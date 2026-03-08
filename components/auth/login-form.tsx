"use client"

import type React from "react"

import { useState } from "react"
import { CheckCircle2, ShieldAlert } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressDialog } from "@/components/ui/progress-dialog"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const result = await login(email, password)

    if (!result.success) {
      toast({
        variant: "destructive",
        title: (
          <span className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Acceso denegado
          </span>
        ),
        description: result.error || "No fue posible iniciar sesion.",
      })
      setIsSubmitting(false)
      return
    }

    toast({
      title: (
        <span className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Inicio de sesion correcto
        </span>
      ),
      description: result.message || "Tu acceso a FutPro fue validado correctamente.",
    })

    setEmail("")
    setPassword("")
    setIsSubmitting(false)
  }

  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Iniciar Sesion</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder a FutPro</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electronico</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@futpro.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contrasena</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Validando acceso..." : "Ingresar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <ProgressDialog
        open={isSubmitting}
        title="Iniciando sesion"
        description="Estamos verificando tus credenciales contra Supabase."
      />
    </>
  )
}
