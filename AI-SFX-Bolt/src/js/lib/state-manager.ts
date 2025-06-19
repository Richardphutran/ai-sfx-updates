/**
 * Professional state management system for AI SFX Generator
 * 
 * This module provides a centralized state management solution using React's useReducer
 * pattern for predictable state updates and better performance. It handles all application
 * state including UI state, file management, audio generation, and Premiere Pro integration.
 * 
 * @module StateManager
 * @version 1.0.0
 * @since 2024
 * 
 * @example
 * ```typescript
 * import { useReducer } from 'react';
 * import { sfxReducer, initialSFXState, SFXActions } from './state-manager';
 * 
 * const [state, dispatch] = useReducer(sfxReducer, initialSFXState);
 * 
 * // Update prompt
 * dispatch(SFXActions.setPrompt('thunder sound'));
 * 
 * // Start generation
 * dispatch(SFXActions.setGenerating(true));
 * ```
 */

import type { TimelineInfo } from "../../shared/universals";

/**
 * Represents an SFX audio file with metadata extracted from filename and filesystem
 * 
 * @interface SFXFileInfo
 * 
 * @example
 * ```typescript
 * const fileInfo: SFXFileInfo = {
 *   filename: 'thunder_storm_2024-01-15_1.mp3',
 *   basename: 'thunder_storm_2024-01-15_1',
 *   number: 1,
 *   prompt: 'thunder storm',
 *   timestamp: '2024-01-15T10:30:00.000Z',
 *   path: '/project/SFX/ai sfx/thunder_storm_2024-01-15_1.mp3',
 *   source: 'filesystem'
 * };
 * ```
 */
export interface SFXFileInfo {
  /** Full filename including extension */
  filename: string;
  /** Filename without extension */
  basename: string;
  /** Version number extracted from filename */
  number: number;
  /** Prompt text extracted from filename */
  prompt: string;
  /** ISO timestamp of file creation/modification */
  timestamp: string;
  /** Full filesystem path to the audio file */
  path: string;
  /** Optional path in Premiere Pro project bin */
  binPath?: string;
  /** Optional subfolder within SFX directory */
  subfolder?: string;
  /** Source of the file information */
  source: 'filesystem' | 'project_bin';
}

/**
 * Represents an audio track detected in Premiere Pro timeline
 * 
 * @interface DetectedTrack
 */
export interface DetectedTrack {
  /** Human-readable track name (e.g., "Audio 5") */
  name: string;
  /** Numeric track identifier */
  number: number;
}

/**
 * Complete application state interface
 * 
 * Contains all state needed for the AI SFX Generator application including
 * generation parameters, UI state, file management, and Premiere Pro integration.
 * 
 * @interface SFXState
 */
export interface SFXState {
  // Core generation state
  /** Current prompt text for SFX generation */
  prompt: string;
  /** Whether SFX generation is currently in progress */
  isGenerating: boolean;
  /** Duration in seconds for generated SFX */
  currentDuration: number;
  /** Prompt influence factor (0.0 - 1.0) */
  promptInfluence: number;
  
  // Timeline and mode state
  /** Whether to use timeline in/out points for placement */
  useInOutMode: boolean;
  /** Whether manual placement mode is active */
  manualModeActive: boolean;
  /** Whether auto-placement mode is enabled */
  autoMode: boolean;
  /** Current Premiere Pro timeline information */
  timelineInfo: TimelineInfo | null;
  
  // API and settings
  /** ElevenLabs API key for audio generation */
  apiKey: string;
  /** Whether user has entered a valid license key */
  isLicensed: boolean;
  /** Current license key */
  licenseKey: string;
  
  // UI state
  /** Whether settings panel is visible */
  showSettings: boolean;
  /** Current menu mode/screen */
  menuMode: 'normal' | 'settings' | 'license' | 'files' | 'updates';
  
  // File and search state
  /** Whether in file lookup/search mode */
  isLookupMode: boolean;
  /** Array of existing SFX filenames */
  existingSFXFiles: string[];
  /** Complete file information for all SFX files */
  allSFXFileInfo: SFXFileInfo[];
  /** Filtered filenames based on search query */
  filteredSFXFiles: string[];
  /** Whether SFX dropdown list is visible */
  showSFXDropdown: boolean;
  /** Currently selected index in dropdown */
  selectedDropdownIndex: number;
  /** Timestamp of last file system scan */
  lastScanTime: number;
  /** Whether file scanning is in progress */
  isScanningFiles: boolean;
  
