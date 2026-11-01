/* =========================================================================
   LAVANDERÍA · CONTROL DE INGRESOS Y GASTOS
   IndexedDB (fuente de verdad local) + sync automático a Google Drive
   ========================================================================= */

/* -------------------------------------------------------------------------
   CONFIGURACIÓN DE GOOGLE DRIVE
   Para activar el backup en Drive, Oscar tiene que:
   1) Crear un proyecto en https://console.cloud.google.com/
   2) Habilitar "Google Drive API"
   3) Crear credenciales OAuth 2.0 → tipo "Web application"
   4) Agregar el dominio de GitHub Pages en "Authorized JavaScript origins"
      (ej: https://oscarelisua.github.io)
   5) Pegar el Client ID acá abajo
   ------------------------------------------------------------------------- */
const GOOGLE_CLIENT_ID = 'PONÉ_ACÁ_TU_CLIENT_ID.apps.googleusercontent.com';
const DRIVE_FILE_NAME = 'lavanderia-backup.json';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

/* ---------------------------- IndexedDB layer --------------------------- */
const DB_NAME = 'LavanderiaDB';
const DB_VERSION = 1;
const STORES = ['clientes', 'servicios', 'precios', 'costosFijos', 'movimientos', 'gastos', 'meta'];

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('clientes')) db.createObjectStore('clientes', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('servicios')) db.createObjectStore('servicios', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('precios')) db.createObjectStore('precios', { keyPath: 'servicioId' });
      if (!db.objectStoreNames.contains('costosFijos')) db.createObjectStore('costosFijos', { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains('movimientos')) db.createObjectStore('movimientos', { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains('gastos')) db.createObjectStore('gastos', { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let dbPromise = openDB();

function tx(storeName, mode) {
  return dbPromise.then(db => db.transaction(storeName, mode).objectStore(storeName));
}

function getAll(storeName) {
  return tx(storeName, 'readonly').then(store => new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

function put(storeName, value) {
  return tx(storeName, 'readwrite').then(store => new Promise((resolve, reject) => {
    const req = store.put(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  })).then(res => { scheduleSync(); return res; });
}

function del(storeName, key) {
  return tx(storeName, 'readwrite').then(store => new Promise((resolve, reject) => {
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  })).then(res => { scheduleSync(); return res; });
}

function getMeta(key) {
  return tx('meta', 'readonly').then(store => new Promise((resolve, reject) => {
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ? req.result.value : null);
    req.onerror = () => reject(req.error);
  }));
}

function setMeta(key, value) {
  return put('meta', { key, value });
}

/* ------------------------------- Seed data ------------------------------- */
async function seedIfEmpty() {
  const clientes = await getAll('clientes');
  if (clientes.length > 0) return;

  const tx1 = (await dbPromise).transaction(['clientes','servicios','precios','costosFijos','movimientos'], 'readwrite');
  SEED_DATA.clientes.forEach(c => tx1.objectStore('clientes').put(c));
  SEED_DATA.servicios.forEach(s => tx1.objectStore('servicios').put(s));
  Object.entries(SEED_DATA.precios).forEach(([servicioId, precio]) => {
    tx1.objectStore('precios').put({ servicioId: parseInt(servicioId), precio });
  });
  SEED_DATA.costosFijos.forEach(cf => tx1.objectStore('costosFijos').put(cf));
  SEED_DATA.movimientos.forEach(m => {
    if (m.total) tx1.objectStore('movimientos').put(m);
  });

  return new Promise((resolve, reject) => {
    tx1.oncomplete = () => resolve();
    tx1.onerror = () => reject(tx1.error);
  });
}

/* -------------------------------- Helpers -------------------------------- */
const fmtMoney = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);
const todayISO = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); };
const monthKey = (dateStr) => (dateStr || todayISO()).slice(0, 7); // YYYY-MM
const monthLabel = (key) => {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
};

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2200);
}

/* -------------------------------- State ---------------------------------- */
let state = {
  clientes: [],
  servicios: [],
  precios: [],       // [{servicioId, precio}]
  costosFijos: [],
  movimientos: [],
  gastos: [],
  historialMonth: todayISO().slice(0, 7),
  fechaPanel: todayISO(),
  mesGastos: todayISO().slice(0, 7),
};

async function loadState() {
  const [clientes, servicios, precios, costosFijos, movimientos, gastos] = await Promise.all([
    getAll('clientes'), getAll('servicios'), getAll('precios'),
    getAll('costosFijos'), getAll('movimientos'), getAll('gastos'),
  ]);
  state.clientes = clientes.sort((a,b) => a.nombre.localeCompare(b.nombre));
  state.servicios = servicios;
  state.precios = precios;
  state.costosFijos = costosFijos;
  state.movimientos = movimientos.sort((a,b) => (b.fecha||'').localeCompare(a.fecha||'') || b.id - a.id);
  state.gastos = gastos.sort((a,b) => (b.fecha||'').localeCompare(a.fecha||'') || b.id - a.id);
}

function precioDeServicio(servicioId) {
  const p = state.precios.find(p => p.servicioId === servicioId);
  return p ? p.precio : 0;
}

/* --------------------------- Cálculos del mes ----------------------------- */
function ingresosDelMes(key) {
  return state.movimientos.filter(m => monthKey(m.fecha) === key).reduce((s, m) => s + (m.total || 0), 0);
}
function gastosVariablesDelMes(key) {
  return state.gastos.filter(g => monthKey(g.fecha) === key && g.tipo !== 'fijo').reduce((s, g) => s + (g.monto || 0), 0);
}
function gastosFijosDelMes(key) {
  return state.gastos.filter(g => monthKey(g.fecha) === key && g.tipo === 'fijo').reduce((s, g) => s + (g.monto || 0), 0);
}
function balanceDelMes(key) {
  return ingresosDelMes(key) - gastosVariablesDelMes(key) - gastosFijosDelMes(key);
}

/* -------------------------------------------------------------------------
   RENDER
   ------------------------------------------------------------------------- */
function renderHeader() {
  const key = todayISO().slice(0, 7);
  document.getElementById('fechaHoy').textContent = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  document.getElementById('mesActualLabel').textContent = monthLabel(key);
  const bal = balanceDelMes(key);
  const balEl = document.getElementById('balanceMes');
  balEl.textContent = fmtMoney(bal);
  balEl.style.color = bal < 0 ? '#F3C98B' : '#fff';
  document.getElementById('sumIngresos').textContent = fmtMoney(ingresosDelMes(key));
  document.getElementById('sumGastos').textContent = fmtMoney(gastosVariablesDelMes(key));
  document.getElementById('sumFijos').textContent = fmtMoney(gastosFijosDelMes(key));
}

function renderPanelForm() {
  const dl = document.getElementById('dlClientes');
  dl.innerHTML = state.clientes.map(c => `<option value="${escapeHtml(c.nombre)}">`).join('');

  const sel = document.getElementById('ingServicio');
  const prev = sel.value;
  sel.innerHTML = state.servicios.map(s => `<option value="${s.id}">${escapeHtml(s.nombre)}</option>`).join('');
  if (prev && state.servicios.some(s => String(s.id) === prev)) sel.value = prev;
  if (state.servicios.length) {
    document.getElementById('ingPrecio').value = precioDeServicio(parseInt(sel.value));
  }
  document.getElementById('ingFecha').value = state.fechaPanel;
  recalcTotalIngreso();
}

function recalcTotalIngreso() {
  const cant = parseFloat(document.getElementById('ingCantidad').value) || 0;
  const precio = parseFloat(document.getElementById('ingPrecio').value) || 0;
  document.getElementById('ingTotal').value = Math.round(cant * precio);
}

function renderListaHoy() {
  const fecha = state.fechaPanel;
  document.getElementById('panelFecha').value = fecha;
  const items = state.movimientos.filter(m => m.fecha === fecha);
  const total = items.reduce((s, m) => s + (m.total || 0), 0);
  document.getElementById('resumenDia').textContent = items.length
    ? `${items.length} ${items.length === 1 ? 'movimiento' : 'movimientos'} · Total del día ${fmtMoney(total)}`
    : '';
  const el = document.getElementById('listaHoy');
  if (!items.length) { el.innerHTML = '<div class="empty">Sin movimientos en este día</div>'; return; }
  el.innerHTML = items.map(m => `
    <div class="list-item">
      <div class="li-main">
        <div class="li-title">${escapeHtml(m.clienteNombre || 'Sin cliente')}</div>
        <div class="li-sub">${escapeHtml(m.servicioNombre || '')} · <span class="pill ${m.formaPago === 'Efectivo' ? '' : 'amber'}">${m.formaPago}</span></div>
      </div>
      <div class="li-amount pos">${fmtMoney(m.total)}</div>
      <button class="li-del" data-del-mov="${m.id}">✕</button>
    </div>
  `).join('');
}

function renderGastoForm() {
  const el = document.getElementById('gastoFecha');
  if (!el.value) el.value = todayISO();
}

function renderListaGastosMes() {
  const key = state.mesGastos;
  document.getElementById('gastoMesLabel').textContent = monthLabel(key);
  const items = state.gastos.filter(g => monthKey(g.fecha) === key && g.tipo !== 'fijo');
  const el = document.getElementById('listaGastosMes');
  if (!items.length) { el.innerHTML = '<div class="empty">Sin gastos en este mes</div>'; return; }
  el.innerHTML = items.map(g => `
    <div class="list-item">
      <div class="li-main">
        <div class="li-title">${escapeHtml(g.categoria)}</div>
        <div class="li-sub">${g.descripcion ? escapeHtml(g.descripcion) + ' · ' : ''}${formatFechaCorta(g.fecha)}</div>
      </div>
      <div class="li-amount neg">-${fmtMoney(g.monto)}</div>
      <button class="li-del" data-del-gasto="${g.id}">✕</button>
    </div>
  `).join('');
}

function renderFijosTab() {
  const key = todayISO().slice(0, 7);
  const yaAplicado = state.gastos.some(g => g.tipo === 'fijo' && g.mesAplicado === key);
  const totalFijos = state.costosFijos.reduce((s, c) => s + (c.monto || 0), 0);

  const estadoEl = document.getElementById('estadoMesFijos');
  if (yaAplicado) {
    estadoEl.innerHTML = `
      <div class="info-box" style="background:#EAF2EF;border-color:#CFE3DC;color:#1D4B46;">
        Ya aplicaste los costos fijos de <b>${monthLabel(key)}</b> por ${fmtMoney(gastosFijosDelMes(key))}.
      </div>`;
  } else {
    estadoEl.innerHTML = `
      <p style="font-size:13.5px;color:var(--ink-soft);margin:0 0 12px;">
        Total configurado: <b style="color:var(--ink);">${fmtMoney(totalFijos)}</b> · aún no confirmaste ${monthLabel(key)}.
      </p>
      <button class="btn btn-amber" id="btnAplicarMes">Aplicar mes (${monthLabel(key)})</button>
    `;
  }

  const listaEl = document.getElementById('listaCostosFijos');
  if (!state.costosFijos.length) {
    listaEl.innerHTML = '<div class="empty">No hay conceptos fijos configurados</div>';
  } else {
    listaEl.innerHTML = state.costosFijos.map(c => `
      <div class="list-item">
        <div class="li-main">
          <div class="li-title">${escapeHtml(c.concepto)}</div>
          <div class="li-sub">${escapeHtml(c.categoria || '')}</div>
        </div>
        <input type="number" value="${c.monto}" data-fijo-monto="${c.id}" style="width:110px;text-align:right;padding:7px 8px;">
        <button class="li-del" data-del-fijo="${c.id}">✕</button>
      </div>
    `).join('');
  }
}

function renderHistorial() {
  const key = state.historialMonth;
  document.getElementById('mesHistorialLabel').textContent = monthLabel(key);
  document.getElementById('histIngresos').textContent = fmtMoney(ingresosDelMes(key));
  document.getElementById('histGastosVar').textContent = '-' + fmtMoney(gastosVariablesDelMes(key));
  document.getElementById('histGastosFijos').textContent = '-' + fmtMoney(gastosFijosDelMes(key));
  const bal = balanceDelMes(key);
  const balEl = document.getElementById('histBalance');
  balEl.textContent = fmtMoney(bal);
  balEl.className = 'li-amount ' + (bal >= 0 ? 'pos' : 'neg');
  balEl.style.fontWeight = '700';

  const movs = state.movimientos.filter(m => monthKey(m.fecha) === key)
    .map(m => ({ ...m, _tipo: 'ingreso' }));
  const gastos = state.gastos.filter(g => monthKey(g.fecha) === key)
    .map(g => ({ ...g, _tipo: 'gasto' }));
  const todos = [...movs, ...gastos].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

  const el = document.getElementById('listaHistorial');
  if (!todos.length) { el.innerHTML = '<div class="empty">Sin movimientos en este mes</div>'; return; }
  el.innerHTML = todos.map(item => {
    if (item._tipo === 'ingreso') {
      return `<div class="list-item">
        <div class="li-main">
          <div class="li-title">${escapeHtml(item.clienteNombre || 'Sin cliente')}</div>
          <div class="li-sub">${escapeHtml(item.servicioNombre || '')} · ${formatFechaCorta(item.fecha)}</div>
        </div>
        <div class="li-amount pos">+${fmtMoney(item.total)}</div>
        <button class="li-del" data-hist-del="mov:${item.id}">✕</button>
      </div>`;
    }
    return `<div class="list-item">
      <div class="li-main">
        <div class="li-title">${escapeHtml(item.categoria)}${item.tipo === 'fijo' ? ' <span class=\"pill brick\">fijo</span>' : ''}</div>
        <div class="li-sub">${item.descripcion ? escapeHtml(item.descripcion) + ' · ' : ''}${formatFechaCorta(item.fecha)}</div>
      </div>
      <div class="li-amount neg">-${fmtMoney(item.monto)}</div>
      <button class="li-del" data-hist-del="gasto:${item.id}">✕</button>
    </div>`;
  }).join('');
}

function renderAjustes() {
  document.getElementById('countClientes').textContent = state.clientes.length;
  document.getElementById('countServicios').textContent = state.servicios.length;

  const elC = document.getElementById('listaClientes');
  elC.innerHTML = state.clientes.map(c => `
    <div class="list-item">
      <div class="li-main">
        <div class="li-title">${escapeHtml(c.nombre)}</div>
        ${c.telefono ? `<div class="li-sub">${escapeHtml(c.telefono)}</div>` : ''}
      </div>
      <button class="li-del" data-del-cliente="${c.id}">✕</button>
    </div>
  `).join('') || '<div class="empty">Sin clientes cargados</div>';

  const elS = document.getElementById('listaServicios');
  elS.innerHTML = state.servicios.map(s => `
    <div class="list-item">
      <div class="li-main">
        <div class="li-title">${escapeHtml(s.nombre)}</div>
        <div class="li-sub">${escapeHtml(s.descripcion || '')}</div>
      </div>
      <input type="number" value="${precioDeServicio(s.id)}" data-precio-servicio="${s.id}" style="width:100px;text-align:right;padding:7px 8px;">
    </div>
  `).join('') || '<div class="empty">Sin servicios cargados</div>';
}

function renderAll() {
  renderHeader();
  renderPanelForm();
  renderListaHoy();
  renderGastoForm();
  renderListaGastosMes();
  renderFijosTab();
  renderHistorial();
  renderAjustes();
}

function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
function formatFechaCorta(iso) {
  if (!iso) return '';
  const [y,m,d] = iso.split('-');
  return `${d}/${m}`;
}

/* -------------------------------------------------------------------------
   TABS
   ------------------------------------------------------------------------- */
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

/* -------------------------------------------------------------------------
   EVENTOS: INGRESOS
   ------------------------------------------------------------------------- */
document.getElementById('ingServicio').addEventListener('change', (e) => {
  document.getElementById('ingPrecio').value = precioDeServicio(parseInt(e.target.value));
  recalcTotalIngreso();
});
document.getElementById('ingCantidad').addEventListener('input', recalcTotalIngreso);
document.getElementById('ingPrecio').addEventListener('input', recalcTotalIngreso);

document.getElementById('segPago').addEventListener('click', (e) => {
  if (e.target.tagName !== 'BUTTON') return;
  document.querySelectorAll('#segPago button').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
});

document.getElementById('btnGuardarIngreso').addEventListener('click', async () => {
  const nombreCliente = document.getElementById('ingClienteInput').value.trim();
  const servicioId = parseInt(document.getElementById('ingServicio').value);
  const servicio = state.servicios.find(s => s.id === servicioId);
  const cantidad = parseFloat(document.getElementById('ingCantidad').value) || 1;
  const precioUnitario = parseFloat(document.getElementById('ingPrecio').value) || 0;
  const total = parseFloat(document.getElementById('ingTotal').value) || 0;
  const formaPago = document.querySelector('#segPago button.active').dataset.val;
  const fecha = document.getElementById('ingFecha').value || todayISO();

  if (!nombreCliente) { toast('Ingresá un cliente'); return; }
  if (!total) { toast('El total no puede ser 0'); return; }

  let cliente = state.clientes.find(c => c.nombre.toLowerCase() === nombreCliente.toLowerCase());
  let clienteId = cliente ? cliente.id : null;
  if (!cliente) {
    clienteId = Date.now();
    await put('clientes', { id: clienteId, nombre: nombreCliente, telefono: '' });
  }

  const mov = {
    id: Date.now(),
    fecha, clienteId, clienteNombre: nombreCliente,
    servicioId, servicioNombre: servicio ? servicio.nombre : '',
    cantidad, precioUnitario, total, formaPago,
  };
  await put('movimientos', mov);
  state.fechaPanel = fecha;
  toast('Ingreso guardado ✓');

  document.getElementById('ingClienteInput').value = '';
  document.getElementById('ingCantidad').value = 1;
  await loadState();
  renderAll();
});

document.getElementById('listaHoy').addEventListener('click', async (e) => {
  const id = e.target.dataset.delMov;
  if (!id) return;
  await del('movimientos', parseInt(id));
  await loadState();
  renderAll();
});

/* -------------------------------------------------------------------------
   EVENTOS: GASTOS
   ------------------------------------------------------------------------- */
document.getElementById('btnGuardarGasto').addEventListener('click', async () => {
  const categoria = document.getElementById('gastoCategoria').value;
  const descripcion = document.getElementById('gastoDescripcion').value.trim();
  const monto = parseFloat(document.getElementById('gastoMonto').value) || 0;
  const fecha = document.getElementById('gastoFecha').value || todayISO();
  if (!monto) { toast('El monto no puede ser 0'); return; }

  await put('gastos', { id: Date.now(), categoria, descripcion, monto, fecha, tipo: 'variable' });
  state.mesGastos = monthKey(fecha);
  toast('Gasto guardado ✓');
  document.getElementById('gastoDescripcion').value = '';
  document.getElementById('gastoMonto').value = '';
  await loadState();
  renderAll();
});

document.getElementById('listaGastosMes').addEventListener('click', async (e) => {
  const id = e.target.dataset.delGasto;
  if (!id) return;
  await del('gastos', parseInt(id));
  await loadState();
  renderAll();
});

/* -------------------------------------------------------------------------
   EVENTOS: FIJOS
   ------------------------------------------------------------------------- */
document.getElementById('cardAplicarMes').addEventListener('click', async (e) => {
  if (e.target.id !== 'btnAplicarMes') return;
  const key = todayISO().slice(0, 7);
  const primerDia = key + '-01';
  const proms = state.costosFijos.map(c => put('gastos', {
    id: Date.now() + c.id,
    categoria: c.concepto,
    descripcion: c.categoria || '',
    monto: c.monto || 0,
    fecha: primerDia,
    tipo: 'fijo',
    mesAplicado: key,
  }));
  await Promise.all(proms);
  toast('Costos fijos aplicados a ' + monthLabel(key));
  await loadState();
  renderAll();
});

document.getElementById('listaCostosFijos').addEventListener('click', async (e) => {
  const id = e.target.dataset.delFijo;
  if (!id) return;
  await del('costosFijos', parseInt(id));
  await loadState();
  renderAll();
});
document.getElementById('listaCostosFijos').addEventListener('change', async (e) => {
  const id = e.target.dataset.fijoMonto;
  if (!id) return;
  const item = state.costosFijos.find(c => c.id === parseInt(id));
  if (!item) return;
  item.monto = parseFloat(e.target.value) || 0;
  await put('costosFijos', item);
  await loadState();
  renderFijosTab();
});

document.getElementById('btnNuevoFijo').addEventListener('click', async () => {
  const concepto = prompt('Nombre del concepto (ej: Internet)');
  if (!concepto) return;
  const monto = parseFloat(prompt('Monto mensual') || '0') || 0;
  await put('costosFijos', { concepto, categoria: 'Otro', monto });
  await loadState();
  renderFijosTab();
});

/* -------------------------------------------------------------------------
   EVENTOS: HISTORIAL
   ------------------------------------------------------------------------- */
function shiftMonth(key, delta) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}
document.getElementById('mesAnterior').addEventListener('click', () => {
  state.historialMonth = shiftMonth(state.historialMonth, -1);
  renderHistorial();
});
document.getElementById('mesSiguiente').addEventListener('click', () => {
  state.historialMonth = shiftMonth(state.historialMonth, 1);
  renderHistorial();
});

