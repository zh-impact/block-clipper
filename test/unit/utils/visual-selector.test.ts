import { describe, it, expect, beforeEach } from 'vitest';
import {
  normalizeVisibleText,
  extractVisibleTextFromElement,
  findBestCandidateFromElement,
} from '../../../utils/visual-selector';

function mockRect(element: HTMLElement, width = 240, height = 120): void {
  Object.defineProperty(element, 'getBoundingClientRect', {
    value: () => ({
      width,
      height,
      top: 10,
      left: 10,
      right: 10 + width,
      bottom: 10 + height,
      x: 10,
      y: 10,
      toJSON: () => ({}),
    }),
    configurable: true,
  });
}

describe('visual-selector utilities', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('normalizes visible text consistently', () => {
    const input = '  Hello    world\n\n\n  line 2\t\tline3  ';
    expect(normalizeVisibleText(input)).toBe('Hello world\n\nline 2 line3');
  });

  it('extracts visible text from element', () => {
    const element = document.createElement('div');
    Object.defineProperty(element, 'innerText', {
      value: ' First line \n\n Second line ',
      configurable: true,
    });

    expect(extractVisibleTextFromElement(element)).toBe('First line\n\nSecond line');
  });

  it('finds best candidate by climbing ancestors and preferring semantic containers', () => {
    const article = document.createElement('article');
    const span = document.createElement('span');
    article.appendChild(span);
    document.body.appendChild(article);

    Object.defineProperty(span, 'innerText', {
      value: 'This is enough visible text to pass candidate threshold.',
      configurable: true,
    });
    Object.defineProperty(article, 'innerText', {
      value: 'Article content with enough visible text to qualify as a candidate.',
      configurable: true,
    });

    mockRect(span, 80, 30);
    mockRect(article, 400, 200);

    const candidate = findBestCandidateFromElement(span, {
      minTextLength: 20,
      overlayClassName: 'bc-visual-selector-ui',
    });

    expect(candidate).toBe(article);
  });

  it('ignores overlay nodes when selecting candidates', () => {
    const overlayRoot = document.createElement('div');
    overlayRoot.className = 'bc-visual-selector-ui';
    const overlayChild = document.createElement('div');
    overlayRoot.appendChild(overlayChild);
    document.body.appendChild(overlayRoot);

    Object.defineProperty(overlayChild, 'innerText', {
      value: 'Overlay content should never be selected even if long enough',
      configurable: true,
    });
    mockRect(overlayChild, 300, 180);

    const candidate = findBestCandidateFromElement(overlayChild, {
      minTextLength: 20,
      overlayClassName: 'bc-visual-selector-ui',
    });

    expect(candidate).toBeNull();
  });
});
