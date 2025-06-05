/**
 * @description Timeline info interface for type-safe ExtendScript communication
 */
export interface TimelineInfo {
  success: boolean;
  error?: string;
  sequenceName?: string;
  audioTrackCount?: number;
  videoTrackCount?: number;
  source?: string;
  playheadPosition?: number;
  playhead?: {
    seconds: number;
    formatted: string;
  };
  hasInPoint?: boolean;
  inPoint?: {
    seconds: number | null;
    formatted: string;
    isActuallySet: boolean;
    rawValue?: any;
    error?: string;
  };
  hasOutPoint?: boolean;
  outPoint?: {
    seconds: number | null;
    formatted: string;
    isActuallySet: boolean;
    rawValue?: any;
    error?: string;
  };
  hasDuration?: boolean;
  duration?: {
    seconds: number | null;
    formatted: string;
    isValid: boolean;
  };
  sequenceLength?: {
    seconds: number;
    formatted: string;
  };
}

/**
 * @description Audio placement result interface
 */
export interface PlacementResult {
  success: boolean;
  error?: string;
  step?: string;
  message?: string;
  fileName?: string;
  trackIndex?: number;
  position?: number;
  positionFormatted?: string;
  debug?: {
    sequenceName?: string;
    placementTimeSeconds?: number;
    placementTimeFormatted?: string;
    filePath?: string;
    fileName?: string;
    baseName?: string;
    importedItemName?: string;
    createdBin?: boolean;
    movedToBin?: string;
    foundAvailableTrack?: number;
    createdNewTrack?: boolean;
    newTrackIndex?: number;
    finalTrackIndex?: number;
    totalTracksNow?: number;
    placementAttempts?: Array<{
      trackIndex: number;
      hasConflict: boolean;
      timePosition?: number;
    }>;
    placementMethod?: string;
    placementSuccess?: boolean;
    [key: string]: any;
  };
}

/**
 * @description App info interface for debugging
 */
export interface AppInfo {
  appName: string;
  version: string;
  projectName: string;
  hasActiveSequence: boolean;
  sequenceName: string | null;
}

/**
 * @description Test connection result
 */
export interface TestConnectionResult {
  success: boolean;
  message: string;
  timestamp: string;
  premiereVersion: string;
  projectName: string;
}

/**
 * @description Declare event types for listening with listenTS() and dispatching with dispatchTS()
 */
export type EventTS = {
  timelineChanged: {
    inPoint: number | null;
    outPoint: number | null;
    duration: number | null;
  };
  audioPlaced: {
    success: boolean;
    position: number;
    trackIndex: number;
    fileName: string;
  };
  audioGenerationStarted: {
    prompt: string;
    duration: number;
    mode: string;
  };
  audioGenerationCompleted: {
    success: boolean;
    fileName?: string;
    error?: string;
  };
};