  // Audio and track state
  /** Whether track targeting is enabled */
  trackTargetingEnabled: boolean;
  /** Currently selected audio track */
  selectedTrack: string;
  /** List of available audio tracks */
  availableTracks: string[];
  /** Playback volume (0-100) */
  volume: number;
  /** Last detected targeted track */
  detectedTargetedTrack: DetectedTrack | null;
  
  // File system state
  /** Custom SFX folder path (if set) */
  customSFXPath: string | null;
  /** Where to place generated SFX: 'ai-sfx-bin' or 'active-bin' */
  sfxPlacement: 'ai-sfx-bin' | 'active-bin';
  
  // Preview state
  /** Current audio element for preview */
  previewAudio: HTMLAudioElement | null;
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Path to currently previewing file */
  previewFile: string | null;
  /** Whether continuous preview mode is active (auto-play on navigation) */
  continuousPreviewMode: boolean;
  
  // Update management
  /** Whether auto-check for updates is enabled */
  autoCheckUpdates: boolean;
  /** Whether update check is currently in progress */
  isCheckingUpdates: boolean;
  /** Whether update download is currently in progress */
  isDownloadingUpdate: boolean;
  /** Latest available version from GitHub releases */
  latestVersion: string | null;
  /** Whether an update is available */
  updateAvailable: boolean;
  /** Download URL for the latest release */
  updateDownloadUrl: string | null;
}

// Action types for type safety
export type SFXAction =
  // Prompt and generation actions
  | { type: 'SET_PROMPT'; payload: string }
  | { type: 'SET_GENERATING'; payload: boolean }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_PROMPT_INFLUENCE'; payload: number }
  
  // Timeline and mode actions
  | { type: 'SET_IN_OUT_MODE'; payload: boolean }
  | { type: 'SET_MANUAL_MODE'; payload: boolean }
  | { type: 'SET_AUTO_MODE'; payload: boolean }
  | { type: 'SET_TIMELINE_INFO'; payload: TimelineInfo | null }
  
  // API and settings actions
  | { type: 'SET_API_KEY'; payload: string }
  | { type: 'SET_LICENSE_KEY'; payload: string }
  | { type: 'SET_LICENSED'; payload: boolean }
  
  // UI actions
  | { type: 'TOGGLE_SETTINGS' }
  | { type: 'SET_MENU_MODE'; payload: SFXState['menuMode'] }
  
  // File and search actions
  | { type: 'SET_LOOKUP_MODE'; payload: boolean }
  | { type: 'SET_SFX_FILES'; payload: string[] }
  | { type: 'SET_ALL_SFX_FILE_INFO'; payload: SFXFileInfo[] }
  | { type: 'SET_FILTERED_SFX_FILES'; payload: string[] }
  | { type: 'SHOW_SFX_DROPDOWN'; payload: boolean }
  | { type: 'SET_SELECTED_DROPDOWN_INDEX'; payload: number }
  | { type: 'SET_SCANNING_FILES'; payload: boolean }
  | { type: 'UPDATE_FILE_SCAN'; payload: { files: SFXFileInfo[]; scanTime: number } }
  
  // Audio and track actions
  | { type: 'SET_TRACK_TARGETING'; payload: boolean }
  | { type: 'SET_SELECTED_TRACK'; payload: string }
  | { type: 'SET_AVAILABLE_TRACKS'; payload: string[] }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_DETECTED_TRACK'; payload: DetectedTrack | null }
  
  // File system actions
  | { type: 'SET_CUSTOM_SFX_PATH'; payload: string | null }
  | { type: 'SET_SFX_PLACEMENT'; payload: 'ai-sfx-bin' | 'active-bin' }
  
  // Preview actions
  | { type: 'SET_PREVIEW_AUDIO'; payload: HTMLAudioElement | null }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_PREVIEW_FILE'; payload: string | null }
  | { type: 'SET_CONTINUOUS_PREVIEW_MODE'; payload: boolean }
  
  // Update management actions
  | { type: 'SET_AUTO_CHECK_UPDATES'; payload: boolean }
  | { type: 'SET_CHECKING_UPDATES'; payload: boolean }
  | { type: 'SET_DOWNLOADING_UPDATE'; payload: boolean }
  | { type: 'SET_LATEST_VERSION'; payload: string | null }
  | { type: 'SET_UPDATE_AVAILABLE'; payload: boolean }
  | { type: 'SET_UPDATE_DOWNLOAD_URL'; payload: string | null }
  
  // Bulk update actions
  | { type: 'LOAD_SETTINGS'; payload: Partial<SFXState> }
  | { type: 'RESET_STATE' }
  | { type: 'EXIT_LOOKUP_MODE' }
  | { type: 'ENTER_LOOKUP_MODE'; payload: { files: SFXFileInfo[]; scanTime: number } };

