import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import FilesScreen from '../FilesScreen.vue'
import { i18n, resetBus, onNav, useFileStore } from 'micronet-kernel'
import type { NavRequest } from 'micronet-kernel'

vi.mock('../../../composables/storage', () => ({
  storage: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
  },
}))

function mountScreen() {
  return mount(FilesScreen, {
    global: { plugins: [i18n] },
  })
}

describe('FilesScreen', () => {
  let navLog: NavRequest[][]
  let offNav: () => void

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 0, 15, 12, 0))
    resetBus()
    navLog = []
    offNav = onNav((msg) => { navLog.push([msg]) })
    const { files } = useFileStore()
    files.value = []
  })

  afterEach(() => {
    offNav()
    resetBus()
    vi.useRealTimers()
  })

  describe('Initial State', () => {
    it('renders the files screen', () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.files-screen').exists()).toBe(true)
    })

    it('shows the root title', () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.header-title').text()).toContain('On My Device')
    })

    it('shows empty state when no files', () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.empty-state').exists()).toBe(true)
    })

    it('shows the bottom action bar', () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.bottom-bar').exists()).toBe(true)
    })

    it('shows two action buttons in bottom bar', () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      expect(buttons.length).toBe(2)
    })
  })

  describe('Create Folder', () => {
    it('opens create folder modal on folder button click', async () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      await buttons[0].trigger('click')
      await nextTick()
      expect(wrapper.find('.modal-overlay').exists()).toBe(true)
      expect(wrapper.find('.modal-title').exists()).toBe(true)
    })

    it('creates a folder', async () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      await buttons[0].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('My Folder')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      expect(wrapper.find('.list-item').exists()).toBe(true)
      expect(wrapper.find('.item-name').text()).toBe('My Folder')
    })

    it('closes modal after creating folder', async () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      await buttons[0].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('Test')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    })
  })

  describe('Create File', () => {
    it('opens create file modal on file button click', async () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      await buttons[1].trigger('click')
      await nextTick()
      expect(wrapper.find('.modal-overlay').exists()).toBe(true)
    })

    it('creates a file', async () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      await buttons[1].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('document.txt')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      expect(wrapper.find('.list-item').exists()).toBe(true)
      expect(wrapper.find('.item-name').text()).toBe('document.txt')
    })
  })

  describe('Folder Navigation', () => {
    it('navigates into a folder on tap', async () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      await buttons[0].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('Test Folder')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      await wrapper.find('.list-item').trigger('click')
      await nextTick()
      expect(wrapper.find('.header-title').text()).toBe('Test Folder')
    })

    it('shows back button when inside a folder', async () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      await buttons[0].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('Test Folder')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      await wrapper.find('.list-item').trigger('click')
      await nextTick()
      expect(wrapper.find('.back-btn').exists()).toBe(true)
    })

    it('navigates back to root on back button click', async () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      await buttons[0].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('Test Folder')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      await wrapper.find('.list-item').trigger('click')
      await nextTick()
      await wrapper.find('.back-btn').trigger('click')
      await nextTick()
      expect(wrapper.find('.header-title').text()).toContain('On My Device')
    })

    it('shows breadcrumb navigation', async () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      await buttons[0].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('Test Folder')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      await wrapper.find('.list-item').trigger('click')
      await nextTick()
      const crumbs = wrapper.findAll('.crumb')
      expect(crumbs.length).toBe(2)
    })
  })

  describe('File Editor', () => {
    it('opens file editor on file tap', async () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      await buttons[1].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('note.txt')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      await wrapper.find('.list-item').trigger('click')
      await nextTick()
      expect(wrapper.find('.editor-screen').exists()).toBe(true)
    })

    it('shows file name in editor header', async () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      await buttons[1].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('note.txt')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      await wrapper.find('.list-item').trigger('click')
      await nextTick()
      expect(wrapper.find('.editor-title').text()).toBe('note.txt')
    })

    it('has a textarea for editing', async () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      await buttons[1].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('note.txt')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      await wrapper.find('.list-item').trigger('click')
      await nextTick()
      expect(wrapper.find('.editor-textarea').exists()).toBe(true)
    })

    it('closes editor on back button', async () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      await buttons[1].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('note.txt')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      await wrapper.find('.list-item').trigger('click')
      await nextTick()
      await wrapper.find('.editor-header .header-btn').trigger('click')
      await nextTick()
      expect(wrapper.find('.editor-screen').exists()).toBe(false)
    })
  })

  describe('Info Modal', () => {
    it('opens info modal on info button click', async () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      await buttons[0].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('Test Folder')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      await wrapper.find('.item-actions').trigger('click')
      await nextTick()
      expect(wrapper.find('.info-header').exists()).toBe(true)
    })

    it('shows file details in info modal', async () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      await buttons[1].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('test.txt')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      await wrapper.find('.item-actions').trigger('click')
      await nextTick()
      const rows = wrapper.findAll('.info-row')
      expect(rows.length).toBeGreaterThan(0)
    })

    it('has rename and delete buttons in info', async () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      await buttons[0].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('Test')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      await wrapper.find('.item-actions').trigger('click')
      await nextTick()
      const actionBtns = wrapper.findAll('.info-action-btn')
      expect(actionBtns.length).toBe(2)
    })
  })

  describe('Delete', () => {
    it('shows delete confirmation modal from info', async () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      await buttons[0].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('Test')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      await wrapper.find('.item-actions').trigger('click')
      await nextTick()
      const deleteBtn = wrapper.findAll('.info-action-btn')[1]
      await deleteBtn.trigger('click')
      await nextTick()
      expect(wrapper.find('.delete-text').exists()).toBe(true)
    })

    it('deletes an item on confirmation', async () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      await buttons[0].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('To Delete')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      expect(wrapper.findAll('.list-item').length).toBe(1)
      await wrapper.find('.item-actions').trigger('click')
      await nextTick()
      const deleteBtn = wrapper.findAll('.info-action-btn')[1]
      await deleteBtn.trigger('click')
      await nextTick()
      const dangerBtn = wrapper.findAll('.modal-action-btn')[1]
      await dangerBtn.trigger('click')
      await nextTick()
      expect(wrapper.findAll('.list-item').length).toBe(0)
    })

    it('cancels deletion on cancel button', async () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      await buttons[0].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('Keep Me')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      await wrapper.find('.item-actions').trigger('click')
      await nextTick()
      const deleteBtn = wrapper.findAll('.info-action-btn')[1]
      await deleteBtn.trigger('click')
      await nextTick()
      const cancelBtn = wrapper.findAll('.modal-action-btn')[0]
      await cancelBtn.trigger('click')
      await nextTick()
      expect(wrapper.findAll('.list-item').length).toBe(1)
    })
  })

  describe('Rename', () => {
    it('opens rename modal from info', async () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      await buttons[0].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('Old Name')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      await wrapper.find('.item-actions').trigger('click')
      await nextTick()
      const renameBtn = wrapper.findAll('.info-action-btn')[0]
      await renameBtn.trigger('click')
      await nextTick()
      expect(wrapper.find('.modal-overlay').exists()).toBe(true)
    })

    it('renames an item', async () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      await buttons[0].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('Old Name')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      await wrapper.find('.item-actions').trigger('click')
      await nextTick()
      const renameBtn = wrapper.findAll('.info-action-btn')[0]
      await renameBtn.trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('New Name')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      expect(wrapper.find('.item-name').text()).toBe('New Name')
    })
  })

  describe('Search', () => {
    it('opens search on search button click', async () => {
      const wrapper = mountScreen()
      const searchBtn = wrapper.findAll('.icon-btn')[0]
      await searchBtn.trigger('click')
      await nextTick()
      expect(wrapper.find('.search-bar').exists()).toBe(true)
    })

    it('filters items by search query', async () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      await buttons[0].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('Alpha')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      await buttons[0].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('Beta')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      const searchBtn = wrapper.findAll('.icon-btn')[0]
      await searchBtn.trigger('click')
      await nextTick()
      await wrapper.find('.search-input').setValue('Alpha')
      await nextTick()
      expect(wrapper.findAll('.list-item').length).toBe(1)
      expect(wrapper.find('.item-name').text()).toBe('Alpha')
    })

    it('shows empty state when no search results', async () => {
      const wrapper = mountScreen()
      const searchBtn = wrapper.findAll('.icon-btn')[0]
      await searchBtn.trigger('click')
      await nextTick()
      await wrapper.find('.search-input').setValue('nonexistent')
      await nextTick()
      expect(wrapper.find('.empty-state').exists()).toBe(true)
    })
  })

  describe('Sort', () => {
    it('opens sort menu on sort button click', async () => {
      const wrapper = mountScreen()
      const sortBtn = wrapper.findAll('.icon-btn')[1]
      await sortBtn.trigger('click')
      await nextTick()
      expect(wrapper.find('.sort-menu').exists()).toBe(true)
    })

    it('shows sort options', async () => {
      const wrapper = mountScreen()
      const sortBtn = wrapper.findAll('.icon-btn')[1]
      await sortBtn.trigger('click')
      await nextTick()
      const options = wrapper.findAll('.sort-option')
      expect(options.length).toBe(4)
    })
  })

  describe('Selection Mode', () => {
    it('enters selection mode on long press', async () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      await buttons[0].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('Test')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      const item = wrapper.find('.list-item')
      await item.trigger('pointerdown')
      vi.advanceTimersByTime(600)
      await nextTick()
      expect(wrapper.find('.select-check').exists()).toBe(true)
    })

    it('shows delete button in selection mode bottom bar', async () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      await buttons[0].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('Test')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      const item = wrapper.find('.list-item')
      await item.trigger('pointerdown')
      vi.advanceTimersByTime(600)
      await nextTick()
      expect(wrapper.findAll('.bottom-bar .bar-btn').length).toBe(1)
    })

    it('exits selection mode on done button', async () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      await buttons[0].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('Test')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      const item = wrapper.find('.list-item')
      await item.trigger('pointerdown')
      vi.advanceTimersByTime(600)
      await nextTick()
      const doneBtns = wrapper.findAll('.header-btn')
      for (const btn of doneBtns) {
        if (btn.text() === 'Done') {
          await btn.trigger('click')
          break
        }
      }
      await nextTick()
      expect(wrapper.find('.select-check').exists()).toBe(false)
    })
  })

  describe('Navigation', () => {
    it('navigates home on swipe up on home bar', async () => {
      const wrapper = mountScreen()
      const bar = wrapper.find('.home-bar-area')
      await bar.trigger('mousedown', { clientY: 300 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientY: 220 }))
      window.dispatchEvent(new MouseEvent('mouseup'))
      expect(navLog).toHaveLength(1)
      expect(navLog[0][0]).toEqual({ action: 'home' })
    })

    it('navigates back on swipe right', async () => {
      const wrapper = mountScreen()
      const screen = wrapper.find('.files-screen')
      await screen.trigger('mousedown', { clientX: 50 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 250 }))
      window.dispatchEvent(new MouseEvent('mouseup'))
      expect(navLog).toHaveLength(1)
      expect(navLog[0][0]).toEqual({ action: 'back' })
    })
  })

  describe('Nested Folders', () => {
    it('supports nested folder creation', async () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      await buttons[0].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('Parent')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      await wrapper.find('.list-item').trigger('click')
      await nextTick()
      await buttons[0].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('Child')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      expect(wrapper.find('.item-name').text()).toBe('Child')
    })

    it('shows deep breadcrumb for nested folders', async () => {
      const wrapper = mountScreen()
      const buttons = wrapper.findAll('.bottom-bar .bar-btn')
      await buttons[0].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('Level 1')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      await wrapper.find('.list-item').trigger('click')
      await nextTick()
      await buttons[0].trigger('click')
      await nextTick()
      await wrapper.find('.modal-input').setValue('Level 2')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      await wrapper.find('.list-item').trigger('click')
      await nextTick()
      const crumbs = wrapper.findAll('.crumb')
      expect(crumbs.length).toBe(3)
    })
  })
})
