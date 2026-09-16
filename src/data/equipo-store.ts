import type { MiembroEquipo } from '@/data/proyecto-detalle'
import {
  INTEGRANTES_HN_HI,
  obtenerDetalleProyecto,
} from '@/data/proyecto-detalle'
import type { Proyecto } from '@/types'

const STORAGE_KEY = 'hhi_equipo_v1'

type RegistroEquipo = Record<string, MiembroEquipo[]>

const listeners = new Set<() => void>()

function notificar() {
  listeners.forEach((l) => l())
}

export function suscribirEquipo(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function leerRegistro(): RegistroEquipo {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as RegistroEquipo
  } catch {
    return {}
  }
}

function escribirRegistro(registro: RegistroEquipo) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registro))
  } catch {
    // Si localStorage no está disponible no se persiste.
  }
}

function seedProyecto(proyectoId: string): MiembroEquipo[] {
  return obtenerDetalleProyecto(proyectoId).equipo.map((m) => ({ ...m }))
}

export function obtenerEquipo(proyectoId: string): MiembroEquipo[] {
  const registro = leerRegistro()
  if (!registro[proyectoId]) {
    registro[proyectoId] = seedProyecto(proyectoId)
    escribirRegistro(registro)
  }
  return registro[proyectoId]
}

export function guardarEquipo(proyectoId: string, equipo: MiembroEquipo[]) {
  const registro = leerRegistro()
  registro[proyectoId] = equipo.map((m) => ({ ...m }))
  escribirRegistro(registro)
  notificar()
}

function especialidadDe(nombre: string): string {
  const integ = INTEGRANTES_HN_HI.find(
    (i) => i.nombre.toLowerCase() === nombre.trim().toLowerCase(),
  )
  return integ?.especialidad ?? 'Sin asignar'
}

export function equipoDesdeProyecto(proyecto: Proyecto): MiembroEquipo[] {
  const miembros: MiembroEquipo[] = []

  if (proyecto.responsable) {
    miembros.push({
      id: `eq-jp-${proyecto.id}`,
      nombre: proyecto.responsable.trim(),
      rol: 'Jefe de Proyecto',
      especialidad: especialidadDe(proyecto.responsable),
      estado: 'activo',
      proyectosAsignados: 1,
    })
  }

  const especialistas = (proyecto.especialistas ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  for (const especialista of especialistas) {
    miembros.push({
      id: `eq-es-${proyecto.id}-${especialista.replace(/\s+/g, '-').toLowerCase()}`,
      nombre: especialista,
      rol: 'Especialista Técnico',
      especialidad: especialidadDe(especialista),
      estado: 'activo',
      proyectosAsignados: 1,
    })
  }

  if (proyecto.revisor) {
    miembros.push({
      id: `eq-rv-${proyecto.id}`,
      nombre: proyecto.revisor.trim(),
      rol: 'Revisor',
      especialidad: especialidadDe(proyecto.revisor),
      estado: 'activo',
      proyectosAsignados: 1,
    })
  }

  return miembros
}

export function eliminarEquipo(proyectoId: string) {
  const registro = leerRegistro()
  if (registro[proyectoId]) {
    delete registro[proyectoId]
    escribirRegistro(registro)
    notificar()
  }
}