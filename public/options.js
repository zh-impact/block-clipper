/**
 * Options Page Script
 * @description Handles displaying and managing all saved clips
 */

// IndexedDB configuration - must match StorageService
const DB_NAME = 'block-clipper-db';
const DB_VERSION = 1;
const STORE_NAME = 'blocks';
const INDEX_NAME = 'by-created'; // Must match INDEXES.BY_CREATED in schema.ts

let db = null;
let allBlocksCache = []; // Cache for export
let exportFormat = 'json';
let importFormat = 'json';
let isImporting = false;
let isExporting = false;
let densityMode = 'standard';

function applyDensityMode() {
  document.body.classList.toggle('density-compact', densityMode === 'compact');
  const toggle = document.getElementById('density-toggle');
  if (toggle) {
    toggle.textContent = densityMode === 'compact' ? 'Standard' : 'Compact';
  }
}

function getEffectiveExportFormat() {
  return densityMode === 'compact' ? 'json' : exportFormat;
}

function getEffectiveImportFormat() {
  return densityMode === 'compact' ? 'json' : importFormat;
}

// Export utility functions
function generateExportFilename(format, count) {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
  const ext = format === 'json' ? 'json' : 'md';
  return `block-clipper-export_${dateStr}_${timeStr}_${count}-items.${ext}`;
}

function exportBlockToMarkdown(block) {
  const parts = [];
  parts.push('---');
  parts.push(`type: ${block.type}`);
  parts.push(`created_at: ${block.createdAt}`);
  parts.push(`source_url: ${block.source.url}`);
  parts.push(`source_title: ${block.source.title}`);
  parts.push('---');
  parts.push('');
  parts.push(block.content);
  parts.push('');
  parts.push('');
  parts.push(`*From: ${block.source.title}*`);
  parts.push(`*Saved: ${new Date(block.createdAt).toLocaleString()}*`);
  return parts.join('\n');
}

function exportBlocksToMarkdown(blocks) {
  return blocks
    .map((block) => exportBlockToMarkdown(block))
    .join('\n\n---\n\n');
}

function exportBlocksToJSON(blocks) {
  const data = blocks.map((block) => ({
    type: block.type,
    content: block.content,
    source: block.source,
    createdAt: block.createdAt,
  }));
  return JSON.stringify(data, null, 2);
}

function downloadFile(content, filename) {
  const blob = new Blob(['\ufeff' + content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function copyToClipboard(content) {
  if (!navigator.clipboard) {
    throw new Error('Clipboard API is not available. Please use file export.');
  }

  await navigator.clipboard.writeText(content);
}

function parseMarkdownFrontmatter(frontmatterRaw) {
  const result = {};
  frontmatterRaw.split('\n').forEach((line) => {
    const idx = line.indexOf(':');
    if (idx <= 0) {
      return;
    }

    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (['type', 'created_at', 'source_url', 'source_title'].includes(key)) {
      result[key] = value;
    }
  });

  return result;
}

function normalizeMarkdownBody(body) {
  const lines = body.trim().split('\n');

  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }

  if ((lines[lines.length - 1] || '').startsWith('*Saved:')) {
    lines.pop();
  }

  if ((lines[lines.length - 1] || '').startsWith('*From:')) {
    lines.pop();
  }

  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }

  return lines.join('\n').trim();
}

function parseMarkdownImport(content) {
  const docs = content
    .split(/\n\n---\n\n(?=---\n)/)
    .map((doc) => doc.trim())
    .filter(Boolean);

  if (docs.length === 0) {
    throw new Error('Import markdown format is invalid');
  }

  return docs.map((doc, index) => {
    const match = doc.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) {
      throw new Error(`Record ${index + 1}: markdown block is missing frontmatter`);
    }

    const [, frontmatterRaw, bodyRaw] = match;
    const frontmatter = parseMarkdownFrontmatter(frontmatterRaw);
    const parsed = {
      type: frontmatter.type,
      content: normalizeMarkdownBody(bodyRaw),
      source: {
        url: frontmatter.source_url,
        title: frontmatter.source_title,
      },
      createdAt: frontmatter.created_at || new Date().toISOString(),
    };

    if (!parsed.type || !parsed.content || !parsed.source.url || !parsed.source.title) {
      throw new Error(`Record ${index + 1}: missing required fields`);
    }

    return parsed;
  });
}

function parseImportContent(content, format) {
  if (!content || !content.trim()) {
    throw new Error('Import file is empty');
  }

  if (format === 'markdown') {
    return parseMarkdownImport(content);
  }

  const parsed = JSON.parse(content);
  if (!Array.isArray(parsed)) {
    throw new Error('Import JSON must be an array of records');
  }

  return parsed;
}

