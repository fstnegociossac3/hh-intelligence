import { useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Header,
  type SortingState,
} from '@tanstack/react-table'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  FileText,
  History,
  Info,
  Loader2,
  MoreHorizontal,
  Search,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import { VisorDocumento } from '@/components/visor-documento'
import { VersionesDocumento, numeroVersiones } from '@/components/versiones-documento'
import { cn } from '@/utils/cn'
import { formatFecha } from '@/utils/formatters'
import { Badge } from '@/components/ui/badge'
import { ESTADO_OK, ESTADO_WARNING, ESTADO_CRITICO, ESTADO_INFO } from '@/utils/estados-clases'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DOC_CATEGORIAS,
  ESPECIALIDADES,
  VERSIONES,
} from '@/data/proyecto-detalle'
import type { DocumentoLista, EstadoIa } from '@/data/proyecto-detalle'

const FILAS_POR_PAGINA = [6, 8, 10, 15]

const ESTADO_IA_LABEL: Record<EstadoIa, string> = {
  pendiente: 'Pendiente',
  procesando: 'Procesando',
  procesado: 'Procesado',
  error: 'Error',
}

const ESTADO_IA_CLASE: Record<EstadoIa, string> = {
  pendiente: ESTADO_WARNING,
  procesando: ESTADO_INFO,
  procesado: ESTADO_OK,
  error: ESTADO_CRITICO,
}

function EstadoIaBadge({ estado }: { estado: EstadoIa }) {
  return (
    <Badge variant="outline" className={ESTADO_IA_CLASE[estado]}>
      {estado === 'procesando' && (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      )}
      {ESTADO_IA_LABEL[estado]}
    </Badge>
  )
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function CeldaSortable({ header }: { header: Header<DocumentoLista, unknown> }) {
  if (header.isPlaceholder) return null
  const column = header.column
  const puede = column.getCanSort()
  const orden = column.getIsSorted()
  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className={cn(
        'inline-flex items-center gap-1.5 transition-colors',
        puede ? 'cursor-pointer hover:text-foreground' : 'cursor-default',
      )}
    >
      <span>
        {flexRender(header.column.columnDef.header, header.getContext())}
      </span>
      {puede &&
        (orden === 'asc' ? (
          <ArrowUp className="h-3.5 w-3.5" />
        ) : orden === 'desc' ? (
          <ArrowDown className="h-3.5 w-3.5" />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        ))}
    </button>
  )
}

