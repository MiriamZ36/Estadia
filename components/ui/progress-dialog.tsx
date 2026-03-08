"use client"

import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

interface ProgressDialogProps {
  open: boolean
  title: string
  description: string
}

export function ProgressDialog({ open, title, description }: ProgressDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Loader2 className="h-5 w-5 animate-spin" />
            </span>
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Progress value={65} className="h-2" />
          <p className="text-sm text-muted-foreground">Estamos validando tu sesion y cargando tu perfil.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
