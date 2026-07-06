import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import NotesScreen from '../NotesScreen.vue'
import { useNotesStore } from '@micronet/kernel'
import { i18n } from '@micronet/kernel'

vi.mock('../../../composables/storage', () => ({
  storage: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
  },
}))

function mountScreen() {
  return mount(NotesScreen, {
    global: { plugins: [i18n] },
  })
}

describe('NotesScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 0, 15, 12, 0))
    const { notes } = useNotesStore()
    notes.value = []
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the header', () => {
    const wrapper = mountScreen()
    expect(wrapper.find('.header-title').text()).toBe('Notes')
  })

  it('shows empty state when no notes exist', () => {
    const wrapper = mountScreen()
    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.find('.empty-title').text()).toBe('No Notes')
    expect(wrapper.find('.empty-desc').text()).toContain('Tap +')
  })

  it('opens editor on add button click', async () => {
    const wrapper = mountScreen()
    await wrapper.find('.add-btn').trigger('click')
    await nextTick()
    expect(wrapper.find('.modal-overlay').exists()).toBe(true)
    expect(wrapper.find('.modal-title').text()).toBe('New Note')
  })

  it('creates a new note', async () => {
    const wrapper = mountScreen()
    await wrapper.find('.add-btn').trigger('click')
    await nextTick()

    await wrapper.find('.editor-title').setValue('My First Note')
    await wrapper.find('.editor-content').setValue('Some content here')
    await wrapper.find('.modal-save').trigger('click')
    await nextTick()

    expect(wrapper.find('.note-card').exists()).toBe(true)
    expect(wrapper.find('.note-title').text()).toBe('My First Note')
    expect(wrapper.find('.note-preview').text()).toBe('Some content here')
  })

  it('edits an existing note', async () => {
    const wrapper = mountScreen()
    await wrapper.find('.add-btn').trigger('click')
    await nextTick()
    await wrapper.find('.editor-title').setValue('Original Title')
    await wrapper.find('.editor-content').setValue('Original content')
    await wrapper.find('.modal-save').trigger('click')
    await nextTick()

    expect(wrapper.find('.note-title').text()).toBe('Original Title')

    await wrapper.find('.note-card').trigger('click')
    await nextTick()
    expect(wrapper.find('.modal-overlay').exists()).toBe(true)
    expect(wrapper.find('.modal-title').text()).toBe('Edit Note')

    await wrapper.find('.editor-title').setValue('Updated Title')
    await wrapper.find('.modal-save').trigger('click')
    await nextTick()

    expect(wrapper.find('.note-title').text()).toBe('Updated Title')
  })

  it('deletes a note', async () => {
    const wrapper = mountScreen()
    await wrapper.find('.add-btn').trigger('click')
    await nextTick()
    await wrapper.find('.editor-title').setValue('To Delete')
    await wrapper.find('.modal-save').trigger('click')
    await nextTick()

    expect(wrapper.find('.note-card').exists()).toBe(true)

    await wrapper.find('.note-card').trigger('click')
    await nextTick()
    await wrapper.find('.delete-note-btn').trigger('click')
    await nextTick()

    expect(wrapper.find('.note-card').exists()).toBe(false)
    expect(wrapper.find('.empty-state').exists()).toBe(true)
  })

  it('closes modal on close button click', async () => {
    const wrapper = mountScreen()
    await wrapper.find('.add-btn').trigger('click')
    await nextTick()
    expect(wrapper.find('.modal-overlay').exists()).toBe(true)

    await wrapper.find('.modal-close').trigger('click')
    await nextTick()
    expect(wrapper.find('.modal-overlay').exists()).toBe(false)
  })

  it('closes modal on overlay click', async () => {
    const wrapper = mountScreen()
    await wrapper.find('.add-btn').trigger('click')
    await nextTick()

    await wrapper.find('.modal-overlay').trigger('click.self')
    await nextTick()
    expect(wrapper.find('.modal-overlay').exists()).toBe(false)
  })

  it('disables save when title and content are empty', async () => {
    const wrapper = mountScreen()
    await wrapper.find('.add-btn').trigger('click')
    await nextTick()

    expect(wrapper.find('.modal-save').attributes('disabled')).toBeDefined()
  })

  it('enables save when title is provided', async () => {
    const wrapper = mountScreen()
    await wrapper.find('.add-btn').trigger('click')
    await nextTick()

    await wrapper.find('.editor-title').setValue('A title')
    await nextTick()
    expect(wrapper.find('.modal-save').attributes('disabled')).toBeUndefined()
  })

  it('enables save when content is provided', async () => {
    const wrapper = mountScreen()
    await wrapper.find('.add-btn').trigger('click')
    await nextTick()

    await wrapper.find('.editor-content').setValue('Some content')
    await nextTick()
    expect(wrapper.find('.modal-save').attributes('disabled')).toBeUndefined()
  })

  it('selects a color in the color picker', async () => {
    const wrapper = mountScreen()
    await wrapper.find('.add-btn').trigger('click')
    await nextTick()

    const colorDots = wrapper.findAll('.color-dot')
    expect(colorDots.length).toBeGreaterThan(0)
    await colorDots[2].trigger('click')
    expect(colorDots[2].classes()).toContain('active')
  })

  it('toggles pin state', async () => {
    const wrapper = mountScreen()
    await wrapper.find('.add-btn').trigger('click')
    await nextTick()
    await wrapper.find('.editor-title').setValue('Pinned Note')
    await wrapper.find('.toolbar-btn').trigger('click')
    await wrapper.find('.modal-save').trigger('click')
    await nextTick()

    expect(wrapper.find('.pin-badge').exists()).toBe(true)
    expect(wrapper.find('.section-label').text()).toBe('Pinned')
  })

  it('shows note count in header', async () => {
    const wrapper = mountScreen()
    await wrapper.find('.add-btn').trigger('click')
    await nextTick()
    await wrapper.find('.editor-title').setValue('Note 1')
    await wrapper.find('.modal-save').trigger('click')
    await nextTick()

    expect(wrapper.find('.note-count').text()).toBe('1')
  })

  it('shows search bar when search button is clicked', async () => {
    const wrapper = mountScreen()
    await wrapper.find('.icon-btn').trigger('click')
    await nextTick()
    expect(wrapper.find('.search-bar').exists()).toBe(true)
    expect(wrapper.find('.search-input').exists()).toBe(true)
  })

  it('searches notes by title', async () => {
    const wrapper = mountScreen()

    await wrapper.find('.add-btn').trigger('click')
    await nextTick()
    await wrapper.find('.editor-title').setValue('Grocery List')
    await wrapper.find('.editor-content').setValue('Milk and eggs')
    await wrapper.find('.modal-save').trigger('click')
    await nextTick()

    await wrapper.find('.add-btn').trigger('click')
    await nextTick()
    await wrapper.find('.editor-title').setValue('Work Notes')
    await wrapper.find('.editor-content').setValue('Meeting at 3pm')
    await wrapper.find('.modal-save').trigger('click')
    await nextTick()

    await wrapper.find('.icon-btn').trigger('click')
    await nextTick()
    await wrapper.find('.search-input').setValue('Grocery')
    await nextTick()

    const titles = wrapper.findAll('.note-title')
    expect(titles).toHaveLength(1)
    expect(titles[0].text()).toBe('Grocery List')
  })

  it('shows no results message when search has no matches', async () => {
    const wrapper = mountScreen()

    await wrapper.find('.add-btn').trigger('click')
    await nextTick()
    await wrapper.find('.editor-title').setValue('Some Note')
    await wrapper.find('.modal-save').trigger('click')
    await nextTick()

    await wrapper.find('.icon-btn').trigger('click')
    await nextTick()
    await wrapper.find('.search-input').setValue('zzzznonexistent')
    await nextTick()

    expect(wrapper.find('.empty-title').text()).toBe('No Results')
  })

  it('clears search when clear button is clicked', async () => {
    const wrapper = mountScreen()

    await wrapper.find('.add-btn').trigger('click')
    await nextTick()
    await wrapper.find('.editor-title').setValue('Test Note')
    await wrapper.find('.modal-save').trigger('click')
    await nextTick()

    await wrapper.find('.icon-btn').trigger('click')
    await nextTick()
    await wrapper.find('.search-input').setValue('xyz')
    await nextTick()

    expect(wrapper.findAll('.note-card')).toHaveLength(0)

    await wrapper.find('.clear-btn').trigger('click')
    await nextTick()

    expect((wrapper.find('.search-input').element as HTMLInputElement).value).toBe('')
    expect(wrapper.findAll('.note-card')).toHaveLength(1)
  })

  it('displays relative time for notes', async () => {
    const wrapper = mountScreen()
    await wrapper.find('.add-btn').trigger('click')
    await nextTick()
    await wrapper.find('.editor-title').setValue('Time Test')
    await wrapper.find('.modal-save').trigger('click')
    await nextTick()

    expect(wrapper.find('.note-time').text()).toBe('Just now')
  })

  it('creates note with auto-generated title from content', async () => {
    const wrapper = mountScreen()
    await wrapper.find('.add-btn').trigger('click')
    await nextTick()

    await wrapper.find('.editor-content').setValue('This is content without a title')
    await wrapper.find('.modal-save').trigger('click')
    await nextTick()

    expect(wrapper.find('.note-title').text()).toBe('This is content without a title')
  })

  it('sorts pinned notes before unpinned notes', async () => {
    const wrapper = mountScreen()

    await wrapper.find('.add-btn').trigger('click')
    await nextTick()
    await wrapper.find('.editor-title').setValue('Regular Note')
    await wrapper.find('.modal-save').trigger('click')
    await nextTick()

    await wrapper.find('.add-btn').trigger('click')
    await nextTick()
    await wrapper.find('.editor-title').setValue('Important Note')
    await wrapper.find('.toolbar-btn').trigger('click')
    await wrapper.find('.modal-save').trigger('click')
    await nextTick()

    const pinnedSection = wrapper.find('.section')
    expect(pinnedSection.find('.section-label').text()).toBe('Pinned')
    expect(pinnedSection.find('.note-title').text()).toBe('Important Note')
  })
})
