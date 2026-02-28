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

function exportAsJSON() {
  if (allBlocksCache.length === 0) {
    alert('No clips to export');
    return;
  }

  if (!confirm(`Export ${allBlocksCache.length} clips as JSON?`)) {
    return;
  }

  const filename = generateExportFilename('json', allBlocksCache.length);
  const content = exportBlocksToJSON(allBlocksCache);
  downloadFile(content, filename);
}

function exportAsMarkdown() {
  if (allBlocksCache.length === 0) {
    alert('No clips to export');
    return;
  }

  if (!confirm(`Export ${allBlocksCache.length} clips as Markdown?`)) {
    return;
  }

  const filename = generateExportFilename('markdown', allBlocksCache.length);
  const content = exportBlocksToMarkdown(allBlocksCache);
  downloadFile(content, filename);
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
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const index = store.index(INDEX_NAME);

  return new Promise((resolve, reject) => {
    const request = index.openCursor(null, 'prev');
    const blocks = [];

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        blocks.push(cursor.value);
        cursor.continue();
      } else {
        resolve(blocks.reverse());
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
      <button class="export-single-button" data-format="markdown">Export Markdown</button>
      <button class="delete-button" data-id="${block.id}">Delete</button>
    </div>
  `;

  // Add export single button handlers
  detailContent.querySelectorAll('.export-single-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const format = btn.dataset.format;
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

    // Update export buttons state
    updateExportButtons(allBlocksCache.length);

    renderList(blocks);
  } catch (error) {
    console.error('Failed to load blocks:', error);
    document.getElementById('list').innerHTML = `<div class="empty">Error loading clips: ${error.message}</div>`;
  }
}

/**
 * Update export buttons state
 */
function updateExportButtons(count) {
  const exportButtons = document.getElementById('export-buttons');
  if (exportButtons) {
    if (count === 0) {
      exportButtons.style.display = 'none';
    } else {
      exportButtons.style.display = 'flex';
      document.getElementById('export-count').textContent = `${count} clips`;
    }
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

    // Export buttons handlers
    document.getElementById('export-json').addEventListener('click', exportAsJSON);
    document.getElementById('export-markdown').addEventListener('click', exportAsMarkdown);

    console.log('[Options] Options page initialized successfully');

  } catch (error) {
    console.error('[Options] Failed to initialize:', error);
    document.getElementById('list').innerHTML = `<div class="empty">Failed to load clips. Error: ${error.message}<br><br>Please make sure you've saved some content first.</div>`;
  }
}

// Initialize on load
init();