/* -------------------------------------------------------------------------
   EVENTOS: AJUSTES
   ------------------------------------------------------------------------- */
document.getElementById('btnNuevoCliente').addEventListener('click', async () => {
  const nombre = document.getElementById('nuevoClienteNombre').value.trim();
  const telefono = document.getElementById('nuevoClienteTel').value.trim();
  if (!nombre) { toast('Ingresá un nombre'); return; }
  await put('clientes', { id: Date.now(), nombre, telefono });
  document.getElementById('nuevoClienteNombre').value = '';
  document.getElementById('nuevoClienteTel').value = '';
  toast('Cliente agregado ✓');
  await loadState();
  renderAll();
});
document.getElementById('listaClientes').addEventListener('click', async (e) => {
  const id = e.target.dataset.delCliente;
  if (!id) return;
  if (!confirm('¿Eliminar este cliente? (no borra sus movimientos ya cargados)')) return;
  await del('clientes', parseInt(id));
  await loadState();
  renderAll();
});
document.getElementById('listaServicios').addEventListener('change', async (e) => {
  const servicioId = e.target.dataset.precioServicio;
  if (!servicioId) return;
  const precio = parseFloat(e.target.value) || 0;
  await put('precios', { servicioId: parseInt(servicioId), precio });
  await loadState();
});

