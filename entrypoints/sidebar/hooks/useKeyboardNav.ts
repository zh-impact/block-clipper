/**
 * useKeyboardNav Hook
 * @description Custom hook for keyboard navigation
 */

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Keyboard navigation options
 */
export interface KeyboardNavOptions<T> {
  /**
   * Array of items to navigate
   */
  items: T[];

  /**
   * Whether navigation is enabled
   * @default true
   */
  enabled?: boolean;

  /**
   * Whether to loop navigation (go to first when at end)
   * @default false
   */
  loop?: boolean;

  /**
   * Whether to ignore keyboard events when target is an input
   * @default true
   */
  ignoreInputs?: boolean;

  /**
   * Callback when selection changes
   */
  onSelect?: (item: T | null, index: number) => void;

  /**
   * Callback when an item is activated (Enter key)
   */
  onActivate?: (item: T, index: number) => void;

  /**
   * Custom keyboard mappings
   */
  keyMap?: {
    up?: string[];
    down?: string[];
    first?: string[];
    last?: string[];
    activate?: string[];
    escape?: string[];
  };
}

/**
 * Keyboard navigation state and methods
 */
export interface KeyboardNavReturn<T> {
  /**
   * Currently selected index (-1 if no selection)
   */
  selectedIndex: number;

  /**
   * Currently selected item (null if no selection)
   */
  selectedItem: T | null;

  /**
   * Whether an item is currently selected
   */
  isSelected: boolean;

  /**
   * Select an item by index
   */
  selectIndex: (index: number) => void;

  /**
   * Select the next item
   */
  selectNext: () => void;

  /**
   * Select the previous item
   */
  selectPrevious: () => void;

  /**
   * Select the first item
   */
  selectFirst: () => void;

  /**
   * Select the last item
   */
  selectLast: () => void;

  /**
   * Clear selection
   */
  clearSelection: () => void;
}

/**
 * Custom hook for keyboard navigation
 *
 * @param options - Navigation options
 * @returns Navigation state and methods
 *
 * @example
 * ```tsx
 * const items = ['Item 1', 'Item 2', 'Item 3'];
 *
 * const {
 *   selectedIndex,
 *   selectedItem,
 *   isSelected,
 *   selectNext,
 *   selectPrevious,
 *   clearSelection,
 * } = useKeyboardNav({
 *   items,
 *   onSelect: (item) => console.log('Selected:', item),
 *   onActivate: (item) => console.log('Activated:', item),
 * });
 *
 * return (
 *   <ul>
 *     {items.map((item, index) => (
 *       <li
 *         key={index}
 *         className={selectedIndex === index ? 'selected' : ''}
 *       >
 *         {item}
 *       </li>
 *     ))}
 *   </ul>
 * );
 * ```
 */
