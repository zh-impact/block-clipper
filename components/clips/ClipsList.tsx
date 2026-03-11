/**
 * ClipsList Component
 * @description Display a list of clips with pagination support
 */

import { type JSX } from "react";
import { ClipCard } from "./ClipCard";
import type { Block } from "../../utils/block-model";

export interface ClipsListProps {
  blocks: Block[];
  selectedIndex?: number;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  isSearchMode?: boolean;
  density?: "standard" | "compact";
  onBlockClick?: (block: Block, index: number) => void;
  onLoadMore?: () => void;
}

/**
 * ClipsList Component
 */
export function ClipsList({
  blocks,
  selectedIndex = -1,
  hasMore = false,
  isLoadingMore = false,
  isSearchMode = false,
  density = "standard",
  onBlockClick,
  onLoadMore,
}: ClipsListProps): JSX.Element {
  const handleKeyPress = (block: Block, index: number) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && onBlockClick) {
      onBlockClick(block, index);
    }
  };

  return (
    <div className="blocks-list" role="list" aria-label="Clipped items">
      {blocks.map((block, index) => (
        <ClipCard
          key={block.id}
          block={block}
          isSelected={selectedIndex === index}
          density={density}
          onClick={() => onBlockClick?.(block, index)}
          onKeyPress={handleKeyPress(block, index)}
        />
      ))}

      {/* Load More Button */}
      {hasMore && !isSearchMode && (
        <button
          onClick={onLoadMore}
          disabled={isLoadingMore}
          className="load-more-button"
          aria-label="Load more clips"
        >
          {isLoadingMore ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