function normalizeImportRecord(record, index) {
  const allowedTypes = ['text', 'heading', 'code', 'quote', 'list'];
  if (!record || typeof record !== 'object') {
    throw new Error(`Record ${index + 1}: must be an object`);
  }

  if (!allowedTypes.includes(record.type)) {
    throw new Error(`Record ${index + 1}: unsupported or missing block type`);
  }

  if (typeof record.content !== 'string' || !record.content.trim()) {
    throw new Error(`Record ${index + 1}: content is required`);
  }

  if (!record.source || typeof record.source.url !== 'string' || typeof record.source.title !== 'string') {
    throw new Error(`Record ${index + 1}: source.url and source.title are required`);
  }

  const normalizedCreatedAt = (() => {
    const date = new Date(record.createdAt);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  })();

  return {
    type: record.type,
    content: record.content,
    source: {
      url: record.source.url,
      title: record.source.title,
      favicon: typeof record.source.favicon === 'string' ? record.source.favicon : undefined,
    },
    createdAt: normalizedCreatedAt,
    metadata: typeof record.metadata === 'object' && record.metadata !== null ? record.metadata : {},
  };
}

function isDuplicateRecord(existingBlocks, candidate) {
  return existingBlocks.some((existing) => (
    existing.content === candidate.content
    && existing.source?.url === candidate.source?.url
    && existing.createdAt === candidate.createdAt
  ));
}

async function importRecords(records) {
  const existingBlocks = await loadBlocks();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  let imported = 0;
  let skipped = 0;

  records.forEach((record) => {
    if (isDuplicateRecord(existingBlocks, record)) {
      skipped++;
      return;
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const block = {
      id,
      ...record,
      updatedAt: now,
    };
    store.add(block);
    existingBlocks.push(block);
    imported++;
  });

  await new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  return { imported, skipped, failed: 0 };
}

function buildExportContent(blocks, format) {
  return format === 'json' ? exportBlocksToJSON(blocks) : exportBlocksToMarkdown(blocks);
}

async function exportToFile() {
  if (isExporting || allBlocksCache.length === 0) {
    if (allBlocksCache.length === 0) {
      alert('No clips to export');
    }
    return;
  }

  isExporting = true;
  updateTransferControlsState();

  try {
    const format = getEffectiveExportFormat();
    const content = buildExportContent(allBlocksCache, format);
    const filename = generateExportFilename(format, allBlocksCache.length);
    downloadFile(content, filename);
  } finally {
    isExporting = false;
    updateTransferControlsState();
  }
}

async function exportToClipboard() {
  if (isExporting || allBlocksCache.length === 0) {
    if (allBlocksCache.length === 0) {
      alert('No clips to export');
    }
    return;
  }

  isExporting = true;
  updateTransferControlsState();

  try {
    const format = getEffectiveExportFormat();
    const content = buildExportContent(allBlocksCache, format);
    await copyToClipboard(content);
    alert(`Copied ${allBlocksCache.length} ${format.toUpperCase()} clips to clipboard.`);
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Failed to copy export to clipboard.');
  } finally {
    isExporting = false;
    updateTransferControlsState();
  }
}

function triggerImportFilePicker() {
  if (isImporting) {
    return;
  }

  const input = document.getElementById('import-input');
  const format = getEffectiveImportFormat();
  input.accept = format === 'json' ? 'application/json,.json' : 'text/markdown,.md,.markdown,text/plain';
  input.click();
}

async function importFromText(content, sourceLabel) {
  isImporting = true;
  updateTransferControlsState();

  try {
    const format = getEffectiveImportFormat();
    const parsedRecords = parseImportContent(content, format)
      .map((record, index) => normalizeImportRecord(record, index));

    const result = await importRecords(parsedRecords);
    await refreshList();
    alert(`${sourceLabel} import (${format.toUpperCase()}): ${result.imported} imported, ${result.skipped} skipped, ${result.failed} failed.`);
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Import failed');
  } finally {
    isImporting = false;
    updateTransferControlsState();
  }
}

async function handleImportFileChange(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) {
    return;
  }

  const content = await file.text();
  await importFromText(content, 'File');
}

async function importFromClipboard() {
  if (isImporting) {
    return;
  }

  try {
    if (!navigator.clipboard) {
      throw new Error('Clipboard API is not available. Please use file import.');
    }
    const text = await navigator.clipboard.readText();
    await importFromText(text, 'Clipboard');
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Clipboard import failed');
  }
}

/**
 * Open IndexedDB
 */
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex(INDEX_NAME, 'createdAt', { unique: false });
      }
    };
  });
}

/**
 * Load all blocks
 */
