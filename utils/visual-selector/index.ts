const PREFERRED_TAGS = new Set([
  'article',
  'section',
  'main',
  'aside',
  'p',
  'li',
  'blockquote',
  'pre',
  'code',
  'td',
  'th',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'div',
]);

export function normalizeVisibleText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();
}

export function extractVisibleTextFromElement(element: HTMLElement): string {
  const raw = element.innerText || element.textContent || '';
  return normalizeVisibleText(raw);
}

function isOverlayElement(element: HTMLElement, overlayClassName: string): boolean {
  return !!element.closest(`.${overlayClassName}`);
}

function isElementVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  if (rect.width < 20 || rect.height < 20) {
    return false;
  }

  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

function isPreferredTag(element: HTMLElement): boolean {
  return PREFERRED_TAGS.has(element.tagName.toLowerCase());
}

export interface CandidateSearchOptions {
  minTextLength?: number;
  overlayClassName?: string;
}

export function findBestCandidateFromElement(
  start: Element | null,
  options: CandidateSearchOptions = {}
): HTMLElement | null {
  if (!start || !(start instanceof HTMLElement)) {
    return null;
  }

  const minTextLength = options.minTextLength ?? 20;
  const overlayClassName = options.overlayClassName ?? 'bc-visual-selector-ui';

  let current: HTMLElement | null = start;
  let fallback: HTMLElement | null = null;

  while (current && current !== document.body && current !== document.documentElement) {
    if (!isOverlayElement(current, overlayClassName) && isElementVisible(current)) {
      const text = extractVisibleTextFromElement(current);
      if (text.length >= minTextLength) {
        if (!fallback) {
          fallback = current;
        }

        if (isPreferredTag(current)) {
          return current;
        }
      }
    }

    current = current.parentElement;
  }

  return fallback;
}
