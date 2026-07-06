import { describe, it, expect, beforeEach } from 'vitest'
import { storage } from '../storage'

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('set and get round-trip a value', async () => {
    await storage.set('test-key', 'hello')
    const result = await storage.get('test-key')
    expect(result).toBe('hello')
  })

  it('get returns null for non-existent key', async () => {
    const result = await storage.get('missing-key')
    expect(result).toBeNull()
  })

  it('del removes a key', async () => {
    await storage.set('to-delete', 'value')
    await storage.del('to-delete')
    const result = await storage.get('to-delete')
    expect(result).toBeNull()
  })

  it('del on non-existent key does not throw', async () => {
    await expect(storage.del('never-existed')).resolves.toBeUndefined()
  })

  it('handles storing JSON strings', async () => {
    const data = JSON.stringify({ name: 'test', items: [1, 2, 3] })
    await storage.set('json-key', data)
    const result = await storage.get('json-key')
    expect(JSON.parse(result!)).toEqual({ name: 'test', items: [1, 2, 3] })
  })

  it('overwrites existing values', async () => {
    await storage.set('key', 'first')
    await storage.set('key', 'second')
    const result = await storage.get('key')
    expect(result).toBe('second')
  })
})
