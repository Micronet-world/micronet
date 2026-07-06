import { ref, watch } from 'vue'
import { storage } from './storage'

export type FileType = 'file' | 'folder'

export interface FileItem {
  id: string
  name: string
  type: FileType
  parentId: string | null
  content: string
  size: number
  color: string
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'micronet-files'

const files = ref<FileItem[]>([])
let loadPromise: Promise<void> | null = null

function load() {
  if (loadPromise) return loadPromise
  loadPromise = (async () => {
    try {
      const raw = await storage.get(STORAGE_KEY)
      if (raw) {
        files.value = JSON.parse(raw)
      }
    } catch {
      files.value = []
    }
  })()
  return loadPromise
}

function save() {
  storage.set(STORAGE_KEY, JSON.stringify(files.value)).catch(() => {})
}

watch(files, save, { deep: true })

function generateId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function nowISO(): string {
  return new Date().toISOString()
}

export function useFileStore() {
  load()

  function addFolder(name: string, parentId: string | null = null, color: string = '#007aff'): FileItem {
    const ts = nowISO()
    const item: FileItem = {
      id: generateId(),
      name,
      type: 'folder',
      parentId,
      content: '',
      size: 0,
      color,
      createdAt: ts,
      updatedAt: ts,
    }
    files.value.push(item)
    return item
  }

  function addFile(name: string, parentId: string | null = null, content: string = ''): FileItem {
    const ts = nowISO()
    const item: FileItem = {
      id: generateId(),
      name,
      type: 'file',
      parentId,
      content,
      size: new TextEncoder().encode(content).length,
      color: '',
      createdAt: ts,
      updatedAt: ts,
    }
    files.value.push(item)
    return item
  }

  function updateFile(id: string, updates: Partial<Pick<FileItem, 'name' | 'content' | 'color'>>) {
    const idx = files.value.findIndex(f => f.id === id)
    if (idx !== -1) {
      const merged = { ...files.value[idx], ...updates, updatedAt: nowISO() }
      if (updates.content !== undefined) {
        merged.size = new TextEncoder().encode(updates.content).length
      }
      files.value[idx] = merged
    }
  }

  function deleteItem(id: string) {
    const descendants = getDescendantIds(id)
    const toDelete = new Set([id, ...descendants])
    files.value = files.value.filter(f => !toDelete.has(f.id))
  }

  function deleteItems(ids: string[]) {
    const toDelete = new Set<string>(ids)
    for (const id of ids) {
      for (const desc of getDescendantIds(id)) {
        toDelete.add(desc)
      }
    }
    files.value = files.value.filter(f => !toDelete.has(f.id))
  }

  function moveItem(id: string, newParentId: string | null) {
    if (id === newParentId) return
    if (newParentId && isDescendant(id, newParentId)) return
    const idx = files.value.findIndex(f => f.id === id)
    if (idx !== -1) {
      files.value[idx] = { ...files.value[idx], parentId: newParentId, updatedAt: nowISO() }
    }
  }

  function getItemById(id: string): FileItem | undefined {
    return files.value.find(f => f.id === id)
  }

  function getChildren(parentId: string | null): FileItem[] {
    return files.value.filter(f => f.parentId === parentId)
  }

  function getDescendantIds(parentId: string): string[] {
    const result: string[] = []
    const stack = [parentId]
    while (stack.length) {
      const current = stack.pop()!
      const children = files.value.filter(f => f.parentId === current)
      for (const child of children) {
        result.push(child.id)
        stack.push(child.id)
      }
    }
    return result
  }

  function isDescendant(ancestorId: string, descendantId: string): boolean {
    let current: string | null = descendantId
    while (current) {
      if (current === ancestorId) return true
      const item = files.value.find(f => f.id === current)
      current = item ? item.parentId : null
    }
    return false
  }

  function getBreadcrumb(itemId: string | null): FileItem[] {
    const path: FileItem[] = []
    let current = itemId
    while (current) {
      const item = files.value.find(f => f.id === current)
      if (!item) break
      path.unshift(item)
      current = item.parentId
    }
    return path
  }

  function searchFiles(query: string, parentId: string | null = null): FileItem[] {
    const q = query.toLowerCase().trim()
    if (!q) return getSortedChildren(parentId)
    return files.value.filter(f =>
      f.name.toLowerCase().includes(q),
    )
  }

  function getSortedChildren(parentId: string | null, sortBy: 'name' | 'date' | 'size' = 'name', ascending: boolean = true): FileItem[] {
    const children = getChildren(parentId)
    const folders = children.filter(f => f.type === 'folder')
    const filesOnly = children.filter(f => f.type === 'file')

    const sortFn = (a: FileItem, b: FileItem): number => {
      let cmp = 0
      switch (sortBy) {
        case 'name':
          cmp = a.name.localeCompare(b.name)
          break
        case 'date':
          cmp = b.updatedAt.localeCompare(a.updatedAt)
          break
        case 'size':
          cmp = a.size - b.size
          break
      }
      return ascending ? cmp : -cmp
    }

    return [...folders.sort(sortFn), ...filesOnly.sort(sortFn)]
  }

  function getItemCount(parentId: string | null): number {
    return getChildren(parentId).length
  }

  function getFolderCount(parentId: string | null): number {
    return getChildren(parentId).filter(f => f.type === 'folder').length
  }

  function getFileCount(parentId: string | null): number {
    return getChildren(parentId).filter(f => f.type === 'file').length
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    const size = bytes / Math.pow(1024, i)
    return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
  }

  function clearAll() {
    files.value = []
  }

  return {
    files,
    addFolder,
    addFile,
    updateFile,
    deleteItem,
    deleteItems,
    moveItem,
    getItemById,
    getChildren,
    getBreadcrumb,
    searchFiles,
    getSortedChildren,
    getItemCount,
    getFolderCount,
    getFileCount,
    formatFileSize,
    clearAll,
  }
}
