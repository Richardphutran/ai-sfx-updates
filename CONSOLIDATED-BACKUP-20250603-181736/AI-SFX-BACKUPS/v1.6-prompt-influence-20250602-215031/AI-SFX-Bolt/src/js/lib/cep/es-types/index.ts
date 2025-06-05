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
  importAndPlaceAudioAtTime: (filePath: string, timeSeconds: number, startingTrackIndex?: number) => PlacementResult;
  
  // Sample functions (for testing - can be removed later)
  helloError: (str: string) => void;
  helloStr: (str: string) => string;
  helloNum: (num: number) => number;
  helloArrayStr: (arr: string[]) => string[];
  helloObj: (obj: { height: number; width: number }) => { x: number; y: number };
  helloVoid: () => void;
};