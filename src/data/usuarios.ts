import type { Usuario } from '@/types'

export const usuarios: Usuario[] = [
  {
    id: 'usr-001',
    nombre: 'Carlos Mendoza',
    email: 'carlos.mendoza@hhi.pe',
    rol: 'administrador',
    estado: 'activo',
    ultimoAcceso: '2025-08-31',
  },
  {
    id: 'usr-002',
    nombre: 'Lucía Ramírez',
    email: 'lucia.ramirez@hhi.pe',
    rol: 'revisor',
    estado: 'activo',
    ultimoAcceso: '2025-08-30',
  },
  {
    id: 'usr-003',
    nombre: 'Andrés Quispe',
    email: 'andres.quispe@hhi.pe',
    rol: 'analista',
    estado: 'activo',
    ultimoAcceso: '2025-08-29',
  },
  {
    id: 'usr-004',
    nombre: 'María Torres',
    email: 'maria.torres@hhi.pe',
    rol: 'consulta',
    estado: 'inactivo',
    ultimoAcceso: '2025-07-12',
  },
  {
    id: 'usr-005',
    nombre: 'Jorge Salazar',
    email: 'jorge.salazar@hhi.pe',
    rol: 'revisor',
    estado: 'activo',
    ultimoAcceso: '2025-08-28',
  },
  {
    id: 'usr-006',
    nombre: 'Paola Gutiérrez',
    email: 'paola.gutierrez@hhi.pe',
    rol: 'analista',
    estado: 'activo',
    ultimoAcceso: '2025-08-27',
  },
]
