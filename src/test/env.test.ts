import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Environment configuration', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')
    vi.stubEnv('VITE_API_URL', 'http://localhost:8000')
  })

  it('VITE_SUPABASE_URL is a valid URL format', () => {
    const url = import.meta.env.VITE_SUPABASE_URL
    expect(url).toBeDefined()
    expect(url).toContain('supabase')
  })

  it('VITE_SUPABASE_ANON_KEY is defined', () => {
    expect(import.meta.env.VITE_SUPABASE_ANON_KEY).toBeDefined()
  })

  it('VITE_API_URL is defined', () => {
    expect(import.meta.env.VITE_API_URL).toBeDefined()
  })
})
