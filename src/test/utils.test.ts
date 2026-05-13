import { describe, it, expect } from 'vitest'

describe('Utility sanity checks', () => {
  it('basic arithmetic works', () => {
    expect(1 + 1).toBe(2)
  })

  it('string operations work', () => {
    expect('moments' + 'andmemories').toBe('momentsandmemories')
  })

  it('array operations work', () => {
    const arr = [1, 2, 3]
    expect(arr.length).toBe(3)
    expect(arr.includes(2)).toBe(true)
  })

  it('object operations work', () => {
    const obj = { name: 'Occasio', type: 'event-platform' }
    expect(obj.name).toBe('Occasio')
    expect(Object.keys(obj)).toHaveLength(2)
  })
})
