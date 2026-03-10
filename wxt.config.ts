import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Block Clipper',
    description: 'Clip, save, and organize web content instantly. Local storage, Markdown export, full-text search. Privacy-focused.',
    permissions: ['activeTab', 'storage', 'scripting', 'contextMenus', 'sidePanel', 'notifications', 'windows'],
    options_page: 'options.html',
    options_ui: {
      page: 'options.html',
      open_in_tab: true,
    },
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
  },
});
