/**
 * Comprehensive TypeScript type definitions for AI SFX Generator
 * Provides type safety across the entire application
 */

// Re-export shared types
export type { TimelineInfo, PlacementResult } from '../../shared/universals';

// Core application types
export interface SFXFileInfo {
  /** Base filename without extension */
  filename: string;
  /** Full filename with extension */
  basename: string;
  /** Extracted number from filename (for versioning) */
  number: number;
  /** Extracted prompt text from filename */
  prompt: string;
  /** File creation/modification timestamp */
  timestamp: string;
  /** Full file system path */
  path: string;
  /** Path in Premiere Pro bin (if applicable) */
  binPath?: string;
  /** Subfolder within SFX directory */
  subfolder?: string;
  /** Source of the file */
  source: 'filesystem' | 'project_bin';
}

export interface DetectedTrack {
  /** Track display name */
  name: string;
  /** Track number/index */
  number: number;
}

// API and Generation Types
export interface GenerationOptions {
  /** Duration in seconds */
  duration?: number;
  /** Prompt influence factor (0-1) */
  promptInfluence?: number;
  /** Target audio track */
  trackTarget?: string;
  /** Playback volume (0-100) */
  volume?: number;
}

export interface APIResponse<T = any> {
  /** Whether the request was successful */
  success: boolean;
  /** Response data */
  data?: T;
  /** Error message if failed */
  error?: string;
  /** HTTP status code */
  status?: number;
}

export interface SFXGenerationResult {
  /** Generated audio data */
  audioData: ArrayBuffer;
  /** Suggested filename */
  filename: string;
  /** Generation metadata */
  metadata?: {
    duration: number;
    promptInfluence: number;
    timestamp: string;
  };
}

// Error System Types
export enum ErrorCategory {
  FILE_SYSTEM = 'FILE_SYSTEM',
  API = 'API',
  UI = 'UI',
  PREMIERE = 'PREMIERE',
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorDetails {
  /** Error category */
  category: ErrorCategory;
  /** Error severity level */
  severity: ErrorSeverity;
  /** Error message */
  message: string;
  /** Technical error details */
  details?: any;
  /** User-friendly message */
  userMessage?: string;
  /** Timestamp when error occurred */
  timestamp: string;
  /** Stack trace if available */
  stack?: string;
  /** Context where error occurred */
  context?: Record<string, any>;
}

// Toast Notification Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastNotification {
  /** Unique identifier */
  id: string;
  /** Notification type */
  type: ToastType;
  /** Main message */
  message: string;
  /** Optional description */
  description?: string;
  /** Auto-dismiss duration in ms */
  duration?: number;
  /** Whether notification persists */
  persistent?: boolean;
  /** Action button configuration */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Timestamp when created */
  timestamp: number;
}

// Security Types
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation error message */
  reason?: string;
}

export interface SecurityStatus {
  /** Whether API key is stored */
  hasStoredAPIKey: boolean;
  /** Masked API key for display */
  maskedAPIKey: string;
  /** Remaining API calls before rate limit */
  remainingAPICalls: number;
  /** Time until rate limit reset (ms) */
  timeUntilReset: number;
  /** Storage format version */
  storageVersion: string;
}

export interface RateLimitInfo {
  /** Whether request can be made */
  canMakeRequest: boolean;
  /** Remaining requests in current window */
  remainingRequests: number;
  /** Time until window resets (ms) */
  timeUntilReset: number;
}

// File System Types
export interface FileOperationResult {
  /** Whether operation succeeded */
  success: boolean;
  /** Result message */
  message?: string;
  /** Error details if failed */
  error?: string;
  /** Operation metadata */
  metadata?: Record<string, any>;
}

export interface DirectoryInfo {
  /** Directory path */
  path: string;
  /** Whether directory exists */
  exists: boolean;
  /** Whether directory is readable */
  readable: boolean;
  /** Whether directory is writable */
  writable: boolean;
  /** Number of files in directory */
  fileCount?: number;
}

// Audio and Playback Types
export interface AudioMetadata {
  /** Audio duration in seconds */
  duration: number;
  /** Sample rate */
  sampleRate?: number;
  /** Bit rate */
  bitRate?: number;
  /** Number of channels */
  channels?: number;
  /** File format */
  format?: string;
  /** File size in bytes */
  size?: number;
}

export interface PlaybackStatus {
  /** Whether this is the current file */
  isCurrentFile: boolean;
  /** Whether file is playing */
  isPlaying: boolean;
  /** Whether file is paused */
  isPaused: boolean;
  /** Audio duration */
  duration: number | null;
  /** Current playback time */
  currentTime: number;
}

// Bridge and Premiere Integration Types
export interface TimelineOperationResult {
  /** Whether operation succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Detected track information */
  detectedTrack?: DetectedTrack;
  /** Timeline metadata */
  timelineInfo?: any;
}

export interface PlacementParameters {
  /** Path to audio file */
  filePath: string;
  /** Target track */
  track: string;
  /** Playback volume */
  volume: number;
  /** Timeline information */
  timelineInfo: any;
  /** Whether to use in/out points */
  useInOutMode: boolean;
  /** Whether track targeting is enabled */
  trackTargetingEnabled: boolean;
}

