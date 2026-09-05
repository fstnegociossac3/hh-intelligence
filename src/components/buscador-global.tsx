import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  FileText,
  FolderKanban,
  ScrollText,
  Search,
  CornerDownLeft,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { useProyectos } from '@/data/proyectos-store'
import { useAnalisis, type ResultadoAnalisis } from '@/data/analisis-store'
import { useObservaciones } from '@/data/observaciones-store'
import { obtenerEstadoDocumentos } from '@/data/documentos-store'

const RESULTADO_LABEL: Record<ResultadoAnalisis, string> = {
  conforme: 'Conforme',
  observado: 'Con observaciones',
  critico: 'Crítico',
  pendiente: 'Pendiente',
}

type CategoriaBusqueda = 'proyectos' | 'documentos' | 'expedientes' | 'observaciones'

interface Resultado {
  categoria: CategoriaBusqueda
  id: string
  titulo: string
  sub: string
  ruta: string
}

const CATEGORIAS: {
  clave: CategoriaBusqueda
  label: string
  icono: LucideIcon
}[] = [
  { clave: 'proyectos', label: 'Proyectos', icono: FolderKanban },
  { clave: 'documentos', label: 'Documentos', icono: FileText },
  { clave: 'expedientes', label: 'Expedientes', icono: ScrollText },
  { clave: 'observaciones', label: 'Observaciones', icono: AlertTriangle },
]

const MAX_POR_CATEGORIA = 5

interface BuscadorGlobalProps {
  autoFocus?: boolean
  onResultado?: () => void
}

export function BuscadorGlobal({ autoFocus, onResultado }: BuscadorGlobalProps) {
  const navigate = useNavigate()
  const proyectos = useProyectos()
  const analisis = useAnalisis()
  const observaciones = useObservaciones()
  const [texto, setTexto] = useState('')
  const [abierto, setAbierto] = useState(false)
  const contenedorRef = useRef<HTMLDivElement>(null)

  const termino = texto.trim().toLowerCase()

  const resultados = useMemo<Resultado[]>(() => {
    if (!termino) return []
    const coindice = (v: string | undefined) =>
      (v ?? '').toLowerCase().includes(termino)

    const lista: Resultado[] = []

    for (const p of proyectos) {
      if (
        coindice(p.nombre) ||
        coindice(p.codigo) ||
        coindice(p.entidad) ||
        coindice(p.responsable)
      ) {
        lista.push({
          categoria: 'proyectos',
          id: p.id,
          titulo: p.nombre,
          sub: `${p.codigo} · ${p.entidad}`,
          ruta: `/proyectos/${p.id}`,
        })
      }
    }

    for (const p of proyectos) {
      const docs = obtenerEstadoDocumentos(p.id)?.documentos ?? []
      for (const d of docs) {
        if (coindice(d.nombre) || coindice(d.categoria) || coindice(p.codigo)) {
          lista.push({
            categoria: 'documentos',
            id: d.id,
            titulo: d.nombre,
            sub: `${d.categoria} · ${p.codigo}`,
            ruta: `/proyectos/${p.id}?tab=documentos`,
          })
        }
      }
    }

    for (const a of analisis) {
      if (
        coindice(a.codigo) ||
        coindice(a.proyecto) ||
        coindice(a.resultado) ||
        coindice(a.responsable)
      ) {
        lista.push({
          categoria: 'expedientes',
          id: a.id,
          titulo: a.codigo,
          sub: `${a.proyecto} · ${RESULTADO_LABEL[a.resultado]}`,
          ruta: `/proyectos/${a.proyectoId}`,
        })
      }
    }

    for (const o of observaciones) {
      if (
        coindice(o.codigo) ||
        coindice(o.partida) ||
        coindice(o.tipoInconsistencia) ||
        coindice(o.proyecto) ||
        coindice(o.regla)
      ) {
        lista.push({
          categoria: 'observaciones',
          id: o.id,
          titulo: o.codigo,
          sub: `${o.partida} · ${o.proyecto}`,
          ruta: `/observaciones?obs=${o.id}`,
        })
      }
    }

    return lista
  }, [termino, proyectos, analisis, observaciones])

  const primero = resultados[0]

  const limpiar = () => {
    setTexto('')
    setAbierto(false)
    onResultado?.()
  }

  const irAResultado = (ruta: string) => {
    navigate(ruta)
    limpiar()
  }

  useEffect(() => {
    if (!abierto) return
    const alClicFuera = (ev: MouseEvent) => {
      if (!contenedorRef.current?.contains(ev.target as Node)) {
        setAbierto(false)
      }
    }
    document.addEventListener('mousedown', alClicFuera)
    return () => document.removeEventListener('mousedown', alClicFuera)
  }, [abierto])

  const manejarCambio = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTexto(e.target.value)
    if (e.target.value.trim()) setAbierto(true)
  }

  const manejarTecla = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === 'Escape') setAbierto(false)
    if (ev.key === 'Enter' && primero) irAResultado(primero.ruta)
  }

  return (
    <div ref={contenedorRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus={autoFocus}
          type="text"
          value={texto}
          onChange={manejarCambio}
          onKeyDown={manejarTecla}
          placeholder="Buscar proyectos, documentos, expedientes, observaciones..."
          aria-label="Búsqueda global"
          className="w-full pl-9 pr-16"
        />
        {termino && (
          <CornerDownLeft className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
        )}
      </div>

      {abierto && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-auto rounded-xl border bg-popover text-popover-foreground shadow-md">
          {resultados.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Sin resultados para «{texto}»
            </p>
          ) : (
            <div className="py-1">
              {CATEGORIAS.map(({ clave, label, icono: Icono }) => {
                const deCategoria = resultados
                  .filter((r) => r.categoria === clave)
                  .slice(0, MAX_POR_CATEGORIA)
                if (deCategoria.length === 0) return null
                return (
                  <div key={clave}>
                    <div className="mt-1 flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <Icono className="h-3.5 w-3.5" />
                      {label}
                      <span className="ml-1 text-muted-foreground/60">
                        {resultados.filter((r) => r.categoria === clave).length}
                      </span>
                    </div>
                    {deCategoria.map((r) => (
                      <button
                        key={`${clave}-${r.id}`}
                        type="button"
                        onClick={() => irAResultado(r.ruta)}
                        className="flex w-full items-center justify-between gap-2 border-l-2 border-transparent px-4 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {r.titulo}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {r.sub}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}