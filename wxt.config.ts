import { defineConfig } from 'wxt'
import tailwindcss from '@tailwindcss/vite'

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  experimental: {
    // Enable root-level component auto-import
    includeComponents: ['components/**/*'],
    // Enable root-level hook auto-import
    includeHooks: ['hooks/**/*'],
  },
  manifest: {
    name: 'Block Clipper',
    description:
      'Clip, save, and organize web content instantly. Local storage, Markdown export, full-text search. Privacy-focused.',
    permissions: [
      'activeTab',
      'storage',
      'scripting',
      'contextMenus',
      'sidePanel',
      'notifications',
      'windows',
    ],
    default_locale: 'en',
    options_page: 'options-page.html',
    side_panel: {
      default_path: 'sidepanel.html',
    },
    commands: {
      'clip-selection': {
        suggested_key: {
          default: 'Ctrl+Shift+Y',
          mac: 'Command+Shift+Y',
        },
        description: 'Clip selected content',
      },
      'open-sidepanel': {
        suggested_key: {
          default: 'Ctrl+Shift+S',
          mac: 'Command+Shift+S',
        },
        description: 'Open Block Clipper side panel',
      },
    },
    action: {
      default_title: 'Open Block Clipper',
    },
    web_accessible_resources: [
      {
        resources: ['chunks/*-Readability.js'],
        matches: ['<all_urls>'],
      },
    ],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
})
