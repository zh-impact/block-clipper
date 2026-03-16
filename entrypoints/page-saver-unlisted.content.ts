/**
 * Page Saver Content Script
 * @description This script extracts page content using Readability
 * It's injected dynamically by the background script
 */

import { Readability } from '@mozilla/readability'

function extractPageContent() {
  console.log('[Page Saver] Extracting from:', document.URL)

  // Clone the document to avoid modifying the original page
  const documentClone = document.cloneNode(true)

  // Parse using the cloned document only
  // Do NOT pass the original document as second parameter
  const article = new Readability(documentClone).parse()

  console.log('[Page Saver] Parse result:', article ? 'Found' : 'NOT FOUND')

  if (!article) {
    throw new Error('Cannot extract article content')
  }

  return {
    title: article.title || document.title || 'Untitled',
    content: article.textContent || '',
    excerpt: article.excerpt,
    length: article.length || 0,
  }
}

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    // Only activate if explicitly requested (don't auto-inject behavior)
    // This script is mostly inactive, just waiting for manual trigger
    console.log('[Page Saver] Content script loaded (idle, waiting for trigger)')

    // Listen for extraction request from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'EXTRACT_PAGE_CONTENT') {
        console.log('[Page Saver] Received EXTRACT_PAGE_CONTENT request')

        // Extract content
        try {
          const extracted = extractPageContent()
          console.log('[Page Saver] ✓ Extracted:', extracted.title, extracted.content.length + 'chars')

          // Send result back to background
          chrome.runtime.sendMessage({
            type: 'PAGE_CONTENT_EXTRACTED',
            data: extracted,
          })

          sendResponse({ success: true })
        } catch (error) {
          console.error('[Page Saver] ✗ Extraction failed:', error)
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'

          chrome.runtime.sendMessage({
            type: 'PAGE_CONTENT_EXTRACTION_FAILED',
            error: errorMsg,
          })

          sendResponse({ success: false, error: errorMsg })
        }

        return true
      }
    })
  },
})
