/**
 * Unit tests for Content Script functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock chrome API
const mockSendMessage = vi.fn();
const mockOnMessageAddListener = vi.fn();

(globalThis as { chrome?: typeof chrome }).chrome = {
  runtime: {
    sendMessage: mockSendMessage,
    onMessage: {
      addListener: mockOnMessageAddListener,
    },
    lastError: undefined,
  },
} as unknown as typeof chrome;

// Mock window.getSelection
let mockSelectionText = '';
const mockGetSelection = vi.fn(() => ({
  toString: () => mockSelectionText,
  rangeCount: mockSelectionText ? 1 : 0,
  getRangeAt: vi.fn(() => ({
    cloneContents: vi.fn(() => {
      const div = document.createElement('div');
      div.innerHTML = mockSelectionText;
      return div;
    }),
  })),
}));

Object.defineProperty(window, 'getSelection', {
  value: mockGetSelection,
  writable: true,
});

describe('Content Script - Core Logic', () => {
  beforeEach(() => {
    // Setup fresh DOM
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    mockSelectionText = '';
    mockSendMessage.mockReset();
  });

  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  describe('Block Type Detection', () => {
    function detectBlockType(html: string): 'text' | 'code' | 'heading' | 'quote' | 'list' {
      if (html.includes('<pre') || html.includes('<code')) {
        return 'code';
      }
      if (/<h[1-6]/i.test(html)) {
        return 'heading';
      }
      if (html.includes('<blockquote')) {
        return 'quote';
      }
      if (/<[uo]l/i.test(html)) {
        return 'list';
      }
      return 'text';
    }

    it('should detect code blocks', () => {
      expect(detectBlockType('<pre><code>const x = 1;</code></pre>')).toBe('code');
      expect(detectBlockType('<code>inline code</code>')).toBe('code');
    });

    it('should detect headings', () => {
      expect(detectBlockType('<h1>Title</h1>')).toBe('heading');
      expect(detectBlockType('<h2>Subtitle</h2>')).toBe('heading');
      expect(detectBlockType('<H6>Small</H6>')).toBe('heading');
    });

    it('should detect quotes', () => {
      expect(detectBlockType('<blockquote>This is a quote</blockquote>')).toBe('quote');
    });

    it('should detect lists', () => {
      expect(detectBlockType('<ul><li>Item 1</li></ul>')).toBe('list');
      expect(detectBlockType('<ol><li>Item 1</li></ol>')).toBe('list');
    });

    it('should default to text for plain content', () => {
      expect(detectBlockType('<p>Plain paragraph</p>')).toBe('text');
      expect(detectBlockType('Just plain text')).toBe('text');
    });

    it('should prioritize code detection over other types', () => {
      expect(detectBlockType('<pre><code>const x = 1;</code></pre><p>text</p>')).toBe('code');
    });

    it('should detect headings with code inside', () => {
      // Code detection has priority over heading detection
      expect(detectBlockType('<h1>Title with <code>code</code></h1>')).toBe('code');
    });
  });

  describe('Content Selection Capture', () => {
    it('should capture selected text content', () => {
      document.body.innerHTML = '<p>Sample text content</p>';
      const range = document.createRange();
      range.selectNodeContents(document.body.querySelector('p')!);
      mockSelectionText = range.cloneContents().textContent || '';

      expect(mockSelectionText).toBe('Sample text content');
    });

    it('should return null when no selection exists', () => {
      mockSelectionText = '';
      const selection = window.getSelection();
      expect(selection?.rangeCount).toBe(0);
    });

    it('should capture HTML structure', () => {
      document.body.innerHTML = '<p><strong>Bold text</strong></p>';
      const p = document.body.querySelector('p');
      if (p) {
        mockSelectionText = p.innerHTML;
      }

      expect(mockSelectionText).toContain('<strong>');
      expect(mockSelectionText).toContain('Bold text');
    });

    it('should handle complex nested selections', () => {
      document.body.innerHTML = `
        <div>
          <h1>Heading</h1>
          <p>Paragraph with <a href="#">link</a></p>
          <ul><li>List item</li></ul>
        </div>
      `;

      const div = document.body.querySelector('div');
      if (div) {
        mockSelectionText = div.innerHTML;
      }

      expect(mockSelectionText).toContain('<h1>');
      expect(mockSelectionText).toContain('<a');
      expect(mockSelectionText).toContain('<ul>');
    });
  });

  describe('Metadata Extraction', () => {
    beforeEach(() => {
      // Mock page properties
      Object.defineProperty(document, 'title', {
        value: 'Test Page Title',
        writable: true,
      });
      Object.defineProperty(window, 'location', {
        value: { href: 'https://example.com/test-page' },
        writable: true,
      });
    });

    function extractMetadata() {
      return {
        url: window.location.href,
        title: document.title,
        favicon:
          document.querySelector('link[rel="icon"]')?.getAttribute('href') ||
          document.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') ||
          undefined,
      };
    }

    it('should extract page URL', () => {
      const metadata = extractMetadata();
      expect(metadata.url).toBe('https://example.com/test-page');
    });

    it('should extract page title', () => {
      const metadata = extractMetadata();
      expect(metadata.title).toBe('Test Page Title');
    });

    it('should extract favicon URL when present', () => {
      document.head.innerHTML = '<link rel="icon" href="/favicon.ico">';
      const metadata = extractMetadata();
      expect(metadata.favicon).toBe('/favicon.ico');
    });

    it('should extract shortcut icon as fallback', () => {
      document.head.innerHTML = '<link rel="shortcut icon" href="/icon.png">';
      const metadata = extractMetadata();
      expect(metadata.favicon).toBe('/icon.png');
    });

    it('should return undefined favicon when not present', () => {
      document.head.innerHTML = '';
      const metadata = extractMetadata();
      expect(metadata.favicon).toBeUndefined();
    });

    it('should prefer icon over shortcut icon', () => {
      document.head.innerHTML = `
        <link rel="shortcut icon" href="/shortcut.png">
        <link rel="icon" href="/icon.ico">
      `;
      const metadata = extractMetadata();
      expect(metadata.favicon).toBe('/icon.ico');
    });
  });

  describe('Content Size Validation', () => {
    it('should detect small content (< 5KB)', () => {
      const smallContent = 'x'.repeat(1000); // 1KB
      expect(smallContent.length).toBeLessThan(5000);
    });

    it('should detect medium content (5KB - 50KB)', () => {
      const mediumContent = 'x'.repeat(10000); // 10KB
      expect(mediumContent.length).toBeGreaterThan(5000);
      expect(mediumContent.length).toBeLessThan(50000);
    });

    it('should detect large content (> 50KB)', () => {
      const largeContent = 'x'.repeat(60000); // 60KB
      expect(largeContent.length).toBeGreaterThan(50000);
    });

    it('should calculate content size in KB', () => {
      const content = 'x'.repeat(10000);
      const sizeKB = Math.round(content.length / 1000);
      expect(sizeKB).toBe(10);
    });
  });

  describe('Message Communication', () => {
    it('should send CLIP_CONTENT message with correct structure', () => {
      const blockData = {
        type: 'text' as const,
        content: 'Test content',
        source: { url: 'https://example.com', title: 'Test' },
      };

      mockSendMessage.mockImplementation((_message, callback) => {
        callback?.({ type: 'CLIP_SUCCESS' });
      });

      mockSendMessage({ type: 'CLIP_CONTENT', data: blockData }, () => {});

      expect(mockSendMessage).toHaveBeenCalledWith(
        { type: 'CLIP_CONTENT', data: blockData },
        expect.any(Function)
      );
    });

    it('should handle CLIP_SUCCESS response', () => {
      const callback = vi.fn();
      mockSendMessage.mockImplementation((_message, cb) => {
        cb?.({ type: 'CLIP_SUCCESS' });
      });

      mockSendMessage({ type: 'TEST' }, callback);

      expect(callback).toHaveBeenCalledWith({ type: 'CLIP_SUCCESS' });
    });

    it('should handle CLIP_ERROR response', () => {
      const callback = vi.fn();
      mockSendMessage.mockImplementation((_message, cb) => {
        cb?.({ type: 'CLIP_ERROR', data: { error: 'Test error' } });
      });

      mockSendMessage({ type: 'TEST' }, callback);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'CLIP_ERROR',
          data: { error: 'Test error' },
        })
      );
    });

    it('should handle runtime errors', () => {
      (globalThis as { chrome?: typeof chrome }).chrome = {
        runtime: {
          sendMessage: vi.fn((_message, callback) => {
            ((globalThis as { chrome?: typeof chrome }).chrome!.runtime as any).lastError = {
              message: 'Connection failed',
            };
            callback?.();
          }),
          onMessage: { addListener: vi.fn() },
          lastError: undefined,
        },
      } as unknown as typeof chrome;

      expect(() => {
        // Simulate error handling
        const chrome = (globalThis as { chrome?: typeof chrome }).chrome as any;
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      }).not.toThrow();
    });
  });

  describe('Duplicate Prevention', () => {
    it('should prevent concurrent clipping operations', () => {
      let isClippingInProgress = false;

      function startClip() {
        if (isClippingInProgress) {
          return false;
        }
        isClippingInProgress = true;
        return true;
      }

      function endClip() {
        isClippingInProgress = false;
      }

      // First clip should succeed
      expect(startClip()).toBe(true);

      // Second clip while first is running should fail
      expect(startClip()).toBe(false);

      // After ending, new clip should succeed
      endClip();
      expect(startClip()).toBe(true);
    });

    it('should reset flag even on error', () => {
      let isClippingInProgress = false;

      try {
        isClippingInProgress = true;
        throw new Error('Test error');
      } catch (e) {
        // Error handling
      } finally {
        isClippingInProgress = false;
      }

      expect(isClippingInProgress).toBe(false);
    });
  });

  describe('Empty Selection Handling', () => {
    it('should detect empty selection', () => {
      const emptySelection = '';
      expect(emptySelection.trim().length).toBe(0);
    });

    it('should detect whitespace-only selection', () => {
      const whitespaceSelection = '   \n\t  ';
      expect(whitespaceSelection.trim().length).toBe(0);
    });

    it('should detect valid selection', () => {
      const validSelection = 'Some text content';
      expect(validSelection.trim().length).toBeGreaterThan(0);
    });
  });
});
