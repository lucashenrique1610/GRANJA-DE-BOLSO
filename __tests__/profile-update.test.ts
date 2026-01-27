
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../app/api/auth/update/route'
import { NextResponse } from 'next/server'

// Mock Supabase client
const mockUpdateUser = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseServerClient: () => ({
    auth: {
      updateUser: mockUpdateUser,
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } })
    },
    from: mockFrom
  })
}))

describe('Profile Update API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateUser.mockResolvedValue({ error: null })
  })

  it('should update user metadata successfully', async () => {
    const req = new Request('http://localhost/api/auth/update', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: { nome: 'New Name', telefone: '123456789' }
      })
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    
    // Verify auth.updateUser was called
    expect(mockUpdateUser).toHaveBeenCalledWith({
      data: { nome: 'New Name', telefone: '123456789' }
    })
    
    // Verify profiles table was NOT accessed (since it doesn't exist)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('should return error if auth update fails', async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: 'Auth error' } })

    const req = new Request('http://localhost/api/auth/update', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: { nome: 'Fail Name' }
      })
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('Auth error')
  })
})
