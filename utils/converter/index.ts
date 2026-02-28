/**
 * HTML to Markdown converter
 * @description Converts HTML content to Markdown format using turndown library
 */

import TurndownService from 'turndown';

/**
 * Configure and create turndown service
 * @description Configured for: ATX headings, fenced code blocks, dash bullets
 */
const turndownService = new TurndownService({
  headingStyle: 'atx',          // Use # ## ### headings
  codeBlockStyle: 'fenced',     // Use ``` code blocks
  bulletListMarker: '-',        // Use - for lists
  emDelimiter: '_',             // Use _ for emphasis
  strongDelimiter: '**',        // Use ** for strong
  linkStyle: 'inlined',         // Use inline links
  linkReferenceStyle: 'full',   // Use full reference links
});

/**
 * Add custom rules for specific HTML elements
 */

// Handle tables (basic conversion)
turndownService.addRule('table', {
  filter: 'table',
  replacement: (content) => {
    return '\n\n' + content + '\n\n';
  },
});

// Handle preformatted text with language detection
turndownService.addRule('preCode', {
  filter: (node) => {
    return (
      node.nodeName === 'PRE' &&
      node.firstChild !== null &&
      (node.firstChild as HTMLElement).nodeName === 'CODE'
    );
  },
  replacement: (_content, node) => {
    const codeNode = node.firstChild as HTMLElement;
    const language = codeNode.getAttribute('class')?.replace(/^(.*?language-|lang-)/, '') || '';
    const code = codeNode.textContent || '';
    return `\n\`\`\`${language}\n${code}\n\`\`\`\n`;
  },
});

// Handle inline code
turndownService.addRule('inlineCode', {
  filter: (node) => {
    return node.nodeName === 'CODE' && (node.parentNode as HTMLElement)?.nodeName !== 'PRE';
  },
  replacement: (content) => {
    return `\`${content}\``;
  },
});

/**
 * Convert HTML to Markdown
 * @param html HTML string to convert
 * @returns Markdown string
 * @throws Error if html is not a valid string or is empty
 */
export function convertHTMLtoMarkdown(html: string): string {
  // Validate input
  if (typeof html !== 'string') {
    throw new Error('Input must be a string');
  }

  if (!html || html.trim().length === 0) {
    return '';
  }

  try {
    const markdown = turndownService.turndown(html);

    // Clean up excessive blank lines
    return markdown
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } catch (error) {
    console.error('[Converter] Failed to convert HTML to Markdown:', error);
    throw new Error(`HTML to Markdown conversion failed: ${error}`);
  }
}

/**
 * Convert HTML element to Markdown
 * @param element HTML element to convert
 * @returns Markdown string
 */
export function convertElementToMarkdown(element: HTMLElement): string {
  const html = element.outerHTML;
  return convertHTMLtoMarkdown(html);
}

/**
 * Sanitize HTML before conversion
 * @param html HTML string
 * @returns Sanitized HTML string
 */
export function sanitizeHTML(html: string): string {
  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove style tags and their content
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  return sanitized;
}

/**
 * Convert HTML to Markdown with sanitization
 * @param html HTML string to convert
 * @returns Markdown string
 */
export function convertHTMLtoMarkdownSafe(html: string): string {
  const sanitized = sanitizeHTML(html);
  return convertHTMLtoMarkdown(sanitized);
}

/**
 * Detect if content looks like HTML
 * @param content String to check
 * @returns true if content appears to be HTML
 */
export function isHTML(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false;
  }

  const trimmed = content.trim();
  return (
    trimmed.startsWith('<') &&
    trimmed.endsWith('>') &&
    /<[a-z][\s\S]*>/i.test(trimmed)
  );
}
