import type { TimelineInfo, PlacementResult, AppInfo, TestConnectionResult } from "../../../../shared/universals";

/**
 * @description Type-safe ExtendScript function definitions for AI SFX Generator
 * These types ensure end-to-end type safety between CEP and ExtendScript layers
 */
export type Scripts = {
  // Core timeline functions
  getSequenceInfo: () => TimelineInfo;
  getAppInfo: () => AppInfo;
  testConnection: () => TestConnectionResult;
  
  // Audio placement functions
  importAndPlaceAudio: (filePath: string, trackIndex?: number) => PlacementResult;
  importAndPlaceAudioAtTime: (filePath: string, timeSeconds: number, startingTrackIndex?: number, placementMode?: 'ai-sfx-bin' | 'active-bin') => PlacementResult;
  
  // Debug functions for project path troubleshooting
  testBasicExtendScript: () => { success: boolean; message: string; appVersion: string; timestamp: string; error?: string };
  debugTimelinePlacement: () => { success: boolean; debug: any; error?: string };
  debugProjectPathDetailed: () => string; // Returns JSON string
  testProjectSaveStatus: () => string; // Returns JSON string
  testSFXDirectoryCreation: () => string; // Returns JSON string
  getProjectPath: () => string; // Returns JSON string
  
  // Sample functions (for testing - can be removed later)
  helloError: (str: string) => void;
  helloStr: (str: string) => string;
  helloNum: (num: number) => number;
  helloArrayStr: (arr: string[]) => string[];
  helloObj: (obj: { height: number; width: number }) => { x: number; y: number };
  helloVoid: () => void;
};