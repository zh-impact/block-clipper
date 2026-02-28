/**
 * Unit tests for HTML to Markdown converter
 */

import { describe, it, expect } from 'vitest';
import {
  convertHTMLtoMarkdown,
  convertElementToMarkdown,
  sanitizeHTML,
  convertHTMLtoMarkdownSafe,
  isHTML,
} from '../../../utils/converter';

describe('HTML to Markdown Converter', () => {
  describe('convertHTMLtoMarkdown()', () => {
    describe('Input validation', () => {
      it('should throw error for non-string input', () => {
        expect(() => convertHTMLtoMarkdown(null as unknown as string)).toThrow('Input must be a string');
        expect(() => convertHTMLtoMarkdown(undefined as unknown as string)).toThrow('Input must be a string');
        expect(() => convertHTMLtoMarkdown(123 as unknown as string)).toThrow('Input must be a string');
      });

      it('should return empty string for empty input', () => {
        expect(convertHTMLtoMarkdown('')).toBe('');
        expect(convertHTMLtoMarkdown('   ')).toBe('');
        expect(convertHTMLtoMarkdown('\n\t')).toBe('');
      });

      it('should handle whitespace-only strings', () => {
        const result = convertHTMLtoMarkdown('   \n\n   ');
        expect(result).toBe('');
      });
    });

    describe('Headings conversion', () => {
      it('should convert h1 to ATX style heading', () => {
        const html = '<h1>Title</h1>';
        expect(convertHTMLtoMarkdown(html)).toBe('# Title');
      });

      it('should convert h2 to ATX style heading', () => {
        const html = '<h2>Subtitle</h2>';
        expect(convertHTMLtoMarkdown(html)).toBe('## Subtitle');
      });

      it('should convert h3 to ATX style heading', () => {
        const html = '<h3>Section</h3>';
        expect(convertHTMLtoMarkdown(html)).toBe('### Section');
      });

      it('should convert h4 to ATX style heading', () => {
        const html = '<h4>Subsection</h4>';
        expect(convertHTMLtoMarkdown(html)).toBe('#### Subsection');
      });

      it('should convert h5 to ATX style heading', () => {
        const html = '<h5>Detail</h5>';
        expect(convertHTMLtoMarkdown(html)).toBe('##### Detail');
      });

      it('should convert h6 to ATX style heading', () => {
        const html = '<h6>Subdetail</h6>';
        expect(convertHTMLtoMarkdown(html)).toBe('###### Subdetail');
      });

      it('should handle headings with inline formatting', () => {
        const html = '<h1><strong>Bold</strong> Title</h1>';
        expect(convertHTMLtoMarkdown(html)).toBe('# **Bold** Title');
      });

      it('should handle multiple headings', () => {
        const html = '<h1>Main</h1><h2>Sub</h2>';
        expect(convertHTMLtoMarkdown(html)).toBe('# Main\n\n## Sub');
      });
    });

    describe('Links conversion', () => {
      it('should convert simple links to inline markdown', () => {
        const html = '<a href="https://example.com">Link text</a>';
        expect(convertHTMLtoMarkdown(html)).toBe('[Link text](https://example.com)');
      });

      it('should convert links with title attribute', () => {
        const html = '<a href="https://example.com" title="Example">Link</a>';
        // Turndown includes title in the link
        expect(convertHTMLtoMarkdown(html)).toBe('[Link](https://example.com "Example")');
      });

      it('should handle empty links', () => {
        const html = '<a href="https://example.com"></a>';
        expect(convertHTMLtoMarkdown(html)).toBe('[](https://example.com)');
      });

      it('should handle links with special characters', () => {
        const html = '<a href="https://example.com?foo=bar&baz=qux">Link</a>';
        expect(convertHTMLtoMarkdown(html)).toBe('[Link](https://example.com?foo=bar&baz=qux)');
      });

      it('should handle relative links', () => {
        const html = '<a href="/path/to/page">Link</a>';
        expect(convertHTMLtoMarkdown(html)).toBe('[Link](/path/to/page)');
      });

      it('should handle anchor links', () => {
        const html = '<a href="#section">Link</a>';
        expect(convertHTMLtoMarkdown(html)).toBe('[Link](#section)');
      });

      it('should handle links with nested formatting', () => {
        const html = '<a href="https://example.com"><strong>Bold Link</strong></a>';
        expect(convertHTMLtoMarkdown(html)).toBe('[**Bold Link**](https://example.com)');
      });
    });

    describe('Code conversion', () => {
      it('should convert inline code to backticks', () => {
        const html = '<p>Use <code>const x = 1</code> to declare</p>';
        const result = convertHTMLtoMarkdown(html);
        expect(result).toContain('`const x = 1`');
      });

      it('should convert fenced code blocks with language', () => {
        const html = '<pre><code class="language-javascript">const x = 1;</code></pre>';
        const result = convertHTMLtoMarkdown(html);
        expect(result).toContain('```javascript');
        expect(result).toContain('const x = 1;');
        expect(result).toContain('```');
      });

      it('should convert fenced code blocks without language', () => {
        const html = '<pre><code>plain text</code></pre>';
        const result = convertHTMLtoMarkdown(html);
        expect(result).toContain('```');
        expect(result).toContain('plain text');
        expect(result).toContain('```');
      });

      it('should handle code with lang- prefix', () => {
        const html = '<pre><code class="lang-python">print("hello")</code></pre>';
        const result = convertHTMLtoMarkdown(html);
        expect(result).toContain('```python');
        expect(result).toContain('print("hello")');
      });

      it('should preserve code formatting', () => {
        const html = '<pre><code>function test() {\n  return true;\n}</code></pre>';
        const result = convertHTMLtoMarkdown(html);
        expect(result).toContain('function test()');
        expect(result).toContain('return true;');
      });

      it('should handle code with special characters', () => {
        const html = '<code>&lt;div&gt;</code>';
        expect(convertHTMLtoMarkdown(html)).toBe('`<div>`');
      });
    });

    describe('Lists conversion', () => {
      it('should convert unordered lists to dash bullets', () => {
        const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
        const result = convertHTMLtoMarkdown(html);
        // Turndown adds extra spaces after the dash
        expect(result).toMatch(/-\s+Item 1/);
        expect(result).toContain('Item 2');
      });

      it('should convert ordered lists', () => {
        const html = '<ol><li>First</li><li>Second</li></ol>';
        const result = convertHTMLtoMarkdown(html);
        // Turndown adds extra spaces after the number
        expect(result).toMatch(/1\.\s+First/);
        expect(result).toContain('Second');
      });

      it('should handle nested lists', () => {
        const html = '<ul><li>Item 1<ul><li>Nested 1</li></ul></li></ul>';
        const result = convertHTMLtoMarkdown(html);
        expect(result).toContain('Item 1');
        expect(result).toContain('Nested 1');
        // Check for nested indentation
        expect(result).toMatch(/\s+-\s+Nested 1/);
      });

      it('should handle mixed list types', () => {
        const html = '<ul><li>Item 1</li><li>Item 2</li></ul><ol><li>First</li></ol>';
        const result = convertHTMLtoMarkdown(html);
        expect(result).toContain('Item 1');
        expect(result).toContain('Item 2');
        expect(result).toContain('First'); // Numbered list item
      });

      it('should handle list items with formatting', () => {
        const html = '<ul><li><strong>Bold item</strong></li></ul>';
        const result = convertHTMLtoMarkdown(html);
        expect(result).toContain('-');
        expect(result).toContain('**Bold item**');
      });

      it('should handle empty list items', () => {
        const html = '<ul><li></li></ul>';
        const result = convertHTMLtoMarkdown(html);
        // Turndown removes empty list items
        expect(result).toBe('');
      });
    });

    describe('Text formatting', () => {
      it('should convert strong to bold', () => {
        const html = '<strong>Bold text</strong>';
        expect(convertHTMLtoMarkdown(html)).toBe('**Bold text**');
      });

      it('should convert b to bold', () => {
        const html = '<b>Bold text</b>';
        expect(convertHTMLtoMarkdown(html)).toBe('**Bold text**');
      });

      it('should convert em to italic', () => {
        const html = '<em>Italic text</em>';
        expect(convertHTMLtoMarkdown(html)).toBe('_Italic text_');
      });

      it('should convert i to italic', () => {
        const html = '<i>Italic text</i>';
        expect(convertHTMLtoMarkdown(html)).toBe('_Italic text_');
      });

      it('should handle nested formatting', () => {
        const html = '<strong>Bold with <em>italic</em> inside</strong>';
        expect(convertHTMLtoMarkdown(html)).toBe('**Bold with _italic_ inside**');
      });

      it('should convert strike through', () => {
        const html = '<del>Deleted text</del>';
        // Turndown by default just removes the del tag and keeps content
        const result = convertHTMLtoMarkdown(html);
        expect(result).toBeTruthy();
        expect(result).toContain('Deleted text');
      });
    });

    describe('Paragraphs and breaks', () => {
      it('should convert paragraphs', () => {
        const html = '<p>First paragraph</p><p>Second paragraph</p>';
        const result = convertHTMLtoMarkdown(html);
        expect(result).toContain('First paragraph');
        expect(result).toContain('Second paragraph');
      });

      it('should convert line breaks', () => {
        const html = '<p>Line 1<br>Line 2</p>';
        const result = convertHTMLtoMarkdown(html);
        expect(result).toContain('Line 1');
        expect(result).toContain('Line 2');
      });

      it('should handle multiple paragraphs', () => {
        const html = '<p>P1</p><p>P2</p><p>P3</p>';
        const result = convertHTMLtoMarkdown(html);
        expect(result).toContain('P1');
        expect(result).toContain('P2');
        expect(result).toContain('P3');
      });
    });

    describe('Tables conversion', () => {
      it('should handle simple tables', () => {
        const html = '<table><tr><td>Cell 1</td><td>Cell 2</td></tr></table>';
        const result = convertHTMLtoMarkdown(html);
        expect(result).toContain('Cell 1');
        expect(result).toContain('Cell 2');
      });

      it('should handle tables with headers', () => {
        const html = '<table><thead><tr><th>H1</th></tr></thead><tbody><tr><td>D1</td></tr></tbody></table>';
        const result = convertHTMLtoMarkdown(html);
        expect(result).toContain('H1');
        expect(result).toContain('D1');
      });
    });

    describe('Blockquotes', () => {
      it('should convert blockquotes', () => {
        const html = '<blockquote>This is a quote</blockquote>';
        const result = convertHTMLtoMarkdown(html);
        expect(result).toContain('> This is a quote');
      });

      it('should handle nested blockquotes', () => {
        const html = '<blockquote>Outer<blockquote>Inner</blockquote></blockquote>';
        const result = convertHTMLtoMarkdown(html);
        expect(result).toContain('>');
      });
    });

    describe('Complex documents', () => {
      it('should handle mixed content', () => {
        const html = `
          <h1>Article Title</h1>
          <p>Introduction with <strong>bold</strong> and <em>italic</em> text.</p>
          <h2>Code Example</h2>
          <pre><code class="language-javascript">const x = 1;</code></pre>
          <h2>Links</h2>
          <p>Visit <a href="https://example.com">Example</a></p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        `;
        const result = convertHTMLtoMarkdown(html);

        expect(result).toContain('# Article Title');
        expect(result).toContain('**bold**');
        expect(result).toContain('_italic_');
        expect(result).toContain('## Code Example');
        expect(result).toContain('```javascript');
        expect(result).toContain('[Example](https://example.com)');
        expect(result).toContain('Item 1');
        expect(result).toContain('Item 2');
      });

      it('should clean up excessive blank lines', () => {
        const html = '<p>P1</p><br><br><p>P2</p>';
        const result = convertHTMLtoMarkdown(html);
        // Should not have 3+ consecutive newlines
        expect(result).not.toMatch(/\n\n\n+/);
      });
    });

    describe('Edge cases', () => {
      it('should handle malformed HTML gracefully', () => {
        const html = '<p>Unclosed paragraph';
        const result = convertHTMLtoMarkdown(html);
        expect(result).toBeTruthy();
      });

      it('should handle HTML entities', () => {
        const html = '<p>&lt;div&gt; &amp; &copy;</p>';
        const result = convertHTMLtoMarkdown(html);
        expect(result).toContain('<div>');
        expect(result).toContain('&');
      });

      it('should handle empty elements', () => {
        const html = '<div></div>';
        const result = convertHTMLtoMarkdown(html);
        expect(result).toBe('');
      });

      it('should handle whitespace preservation', () => {
        const html = '<p>Multiple   spaces</p>';
        const result = convertHTMLtoMarkdown(html);
        expect(result).toContain('Multiple');
      });
    });
  });

  describe('sanitizeHTML()', () => {
    it('should remove script tags', () => {
      const html = '<p>Content</p><script>alert("xss")</script>';
      const result = sanitizeHTML(html);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('<p>Content</p>');
    });

    it('should remove style tags', () => {
      const html = '<p>Content</p><style>body { color: red; }</style>';
      const result = sanitizeHTML(html);
      expect(result).not.toContain('<style>');
      expect(result).not.toContain('color: red');
      expect(result).toContain('<p>Content</p>');
    });

    it('should remove multiple script tags', () => {
      const html = '<script>alert(1)</script><p>Content</p><script>alert(2)</script>';
      const result = sanitizeHTML(html);
      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>Content</p>');
    });

    it('should handle script with content', () => {
      const html = '<script>var x = "test";</script>';
      const result = sanitizeHTML(html);
      expect(result).toBe('');
    });
  });

  describe('convertHTMLtoMarkdownSafe()', () => {
    it('should sanitize before converting', () => {
      const html = '<p>Content</p><script>alert("xss")</script>';
      const result = convertHTMLtoMarkdownSafe(html);
      expect(result).toContain('Content');
      expect(result).not.toContain('alert');
      expect(result).not.toContain('xss');
    });

    it('should remove style tags before conversion', () => {
      const html = '<h1>Title</h1><style>h1 { color: red; }</style>';
      const result = convertHTMLtoMarkdownSafe(html);
      expect(result).toContain('# Title');
      expect(result).not.toContain('color');
    });
  });

  describe('isHTML()', () => {
    it('should detect HTML strings', () => {
      expect(isHTML('<p>Hello</p>')).toBe(true);
      expect(isHTML('<div>Content</div>')).toBe(true);
      expect(isHTML('<strong>Bold</strong>')).toBe(true);
    });

    it('should return false for plain text', () => {
      expect(isHTML('Just plain text')).toBe(false);
      expect(isHTML('Not <html>')).toBe(false);
      expect(isHTML('')).toBe(false);
    });

    it('should return false for non-string input', () => {
      expect(isHTML(null as unknown as string)).toBe(false);
      expect(isHTML(undefined as unknown as string)).toBe(false);
      expect(isHTML(123 as unknown as string)).toBe(false);
    });

    it('should detect HTML with attributes', () => {
      expect(isHTML('<a href="https://example.com">Link</a>')).toBe(true);
      expect(isHTML('<img src="image.jpg" />')).toBe(true);
    });

    it('should handle self-closing tags', () => {
      expect(isHTML('<br />')).toBe(true);
      expect(isHTML('<hr>')).toBe(true);
    });
  });
});
