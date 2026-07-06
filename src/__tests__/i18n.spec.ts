import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { i18n, setLocale, getLocale } from '@micronet/kernel'

describe('i18n', () => {
  beforeEach(() => {
    localStorage.clear()
    setLocale('en')
  })

  afterEach(() => {
    localStorage.clear()
    setLocale('en')
  })

  it('default locale is en', () => {
    expect(getLocale()).toBe('en')
  })

  it('setLocale("zh") changes locale to zh', () => {
    setLocale('zh')
    expect(getLocale()).toBe('zh')
  })

  it('setLocale("en") changes locale to en', () => {
    setLocale('zh')
    setLocale('en')
    expect(getLocale()).toBe('en')
  })

  it('getLocale() returns current locale', () => {
    expect(getLocale()).toBe('en')
    setLocale('zh')
    expect(getLocale()).toBe('zh')
  })

  it('setLocale persists to localStorage', () => {
    setLocale('zh')
    expect(localStorage.getItem('micronet-locale')).toBe('zh')
    setLocale('en')
    expect(localStorage.getItem('micronet-locale')).toBe('en')
  })

  it('English translations include expected keys', () => {
    const messages = i18n.global.messages.value.en as Record<string, any>
    expect(messages.common).toBeDefined()
    expect(messages.home).toBeDefined()
    expect(messages.settings).toBeDefined()
    expect(messages.camera).toBeDefined()
    expect(messages.photos).toBeDefined()
    expect(messages.maps).toBeDefined()
    expect(messages.calendar).toBeDefined()
  })

  it('Chinese translations include expected keys', () => {
    const messages = i18n.global.messages.value.zh as Record<string, any>
    expect(messages.common).toBeDefined()
    expect(messages.home).toBeDefined()
    expect(messages.settings).toBeDefined()
    expect(messages.camera).toBeDefined()
    expect(messages.photos).toBeDefined()
    expect(messages.maps).toBeDefined()
    expect(messages.calendar).toBeDefined()
  })

  it('dateFormat key exists in both locales', () => {
    const en = i18n.global.messages.value.en as Record<string, any>
    const zh = i18n.global.messages.value.zh as Record<string, any>
    expect(en.time).toBeDefined()
    expect(zh.time).toBeDefined()
    expect(typeof en.time).toBe('object')
    expect(typeof zh.time).toBe('object')
  })
})
