/**
 * useAI Hook
 * @description Manages AI features including title generation availability and operations
 */

import { useState, useEffect, useCallback } from "react";
import {
  generateAITitle,
  isAIAvailable,
} from "../utils/ai/aiTitleGenerator";
import type { Block } from "../utils/block-model";

export interface UseAIResult {
  aiAvailable: boolean;
  isGenerating: boolean;
  checkAvailability: () => Promise<void>;
  generateTitle: (block: Block) => Promise<string>;
  regenerateTitle: (block: Block, onUpdate?: (block: Block) => void) => Promise<void>;
}

/**
 * Hook for managing AI features
 */
export function useAI(): UseAIResult {
  const [aiAvailable, setAiAvailable] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Check AI availability
   */
  const checkAvailability = useCallback(async () => {
    const available = await isAIAvailable();
    setAiAvailable(available);
    console.log("[useAI] AI available:", available);
  }, []);

  /**
   * Generate AI title for a block
   */
  const generateTitle = useCallback(async (block: Block): Promise<string> => {
    return await generateAITitle(block.content);
  }, []);

  /**
   * Regenerate AI title for a block
   */
  const regenerateTitle = useCallback(async (
    block: Block,
    onUpdate?: (block: Block) => void,
  ): Promise<void> => {
    if (!aiAvailable || isGenerating) {
      return;
    }

    setIsGenerating(true);

    try {
      // Generate new AI title
      const aiTitle = await generateAITitle(block.content);

      // Update block in storage
      const { getStorageService } = await import("../utils/storage");
      const storageService = getStorageService();
      await storageService.updateBlockTitle(block.id, aiTitle, true);

      // Call update callback if provided
      if (onUpdate) {
        const updatedBlock: Block = {
          ...block,
          title: aiTitle,
          aiGenerated: true,
        };
        onUpdate(updatedBlock);
      }
    } catch (error) {
      console.error("[useAI] Failed to regenerate AI title:", error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [aiAvailable, isGenerating]);

  // Check availability on mount
  useEffect(() => {
    void checkAvailability();
  }, [checkAvailability]);

  return {
    aiAvailable,
    isGenerating,
    checkAvailability,
    generateTitle,
    regenerateTitle,
  };
}