/* -------------------------------------------------------------------------
   NAVEGACIÓN POR FECHA (Panel) Y MES (Gastos) + BORRAR DESDE HISTORIAL
   ------------------------------------------------------------------------- */
function shiftDay(iso, delta) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
}
function setFechaPanel(f) {
  state.fechaPanel = f || todayISO();
  document.getElementById('ingFecha').value = state.fechaPanel;
  renderListaHoy();
}
document.getElementById('panelFecha').addEventListener('change', e => setFechaPanel(e.target.value));
document.getElementById('ingFecha').addEventListener('change', e => setFechaPanel(e.target.value));
document.getElementById('diaAnterior').addEventListener('click', () => setFechaPanel(shiftDay(state.fechaPanel, -1)));
document.getElementById('diaSiguiente').addEventListener('click', () => setFechaPanel(shiftDay(state.fechaPanel, 1)));
document.getElementById('btnIrHoy').addEventListener('click', () => setFechaPanel(todayISO()));

document.getElementById('gastoMesAnt').addEventListener('click', () => { state.mesGastos = shiftMonth(state.mesGastos, -1); renderListaGastosMes(); });
document.getElementById('gastoMesSig').addEventListener('click', () => { state.mesGastos = shiftMonth(state.mesGastos, 1); renderListaGastosMes(); });

