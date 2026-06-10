import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextResponse } from "next/server"

// Hoisted mocks must be defined before imports that use them
const { 
  mockFrom, 
  mockSelect, 
  mockEq, 
  mockIn, 
  mockOrder, 
  mockLimit, 
  mockInsert, 
  mockSingle, 
  mockGetUserById 
} = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockSelect: vi.fn(),
  mockEq: vi.fn(),
  mockIn: vi.fn(),
  mockOrder: vi.fn(),
  mockLimit: vi.fn(),
  mockInsert: vi.fn(),
  mockSingle: vi.fn(),
  mockGetUserById: vi.fn(),
}))

vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: mockFrom,
    auth: {
      admin: {
        getUserById: mockGetUserById,
      },
    },
  },
}))

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body) => ({ body, status: 200 })),
    error: vi.fn(),
  },
}))

// Import the route handler AFTER mocking
import { GET } from "../app/api/subscription/status/route"

describe("Subscription Status API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default chain for supabase query
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
    })
    mockSelect.mockReturnValue({
      eq: mockEq,
      single: mockSingle,
    })
    mockEq.mockReturnValue({
      in: mockIn,
    })
    mockIn.mockReturnValue({
      order: mockOrder,
    })
    mockOrder.mockReturnValue({
      limit: mockLimit,
    })
    mockInsert.mockReturnValue({
      select: mockSelect,
    })
  })

  it("should return active for existing subscription", async () => {
    const userId = "user-123"
    const req = new Request(`http://localhost/api/subscription/status?userId=${userId}`)
    
    // Mock existing subscription found
    mockLimit.mockResolvedValue({
      data: [{ status: "active", user_id: userId }],
      error: null,
    })

    const response = await GET(req)
    // @ts-ignore
    expect(response.body).toEqual({
      active: true,
      subscription: { status: "active", user_id: userId },
    })
  })

  it("should create trial for new user without subscription", async () => {
    const userId = "new-user-123"
    const req = new Request(`http://localhost/api/subscription/status?userId=${userId}`)
    
    // Mock no existing subscription
    mockLimit.mockResolvedValue({
      data: [],
      error: null,
    })

    // Mock user created recently (now)
    mockGetUserById.mockResolvedValue({
      data: { user: { created_at: new Date().toISOString() } },
      error: null,
    })

    // Mock trial insertion success
    const trialData = {
      id: `trial_${userId}`,
      status: "trialing",
      user_id: userId,
    }
    mockSingle.mockResolvedValue({
      data: trialData,
      error: null,
    })

    const response = await GET(req)
    
    // Verify insertion was called
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: userId,
      status: "trialing",
      metadata: { source: "free_trial" },
    }))

    // @ts-ignore
    expect(response.body).toEqual({
      active: true,
      subscription: trialData,
    })
  })

  it("should deny trial for old user without subscription", async () => {
    const userId = "old-user-123"
    const req = new Request(`http://localhost/api/subscription/status?userId=${userId}`)
    
    // Mock no existing subscription
    mockLimit.mockResolvedValue({
      data: [],
      error: null,
    })

    // Mock user created 10 days ago
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 10)
    mockGetUserById.mockResolvedValue({
      data: { user: { created_at: oldDate.toISOString() } },
      error: null,
    })

    const response = await GET(req)
    
    // Verify insertion was NOT called
    expect(mockInsert).not.toHaveBeenCalled()

    // @ts-ignore
    expect(response.body).toEqual({
      active: false,
    })
  })
})
