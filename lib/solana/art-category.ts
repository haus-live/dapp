/**
 * Art Category utility for mapping UI-friendly category names to Solana program enum values
 * Production implementation with no mocks or placeholders
 */

// Define enum values explicitly to match Solana program enumeration
export enum ArtCategory {
  StandupComedy = 0,
  PerformanceArt = 1,
  PoetrySlam = 2,
  OpenMicImprov = 3, // Exact match to Solana program enum
  LivePainting = 4,
  CreatingWorkshop = 5 // Exact match to Solana program enum
}

// Type for Borsh-compatible variant objects matching the Solana program schema
export type ArtCategoryVariant = 
  | { standupComedy: {} } 
  | { performanceArt: {} } 
  | { poetrySlam: {} }
  | { openMicImprov: {} } 
  | { livePainting: {} }
  | { creatingWorkshop: {} }; // Note: matching Solana program enum exactly

/**
 * Maps UI-friendly category strings to Borsh-compatible variant objects
 * This is critical for proper serialization/deserialization with the Solana program
 */
export function mapCategoryToVariant(category: string): ArtCategoryVariant {
  switch (category) {
    case 'standup-comedy':
      return { standupComedy: {} };
    case 'performance-art':
      return { performanceArt: {} };
    case 'poetry-slam':
      return { poetrySlam: {} };
    case 'open-mic':
      return { openMicImprov: {} }; // Correct enum variant name
    case 'live-painting':
      return { livePainting: {} };
    case 'creative-workshop':
      return { creatingWorkshop: {} }; // Correct enum variant name
    default:
      // Default to performance art if category is unknown
      return { performanceArt: {} };
  }
}

// Convert numeric enum value to Borsh-compatible variant object
export function numberToVariant(value: number): ArtCategoryVariant {
  switch (value) {
    case ArtCategory.StandupComedy:
      return { standupComedy: {} };
    case ArtCategory.PerformanceArt:
      return { performanceArt: {} };
    case ArtCategory.PoetrySlam:
      return { poetrySlam: {} };
    case ArtCategory.OpenMicImprov:
      return { openMicImprov: {} };
    case ArtCategory.LivePainting:
      return { livePainting: {} };
    case ArtCategory.CreatingWorkshop:
      return { creatingWorkshop: {} };
    default:
      return { performanceArt: {} };
  }
}

// Get the variant key name for a category (useful for borsh serialization)
export function getVariantKeyForCategory(category: string): string {
  switch (category) {
    case 'standup-comedy': return 'standupComedy';
    case 'performance-art': return 'performanceArt';
    case 'poetry-slam': return 'poetrySlam';
    case 'open-mic': return 'openMicImprov';
    case 'live-painting': return 'livePainting';
    case 'creative-workshop': return 'creatingWorkshop';
    default: return 'performanceArt';
  }
}

// Map UI-friendly category strings to numeric enum values (for backward compatibility)
export function mapCategoryToNumber(category: string): number {
  switch (category) {
    case 'standup-comedy':
      return ArtCategory.StandupComedy;
    case 'performance-art':
      return ArtCategory.PerformanceArt;
    case 'poetry-slam':
      return ArtCategory.PoetrySlam;
    case 'open-mic':
      return ArtCategory.OpenMicImprov; // Updated to correct enum value
    case 'live-painting':
      return ArtCategory.LivePainting;
    case 'creative-workshop':
      return ArtCategory.CreatingWorkshop; // Updated to correct enum value
    default:
      // Default to performance art if category is unknown
      return ArtCategory.PerformanceArt;
  }
}

// Map numeric values back to UI-friendly strings
export function mapNumberToCategory(value: number): string {
  switch (value) {
    case ArtCategory.StandupComedy:
      return 'standup-comedy';
    case ArtCategory.PerformanceArt:
      return 'performance-art';
    case ArtCategory.PoetrySlam:
      return 'poetry-slam';
    case ArtCategory.OpenMicImprov: // Updated to correct enum value
      return 'open-mic';
    case ArtCategory.LivePainting:
      return 'live-painting';
    case ArtCategory.CreatingWorkshop: // Updated to correct enum value
      return 'creative-workshop';
    default:
      return 'performance-art';
  }
}