async function loadBlocks() {
  console.log('[Options loadBlocks] Function called');

  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const index = store.index(INDEX_NAME);

  return new Promise((resolve, reject) => {
    // Use 'prev' direction to get newest first
    const request = index.openCursor(null, 'prev');
    const blocks = [];

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        blocks.push(cursor.value);
        cursor.continue();
      } else {
        // DEBUG: Log before returning
        console.log('[Options loadBlocks] Returning blocks:', {
          count: blocks.length,
          firstItem: blocks[0] ? { id: blocks[0].id, createdAt: blocks[0].createdAt } : null,
          lastItem: blocks[blocks.length - 1] ? { id: blocks[blocks.length - 1].id, createdAt: blocks[blocks.length - 1].createdAt } : null,
          order: blocks.map((b, i) => `${i + 1}. ${b.createdAt} - ${b.id.substring(0, 8)}`),
        });

        // Don't reverse! 'prev' already gives us newest first
        resolve(blocks);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Search blocks
 */
async function searchBlocks(query) {
  const blocks = await loadBlocks();
  const lowerQuery = query.toLowerCase();

  return blocks.filter(block => {
    const content = block.content.toLowerCase();
    const title = block.source.title.toLowerCase();
    return content.includes(lowerQuery) || title.includes(lowerQuery);
  });
}

/**
 * Delete block
 */
async function deleteBlock(id) {
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.delete(id);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Format relative time
 */
function formatRelativeTime(timestamp) {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(timestamp).toLocaleDateString();
}

/**
 * Get content preview
 */
function getContentPreview(content, maxLength = 100) {
  const plainText = content
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  return plainText.length > maxLength
    ? plainText.substring(0, maxLength) + '...'
    : plainText;
}

/**
 * Get block title
 */
function getBlockTitle(block) {
  const metadataTitle = block.metadata?.title?.trim();
  if (metadataTitle) {
    return metadataTitle;
  }

  const firstLine = block.content.split('\n')[0].trim();
  const withoutMarkdown = firstLine
    .replace(/#{1,6}\s/, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .trim();

  return withoutMarkdown.substring(0, 50) || 'Untitled Clip';
}

/**
 * Render list
 */
function renderList(blocks) {
  const listDiv = document.getElementById('list');
  const detailDiv = document.getElementById('detail');

  listDiv.style.display = 'block';
  detailDiv.classList.remove('active');

  if (blocks.length === 0) {
    listDiv.innerHTML = '<div class="empty"><h2>No clips yet</h2><p>Select text on a webpage and use <strong>Ctrl+Shift+Y</strong> to clip content.</p></div>';
    return;
  }

  listDiv.innerHTML = '<div id="clips"></div>';
  const clipsDiv = document.getElementById('clips');

  blocks.forEach(block => {
    const card = document.createElement('div');
    card.className = 'clip-card';
    card.innerHTML = `
      <div class="clip-header">
        <div class="clip-title">${getBlockTitle(block)}</div>
        <div class="clip-header-right">
          <div class="clip-time">${formatRelativeTime(block.createdAt)}</div>
          <button class="delete-icon-button" data-id="${block.id}" title="Delete clip">
            🗑️
          </button>
        </div>
      </div>
      <div class="clip-preview">${getContentPreview(block.content)}</div>
      <div class="clip-source">${block.source.title}</div>
    `;

    // Card click to show detail
    card.addEventListener('click', (e) => {
      // Don't trigger if delete button was clicked
      if (!e.target.closest('.delete-icon-button')) {
        showDetail(block);
      }
    });

    // Delete button click handler
    const deleteBtn = card.querySelector('.delete-icon-button');
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation(); // Prevent card click
      if (confirm(`Delete "${getBlockTitle(block)}"?`)) {
        try {
          await deleteBlock(block.id);
          refreshList();
        } catch (error) {
          console.error('Failed to delete:', error);
          alert('Failed to delete clip');
        }
      }
    });

    clipsDiv.appendChild(card);
  });
}

/**
 * Show detail
 */
function showDetail(block) {
  const listDiv = document.getElementById('list');
  const detailDiv = document.getElementById('detail');
  const detailContent = document.getElementById('detail-content');

  listDiv.style.display = 'none';
  detailDiv.classList.add('active');

  detailContent.innerHTML = `
    <h2>${getBlockTitle(block)}</h2>
    <div class="detail-meta">
      <a href="${block.source.url}" target="_blank" rel="noopener noreferrer">${block.source.title}</a>
      <span>${new Date(block.createdAt).toLocaleString()}</span>
    </div>
    <pre>${block.content}</pre>
    <div class="detail-actions">
      <button class="export-single-button" data-format="json">Export JSON</button>
      <button class="export-single-button" data-format="json-clipboard">Copy JSON</button>
      <button class="export-single-button" data-format="markdown">Export Markdown</button>
      <button class="export-single-button" data-format="markdown-clipboard">Copy Markdown</button>
      <button class="delete-button" data-id="${block.id}">Delete</button>
    </div>
  `;

  // Add export single button handlers
  detailContent.querySelectorAll('.export-single-button').forEach(btn => {
    btn.addEventListener('click', async () => {
      const format = btn.dataset.format;

      if (format === 'json-clipboard' || format === 'markdown-clipboard') {
        try {
          const content = format === 'json-clipboard'
            ? exportBlocksToJSON([block])
            : exportBlockToMarkdown(block);
          await copyToClipboard(content);
          alert(`Copied clip ${format.startsWith('json') ? 'JSON' : 'Markdown'} to clipboard.`);
        } catch (error) {
          alert(error instanceof Error ? error.message : 'Failed to copy to clipboard.');
        }
        return;
      }

      const filename = generateExportFilename(format, 1);
      const content = format === 'json'
        ? exportBlocksToJSON([block])
        : exportBlockToMarkdown(block);
      downloadFile(content, filename);
    });
  });

  // Add delete button handler
  detailContent.querySelector('.delete-button').addEventListener('click', async () => {
    if (confirm('Delete this clip?')) {
      try {
        await deleteBlock(block.id);
        refreshList();
      } catch (error) {
        console.error('Failed to delete:', error);
        alert('Failed to delete clip');
      }
    }
  });
}

/**
 * Refresh list
 */
async function refreshList() {
  const searchValue = document.getElementById('search').value;
  let blocks;

  try {
    if (searchValue.trim()) {
      blocks = await searchBlocks(searchValue);
    } else {
      blocks = await loadBlocks();
      // Cache all blocks for export when not searching
      allBlocksCache = blocks;
    }

    updateTransferControlsState();

    renderList(blocks);
  } catch (error) {
    console.error('Failed to load blocks:', error);
    document.getElementById('list').innerHTML = `<div class="empty">Error loading clips: ${error.message}</div>`;
  }
}

/**
 * Update transfer controls state
 */
function updateTransferControlsState() {
  const toolbar = document.getElementById('toolbar');
  const exportFileBtn = document.getElementById('export-file');
  const exportClipboardBtn = document.getElementById('export-clipboard');
  const importFileBtn = document.getElementById('import-file');
  const importClipboardBtn = document.getElementById('import-clipboard');
  const exportFormatSelect = document.getElementById('export-format');
  const importFormatSelect = document.getElementById('import-format');

  if (toolbar) {
    toolbar.style.display = 'flex';
  }

  if (exportFileBtn) {
    exportFileBtn.disabled = isExporting || allBlocksCache.length === 0;
  }

  if (exportClipboardBtn) {
    exportClipboardBtn.disabled = isExporting || allBlocksCache.length === 0;
  }

  if (importFileBtn) {
    importFileBtn.disabled = isImporting;
  }

  if (importClipboardBtn) {
    importClipboardBtn.disabled = isImporting;
  }

  if (exportFormatSelect) {
    exportFormatSelect.disabled = isExporting;
  }

  if (importFormatSelect) {
    importFormatSelect.disabled = isImporting;
  }
}

/**
 * Initialize
 */
async function init() {
  try {
    console.log('[Options] Initializing options page...');
    await openDB();
    console.log('[Options] Database opened, loading blocks...');
    await refreshList();

    // Search handler
    let searchTimeout;
    document.getElementById('search').addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        refreshList();
      }, 300);
    });

    // Back button handler
    document.getElementById('back').addEventListener('click', () => {
      refreshList();
    });

    document.getElementById('density-toggle').addEventListener('click', () => {
      densityMode = densityMode === 'standard' ? 'compact' : 'standard';
      applyDensityMode();
    });

    document.getElementById('export-format').addEventListener('change', (event) => {
      exportFormat = event.target.value;
    });

    document.getElementById('import-format').addEventListener('change', (event) => {
      importFormat = event.target.value;
    });

    document.getElementById('export-file').addEventListener('click', () => {
      exportToFile();
    });

    document.getElementById('export-clipboard').addEventListener('click', () => {
      exportToClipboard();
    });

    document.getElementById('import-file').addEventListener('click', () => {
      triggerImportFilePicker();
    });

    document.getElementById('import-clipboard').addEventListener('click', () => {
      importFromClipboard();
    });

    document.getElementById('import-input').addEventListener('change', (event) => {
      handleImportFileChange(event);
    });

    applyDensityMode();
    updateTransferControlsState();

    console.log('[Options] Options page initialized successfully');

  } catch (error) {
    console.error('[Options] Failed to initialize:', error);
    document.getElementById('list').innerHTML = `<div class="empty">Failed to load clips. Error: ${error.message}<br><br>Please make sure you've saved some content first.</div>`;
  }
}

// Initialize on load
init();