// Initial state
export const initialSFXState: SFXState = {
  // Core generation state
  prompt: "",
  isGenerating: false,
  currentDuration: 10,
  promptInfluence: 0.3,
  
  // Timeline and mode state
  useInOutMode: false,
  manualModeActive: false,
  autoMode: true,
  timelineInfo: null,
  
  // API and settings
  apiKey: "",
  isLicensed: false,
  licenseKey: "",
  
  // UI state
  showSettings: false,
  menuMode: 'normal',
  
  // File and search state
  isLookupMode: false,
  existingSFXFiles: [],
  allSFXFileInfo: [],
  filteredSFXFiles: [],
  showSFXDropdown: false,
  selectedDropdownIndex: -1,
  lastScanTime: 0,
  isScanningFiles: false,
  
  // Audio and track state
  trackTargetingEnabled: true,
  selectedTrack: "A5*",
  availableTracks: ["A1", "A2", "A3", "A4", "A5*", "A6", "A7", "A8"],
  volume: 0,
  detectedTargetedTrack: null,
  
  // File system state
  customSFXPath: null,
  sfxPlacement: 'ai-sfx-bin',
  
  // Preview state
  previewAudio: null,
  isPlaying: false,
  previewFile: null,
  continuousPreviewMode: false,
  
  // Update management
  autoCheckUpdates: true,
  isCheckingUpdates: false,
  isDownloadingUpdate: false,
  latestVersion: null,
  updateAvailable: false,
  updateDownloadUrl: null
};

/**
 * Professional state reducer with optimized updates
 */
