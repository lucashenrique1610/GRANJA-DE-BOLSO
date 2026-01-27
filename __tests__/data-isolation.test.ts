import { describe, it, expect, vi, beforeEach } from 'vitest'
import { verifyResourceAccess } from '@/lib/security'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserFromRequest } from '@/lib/auth-helper'

// Mocks
vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

vi.mock('@/lib/auth-helper', () => ({
  getUserFromRequest: vi.fn(),
}))

describe('Data Isolation & Security', () => {
  const mockReq = {
    headers: {
      get: vi.fn().mockReturnValue('127.0.0.1')
    }
  } as unknown as Request

  const mockUser = { id: 'user-123' }
  const otherUser = { id: 'user-456' }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(getUserFromRequest as any).mockResolvedValue(mockUser)
  })

  it('should allow access to own resource', async () => {
    // Setup mock DB response: resource exists and belongs to user
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { user_id: 'user-123' }, error: null })
      })
    })
    ;(supabaseAdmin.from as any).mockReturnValue({ select: mockSelect })

    const result = await verifyResourceAccess(mockReq, 'lotes', 'lote-1')

    expect(result.status).toBe('granted')
    expect(result).toHaveProperty('user', mockUser)
  })

  it('should forbid access to another user resource and log audit', async () => {
    // Setup mock DB response: resource exists but belongs to OTHER user
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { user_id: 'user-456' }, error: null })
      })
    })
    
    const mockInsert = vi.fn().mockResolvedValue({ error: null })
    
    ;(supabaseAdmin.from as any).mockImplementation((table: string) => {
      if (table === 'lotes') return { select: mockSelect }
      if (table === 'audit_logs') return { insert: mockInsert }
      return {}
    })

    const result = await verifyResourceAccess(mockReq, 'lotes', 'lote-1')

    expect(result.status).toBe('forbidden')
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      action: 'security_violation',
      user_id: 'user-123',
      entity: 'lotes',
      entity_id: 'lote-1'
    }))
  })

  it('should return not_found for non-existent resource', async () => {
    // Setup mock DB response: resource does not exist
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      })
    })
    ;(supabaseAdmin.from as any).mockReturnValue({ select: mockSelect })

    const result = await verifyResourceAccess(mockReq, 'lotes', 'lote-999')

    expect(result.status).toBe('not_found')
    // Should NOT log security violation for simple 404 (to avoid log spam on typos)
    // Unless we want to log 404s too, but spec said "block access", usually implies existing resources.
  })

  it('should return unauthorized if no user', async () => {
    ;(getUserFromRequest as any).mockResolvedValue(null)
    const result = await verifyResourceAccess(mockReq, 'lotes', 'lote-1')
    expect(result.status).toBe('unauthorized')
  })
})
