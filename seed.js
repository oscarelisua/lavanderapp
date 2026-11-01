const SEED_DATA = {
  "clientes": [
    {
      "id": 1,
      "nombre": "Jesus",
      "telefono": "3413046545"
    },
    {
      "id": 2,
      "nombre": "Taller mecanico",
      "telefono": ""
    },
    {
      "id": 3,
      "nombre": "Euge",
      "telefono": "3413676657"
    },
    {
      "id": 4,
      "nombre": "Elias",
      "telefono": "3413517343"
    },
    {
      "id": 5,
      "nombre": "Tamara",
      "telefono": "3415706838"
    },
    {
      "id": 6,
      "nombre": "Marcos",
      "telefono": "3416280299"
    },
    {
      "id": 7,
      "nombre": "Sofia",
      "telefono": "3415892158"
    },
    {
      "id": 8,
      "nombre": "Maylen",
      "telefono": "3415699488"
    },
    {
      "id": 9,
      "nombre": "Carolina",
      "telefono": "3413130612"
    },
    {
      "id": 10,
      "nombre": "Perla",
      "telefono": "3413210199"
    },
    {
      "id": 11,
      "nombre": "Cristina",
      "telefono": "3416509827"
    },
    {
      "id": 12,
      "nombre": "Ivan",
      "telefono": "3413593581"
    },
    {
      "id": 13,
      "nombre": "Chocoleto",
      "telefono": ""
    },
    {
      "id": 14,
      "nombre": "Flavia",
      "telefono": "3416427830"
    },
    {
      "id": 15,
      "nombre": "Magali",
      "telefono": "3412670176"
    },
    {
      "id": 16,
      "nombre": "Carlos Scardilli",
      "telefono": "3416429648"
    },
    {
      "id": 17,
      "nombre": "Vanesa",
      "telefono": "3413259503"
    },
    {
      "id": 18,
      "nombre": "Cintia",
      "telefono": "3413519527"
    },
    {
      "id": 19,
      "nombre": "Evelin",
      "telefono": "3413453704"
    },
    {
      "id": 20,
      "nombre": "Diego",
      "telefono": "3412038250"
    },
    {
      "id": 21,
      "nombre": "Jorge Domenech",
      "telefono": "3415963682"
    },
    {
      "id": 22,
      "nombre": "Elsa Aymeric",
      "telefono": "3413752400"
    },
    {
      "id": 23,
      "nombre": "Ani Swerso",
      "telefono": "3413346452"
    },
    {
      "id": 24,
      "nombre": "Beatriz Adriana",
      "telefono": "3413460956"
    }
  ],
  "servicios": [
    {
      "id": 1,
      "nombre": "Acolchado 2",
      "descripcion": "2 Plazas"
    },
    {
      "id": 2,
      "nombre": "Lavado y planchado",
      "descripcion": "Lavado + planchado"
    },
    {
      "id": 3,
      "nombre": "Tintorería - Traje",
      "descripcion": "Traje"
    },
    {
      "id": 4,
      "nombre": "Acolchado 1",
      "descripcion": "1 Plaza"
    },
    {
      "id": 5,
      "nombre": "Servicio express",
      "descripcion": "Entrega en el día y Domingos"
    },
    {
      "id": 6,
      "nombre": "Promo 1 Plaza",
      "descripcion": "Lavado + secado + planchado de 1 plaza"
    },
    {
      "id": 7,
      "nombre": "Promo 2 Plazas",
      "descripcion": "Lavado + secado + planchado de 2 plazas"
    },
    {
      "id": 8,
      "nombre": "Tintorería - Saco",
      "descripcion": "Saco"
    },
    {
      "id": 9,
      "nombre": "Tintorería - Campera",
      "descripcion": "Campera"
    }
  ],
  "precios": {
    "1": 18000,
    "2": 10000,
    "3": 20000,
    "4": 15000,
    "5": 15000,
    "6": 10000,
    "7": 15000,
    "8": 20000,
    "9": 15000
  },
  "costosFijos": [
    {
      "concepto": "Alquiler",
      "categoria": "Infraestructura",
      "monto": 550000
    },
    {
      "concepto": "Luz",
      "categoria": "Servicios",
      "monto": 0
    },
    {
      "concepto": "Agua",
      "categoria": "Servicios",
      "monto": 0
    },
    {
      "concepto": "Gas",
      "categoria": "Servicios",
      "monto": 0
    },
    {
      "concepto": "Sueldos",
      "categoria": "Personal",
      "monto": 0
    },
    {
      "concepto": "Insumos de limpieza",
      "categoria": "Insumos",
      "monto": 70000
    }
  ],
  "movimientos": [
    {
      "id": 1,
      "fecha": "2026-09-04",
      "clienteId": 12,
      "clienteNombre": "Ivan",
      "servicioId": 9,
      "servicioNombre": "Tintorería - Campera",
      "cantidad": 1,
      "precioUnitario": 15000,
      "total": 15000,
      "formaPago": "Efectivo"
    },
    {
      "id": 2,
      "fecha": "2026-09-05",
      "clienteId": 3,
      "clienteNombre": "Euge",
      "servicioId": 7,
      "servicioNombre": "Promo 2 Plazas",
      "cantidad": 1,
      "precioUnitario": 15000,
      "total": 15000,
      "formaPago": "Transferencia"
    },
    {
      "id": 3,
      "fecha": "2026-09-06",
      "clienteId": 4,
      "clienteNombre": "Elias",
      "servicioId": 9,
      "servicioNombre": "Tintorería - Campera",
      "cantidad": 1,
      "precioUnitario": 15000,
      "total": 15000,
      "formaPago": "Transferencia"
    },
    {
      "id": 4,
      "fecha": "2026-09-07",
      "clienteId": 2,
      "clienteNombre": "Taller mecanico",
      "servicioId": 7,
      "servicioNombre": "Promo 2 Plazas",
      "cantidad": 1,
      "precioUnitario": 15000,
      "total": 15000,
      "formaPago": "Transferencia"
    },
    {
      "id": 5,
      "fecha": "2026-09-08",
      "clienteId": 5,
      "clienteNombre": "Tamara",
      "servicioId": 7,
      "servicioNombre": "Promo 2 Plazas",
      "cantidad": 2,
      "precioUnitario": 15000,
      "total": 30000,
      "formaPago": "Transferencia"
    },
    {
      "id": 6,
      "fecha": "2026-09-09",
      "clienteId": 6,
      "clienteNombre": "Marcos",
      "servicioId": 7,
      "servicioNombre": "Promo 2 Plazas",
      "cantidad": 1,
      "precioUnitario": 15000,
      "total": 15000,
      "formaPago": "Efectivo"
    },
    {
      "id": 7,
      "fecha": "2026-09-10",
      "clienteId": 7,
      "clienteNombre": "Sofia",
      "servicioId": 7,
      "servicioNombre": "Promo 2 Plazas",
      "cantidad": 1,
      "precioUnitario": 15000,
      "total": 15000,
      "formaPago": "Transferencia"
    },
    {
      "id": 8,
      "fecha": "2026-09-11",
      "clienteId": 8,
      "clienteNombre": "Maylen",
      "servicioId": 7,
      "servicioNombre": "Promo 2 Plazas",
      "cantidad": 2,
      "precioUnitario": 15000,
      "total": 30000,
      "formaPago": "Transferencia"
    },
    {
      "id": 9,
      "fecha": "2026-09-12",
      "clienteId": 9,
      "clienteNombre": "Carolina",
      "servicioId": 7,
      "servicioNombre": "Promo 2 Plazas",
      "cantidad": 2,
      "precioUnitario": 15000,
      "total": 30000,
      "formaPago": "Efectivo"
    },
    {
      "id": 10,
      "fecha": "2026-09-13",
      "clienteId": 10,
      "clienteNombre": "Perla",
      "servicioId": 7,
      "servicioNombre": "Promo 2 Plazas",
      "cantidad": 1,
      "precioUnitario": 15000,
      "total": 15000,
      "formaPago": "Efectivo"
    },
    {
      "id": 11,
      "fecha": "2026-09-14",
      "clienteId": 11,
      "clienteNombre": "Cristina",
      "servicioId": 7,
      "servicioNombre": "Promo 2 Plazas",
      "cantidad": 1,
      "precioUnitario": 15000,
      "total": 15000,
      "formaPago": "Efectivo"
    },
    {
      "id": 12,
      "fecha": "2026-09-15",
      "clienteId": 13,
      "clienteNombre": "Chocoleto",
      "servicioId": 2,
      "servicioNombre": "Lavado y planchado",
      "cantidad": 1,
      "precioUnitario": 10000,
      "total": 10000,
      "formaPago": "Efectivo"
    },
    {
      "id": 13,
      "fecha": "2026-09-16",
      "clienteId": 14,
      "clienteNombre": "Flavia",
      "servicioId": 7,
      "servicioNombre": "Promo 2 Plazas",
      "cantidad": 2,
      "precioUnitario": 15000,
      "total": 30000,
      "formaPago": "Transferencia"
    },
    {
      "id": 14,
      "fecha": "2026-09-17",
      "clienteId": 15,
      "clienteNombre": "Magali",
      "servicioId": 2,
      "servicioNombre": "Lavado y planchado",
      "cantidad": 4,
      "precioUnitario": 10000,
      "total": 40000,
      "formaPago": "Transferencia"
    },
    {
      "id": 15,
      "fecha": "2026-09-18",
      "clienteId": 16,
      "clienteNombre": "Carlos Scardilli",
      "servicioId": 7,
      "servicioNombre": "Promo 2 Plazas",
      "cantidad": 1,
      "precioUnitario": 15000,
      "total": 15000,
      "formaPago": "Efectivo"
    },
    {
      "id": 16,
      "fecha": "2026-09-19",
      "clienteId": 16,
      "clienteNombre": "Carlos Scardilli",
      "servicioId": 2,
      "servicioNombre": "Lavado y planchado",
      "cantidad": 1,
      "precioUnitario": 5000,
      "total": 5000,
      "formaPago": "Efectivo"
    },
    {
      "id": 17,
      "fecha": "2026-09-20",
      "clienteId": 17,
      "clienteNombre": "Vanesa",
      "servicioId": 7,
      "servicioNombre": "Promo 2 Plazas",
      "cantidad": 2,
      "precioUnitario": 15000,
      "total": 30000,
      "formaPago": "Transferencia"
    },
    {
      "id": 18,
      "fecha": "2026-09-21",
      "clienteId": 1,
      "clienteNombre": "Jesus",
      "servicioId": 7,
      "servicioNombre": "Promo 2 Plazas",
      "cantidad": 2,
      "precioUnitario": 15000,
      "total": 30000,
      "formaPago": "Transferencia"
    },
    {
      "id": 19,
      "fecha": "2026-09-22",
      "clienteId": 18,
      "clienteNombre": "Cintia",
      "servicioId": 7,
      "servicioNombre": "Promo 2 Plazas",
      "cantidad": 2,
      "precioUnitario": 15000,
      "total": 30000,
      "formaPago": "Transferencia"
    },
    {
      "id": 20,
      "fecha": "2026-09-23",
      "clienteId": 19,
      "clienteNombre": "Evelin",
      "servicioId": 2,
      "servicioNombre": "Lavado y planchado",
      "cantidad": 2,
      "precioUnitario": 10000,
      "total": 20000,
      "formaPago": "Efectivo"
    },
    {
      "id": 21,
      "fecha": "2026-09-24",
      "clienteId": 20,
      "clienteNombre": "Diego",
      "servicioId": 7,
      "servicioNombre": "Promo 2 Plazas",
      "cantidad": 2,
      "precioUnitario": 15000,
      "total": 30000,
      "formaPago": "Transferencia"
    },
    {
      "id": 22,
      "fecha": "2026-09-25",
      "clienteId": 21,
      "clienteNombre": "Jorge Domenech",
      "servicioId": 3,
      "servicioNombre": "Tintorería - Traje",
      "cantidad": 1,
      "precioUnitario": 20000,
      "total": 20000,
      "formaPago": "Transferencia"
    },
    {
      "id": 23,
      "fecha": "2026-09-26",
      "clienteId": 22,
      "clienteNombre": "Elsa Aymeric",
      "servicioId": 1,
      "servicioNombre": "Acolchado 2",
      "cantidad": 1,
      "precioUnitario": 18000,
      "total": 18000,
      "formaPago": "Transferencia"
    },
    {
      "id": 24,
      "fecha": "2026-09-27",
      "clienteId": 22,
      "clienteNombre": "Elsa Aymeric",
      "servicioId": 9,
      "servicioNombre": "Tintorería - Campera",
      "cantidad": 1,
      "precioUnitario": 15000,
      "total": 15000,
      "formaPago": "Transferencia"
    },
    {
      "id": 25,
      "fecha": "2026-09-28",
      "clienteId": 23,
      "clienteNombre": "Ani Swerso",
      "servicioId": 4,
      "servicioNombre": "Acolchado 1",
      "cantidad": 1,
      "precioUnitario": 15000,
      "total": 15000,
      "formaPago": "Efectivo"
    },
    {
      "id": 26,
      "fecha": "2026-09-29",
      "clienteId": 24,
      "clienteNombre": "Beatriz Adriana",
      "servicioId": 7,
      "servicioNombre": "Promo 2 Plazas",
      "cantidad": 4,
      "precioUnitario": 15000,
      "total": 60000,
      "formaPago": "Transferencia"
    }
  ]
};