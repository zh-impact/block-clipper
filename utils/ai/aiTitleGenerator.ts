/**
 * AI Title Generator using Chrome Summarizer API
 * @description Generates concise titles for clipped content using Chrome's built-in AI
 */

/**
 * AI title generation options
 */
export interface AITitleGenerationOptions {
  type?: 'headline' | 'key-points' | 'tldr' | 'teaser'
  length?: 'short' | 'medium' | 'long'
}

/**
 * AI title generation result
 */
export interface AITitleGenerationResult {
  title: string
  aiGenerated: boolean
}

/**
 * Cache for AI availability check
 */
let aiAvailableCache: boolean | null = null

/**
 * Check if Chrome Summarizer API is available
 * @returns Promise resolving to true if API is available
 */
export async function isAIAvailable(): Promise<boolean> {
  // Return cached result if available
  if (aiAvailableCache !== null) {
    return aiAvailableCache
  }

  // Check if Summarizer API exists in global scope
  if (typeof window === 'undefined' || !('Summarizer' in window)) {
    aiAvailableCache = false
    return false
  }

  // API is available
  aiAvailableCache = true
  return true
}

/**
 * Generate AI title from content using Chrome Summarizer API
 * @param content - Content text to generate title from
 * @param options - Generation options (optional)
 * @returns Promise resolving to generated title
 * @throws Error if AI generation fails
 */
export async function generateAITitle(
  content: string,
  options: AITitleGenerationOptions = {},
): Promise<string> {
  const {
    type = 'headline', // Use headline for title generation (12-22 words)
    length = 'short', // Use short length for concise titles
  } = options

  // Check AI availability
  if (!(await isAIAvailable())) {
    throw new Error('Chrome Summarizer API is not available')
  }

  // Truncate content if too long (Summarizer API has input limits)
  const maxContentLength = 10000 // Safe limit
  const truncatedContent =
    content.length > maxContentLength ? content.substring(0, maxContentLength) : content

  try {
    // Access Summarizer API from global scope
    const Summarizer = (
      window as unknown as { Summarizer: { create: (options: unknown) => unknown } }
    ).Summarizer

    // Log first-time use (model download might occur)
    console.log(
      '[AI Title Generator] Initializing AI model (first-time use may download Gemini Nano)...',
    )

    // Create summarizer instance with user activation
    const summarizer = await Summarizer.create({
      type,
      length,
    } as unknown)

    console.log('[AI Title Generator] AI model ready, generating title...')

    // Generate summary (title)
    const result = await (summarizer as { summarize: (text: string) => Promise<string> }).summarize(
      truncatedContent,
    )

    // Clean up summarizer
    await (summarizer as { destroy: () => Promise<void> }).destroy()

    console.log('[AI Title Generator] Title generated successfully')

    // Return generated title
    return result.trim()
  } catch (error) {
    // Log error for debugging
    console.error('[AI Title Generator] Generation failed:', error)

    // Re-throw error for caller to handle
    throw new Error(error instanceof Error ? error.message : 'Failed to generate AI title')
  }
}

/**
 * Generate title with fallback to metadata extraction
 * @param content - Content text
 * @param options - AI generation options (optional)
 * @returns Promise resolving to AITitleGenerationResult
 */
export async function generateTitleWithFallback(
  content: string,
  options: AITitleGenerationOptions = {},
): Promise<AITitleGenerationResult> {
  // Try AI generation first
  try {
    if (await isAIAvailable()) {
      const title = await generateAITitle(content, options)
      return {
        title,
        aiGenerated: true,
      }
    }
  } catch (error) {
    // Log failure but continue to fallback
    console.warn('[AI Title Generator] AI generation failed, falling back:', error)
  }

  // Fallback: extract first line or first N words from content
  const fallbackTitle = extractFallbackTitle(content)
  return {
    title: fallbackTitle,
    aiGenerated: false,
  }
}

/**
 * Extract fallback title from content
 * @param content - Content text
 * @returns Fallback title (first line or truncated text)
 */
function extractFallbackTitle(content: string): string {
  // Split by lines and get first non-empty line
  const lines = content.split('\n').filter((line) => line.trim().length > 0)

  if (lines.length > 0) {
    const firstLine = lines[0].trim()
    // Truncate if too long (max 100 characters for fallback)
    if (firstLine.length > 100) {
      return firstLine.substring(0, 97) + '...'
    }
    return firstLine
  }

  // If no lines, return truncated content
  const truncated = content.trim().substring(0, 100)
  return truncated.length < content.length ? truncated + '...' : truncated
}

/**
 * Reset AI availability cache (for testing)
 */
export function resetAIAvailabilityCache(): void {
  aiAvailableCache = null
}