export function sfxReducer(state: SFXState, action: SFXAction): SFXState {
  switch (action.type) {
    // Prompt and generation actions
    case 'SET_PROMPT':
      return { ...state, prompt: action.payload };
      
    case 'SET_GENERATING':
      return { ...state, isGenerating: action.payload };
      
    case 'SET_DURATION':
      return { ...state, currentDuration: action.payload };
      
    case 'SET_PROMPT_INFLUENCE':
      return { ...state, promptInfluence: action.payload };
    
    // Timeline and mode actions
    case 'SET_IN_OUT_MODE':
      return { ...state, useInOutMode: action.payload };
      
    case 'SET_MANUAL_MODE':
      return { ...state, manualModeActive: action.payload };
      
    case 'SET_AUTO_MODE':
      return { ...state, autoMode: action.payload };
      
    case 'SET_TIMELINE_INFO':
      return { ...state, timelineInfo: action.payload };
    
    // API and settings actions
    case 'SET_API_KEY':
      return { ...state, apiKey: action.payload };
      
    case 'SET_LICENSE_KEY':
      return { ...state, licenseKey: action.payload };
      
    case 'SET_LICENSED':
      return { ...state, isLicensed: action.payload };
    
    // UI actions
    case 'TOGGLE_SETTINGS':
      return { ...state, showSettings: !state.showSettings };
      
    case 'SET_MENU_MODE':
      return { ...state, menuMode: action.payload };
    
    // File and search actions
    case 'SET_LOOKUP_MODE':
      return { ...state, isLookupMode: action.payload };
      
    case 'SET_SFX_FILES':
      return { ...state, existingSFXFiles: action.payload };
      
    case 'SET_ALL_SFX_FILE_INFO':
      return { ...state, allSFXFileInfo: action.payload };
      
    case 'SET_FILTERED_SFX_FILES':
      return { ...state, filteredSFXFiles: action.payload };
      
    case 'SHOW_SFX_DROPDOWN':
      return { ...state, showSFXDropdown: action.payload };
      
    case 'SET_SELECTED_DROPDOWN_INDEX':
      return { ...state, selectedDropdownIndex: action.payload };
      
    case 'SET_SCANNING_FILES':
      return { ...state, isScanningFiles: action.payload };
      
    case 'UPDATE_FILE_SCAN':
      const fileNames = action.payload.files.map(f => f.filename);
      return {
        ...state,
        allSFXFileInfo: action.payload.files,
        existingSFXFiles: fileNames,
        lastScanTime: action.payload.scanTime,
        isScanningFiles: false
      };
    
    // Audio and track actions
    case 'SET_TRACK_TARGETING':
      return { ...state, trackTargetingEnabled: action.payload };
      
    case 'SET_SELECTED_TRACK':
      return { ...state, selectedTrack: action.payload };
      
    case 'SET_AVAILABLE_TRACKS':
      return { ...state, availableTracks: action.payload };
      
    case 'SET_VOLUME':
      return { ...state, volume: action.payload };
      
    case 'SET_DETECTED_TRACK':
      return { ...state, detectedTargetedTrack: action.payload };
    
    // File system actions
    case 'SET_CUSTOM_SFX_PATH':
      return { ...state, customSFXPath: action.payload };
      
    case 'SET_SFX_PLACEMENT':
      return { ...state, sfxPlacement: action.payload };
    
    // Preview actions
    case 'SET_PREVIEW_AUDIO':
      return { ...state, previewAudio: action.payload };
      
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload };
      
    case 'SET_PREVIEW_FILE':
      return { ...state, previewFile: action.payload };
      
    case 'SET_CONTINUOUS_PREVIEW_MODE':
      return { ...state, continuousPreviewMode: action.payload };
    
    // Update management actions
    case 'SET_AUTO_CHECK_UPDATES':
      return { ...state, autoCheckUpdates: action.payload };
      
    case 'SET_CHECKING_UPDATES':
      return { ...state, isCheckingUpdates: action.payload };
      
    case 'SET_DOWNLOADING_UPDATE':
      return { ...state, isDownloadingUpdate: action.payload };
      
    case 'SET_LATEST_VERSION':
      return { ...state, latestVersion: action.payload };
      
    case 'SET_UPDATE_AVAILABLE':
      return { ...state, updateAvailable: action.payload };
      
    case 'SET_UPDATE_DOWNLOAD_URL':
      return { ...state, updateDownloadUrl: action.payload };
    
    // Bulk update actions
    case 'LOAD_SETTINGS':
      return { ...state, ...action.payload };
      
    case 'RESET_STATE':
      return { ...initialSFXState };
      
    case 'EXIT_LOOKUP_MODE':
      return {
        ...state,
        isLookupMode: false,
        showSFXDropdown: false,
        filteredSFXFiles: [],
        selectedDropdownIndex: -1,
        prompt: ''
      };
      
    case 'ENTER_LOOKUP_MODE':
      const names = action.payload.files.map(f => f.filename);
      return {
        ...state,
        isLookupMode: true,
        showSFXDropdown: true,
        allSFXFileInfo: action.payload.files,
        existingSFXFiles: names,
        filteredSFXFiles: names,
        selectedDropdownIndex: names.length > 0 ? 0 : -1,
        lastScanTime: action.payload.scanTime,
        isScanningFiles: false,
        prompt: ' '
      };
    
    default:
      console.warn('Unknown action type:', (action as any).type);
      return state;
  }
}

/**
 * Action creators for type safety and consistency
 * 
 * Provides strongly-typed action creators that ensure proper state updates
 * and prevent runtime errors from invalid action types or payloads.
 * 
 * @namespace SFXActions
 * 
 * @example
 * ```typescript
 * // Update generation prompt
 * dispatch(SFXActions.setPrompt('ocean waves'));
 * 
 * // Start file scan
 * dispatch(SFXActions.setScanningFiles(true));
 * 
 * // Update file information
 * dispatch(SFXActions.updateFileScan(fileInfoArray, Date.now()));
 * ```
 */
