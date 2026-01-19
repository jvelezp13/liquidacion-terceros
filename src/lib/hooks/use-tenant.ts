/**
 * Hooks para gestion de tenants (multi-empresa)
 * Hooks: useActiveTenant, useUserTenants, useSetActiveTenant
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// Tipos para tenant
export interface Tenant {
  id: string
  nombre: string
  slug: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface TenantUser {
  id: string
  tenant_id: string
  user_id: string
  rol: 'admin' | 'editor' | 'viewer'
  tenant_activo: boolean
  created_at: string
  tenant?: Tenant
}

/**
 * Obtiene el tenant activo del usuario actual
 */
export function useActiveTenant() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['tenants', 'active'],
    queryFn: async () => {
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      // Buscar el tenant activo del usuario
      const { data, error } = await supabase
        .from('tenant_users')
        .select(`
          *,
          tenant:tenants(*)
        `)
        .eq('user_id', user.id)
        .eq('tenant_activo', true)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      // Retornar el tenant con los datos del TenantUser
      if (data && data.tenant) {
        return {
          ...data.tenant,
          rol: data.rol as 'admin' | 'editor' | 'viewer',
          tenantUserId: data.id,
        }
      }

      return null
    },
  })
}

/**
 * Obtiene todos los tenants a los que pertenece el usuario
 */
export function useUserTenants() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['tenants', 'user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('tenant_users')
        .select(`
          *,
          tenant:tenants(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Mapear para retornar tenants con info del usuario
      return (data || []).map(tu => ({
        ...tu.tenant as Tenant,
        rol: tu.rol as 'admin' | 'editor' | 'viewer',
        tenantUserId: tu.id,
        isActive: tu.tenant_activo,
      }))
    },
  })
}

/**
 * Cambia el tenant activo del usuario
 */
export function useSetActiveTenant() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tenantId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      // Desactivar todos los tenants del usuario
      const { error: deactivateError } = await supabase
        .from('tenant_users')
        .update({ tenant_activo: false })
        .eq('user_id', user.id)

      if (deactivateError) throw deactivateError

      // Activar el tenant seleccionado
      const { data, error } = await supabase
        .from('tenant_users')
        .update({ tenant_activo: true })
        .eq('user_id', user.id)
        .eq('tenant_id', tenantId)
        .select(`
          *,
          tenant:tenants(*)
        `)
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidar todas las queries relacionadas con datos del tenant
      // Esto fuerza a recargar todos los datos con el nuevo tenant
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: ['escenario'] })
      // Invalidar todas las queries de datos
      queryClient.invalidateQueries()
    },
  })
}

/**
 * Verifica si el usuario tiene un rol especifico o superior
 * admin > editor > viewer
 */
export function useHasRole(requiredRole: 'admin' | 'editor' | 'viewer') {
  const { data: tenant, isLoading } = useActiveTenant()

  const roleHierarchy = { admin: 3, editor: 2, viewer: 1 }

  const hasRole = tenant
    ? roleHierarchy[tenant.rol] >= roleHierarchy[requiredRole]
    : false

  return { hasRole, isLoading }
}

/**
 * Hook helper para verificar si el usuario puede editar
 */
export function useCanEdit() {
  return useHasRole('editor')
}

/**
 * Hook helper para verificar si el usuario es admin
 */
export function useIsAdmin() {
  return useHasRole('admin')
}