document.getElementById('listaHistorial').addEventListener('click', async (e) => {
  const v = e.target.dataset.histDel;
  if (!v) return;
  if (!confirm('¿Eliminar este movimiento?')) return;
  const [tipo, id] = v.split(':');
  await del(tipo === 'mov' ? 'movimientos' : 'gastos', parseInt(id));
  await loadState();
  renderAll();
});

/* =========================================================================
   GOOGLE DRIVE SYNC
   ========================================================================= */
let gapiInited = false;
let gisInited = false;
let tokenClient = null;
let accessToken = null;
let syncTimer = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function initGoogle() {
  if (GOOGLE_CLIENT_ID.startsWith('PONÉ_ACÁ')) {
    document.getElementById('driveEstado').textContent = 'El backup a Drive todavía no está configurado (falta el Client ID de Google).';
    document.getElementById('btnConectarDrive').disabled = true;
    document.getElementById('btnConectarDrive').style.opacity = 0.5;
    return;
  }
  try {
    await Promise.all([
      loadScript('https://apis.google.com/js/api.js'),
      loadScript('https://accounts.google.com/gsi/client'),
    ]);
    await new Promise(res => gapi.load('client', res));
    await gapi.client.init({ discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'] });
    gapiInited = true;

    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: DRIVE_SCOPE,
      callback: async (resp) => {
        if (resp.error) { toast('No se pudo conectar con Drive'); return; }
        accessToken = resp.access_token;
        gapi.client.setToken({ access_token: accessToken });
        localStorage.setItem('lavanderia_drive_connected', '1');
        setSyncUI(true);
        toast('Google Drive conectado ✓');
        await syncToDrive();
      },
    });
    gisInited = true;

    if (localStorage.getItem('lavanderia_drive_connected') === '1') {
      setSyncUI(true, true);
    }
  } catch (err) {
    console.error('Error iniciando Google APIs', err);
  }
}