export const SFXActions = {
  // Prompt and generation
  /** 
   * Set the current prompt for SFX generation
   * @param prompt - The prompt text
   */
  setPrompt: (prompt: string): SFXAction => ({ type: 'SET_PROMPT', payload: prompt }),
  
  /** 
   * Set generation status
   * @param isGenerating - Whether generation is in progress
   */
  setGenerating: (isGenerating: boolean): SFXAction => ({ type: 'SET_GENERATING', payload: isGenerating }),
  
  /** 
   * Set SFX duration in seconds
   * @param duration - Duration in seconds (1-30)
   */
  setDuration: (duration: number): SFXAction => ({ type: 'SET_DURATION', payload: duration }),
  
  /** 
   * Set prompt influence factor
   * @param influence - Influence factor (0.0 - 1.0)
   */
  setPromptInfluence: (influence: number): SFXAction => ({ type: 'SET_PROMPT_INFLUENCE', payload: influence }),
  
  // Timeline and mode
  /** 
   * Toggle in/out point mode for timeline placement
   * @param useInOutMode - Whether to use in/out points
   */
  setInOutMode: (useInOutMode: boolean): SFXAction => ({ type: 'SET_IN_OUT_MODE', payload: useInOutMode }),
  
  /** 
   * Set manual placement mode
   * @param manualModeActive - Whether manual mode is active
   */
  setManualMode: (manualModeActive: boolean): SFXAction => ({ type: 'SET_MANUAL_MODE', payload: manualModeActive }),
  
  /** 
   * Set auto placement mode
   * @param autoMode - Whether auto mode is enabled
   */
  setAutoMode: (autoMode: boolean): SFXAction => ({ type: 'SET_AUTO_MODE', payload: autoMode }),
  
  /** 
   * Update timeline information from Premiere Pro
   * @param timelineInfo - Current timeline info or null
   */
  setTimelineInfo: (timelineInfo: TimelineInfo | null): SFXAction => ({ type: 'SET_TIMELINE_INFO', payload: timelineInfo }),
  
  // API and settings
  /** 
   * Set ElevenLabs API key
   * @param apiKey - The API key string
   */
  setApiKey: (apiKey: string): SFXAction => ({ type: 'SET_API_KEY', payload: apiKey }),
  
  /** 
   * Set license key
   * @param licenseKey - The license key string
   */
  setLicenseKey: (licenseKey: string): SFXAction => ({ type: 'SET_LICENSE_KEY', payload: licenseKey }),
  
  /** 
   * Set licensed status
   * @param isLicensed - Whether user has valid license
   */
  setLicensed: (isLicensed: boolean): SFXAction => ({ type: 'SET_LICENSED', payload: isLicensed }),
  
  // UI
  /** Toggle settings panel visibility */
  toggleSettings: (): SFXAction => ({ type: 'TOGGLE_SETTINGS' }),
  
  /** 
   * Set current menu mode
   * @param mode - The menu mode to display
   */
  setMenuMode: (mode: SFXState['menuMode']): SFXAction => ({ type: 'SET_MENU_MODE', payload: mode }),
  
  // Files and search
  /** 
   * Set lookup mode for file searching
   * @param isLookupMode - Whether lookup mode is active
   */
  setLookupMode: (isLookupMode: boolean): SFXAction => ({ type: 'SET_LOOKUP_MODE', payload: isLookupMode }),
  
  /** 
   * Set array of SFX filenames
   * @param files - Array of filenames
   */
  setSFXFiles: (files: string[]): SFXAction => ({ type: 'SET_SFX_FILES', payload: files }),
  
  /** 
   * Set complete file information array
   * @param files - Array of SFX file info objects
   */
  setAllSFXFileInfo: (files: SFXFileInfo[]): SFXAction => ({ type: 'SET_ALL_SFX_FILE_INFO', payload: files }),
  
  /** 
   * Set filtered filenames based on search
   * @param files - Array of filtered filenames
   */
  setFilteredSFXFiles: (files: string[]): SFXAction => ({ type: 'SET_FILTERED_SFX_FILES', payload: files }),
  
  /** 
   * Show or hide SFX dropdown
   * @param show - Whether dropdown should be visible
   */
  showSFXDropdown: (show: boolean): SFXAction => ({ type: 'SHOW_SFX_DROPDOWN', payload: show }),
  
  /** 
   * Set selected dropdown index
   * @param index - The selected index (-1 for none)
   */
  setSelectedDropdownIndex: (index: number): SFXAction => ({ type: 'SET_SELECTED_DROPDOWN_INDEX', payload: index }),
  
  /** 
   * Set file scanning status
   * @param scanning - Whether file scan is in progress
   */
  setScanningFiles: (scanning: boolean): SFXAction => ({ type: 'SET_SCANNING_FILES', payload: scanning }),
  
  /** 
   * Update file scan results
   * @param files - Array of discovered SFX files
   * @param scanTime - Timestamp of the scan
   */
  updateFileScan: (files: SFXFileInfo[], scanTime: number): SFXAction => ({ 
    type: 'UPDATE_FILE_SCAN', 
    payload: { files, scanTime } 
  }),
  
  // Audio and tracks
  /** 
   * Enable or disable track targeting
   * @param enabled - Whether track targeting is enabled
   */
  setTrackTargeting: (enabled: boolean): SFXAction => ({ type: 'SET_TRACK_TARGETING', payload: enabled }),
  
  /** 
   * Set the selected audio track
   * @param track - Track identifier (e.g., "A5*")
   */
  setSelectedTrack: (track: string): SFXAction => ({ type: 'SET_SELECTED_TRACK', payload: track }),
  
  /** 
   * Set available audio tracks
   * @param tracks - Array of track identifiers
   */
  setAvailableTracks: (tracks: string[]): SFXAction => ({ type: 'SET_AVAILABLE_TRACKS', payload: tracks }),
  
  /** 
   * Set playback volume
   * @param volume - Volume level (0-100)
   */
  setVolume: (volume: number): SFXAction => ({ type: 'SET_VOLUME', payload: volume }),
  
  /** 
   * Set detected target track
   * @param track - Detected track info or null
   */
  setDetectedTrack: (track: DetectedTrack | null): SFXAction => ({ type: 'SET_DETECTED_TRACK', payload: track }),
  
  // File system
  /** 
   * Set custom SFX folder path
   * @param path - Custom folder path or null for project folder
   */
  setCustomSFXPath: (path: string | null): SFXAction => ({ type: 'SET_CUSTOM_SFX_PATH', payload: path }),
  
  /** 
   * Set SFX placement preference
   * @param placement - Where to place generated SFX files
   */
  setSFXPlacement: (placement: 'ai-sfx-bin' | 'active-bin'): SFXAction => ({ type: 'SET_SFX_PLACEMENT', payload: placement }),
  
  // Preview
  setPreviewAudio: (audio: HTMLAudioElement | null): SFXAction => ({ type: 'SET_PREVIEW_AUDIO', payload: audio }),
  setPlaying: (playing: boolean): SFXAction => ({ type: 'SET_PLAYING', payload: playing }),
  setPreviewFile: (file: string | null): SFXAction => ({ type: 'SET_PREVIEW_FILE', payload: file }),
  
  /** 
   * Set continuous preview mode (auto-play on navigation)
   * @param continuous - Whether to enable continuous preview mode
   */
  setContinuousPreviewMode: (continuous: boolean): SFXAction => ({ type: 'SET_CONTINUOUS_PREVIEW_MODE', payload: continuous }),
  
  // Update management
  /** 
   * Set auto-check for updates preference
   * @param autoCheck - Whether to automatically check for updates
   */
  setAutoCheckUpdates: (autoCheck: boolean): SFXAction => ({ type: 'SET_AUTO_CHECK_UPDATES', payload: autoCheck }),
  
  /** 
   * Set update checking status
   * @param checking - Whether update check is in progress
   */
  setCheckingUpdates: (checking: boolean): SFXAction => ({ type: 'SET_CHECKING_UPDATES', payload: checking }),
  
  /** 
   * Set update downloading status
   * @param downloading - Whether update download is in progress
   */
  setDownloadingUpdate: (downloading: boolean): SFXAction => ({ type: 'SET_DOWNLOADING_UPDATE', payload: downloading }),
  
  /** 
   * Set latest available version
   * @param version - Latest version string or null
   */
  setLatestVersion: (version: string | null): SFXAction => ({ type: 'SET_LATEST_VERSION', payload: version }),
  
  /** 
   * Set update availability status
   * @param available - Whether an update is available
   */
  setUpdateAvailable: (available: boolean): SFXAction => ({ type: 'SET_UPDATE_AVAILABLE', payload: available }),
  
  /** 
   * Set update download URL
   * @param url - Download URL for the latest release
   */
  setUpdateDownloadUrl: (url: string | null): SFXAction => ({ type: 'SET_UPDATE_DOWNLOAD_URL', payload: url }),
  
  // Bulk operations
  loadSettings: (settings: Partial<SFXState>): SFXAction => ({ type: 'LOAD_SETTINGS', payload: settings }),
  resetState: (): SFXAction => ({ type: 'RESET_STATE' }),
  exitLookupMode: (): SFXAction => ({ type: 'EXIT_LOOKUP_MODE' }),
  enterLookupMode: (files: SFXFileInfo[], scanTime: number): SFXAction => ({ 
    type: 'ENTER_LOOKUP_MODE', 
    payload: { files, scanTime } 
  })
};