export function useKeyboardNav<T>(
  options: KeyboardNavOptions<T>
): KeyboardNavReturn<T> {
  const {
    items,
    enabled = true,
    loop = false,
    ignoreInputs = true,
    onSelect,
    onActivate,
    keyMap: customKeyMap,
  } = options;

  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLElement>(null);

  /**
   * Default keyboard mappings
   */
  const keyMap = {
    up: ['ArrowUp', 'ArrowLeft'],
    down: ['ArrowDown', 'ArrowRight'],
    first: ['Home'],
    last: ['End'],
    activate: ['Enter', ' '],
    escape: ['Escape'],
    ...customKeyMap,
  };

  /**
   * Get the currently selected item
   */
  const selectedItem = selectedIndex >= 0 && selectedIndex < items.length
    ? items[selectedIndex]
    : null;

  const isSelected = selectedIndex >= 0;

  /**
   * Select an item by index
   */
  const selectIndex = useCallback((index: number) => {
    if (!enabled || items.length === 0) return;

    const validIndex = Math.max(-1, Math.min(index, items.length - 1));
    setSelectedIndex(validIndex);

    if (validIndex >= 0) {
      onSelect?.(items[validIndex], validIndex);
    } else {
      onSelect?.(null, -1);
    }
  }, [enabled, items, onSelect]);

  /**
   * Select the next item
   */
  const selectNext = useCallback(() => {
    if (!enabled || items.length === 0) return;

    if (selectedIndex === -1) {
      selectIndex(0);
    } else if (selectedIndex < items.length - 1) {
      selectIndex(selectedIndex + 1);
    } else if (loop) {
      selectIndex(0);
    }
  }, [enabled, items.length, selectedIndex, selectIndex, loop]);

  /**
   * Select the previous item
   */
  const selectPrevious = useCallback(() => {
    if (!enabled || items.length === 0) return;

    if (selectedIndex > 0) {
      selectIndex(selectedIndex - 1);
    } else if (loop && selectedIndex === 0) {
      selectIndex(items.length - 1);
    } else {
      selectIndex(-1);
    }
  }, [enabled, items.length, selectedIndex, selectIndex, loop]);

  /**
   * Select the first item
   */
  const selectFirst = useCallback(() => {
    if (enabled && items.length > 0) {
      selectIndex(0);
    }
  }, [enabled, items.length, selectIndex]);

  /**
   * Select the last item
   */
  const selectLast = useCallback(() => {
    if (enabled && items.length > 0) {
      selectIndex(items.length - 1);
    }
  }, [enabled, items.length, selectIndex]);

  /**
   * Clear selection
   */
  const clearSelection = useCallback(() => {
    setSelectedIndex(-1);
    onSelect?.(null, -1);
  }, [onSelect]);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignore if target is an input/textarea
    if (ignoreInputs) {
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }
    }

    const key = event.key;

    // Navigate up
    if (keyMap.up.includes(key)) {
      event.preventDefault();
      selectPrevious();
    }
    // Navigate down
    else if (keyMap.down.includes(key)) {
      event.preventDefault();
      selectNext();
    }
    // Go to first
    else if (keyMap.first.includes(key)) {
      event.preventDefault();
      selectFirst();
    }
    // Go to last
    else if (keyMap.last.includes(key)) {
      event.preventDefault();
      selectLast();
    }
    // Activate selected item
    else if (keyMap.activate.includes(key)) {
      if (isSelected && selectedItem) {
        event.preventDefault();
        onActivate?.(selectedItem, selectedIndex);
      }
    }
    // Clear selection
    else if (keyMap.escape?.includes(key)) {
      event.preventDefault();
      clearSelection();
    }
  }, [
    enabled,
    ignoreInputs,
    isSelected,
    selectedItem,
    selectedIndex,
    keyMap,
    selectNext,
    selectPrevious,
    selectFirst,
    selectLast,
    clearSelection,
    onActivate,
  ]);

  /**
   * Set up keyboard event listener
   */
  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  /**
   * Reset selection when items change
   */
  useEffect(() => {
    if (selectedIndex >= items.length) {
      setSelectedIndex(-1);
    }
  }, [items.length, selectedIndex]);

  return {
    selectedIndex,
    selectedItem,
    isSelected,
    selectIndex,
    selectNext,
    selectPrevious,
    selectFirst,
    selectLast,
    clearSelection,
  };
}

/**
 * Hook for grid-like keyboard navigation
 */
export function useKeyboardGridNav<T>(
  items: T[],
  columns: number,
  options?: Omit<KeyboardNavOptions<T>, 'keyMap'>
) {
  const nav = useKeyboardNav({
    items,
    ...options,
  });

  const {
    selectedIndex,
    selectIndex,
  } = nav;

  /**
   * Calculate row and column from index
   */
  const getRowCol = useCallback((index: number) => {
    return {
      row: Math.floor(index / columns),
      col: index % columns,
    };
  }, [columns]);

  /**
   * Calculate index from row and column
   */
  const getIndex = useCallback((row: number, col: number) => {
    return row * columns + col;
  }, [columns]);

  /**
   * Navigate with arrow keys (including left/right)
   */
  const handleGridKeyDown = useCallback((event: KeyboardEvent) => {
    if (!options?.enabled) return;

    if (selectedIndex === -1) {
      nav.selectNext();
      return;
    }

    const { row, col } = getRowCol(selectedIndex);
    let newIndex = selectedIndex;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        newIndex = getIndex(Math.max(0, row - 1), col);
        break;
      case 'ArrowDown':
        event.preventDefault();
        newIndex = getIndex(
          Math.min(Math.floor(items.length / columns), row + 1),
          col
        );
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (col > 0) {
          newIndex = getIndex(row, col - 1);
        } else if (row > 0) {
          // Wrap to previous row
          newIndex = getIndex(row - 1, columns - 1);
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (col < columns - 1 && selectedIndex < items.length - 1) {
          newIndex = getIndex(row, col + 1);
        } else if (selectedIndex < items.length - 1) {
          // Wrap to next row
          newIndex = getIndex(row + 1, 0);
        }
        break;
      default:
        return;
    }

    if ( newIndex >= 0 && newIndex < items.length) {
      selectIndex(newIndex);
    }
  }, [options?.enabled, selectedIndex, items.length, columns, getRowCol, getIndex, nav, selectIndex]);

  return {
    ...nav,
    handleGridKeyDown,
  };
}
