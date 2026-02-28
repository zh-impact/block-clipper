# ListView Performance Testing Guide

## Overview

This document describes how to test the ListView performance with 1000+ items.

## Test Setup

### 1. Create Test Data

Use the browser console to generate test data:

```javascript
// Open the sidebar and run this in the browser console
async function generateTestClips(count) {
  const storageService = await chrome.runtime.sendMessage({
    type: 'GET_STORAGE_SERVICE'
  });

  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(
      storageService.create({
        type: 'text',
        content: `Test clip #${i + 1}\n\nThis is a test clip with some content.\n\n- Item 1\n- Item 2\n- Item 3`,
        source: {
          url: `https://example.com/test-${i}`,
          title: `Test Page ${i + 1}`,
          favicon: null
        }
      })
    );
  }

  await Promise.all(promises);
  console.log(`Created ${count} test clips`);
}

// Generate 1000 test clips
generateTestClips(1000);
```

### 2. Clear Test Data

```javascript
// Clear all test clips
async function clearAllClips() {
  const storageService = await chrome.runtime.sendMessage({
    type: 'GET_STORAGE_SERVICE'
  });

  const result = await storageService.query({ page: 1, limit: 10000 });
  const ids = result.items.map(item => item.id);
  await storageService.deleteMany(ids);
  console.log(`Cleared ${ids.length} clips`);
}

clearAllClips();
```

## Performance Metrics to Measure

### 1. Initial Load Time

- **Target**: < 1 second to load first 50 items
- **How to measure**: Open DevTools Performance tab, record, then open sidebar

### 2. Scroll Performance

- **Target**: 60 FPS while scrolling
- **How to measure**: Open DevTools Performance tab, record, then scroll through list

### 3. Load More Performance

- **Target**: < 500ms to load next 50 items
- **How to measure**: Click "Load More" button and measure time in DevTools Network tab

### 4. Keyboard Navigation Performance

- **Target**: Instant response to arrow keys
- **How to measure**: Use arrow keys to navigate and observe visual feedback

### 5. Search Performance

- **Target**: < 1 second to search across 1000+ items
- **How to measure**: Type in search box and measure time to see results

## Performance Benchmarks

### Expected Performance (1000+ items)

| Operation | Target | Acceptable | Poor |
|-----------|--------|------------|------|
| Initial load (50 items) | < 500ms | < 1s | > 2s |
| Load more (50 items) | < 300ms | < 500ms | > 1s |
| Scroll through 100 items | 60 FPS | 45+ FPS | < 30 FPS |
| Search query | < 500ms | < 1s | > 2s |
| Keyboard navigation | Instant | < 100ms | > 200ms |

### Memory Usage

| Items | Expected | Acceptable | High |
|-------|----------|------------|------|
| 0 items | ~10MB | < 20MB | > 50MB |
| 100 items | ~15MB | < 30MB | > 100MB |
| 1000 items | ~30MB | < 100MB | > 300MB |

## Manual Testing Procedure

### Step 1: Generate Test Data
1. Load the extension
2. Open DevTools console
3. Run `generateTestClips(1000)`
4. Wait for creation to complete (~10-30 seconds)

### Step 2: Test Initial Load
1. Close and reopen sidebar
2. Measure time to show first 50 items
3. **Pass**: < 1 second

### Step 3: Test Scroll Performance
1. Open DevTools Performance tab
2. Click "Record"
3. Scroll through entire list
4. Stop recording
5. Check FPS (should be 60)
6. **Pass**: No dropped frames

### Step 4: Test Load More
1. Scroll to bottom
2. Click "Load More" button
3. Measure time to load next page
4. **Pass**: < 500ms

### Step 5: Test Keyboard Navigation
1. Press Arrow Down key repeatedly
2. Observe selection highlight
3. **Pass**: Instant visual feedback

### Step 6: Test Search
1. Type "Test clip" in search box
2. Measure time to show results
3. **Pass**: < 1 second

### Step 7: Clean Up
1. Run `clearAllClips()`
2. Verify all items are deleted

## Automated Performance Test

Create a file `test/performance/listview.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('ListView Performance', () => {
  test.beforeEach(async ({ extension }) => {
    // Generate 1000 test clips
    await extension.evaluate(async () => {
      const storageService = await getStorageService();
      for (let i = 0; i < 1000; i++) {
        await storageService.create({
          type: 'text',
          content: `Test clip #${i}`,
          source: { url: `https://example.com/${i}`, title: `Test ${i}` }
        });
      }
    });
  });

  test('should load first page within 1 second', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('chrome-extension://__/sidepanel.html');
    await page.waitForSelector('.block-card');
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(1000);
  });

  test('should maintain 60 FPS while scrolling', async ({ page }) => {
    await page.goto('chrome-extension://__/sidepanel.html');
    const fps = await page.evaluate(async () => {
      let frames = 0;
      const start = performance.now();
      const list = document.querySelector('.blocks-list');
      if (!list) return 0;

      for (let i = 0; i < 50; i++) {
        list.scrollTop += 100;
        await new Promise(r => requestAnimationFrame(r));
        frames++;
      }
      const duration = performance.now() - start;
      return Math.round(frames / (duration / 1000));
    });
    expect(fps).toBeGreaterThanOrEqual(55);
  });
});
```

## Current Implementation Optimizations

The ListView already includes several performance optimizations:

1. **Pagination**: Loads only 50 items at a time
2. **Debounced Search**: 300ms delay to avoid excessive queries
3. **Simple DOM Structure**: Minimal nesting for fast rendering
4. **CSS Transitions**: Hardware-accelerated animations
5. **Event Delegation**: Single listener for keyboard navigation

## Future Optimizations (if needed)

If performance is insufficient:

1. **Virtual Scrolling**: Only render visible items
   - Use `@tanstack/react-virtual` or `react-window`
   - Reduces DOM nodes from 1000+ to ~20

2. **Web Workers**: Offload search to background thread
   - Keep UI responsive during search

3. **Request Caching**: Cache query results
   - Avoid redundant IndexedDB queries

4. **Lazy Images**: Load favicons on-demand
   - Use IntersectionObserver

5. **Code Splitting**: Lazy load DetailView
   - Reduce initial bundle size

## Test Results Template

```
Date: ___________
Tester: ___________
Browser: Chrome [ ] Edge [ ] Firefox [ ]
Extension Version: ___________

### Test Data
- Total Items: _____
- Content Size per Item: _____ KB

### Metrics
- Initial Load Time: _____ ms (Pass/Fail)
- Load More Time: _____ ms (Pass/Fail)
- Scroll FPS: _____ (Pass/Fail)
- Search Time: _____ ms (Pass/Fail)
- Keyboard Nav: _____ ms (Pass/Fail)

### Memory Usage
- Heap Size: _____ MB (Pass/Fail)
- DOM Nodes: _____ (Pass/Fail)

### Notes
_________________________________________________
_________________________________________________
```