function setSyncUI(connected, silent) {
  const btn = document.getElementById('syncBtn');
  const label = document.getElementById('syncLabel');
  const estado = document.getElementById('driveEstado');
  document.getElementById('btnConectarDrive').style.display = connected ? 'none' : 'block';
  document.getElementById('btnSincronizarAhora').style.display = connected ? 'block' : 'none';
  document.getElementById('btnRestaurarDrive').style.display = connected ? 'block' : 'none';
  btn.className = 'sync-dot ' + (connected ? 'ok' : 'off');
  label.textContent = connected ? 'Drive ✓' : 'Drive';
  estado.textContent = connected
    ? 'Conectada. Tus datos se respaldan automáticamente en tu Google Drive.'
    : 'No conectada. Tus datos están guardados solo en este celular.';
  if (!silent) return;
}

document.getElementById('btnConectarDrive').addEventListener('click', () => {
  if (!gisInited) { toast('Google todavía no cargó, esperá unos segundos'); return; }
  tokenClient.requestAccessToken({ prompt: 'consent' });
});
document.getElementById('syncBtn').addEventListener('click', () => {
  if (!accessToken) { document.querySelector('.nav-btn[data-tab="tab-ajustes"]').click(); return; }
  syncToDrive(true);
});
document.getElementById('btnSincronizarAhora').addEventListener('click', () => syncToDrive(true));
document.getElementById('btnRestaurarDrive').addEventListener('click', restoreFromDrive);