export function DocumentosTable({
  documentos,
  setDocumentos,
}: {
  documentos: DocumentoLista[]
  setDocumentos: Dispatch<SetStateAction<DocumentoLista[]>>
}) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('todas')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroVersion, setFiltroVersion] = useState('todas')
  const [paginacion, setPaginacion] = useState({
    pageIndex: 0,
    pageSize: 8,
  })
  const [docInfo, setDocInfo] = useState<DocumentoLista | null>(null)
  const [docVisor, setDocVisor] = useState<DocumentoLista | null>(null)
  const [docVersiones, setDocVersiones] = useState<DocumentoLista | null>(null)

  const datosFiltrados = useMemo(() => {
    return documentos.filter((d) => {
      if (filtroCategoria !== 'todas' && d.categoria !== filtroCategoria)
        return false
      if (filtroEspecialidad !== 'todas' && d.especialidad !== filtroEspecialidad)
        return false
      if (filtroEstado !== 'todos' && d.estadoIa !== filtroEstado) return false
      if (filtroVersion !== 'todas' && d.version !== filtroVersion) return false
      return true
    })
  }, [documentos, filtroCategoria, filtroEspecialidad, filtroEstado, filtroVersion])

  const columnas = useMemo<ColumnDef<DocumentoLista>[]>(
    () => [
      {
        accessorKey: 'nombre',
        header: 'Documento',
        cell: ({ row }) => (
          <div className="flex max-w-[260px] items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm font-medium">
              {row.original.nombre}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'categoria',
        header: 'Categoría',
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.categoria}</Badge>
        ),
      },
      {
        accessorKey: 'especialidad',
        header: 'Especialidad',
        cell: ({ row }) => (
          <span className="text-xs">{row.original.especialidad}</span>
        ),
      },
      {
        accessorKey: 'version',
        header: 'Versión',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-medium">
              v{row.original.version}
            </span>
            <Badge variant="secondary" className="font-mono text-[10px]">
              {numeroVersiones(row.original)}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: ({ row }) => (
          <span className="text-xs">{formatFecha(row.original.fecha)}</span>
        ),
      },
      {
        accessorKey: 'tamaño',
        header: 'Tamaño',
        cell: ({ row }) => (
          <span className="text-xs">{formatBytes(row.original.tamaño)}</span>
        ),
      },
      {
        accessorKey: 'estadoIa',
        header: 'Estado IA',
        cell: ({ row }) => <EstadoIaBadge estado={row.original.estadoIa} />,
      },
      {
        accessorKey: 'responsable',
        header: 'Responsable',
        cell: ({ row }) => (
          <span className="text-xs">{row.original.responsable}</span>
        ),
      },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => (
          <AccionesDocumento
            documento={row.original}
            setDocInfo={setDocInfo}
            onVisualizar={setDocVisor}
            onVerVersiones={setDocVersiones}
            eliminar={() =>
              setDocumentos((prev) =>
                prev.filter((d) => d.id !== row.original.id),
              )
            }
            onNuevaVersion={(doc) => {
              const partes = doc.version.split('.')
              const mayor = parseInt(partes[0])
              const menor = parseInt(partes[1] || '0')
              const nuevaVersion = `${mayor}.${menor + 1}`
              setDocumentos((prev) =>
                prev.map((d) =>
                  d.id === doc.id
                    ? {
                        ...d,
                        version: nuevaVersion,
                        fecha: new Date().toISOString().split('T')[0],
                        estadoIa: 'pendiente' as EstadoIa,
                      }
                    : d,
                ),
              )
              toast.success('Nueva versión creada', {
                description: `${doc.nombre} ahora es v${nuevaVersion}.`,
              })
            }}
          />
        ),
      },
    ],
    [setDocumentos, setDocVisor],
  )

  const table = useReactTable({
    data: datosFiltrados,
    columns: columnas,
    state: {
      sorting,
      globalFilter: busqueda,
      pagination: paginacion,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setBusqueda,
    onPaginationChange: setPaginacion,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
  })

  const filas = table.getRowModel().rows
  const totalPaginas = table.getPageCount()
  const primera = paginacion.pageIndex * paginacion.pageSize + 1
  const ultima = Math.min(
    (paginacion.pageIndex + 1) * paginacion.pageSize,
    table.getFilteredRowModel().rows.length,
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar documento..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
            aria-label="Buscar documentos"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap lg:items-center lg:gap-2">
          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger className="w-full lg:w-52">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las categorías</SelectItem>
              {DOC_CATEGORIAS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filtroEspecialidad}
            onValueChange={setFiltroEspecialidad}
          >
            <SelectTrigger className="w-full lg:w-52">
              <SelectValue placeholder="Especialidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las especialidades</SelectItem>
              {ESPECIALIDADES.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-full lg:w-44">
              <SelectValue placeholder="Estado IA" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              {(['pendiente', 'procesando', 'procesado', 'error'] as EstadoIa[]).map(
                (e) => (
                  <SelectItem key={e} value={e}>
                    {ESTADO_IA_LABEL[e]}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>

          <Select value={filtroVersion} onValueChange={setFiltroVersion}>
            <SelectTrigger className="w-full lg:w-36">
              <SelectValue placeholder="Versión" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las versiones</SelectItem>
              {VERSIONES.map((v) => (
                <SelectItem key={v} value={v}>
                  v{v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="hidden rounded-lg border bg-card lg:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((grupo) => (
              <TableRow key={grupo.id}>
                {grupo.headers.map((header) => (
                  <TableHead key={header.id}>
                    <CeldaSortable header={header} />
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {filas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnas.length}
                  className="h-40 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8" />
                    <span>No se encontraron documentos</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filas.map((fila) => (
                <TableRow key={fila.id}>
                  {fila.getVisibleCells().map((celda) => (
                    <TableCell key={celda.id}>
                      {flexRender(
                        celda.column.columnDef.cell,
                        celda.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {filas.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border bg-card py-12 text-center text-muted-foreground">
            <Search className="h-8 w-8" />
            <span className="text-sm">No se encontraron documentos</span>
          </div>
        ) : (
          filas.map((fila) => {
            const d = fila.original
            return (
              <div key={fila.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="truncate text-sm font-medium">{d.nombre}</p>
                  </div>
                  <AccionesDocumento
                    documento={d}
                    setDocInfo={setDocInfo}
                    onVisualizar={setDocVisor}
                    onVerVersiones={setDocVersiones}
                    eliminar={() =>
                      setDocumentos((prev) =>
                        prev.filter((x) => x.id !== d.id),
                      )
                    }
                    onNuevaVersion={(doc) => {
                      const partes = doc.version.split('.')
                      const mayor = parseInt(partes[0])
                      const menor = parseInt(partes[1] || '0')
                      const nuevaVersion = `${mayor}.${menor + 1}`
                      setDocumentos((prev) =>
                        prev.map((x) =>
                          x.id === doc.id
                            ? {
                                ...x,
                                version: nuevaVersion,
                                fecha: new Date().toISOString().split('T')[0],
                                estadoIa: 'pendiente' as EstadoIa,
                              }
                            : x,
                        ),
                      )
                      toast.success('Nueva versión creada', {
                        description: `${doc.nombre} ahora es v${nuevaVersion}.`,
                      })
                    }}
                  />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{d.categoria}</Badge>
                  <EstadoIaBadge estado={d.estadoIa} />
                  <span className="font-mono text-xs">v{d.version}</span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {numeroVersiones(d)} versiones
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>Especialidad: {d.especialidad}</span>
                  <span>Responsable: {d.responsable}</span>
                  <span>Fecha: {formatFecha(d.fecha)}</span>
                  <span>Tamaño: {formatBytes(d.tamaño)}</span>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          Mostrando{' '}
          <span className="font-medium">
            {filas.length === 0 ? 0 : primera}–{ultima}
          </span>{' '}
          de{' '}
          <span className="font-medium">
            {table.getFilteredRowModel().rows.length}
          </span>{' '}
          documentos
        </p>
        <div className="flex items-center gap-2">
          <Select
            value={String(paginacion.pageSize)}
            onValueChange={(v) =>
              setPaginacion((prev) => ({
                ...prev,
                pageSize: Number(v),
                pageIndex: 0,
              }))
            }
          >
            <SelectTrigger className="w-28" aria-label="Filas por página">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILAS_POR_PAGINA.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / pág.
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            aria-label="Página anterior"
          >
            <ChevronLeft />
          </Button>
          <span className="min-w-16 text-center text-sm">
            {paginacion.pageIndex + 1} / {Math.max(totalPaginas, 1)}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            aria-label="Página siguiente"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <Dialog
        open={docInfo !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setDocInfo(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Información extraída</DialogTitle>
            <DialogDescription>
              Datos reconocidos por la IA del documento.
            </DialogDescription>
          </DialogHeader>
          {docInfo && (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Documento
                </p>
                <p className="truncate text-sm font-medium">{docInfo.nombre}</p>
              </div>
              <Separator />
              {[
                ['Categoría', docInfo.categoria],
                ['Especialidad', docInfo.especialidad],
                ['Versión', docInfo.version],
                ['Responsable', docInfo.responsable],
                [
                  'Coherencia',
                  `${Math.floor(70 + Math.random() * 25)}%`,
                ],
                ['Estado IA', ESTADO_IA_LABEL[docInfo.estadoIa]],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={docVisor !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setDocVisor(null)
        }}
      >
        <DialogContent className="h-[92vh] max-h-[92vh] w-[96vw] max-w-[96vw] gap-0 overflow-hidden p-0 sm:rounded-lg [&>button]:hidden">
          {docVisor && (
            <VisorDocumento
              documento={docVisor}
              onCerrar={() => setDocVisor(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {docVersiones && (
        <VersionesDocumento
          key={`${docVersiones.id}-${docVersiones.version}`}
          documento={docVersiones}
          open
          onOpenChange={(abierto) => {
            if (!abierto) setDocVersiones(null)
          }}
        />
      )}
    </div>
  )
}

function AccionesDocumento({
  documento,
  setDocInfo,
  onVisualizar,
  onVerVersiones,
  eliminar,
  onNuevaVersion,
}: {
  documento: DocumentoLista
  setDocInfo: (d: DocumentoLista) => void
  onVisualizar: (d: DocumentoLista) => void
  onVerVersiones: (d: DocumentoLista) => void
  eliminar: () => void
  onNuevaVersion: (d: DocumentoLista) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Acciones">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onVisualizar(documento)}>
          <Eye />
          Visualizar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onVerVersiones(documento)}>
          <History />
          Ver versiones
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setDocInfo(documento)}>
          <Info />
          Ver información extraída
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onNuevaVersion(documento)}>
          <Copy />
          Nueva versión
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            toast.success('Descarga iniciada', {
              description: `Descargando ${documento.nombre}...`,
            })
          }
        >
          <Download />
          Descargar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => {
            eliminar()
            toast.success('Documento eliminado', {
              description: documento.nombre,
            })
          }}
        >
          <Trash2 />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
