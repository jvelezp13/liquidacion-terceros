'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [validSession, setValidSession] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Verificar que hay una sesion valida (viene del link del email)
  useEffect(() => {
    let isMounted = true

    // Escuchar cambios de autenticacion (cuando Supabase procesa el token del email)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return

      if (event === 'PASSWORD_RECOVERY') {
        setValidSession(true)
      } else if (event === 'SIGNED_IN' && session) {
        // A veces llega como SIGNED_IN en lugar de PASSWORD_RECOVERY
        setValidSession(true)
      } else if (event === 'INITIAL_SESSION') {
        // Sesion inicial - verificar si hay sesion activa
        setValidSession(!!session)
      }
    })

    // Verificar sesion existente despues de un momento (para dar tiempo al procesamiento del token)
    const timeout = setTimeout(async () => {
      if (!isMounted) return
      const { data: { session } } = await supabase.auth.getSession()
      if (isMounted && validSession === null) {
        setValidSession(!!session)
      }
    }, 1000)

    return () => {
      isMounted = false
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [supabase.auth, validSession])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Las contrasenas no coinciden')
      return
    }

    if (password.length < 8) {
      toast.error('La contrasena debe tener al menos 8 caracteres')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      toast.error('Error al actualizar contrasena', {
        description: error.message,
      })
    } else {
      setSuccess(true)
      toast.success('Contrasena actualizada')
    }

    setLoading(false)
  }

  // Cargando verificacion de sesion
  if (validSession === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // No hay sesion valida (link invalido o expirado)
  if (validSession === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Link invalido</CardTitle>
            <CardDescription className="text-center">
              El link de recuperacion es invalido o ha expirado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Por favor solicita un nuevo link de recuperacion.
            </p>
            <Link href="/forgot-password" className="block">
              <Button className="w-full">Solicitar nuevo link</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Contrasena actualizada exitosamente
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Contrasena actualizada</CardTitle>
            <CardDescription className="text-center">
              Tu contrasena ha sido actualizada exitosamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push('/login')}>
              Ir al login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Formulario para establecer nueva contrasena
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Nueva contrasena</CardTitle>
          <CardDescription>
            Ingresa tu nueva contrasena
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva contrasena</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contrasena</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repite tu contrasena"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar contrasena'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