// Component Props Types
export interface BaseComponentProps {
  /** Optional CSS class name */
  className?: string;
  /** Optional inline styles */
  style?: React.CSSProperties;
  /** Optional test ID for testing */
  testId?: string;
}

export interface ToastSystemProps extends BaseComponentProps {
  /** Position of toast container */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Maximum number of toasts to show */
  maxToasts?: number;
  /** Default duration for auto-dismiss */
  defaultDuration?: number;
}

export interface ErrorBoundaryProps extends BaseComponentProps {
  /** Child components */
  children: React.ReactNode;
  /** Fallback component to render on error */
  fallback?: React.ComponentType<ErrorBoundaryState>;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export interface ErrorBoundaryState {
  /** Whether error boundary has caught an error */
  hasError: boolean;
  /** Error details */
  error?: Error;
  /** React error info */
  errorInfo?: React.ErrorInfo;
}

// Hook Return Types
export interface UseSFXFileManagerReturn {
  // State getters
  getCurrentSFXPath: () => string | null;
  getSFXLocationDisplay: () => string;
  
  // File operations
  ensureSFXDirectory: () => Promise<string | null>;
  scanSFXFiles: (forceRefresh?: boolean) => Promise<void>;
  setCustomSFXFolder: (path: string) => Promise<boolean>;
  clearCustomSFXFolder: () => Promise<void>;
  openSFXFolder: () => Promise<void>;
  
  // Search and filtering
  filterSFXFiles: (query: string) => void;
  parseSFXFilename: (filename: string, fullPath: string, source?: 'filesystem' | 'project_bin') => SFXFileInfo;
  
  // Computed values
  hasValidSFXPath: boolean;
  fileCount: number;
  isScanning: boolean;
  lastScanTime: number;
}

export interface UseSFXGeneratorReturn {
  // Main functions
  generateSFX: (prompt?: string, options?: GenerationOptions) => Promise<string | null>;
  cancelGeneration: () => void;
  
  // Utilities
  validateGenerationParams: (prompt: string, apiKey: string) => ValidationResult & { errors: string[] };
  generateSFXFilename: (prompt: string, index?: number) => string;
  getNextAvailableFilename: (basePrompt: string) => Promise<string>;
  placeSFXInTimeline: (filePath: string, options?: Partial<PlacementParameters>) => Promise<void>;
  
  // Status functions
  canGenerate: () => { canGenerate: boolean; reason?: string };
  estimateGenerationTime: (duration: number) => number;
  
  // State
  isGenerating: boolean;
  remainingAPICalls: number;
  
  // Cleanup
  cleanup: () => void;
}

export interface UseAudioPreviewReturn {
  // Playback controls
  playAudio: (filePath: string) => Promise<void>;
  stopAudio: () => void;
  pauseAudio: () => void;
  resumeAudio: () => Promise<void>;
  togglePlayback: (filePath?: string) => Promise<void>;
  
  // Volume controls
  updateVolume: (volume: number) => void;
  
  // Seek controls
  seekTo: (time: number) => void;
  getCurrentTime: () => number;
  getAudioDuration: (filePath: string) => number | null;
  
  // Utility functions
  preloadAudio: (filePath: string) => void;
  clearCache: () => void;
  getPlaybackStatus: (filePath: string) => PlaybackStatus;
  
  // State
  isPlaying: boolean;
  currentFile: string | null;
  volume: number;
  
  // Audio element access
  getCurrentAudio: () => HTMLAudioElement | null;
  
  // Cache info
  getCacheSize: () => number;
  isCached: (filePath: string) => boolean;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Event Types
export interface SFXEvent {
  /** Event type */
  type: string;
  /** Event timestamp */
  timestamp: number;
  /** Event data */
  data?: any;
}

export interface FileEvent extends SFXEvent {
  type: 'file_created' | 'file_deleted' | 'file_modified';
  data: {
    filePath: string;
    filename: string;
  };
}

export interface GenerationEvent extends SFXEvent {
  type: 'generation_started' | 'generation_completed' | 'generation_failed';
  data: {
    prompt: string;
    duration: number;
    result?: string;
    error?: string;
  };
}

// Configuration Types
export interface AppConfig {
  /** API configuration */
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  /** File system configuration */
  files: {
    allowedExtensions: string[];
    maxFileSize: number;
    cacheSize: number;
  };
  /** UI configuration */
  ui: {
    theme: 'light' | 'dark' | 'auto';
    animations: boolean;
    soundEffects: boolean;
  };
  /** Debug configuration */
  debug: {
    enabled: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    showToasts: boolean;
  };
}

// Global type augmentations
declare global {
  interface Window {
    /** Error system tests (development only) */
    ErrorSystemTests?: any;
    /** Debug logger */
    debugLogger?: any;
    /** Debug logs */
    __debugLogs?: Record<string, any[]>;
  }
}

// Export everything as a namespace as well
export namespace SFXTypes {
  export type FileInfo = SFXFileInfo;
  export type Track = DetectedTrack;
  export type Generation = GenerationOptions;
  export type Toast = ToastNotification;
  export type Error = ErrorDetails;
  export type Security = SecurityStatus;
  export type Audio = AudioMetadata;
  export type Playback = PlaybackStatus;
  export type Config = AppConfig;
}