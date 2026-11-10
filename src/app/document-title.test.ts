import { describe, expect, it } from 'vitest'

import { enUSMessages, zhCNMessages } from '@/app/i18n/messages'
import { getDocumentTitle } from './document-title'

const zh = (key: keyof typeof zhCNMessages) => zhCNMessages[key]
const en = (key: keyof typeof enUSMessages) => enUSMessages[key]

describe('getDocumentTitle', () => {
  it('prefixes the page name to the brand', () => {
    expect(getDocumentTitle('/users', zh)).toBe('用户管理 - Arco Pro')
    expect(getDocumentTitle('/users', en)).toBe('User Management - Arco Pro')
  })

  it('names the login page', () => {
    expect(getDocumentTitle('/login', zh)).toBe('登录 - Arco Pro')
  })

  it('falls back to the brand for unknown and untitled paths', () => {
    expect(getDocumentTitle('/', zh)).toBe('Arco Pro')
    expect(getDocumentTitle('/missing', en)).toBe('Arco Pro')
    expect(getDocumentTitle('/welcome', zh)).toBe('Arco Pro')
  })
})