async function findDriveFile() {
  const res = await gapi.client.drive.files.list({
    spaces: 'appDataFolder',
    q: `name='${DRIVE_FILE_NAME}'`,
    fields: 'files(id, modifiedTime)',
  });
  return res.result.files && res.result.files[0];
}

async function buildSnapshot() {
  const [clientes, servicios, precios, costosFijos, movimientos, gastos] = await Promise.all([
    getAll('clientes'), getAll('servicios'), getAll('precios'), getAll('costosFijos'), getAll('movimientos'), getAll('gastos'),
  ]);
  return { clientes, servicios, precios, costosFijos, movimientos, gastos, exportadoEn: new Date().toISOString() };
}

async function syncToDrive(manual) {
  if (!accessToken || !gapiInited) return;
  if (!navigator.onLine) { if (manual) toast('Sin conexión, se sincronizará más tarde'); return; }
  try {
    const snapshot = await buildSnapshot();
    const existing = await findDriveFile();
    const boundary = 'lavanderia_boundary';
    const metadata = { name: DRIVE_FILE_NAME, mimeType: 'application/json', parents: existing ? undefined : ['appDataFolder'] };
    const body =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(snapshot)}\r\n--${boundary}--`;

    const url = existing
      ? `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=multipart`
      : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

    await fetch(url, {
      method: existing ? 'PATCH' : 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    });
    if (manual) toast('Sincronizado con Drive ✓');
  } catch (err) {
    console.error('Error sincronizando con Drive', err);
    if (manual) toast('No se pudo sincronizar');
  }
}

async function restoreFromDrive() {
  if (!accessToken) return;
  if (!confirm('Esto reemplaza los datos locales con el último backup de Drive. ¿Continuar?')) return;
  try {
    const existing = await findDriveFile();
    if (!existing) { toast('No hay backup en Drive todavía'); return; }
    const res = await gapi.client.drive.files.get({ fileId: existing.id, alt: 'media' });
    const snapshot = res.result;
    const db = await dbPromise;
    const t = db.transaction(STORES.filter(s => s !== 'meta'), 'readwrite');
    ['clientes','servicios','precios','costosFijos','movimientos','gastos'].forEach(store => {
      t.objectStore(store).clear();
      (snapshot[store] || []).forEach(item => t.objectStore(store).put(item));
    });
    t.oncomplete = async () => { await loadState(); renderAll(); toast('Datos restaurados ✓'); };
  } catch (err) {
    console.error('Error restaurando desde Drive', err);
    toast('No se pudo restaurar');
  }
}

function scheduleSync() {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => syncToDrive(false), 4000);
}
window.addEventListener('online', () => syncToDrive(false));

/* =========================================================================
   INIT
   ========================================================================= */
async function init() {
  await seedIfEmpty();
  await loadState();
  renderAll();
  initGoogle();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  }
}
init();
