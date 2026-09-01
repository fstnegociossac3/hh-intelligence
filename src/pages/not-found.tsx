import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground p-4">
      <FileQuestion className="h-16 w-16 text-muted-foreground" />
      <h1 className="text-2xl font-semibold">Página no encontrada</h1>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        La ruta que buscas no existe o fue movida.
      </p>
      <Button onClick={() => navigate('/dashboard')}>Ir al dashboard</Button>
    </div>
  )
}
