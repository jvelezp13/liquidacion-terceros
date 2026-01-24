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

// Roles del sistema
// Nota: 'logistica' tiene permisos de editor en Liquidacion de Terceros
// 'soporte' es rol temporal de super admin con acceso completo
export type RolTenant = 'admin' | 'editor' | 'viewer' | 'logistica' | 'soporte'

export interface TenantUser {
  id: string
  tenant_id: string
  user_id: string
  rol: RolTenant
  tenant_activo: boolean
  created_at: string
  tenant?: Tenant
}

// Tipo para el tenant activo con datos de rol
export interface ActiveTenant extends Tenant {
  rol: RolTenant
  tenantUserId: string
}

// Tipo para tenant en lista de usuario
export interface UserTenantItem extends ActiveTenant {
  isActive: boolean
}

// Tipo para respuesta de query con tenant
interface TenantUserWithTenant {
  id: string
  user_id: string
  tenant_id: string
  rol: string
  tenant_activo: boolean
  tenant: Tenant | null
}

/**
 * Obtiene el tenant activo del usuario actual
 */
export function useActiveTenant() {
  const supabase = createClient()

  return useQuery<ActiveTenant | null>({
    queryKey: ['tenants', 'active'],
    queryFn: async (): Promise<ActiveTenant | null> => {
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = supabase as any

      // Buscar el tenant activo del usuario
      const { data, error } = await client
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
      const tenantUser = data as TenantUserWithTenant | null
      if (tenantUser && tenantUser.tenant) {
        return {
          ...tenantUser.tenant,
          rol: tenantUser.rol as RolTenant,
          tenantUserId: tenantUser.id,
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

  return useQuery<UserTenantItem[]>({
    queryKey: ['tenants', 'user'],
    queryFn: async (): Promise<UserTenantItem[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = supabase as any

      const { data, error } = await client
        .from('tenant_users')
        .select(`
          *,
          tenant:tenants(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Mapear para retornar tenants con info del usuario
      const tenantUsers = (data || []) as TenantUserWithTenant[]
      return tenantUsers
        .filter(tu => tu.tenant !== null)
        .map(tu => ({
          ...tu.tenant!,
          rol: tu.rol as RolTenant,
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = supabase as any

      // Desactivar todos los tenants del usuario
      const { error: deactivateError } = await client
        .from('tenant_users')
        .update({ tenant_activo: false })
        .eq('user_id', user.id)

      if (deactivateError) throw deactivateError

      // Activar el tenant seleccionado
      const { data, error } = await client
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
      return data as TenantUserWithTenant
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
 * admin > editor = logistica > viewer
 * Nota: En Liquidacion de Terceros, 'logistica' tiene los mismos permisos que 'editor'
 */
export function useHasRole(requiredRole: 'admin' | 'editor' | 'viewer') {
  const { data: tenant, isLoading } = useActiveTenant()

  // logistica tiene nivel de editor en Liquidacion de Terceros
  // soporte tiene nivel de admin (acceso completo)
  const roleHierarchy: Record<RolTenant, number> = {
    admin: 3,
    soporte: 3, // Mismo nivel que admin
    editor: 2,
    logistica: 2, // Mismo nivel que editor
    viewer: 1,
  }

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
