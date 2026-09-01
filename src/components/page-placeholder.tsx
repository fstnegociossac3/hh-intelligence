import type { ReactNode } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Construction } from 'lucide-react'
import { cn } from '@/utils/cn'

interface PagePlaceholderProps {
  titulo: string
  descripcion: string
  badge?: string
  children?: ReactNode
  className?: string
}

export function PagePlaceholder({
  titulo,
  descripcion,
  badge = 'En construcción',
  children,
  className,
}: PagePlaceholderProps) {
  return (
    <div className="space-y-6">
      <Card className={cn('border-dashed', className)}>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Construction className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <Badge variant="outline">{badge}</Badge>
            <h2 className="text-xl font-semibold">{titulo}</h2>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              {descripcion}
            </p>
          </div>
          {children}
        </CardContent>
      </Card>
    </div>
  )
}
