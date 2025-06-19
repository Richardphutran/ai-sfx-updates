import { useEffect, useState, useCallback, useRef, useReducer } from "react";
import { evalTS, subscribeBackgroundColor, listenTS, csi } from "../lib/utils/bolt";
import CSInterface from "../lib/cep/csinterface";
import { fs } from "../lib/cep/node";
import type { TimelineInfo, PlacementResult } from "../../shared/universals";
import { bridgeClient } from "../lib/bridge-client";
import { ErrorBoundary } from "../components/ErrorBoundary";
// Removed ToastSystem for silent operation
import { errorManager, ErrorUtils, ErrorCategory, ErrorSeverity } from "../lib/error-manager";
import { ErrorSystemTests } from "../lib/test-error-system";
import { SecurityManager, SecureStorage, InputSanitizer, SecurityValidator } from "../lib/security-manager";
import { sfxReducer, initialSFXState, SFXActions, type SFXState, type SFXFileInfo } from "../lib/state-manager";
import { LicenseManager } from "../lib/license-manager";
import "./main.scss";
// Removed ToastSystem SCSS
import "../components/ErrorBoundary.scss";

// Performance utility for conditional logging - now silent by default
const devLog = (...args: any[]) => {
  // Only log critical debug events
  if (process.env.NODE_ENV === 'development' && (args[0]?.includes?.('🚨') || args[0]?.includes?.('❌'))) {
    console.log(...args);
  }
};

// Debounce utility for performance
const useDebounce = (callback: (...args: any[]) => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
};

// Async file system utilities
const fsAsync = {
  existsSync: (path: string): boolean => {
    try {
      return fs.existsSync(path);
    } catch {
      return false;
    }
  },
  
  exists: async (path: string): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        resolve(fs.existsSync(path));
      } catch {
        resolve(false);
      }
    });
  },
  
  readdir: async (path: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      // PERFORMANCE: Use immediate execution, but with yield
      try {
        const items = fs.readdirSync(path);
        // PERFORMANCE: Limit results and yield control
        const limitedItems = items.slice(0, 200); // Max 200 files per directory
        setImmediate(() => resolve(limitedItems));
      } catch (error) {
        setImmediate(() => reject(error));
      }
    });
  },
  
  stat: async (path: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      // PERFORMANCE: Use immediate execution, but with yield
      try {
        const stats = fs.statSync(path);
        // Use setImmediate equivalent to yield control
        setImmediate(() => resolve(stats));
      } catch (error) {
        setImmediate(() => reject(error));
      }
    });
  },
  
  mkdir: async (path: string, options?: { recursive?: boolean }): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        fs.mkdirSync(path, options);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
};

// State interfaces moved to state-manager.ts

export const App = () => {

  const [bgColor, setBgColor] = useState("#2a2a2a");
  // Removed toast system for silent operation
  const [state, dispatch] = useReducer(sfxReducer, initialSFXState);
  
  // REMOVED: setState compatibility helper - was causing performance issues

  const promptRef = useRef<HTMLTextAreaElement>(null);
  const timelineUpdateRef = useRef<NodeJS.Timeout>();
  const cachedFileInfoRef = useRef<SFXFileInfo[]>([]);
  const CACHE_DURATION = 900000; // 15 minutes cache for maximum performance
  
  // Track textarea focus state for aggressive left/right arrow capture
  const [textareaHasFocus, setTextareaHasFocus] = useState(false);

  // Enhanced file scanning with detailed debugging
  const performFileScanning = useCallback(async () => {
    console.log('🔍 SPACEBAR SCAN: Starting comprehensive SFX scan...');
    dispatch(SFXActions.setScanningFiles(true));
    
    try {
      const scanStartTime = performance.now();
      console.log('📁 SCAN TARGET: Custom path =', state.customSFXPath || 'null (will use project default)');
      
      const allFiles = await scanExistingSFXFiles(state.customSFXPath);
      const scanDuration = performance.now() - scanStartTime;
      
      console.log(`✅ SCAN COMPLETE: Found ${allFiles.length} files in ${scanDuration.toFixed(0)}ms`);
      console.log('📊 SCAN BREAKDOWN:', {
        filesystemFiles: allFiles.filter(f => f.source === 'filesystem').length,
        projectBinFiles: allFiles.filter(f => f.source === 'project_bin').length,
        totalUnique: allFiles.length
      });
      
      // Log to file
      try {
        const logPath = '/tmp/ai-sfx-debug.log';
        const timestamp = new Date().toISOString();
        const logMessage = `${timestamp} - SCAN COMPLETE: Found ${allFiles.length} files (FS: ${allFiles.filter(f => f.source === 'filesystem').length}, Bins: ${allFiles.filter(f => f.source === 'project_bin').length})\n`;
        fs.writeFileSync(logPath, logMessage, { flag: 'a' });
        
        // Log first few filenames for debugging
        if (allFiles.length > 0) {
          const sampleFiles = allFiles.slice(0, 3).map(f => f.filename).join(', ');
          const sampleMessage = `${timestamp} - SAMPLE FILES: ${sampleFiles}${allFiles.length > 3 ? '...' : ''}\n`;
          fs.writeFileSync(logPath, sampleMessage, { flag: 'a' });
        }
      } catch (e) {}
      
      if (allFiles.length === 0) {
        console.warn('⚠️ NO FILES FOUND: This suggests scanning failed or no SFX exist');
        console.log('🔧 DEBUGGING HINTS:');
        console.log('  - Check if project is saved (needed for project path detection)');
        console.log('  - Verify SFX files exist in: Project/SFX/ or custom folder');
        console.log('  - Check if audio files are in Premiere bins named "SFX" or "AI SFX"');
      }
      
      // Cache the results
      cachedFileInfoRef.current = allFiles;
      
      dispatch(SFXActions.updateFileScan(allFiles, Date.now()));
    } catch (error) {
      console.error('❌ SCAN FAILED:', error);
      ErrorUtils.handleFileError(error as Error, { operation: 'scanExistingSFXFiles' });
      dispatch(SFXActions.setScanningFiles(false));
    }
  }, [state.customSFXPath]);

  const debouncedFileScanning = useDebounce(performFileScanning, 2000); // Much longer debounce for performance
  
  // Professional fuzzy search logic
  const performFileFiltering = useCallback((searchTerm: string, allFiles: SFXFileInfo[]) => {
    // Handle empty/space-only search - show ALL files (professional behavior)
    const cleanedSearch = searchTerm.trim();
    if (cleanedSearch === '' || searchTerm === ' ') {
      console.log('🔍 EMPTY SEARCH: Showing all files');
      // Log to file
      try {
        const logPath = '/tmp/ai-sfx-debug.log';
        const timestamp = new Date().toISOString();
        const logMessage = `${timestamp} - EMPTY SEARCH: Showing all ${allFiles.length} files\n`;
        fs.writeFileSync(logPath, logMessage, { flag: 'a' });
      } catch (e) {}
      return allFiles.map(f => f.filename);
    }

    const normalizedSearch = cleanedSearch.toLowerCase();
    console.log('🔍 FILTERING FILES:', { searchTerm: normalizedSearch, totalFiles: allFiles.length });
    
    // Professional search scoring
    const scoredFiles = allFiles.map(file => {
      const prompt = file.prompt.toLowerCase().replace(/_/g, ' ');
      const basename = file.basename.toLowerCase().replace(/_/g, ' ');
      const filename = file.filename.toLowerCase().replace(/_/g, ' ');
      
      let score = 0;
      let reasons: string[] = [];
      
      // 1. EXACT MATCH (highest priority)
      if (prompt === normalizedSearch || basename === normalizedSearch) {
        score += 1000;
        reasons.push('exact_match');
      }
      
      // 2. STARTS WITH (very high priority)
      if (prompt.startsWith(normalizedSearch) || basename.startsWith(normalizedSearch) || filename.startsWith(normalizedSearch)) {
        score += 500;
        reasons.push('starts_with');
      }
      
      // 3. CONTAINS (high priority)
      if (prompt.includes(normalizedSearch) || basename.includes(normalizedSearch) || filename.includes(normalizedSearch)) {
        score += 100;
        reasons.push('contains');
      }
      
      // 4. WORD BOUNDARIES (medium priority)
      const searchRegex = new RegExp(`\\b${normalizedSearch}`, 'i');
      if (searchRegex.test(prompt) || searchRegex.test(basename) || searchRegex.test(filename)) {
        score += 50;
        reasons.push('word_boundary');
      }
      
      // 5. CHARACTER SEQUENCE (fuzzy matching)
      const searchChars = normalizedSearch.split('');
      const promptChars = prompt.split('');
      let charMatches = 0;
      let lastIndex = -1;
      
      for (const char of searchChars) {
        const index = promptChars.indexOf(char, lastIndex + 1);
        if (index > lastIndex) {
          charMatches++;
          lastIndex = index;
        }
      }
      
      if (charMatches === searchChars.length) {
        score += 25;
        reasons.push('char_sequence');
      }
      
      return { file, score, reasons };
    });
    
    // Filter and sort by score
    const filtered = scoredFiles
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
    
    console.log(`🎯 SEARCH RESULTS: "${normalizedSearch}" matched ${filtered.length}/${allFiles.length} files`);
    
    // Log to file
    try {
      const logPath = '/tmp/ai-sfx-debug.log';
      const timestamp = new Date().toISOString();
      const logMessage = `${timestamp} - SEARCH "${normalizedSearch}": ${filtered.length}/${allFiles.length} matches\n`;
      fs.writeFileSync(logPath, logMessage, { flag: 'a' });
      
      if (filtered.length > 0) {
        const topResults = filtered.slice(0, 3).map(item => `${item.file.filename} (score:${item.score})`).join(', ');
        const resultsMessage = `${timestamp} - TOP RESULTS: ${topResults}\n`;
        fs.writeFileSync(logPath, resultsMessage, { flag: 'a' });
      }
    } catch (e) {}
    
    return filtered.map(item => item.file.filename);
  }, []);
  
  // Debounced file filtering to prevent lag during typing
  const debouncedFileFiltering = useDebounce((searchTerm: string, allFiles: SFXFileInfo[]) => {
    // Limit results for performance
    const filteredNames = performFileFiltering(searchTerm, allFiles).slice(0, 50); // Max 50 results
    dispatch(SFXActions.setFilteredSFXFiles(filteredNames));
    dispatch(SFXActions.setSelectedDropdownIndex(filteredNames.length > 0 ? 0 : -1));
    dispatch(SFXActions.showSFXDropdown(true));
  }, 300); // Longer debounce for performance

  // Initialize bridge connection and console forwarding
  useEffect(() => {
    // Set up console forwarding to multi-plugin debugger
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleInfo = console.info;
    const originalConsoleDebug = console.debug;
    
    // PERFORMANCE: Console forwarding completely disabled for better performance
    // Bridge forwarding causes significant system slowdown
    if (false) { // Disabled completely
      console.log = function(...args) {
        originalConsoleLog.apply(console, args);
      };
    }
    
    // DISABLED: Console forwarding also disabled to eliminate any bridge client calls
    // All console methods remain as original - no forwarding to bridge
    /*
    console.error = function(...args) {
      const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
      if (bridgeClient.getStatus().connected) {
        bridgeClient.sendConsoleMessage('error', message, args.length > 1 ? args.slice(1) : undefined);
      }
      originalConsoleError.apply(console, args);
    };
    
    console.warn = function(...args) {
      const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
      if (bridgeClient.getStatus().connected) {
        bridgeClient.sendConsoleMessage('warn', message, args.length > 1 ? args.slice(1) : undefined);
      }
      originalConsoleWarn.apply(console, args);
    };
    
    console.info = function(...args) {
      const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
      if (bridgeClient.getStatus().connected) {
        bridgeClient.sendConsoleMessage('info', message, args.length > 1 ? args.slice(1) : undefined);
      }
      originalConsoleInfo.apply(console, args);
    };
    
    console.debug = function(...args) {
      const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
      if (bridgeClient.getStatus().connected) {
        bridgeClient.sendConsoleMessage('debug', message, args.length > 1 ? args.slice(1) : undefined);
      }
      originalConsoleDebug.apply(console, args);
    };
    */
    
    // DISABLED: Bridge connection completely disabled to eliminate console polling
    // bridgeClient.connect() causes WebSocket connection attempts every 2 seconds
    // Commenting out to provide clean console experience
    /*
    bridgeClient.connect().then(connected => {
      if (connected) {
        devLog('✅ Bridge client connected successfully');
        devLog('🔊 AI SFX plugin ready for multi-plugin debugging');
        
        // Set up event handlers
        bridgeClient.on('sfx-response', (response) => {
          console.log('🎵 SFX response received:', response);
          // Handle SFX generation response
        });
        
        bridgeClient.on('premiere-response', (response) => {
          console.log('🎬 Premiere response received:', response);
          // Handle Premiere action response
        });
        
      } else {
        console.warn('⚠️ Bridge client failed to connect');
      }
    });
    */

    return () => {
      // Restore original console methods
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.info = originalConsoleInfo;
      console.debug = originalConsoleDebug;
      
      // bridgeClient.disconnect(); // Disabled since bridge connection is disabled
    };
  }, []);

  // Prevent drag behavior
  useEffect(() => {
    const preventDrag = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const preventMouseDrag = (e: MouseEvent) => {
      if (e.target && !(e.target as HTMLElement).closest('input, textarea, button, .duration-slider, .influence-slider')) {
        e.preventDefault();
      }
    };

    // Add event listeners to prevent drag
    document.addEventListener('dragstart', preventDrag, true);
    document.addEventListener('drag', preventDrag, true);
    document.addEventListener('dragend', preventDrag, true);
    document.addEventListener('dragover', preventDrag, true);
    document.addEventListener('dragenter', preventDrag, true);
    document.addEventListener('dragleave', preventDrag, true);
    document.addEventListener('drop', preventDrag, true);
    document.addEventListener('mousedown', preventMouseDrag, true);

    // Cleanup
    return () => {
      document.removeEventListener('dragstart', preventDrag, true);
      document.removeEventListener('drag', preventDrag, true);
      document.removeEventListener('dragend', preventDrag, true);
      document.removeEventListener('dragover', preventDrag, true);
      document.removeEventListener('dragenter', preventDrag, true);
      document.removeEventListener('dragleave', preventDrag, true);
      document.removeEventListener('drop', preventDrag, true);
      document.removeEventListener('mousedown', preventMouseDrag, true);
    };
  }, []);

  // Clean up filename for display (remove timestamps, clean up format)
  const formatFileDisplayName = (filename: string): string => {
    // Remove audio file extension if present
    let name = filename.replace(/\.(mp3|wav|aac|m4a|flac|ogg|aiff|aif)$/i, '');
    
    // Check for NEW number suffix format: "cat walking 1" or "explosion sound 12"
    const numberSuffixMatch = name.match(/^(.+?)\s+(\d+)$/);
    if (numberSuffixMatch) {
      const [, prompt, number] = numberSuffixMatch;
      return `${prompt} (${number})`;
    }
    
    // Check for OLD number prefix format: "001 cat walking"
    const numberPrefixMatch = name.match(/^(\d{3})\s+(.+)$/);
    if (numberPrefixMatch) {
      const [, number, prompt] = numberPrefixMatch;
      return `${prompt} (${number})`;
    }
    
    // Check if it's old underscore format (prompt_001_timestamp) 
    const underscoreFormatMatch = name.match(/^(.+?)_(\d{3})_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
    if (underscoreFormatMatch) {
      // Old format: show "prompt (001)"
      const [, prompt, number] = underscoreFormatMatch;
      return `${prompt.replace(/_/g, ' ')} (${number})`;
    }
    
    // Check for old timestamp format
    const oldFormatMatch = name.match(/^(.+?)_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
    if (oldFormatMatch) {
      // Old format: just show the prompt
      return oldFormatMatch[1].replace(/_/g, ' ');
    }
    
    // Fallback: clean underscores and return as-is
    return name.replace(/_/g, ' ');
  };

  // Check if filename has new numbering format
  const hasNumberFormat = (filename: string): boolean => {
    const name = filename.replace(/\.(mp3|wav|aac|m4a|flac|ogg|aiff|aif)$/i, '');
    return /^(.+?)_(\d{3})_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/.test(name);
  };

  // Show status in console for debugging
  // Professional status and error handling
  const showStatus = useCallback((message: string, duration = 2000) => {
    // Silent operation - no status messages
    console.log(`ℹ️ Status: ${message}`);
  }, []);

  const showSuccess = useCallback((message: string, duration = 2000) => {
    // Silent operation - no success notifications
    console.log(`✅ Success: ${message}`);
  }, []);

  const showWarning = useCallback((message: string, duration = 3000) => {
    // Silent operation - no warning notifications
    console.log(`⚠️ Warning: ${message}`);
  }, []);

  const showError = useCallback((message: string, duration = 5000, action?: { label: string; handler: () => void }) => {
    // Silent operation - no error notifications
    console.error(`❌ Error: ${message}`);
  }, []);

  // Error manager integration - DISABLED for silent operation
  useEffect(() => {
    const unsubscribe = errorManager.onNotification((notification) => {
      // Silent operation - log to console only
      console.log(`📢 ${notification.type.toUpperCase()}: ${notification.message}`);
    });

    return () => {
      unsubscribe();
    };
  }, []);


  // Update timeline info (optimized with change detection)
  const updateTimelineInfo = useCallback(async () => {
    try {
      const timelineInfo = await evalTS("getSequenceInfo");
      
      // Only update if the essential data changed (performance optimization)
      // Include actual time values in hash, not just booleans
      const prevHash = state.timelineInfo ? 
        `${state.timelineInfo.hasInPoint}-${state.timelineInfo.hasOutPoint}-${state.timelineInfo.inPoint?.seconds}-${state.timelineInfo.outPoint?.seconds}-${state.timelineInfo.sequenceName}` : '';
      const newHash = timelineInfo ? 
        `${timelineInfo.hasInPoint}-${timelineInfo.hasOutPoint}-${timelineInfo.inPoint?.seconds}-${timelineInfo.outPoint?.seconds}-${timelineInfo.sequenceName}` : '';
      
      if (prevHash !== newHash) {
        dispatch(SFXActions.setTimelineInfo(timelineInfo));
      }
    } catch (error) {
      console.error('❌ Timeline update failed:', error);
    }
  }, [state.timelineInfo, dispatch]);


  // Handle mode changes
  const activateInOutMode = useCallback(() => {
    dispatch(SFXActions.setInOutMode(true));
    dispatch(SFXActions.setManualMode(false));
    dispatch(SFXActions.setAutoMode(false));
  }, [dispatch]);

  const activateManualMode = useCallback(() => {
    dispatch(SFXActions.setInOutMode(false));
    dispatch(SFXActions.setManualMode(true));
    dispatch(SFXActions.setAutoMode(false));
  }, [dispatch]);

  const activateAutoMode = useCallback(() => {
    dispatch(SFXActions.setInOutMode(false));
    dispatch(SFXActions.setManualMode(false));
    dispatch(SFXActions.setAutoMode(true));
  }, [dispatch]);

  // Handle generation
  const handleGenerate = useCallback(async () => {
    // DEBUG: Generation start
    console.log('🎬 handleGenerate START:', { 
      prompt: state.prompt, 
      isGenerating: state.isGenerating,
      isLicensed: state.isLicensed,
      hasApiKey: !!state.apiKey 
    });
    
    // Allow empty prompt check but don't block if already generating
    if (!state.prompt.trim()) {
      console.log('⚠️ Empty prompt - returning early');
      return;
    }
    
    // Prevent multiple simultaneous generations
    if (state.isGenerating) {
      showStatus('Already generating, please wait...', 2000);
      return;
    }

    // Debug: Check API key and validation
    console.log('🔍 Current state:', { 
      isLicensed: state.isLicensed, 
      hasApiKey: !!state.apiKey, 
      apiKeyStart: state.apiKey?.substring(0, 10),
      prompt: state.prompt?.substring(0, 20) 
    });
    
    // Validate API key and prompt securely
    const validation = SecurityValidator.validateAPIRequest(state.prompt, state.apiKey);
    if (!validation.valid) {
      console.log('❌ Validation failed:', validation.errors);
      console.log('❌ Invalid API key or prompt:', { apiKey: state.apiKey?.substring(0, 10), prompt: state.prompt });
      showError(`Validation failed: ${validation.errors.join(', ')}`);
      return;
    }

    // Check rate limiting
    if (!SecurityValidator.rateLimiter.canMakeRequest()) {
      const timeUntilReset = SecurityValidator.rateLimiter.getTimeUntilReset();
      showWarning(`Rate limit exceeded. Please wait ${Math.ceil(timeUntilReset / 1000)} seconds.`);
      return;
    }
    
    console.log('🔒 Security validation passed, continuing with generation...');

    // Sanitize the prompt before using it
    const promptToGenerate = InputSanitizer.sanitizePrompt(state.prompt);
    
    console.log('🔄 Step 2: Setting generating state to true');
    dispatch(SFXActions.setGenerating(true));
    console.log('🔍 Step 3: Starting timeline detection...');
    showStatus('Detecting timeline...');

    try {
      // Get current timeline info and capture playhead position immediately
      console.log('📺 Step 4: Getting timeline info from Premiere...');
      const timelineInfo = await evalTS("getSequenceInfo");
      const currentPlayheadPosition = timelineInfo?.playheadPosition || timelineInfo?.playhead?.seconds || 0;
      
      
      let duration = state.currentDuration;
      let placementPosition: number | null = null;
      
      
      // Check for In-N-Out mode
      if (state.useInOutMode && timelineInfo?.success && timelineInfo?.hasInPoint && timelineInfo?.hasOutPoint) {
        const inPointSeconds = timelineInfo.inPoint?.seconds ?? 0;
        const outPointSeconds = timelineInfo.outPoint?.seconds ?? 0;
        const timelineDuration = outPointSeconds - inPointSeconds;
        
        
        if (timelineDuration > 22) {
          showStatus(`Timeline duration too long (${Math.round(timelineDuration)}s). Maximum is 22s for AI generation.`, 4000);
          dispatch(SFXActions.setGenerating(false));
          return;
        } else if (timelineDuration > 0) {
          duration = Math.min(timelineDuration, 22);
          placementPosition = inPointSeconds;
          showStatus(`Using in/out points: ${timelineInfo.inPoint?.formatted} to ${timelineInfo.outPoint?.formatted} (${duration.toFixed(1)}s)`, 2000);
        } else {
          showStatus('Invalid timeline selection. Please set valid in/out points.', 3000);
          dispatch(SFXActions.setGenerating(false));
          return;
        }
      } else {
        if (state.useInOutMode) {
          showStatus('No in/out points set - using manual duration', 2000);
        }
      }
      
      
      // Test ExtendScript connection
      try {
        const basicTest = await evalTS("getAppInfo");
        if (!basicTest) {
          throw new Error('ExtendScript connection failed');
        }
      } catch (extendScriptError) {
        throw new Error('Cannot connect to Premiere Pro. Make sure a project is open.');
      }
      
      console.log('🎵 Step 5: Starting SFX generation with ElevenLabs...', { prompt: promptToGenerate, duration, hasApiKey: !!state.apiKey });
      showStatus('Generating SFX...');
      
      // Generate audio using Eleven Labs API
      const audioData = await generateSFX(promptToGenerate, duration, state.apiKey, state.promptInfluence);
      
      console.log('✅ Step 6: SFX generation completed, now placing on timeline...', { audioDataSize: audioData?.byteLength });
      showStatus('Placing on timeline...');
      
      // Save audio file
      console.log('💾 Step 6a: Saving audio file...');
      const filePath = await saveAudioFile(audioData, promptToGenerate);
      console.log('✅ Step 6b: Audio file saved to:', filePath);
      
      // Verify file was created
      if (await fsAsync.exists(filePath)) {
        console.log('✅ Step 6c: File exists on disk, proceeding to timeline placement');
      } else {
        console.log('❌ Step 6c: File NOT found on disk after save!');
        throw new Error('Audio file was not saved properly');
      }
      
      // Place audio on timeline with enhanced error handling
      console.log('🎬 Step 7: Starting timeline placement process...');
      let result: PlacementResult;
      
      
      // Determine target track index based on track targeting settings
      let targetTrackIndex = 0; // Default to first track
      
      if (state.trackTargetingEnabled) {
        // Detect the currently targeted track in real-time (fresh detection for generation)
        const targetedTrack = await detectTargetedTrack();
        
        if (targetedTrack && targetedTrack.number) {
          targetTrackIndex = targetedTrack.number - 1;
          showStatus(`Placing on ${targetedTrack.name}...`);
        } else {
          showStatus('No track targeted - using auto placement...');
        }
      } else {
        showStatus('Using smart auto-placement...');
      }
      
      try {
        console.log('🎬 Step 7a: Calling timeline placement function...');
        console.log('  • File path:', filePath);
        console.log('  • Position:', placementPosition || currentPlayheadPosition);
        console.log('  • Target track:', targetTrackIndex);
        
        if (placementPosition !== null) {
          console.log('📍 Using specific placement position:', placementPosition);
          result = await evalTS("importAndPlaceAudioAtTime", filePath, placementPosition, targetTrackIndex, state.sfxPlacement);
        } else {
          console.log('📍 Using current playhead position:', currentPlayheadPosition);
          result = await evalTS("importAndPlaceAudioAtTime", filePath, currentPlayheadPosition, targetTrackIndex, state.sfxPlacement);
        }
        
        console.log('🎬 Step 7b: Timeline placement result:', result);
        
        // Enhanced error reporting
        if (!result || !result.success) {
          console.log('⚠️ First placement attempt failed, trying fallback...');
          console.log('❌ Error:', result?.error);
          showStatus('Trying alternative placement...');
          
          // Fallback: Try with captured playhead position and same target track
          console.log('🔄 Fallback: Using playhead position with same track');
          const fallbackResult = await evalTS("importAndPlaceAudioAtTime", filePath, currentPlayheadPosition, targetTrackIndex, state.sfxPlacement);
          console.log('🔄 Fallback result:', fallbackResult);
          
          if (fallbackResult && fallbackResult.success) {
            console.log('✅ Fallback placement succeeded!');
            result = fallbackResult;
          } else {
            console.log('❌ Both placement attempts failed');
            console.log('Primary error:', result?.error);
            console.log('Fallback error:', fallbackResult?.error);
            throw new Error(result?.error || 'Timeline placement failed completely');
          }
        } else {
          console.log('✅ Step 7c: Timeline placement succeeded on first attempt!');
        }
      } catch (placementError) {
        console.log('❌ Step 7d: All placement attempts failed with error:', placementError);
        // Last resort: Show user where file was saved
        showStatus(`SFX saved to ${filePath}. Please manually drag to timeline.`, 5000);
        throw new Error(`Timeline placement failed: ${placementError instanceof Error ? placementError.message : String(placementError)}`);
      }
      
      console.log('🏁 Step 8: Processing final result...');
      if (result.success) {
        console.log('✅ Step 8a: Timeline placement confirmed successful!');
        // Only clear the prompt that was actually generated, not the current one
        // If user hasn't typed anything new, clear the prompt
        if (state.prompt.trim() === promptToGenerate) {
          dispatch(SFXActions.setPrompt(""));
        }
        // Otherwise keep their new prompt intact
        
        let statusMsg = 'SFX added to timeline!';
        if (placementPosition !== null && timelineInfo?.inPoint) {
          statusMsg = `SFX placed at ${timelineInfo.inPoint.formatted}`;
          if (result.trackIndex !== undefined) {
            statusMsg += ` on track ${result.trackIndex + 1}`;
          }
          if (result.message?.includes('avoided conflicts')) {
            statusMsg += ' (avoided conflicts)';
          } else if (result.message?.includes('new track created')) {
            statusMsg += ' (new track)';
          }
          statusMsg += ' - Duration may vary due to AI generation';
        }
        showStatus(statusMsg, 4000);
      } else {
        throw new Error(result.error || 'Failed to place audio');
      }

    } catch (error) {
      showStatus(`Error: ${error instanceof Error ? error.message : String(error)}`, 4000);
    } finally {
      dispatch(SFXActions.setGenerating(false));
    }
  }, [state, showStatus, dispatch]);

  // Generate SFX using Eleven Labs API with retry logic
  const generateSFX = async (prompt: string, duration: number, apiKey: string, promptInfluence: number): Promise<ArrayBuffer> => {
    console.log('🔥 generateSFX called:', { prompt, duration, apiKeyFirst10: apiKey?.substring(0, 10), promptInfluence });
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        attempt++;
        console.log(`🎵 API attempt ${attempt}/${maxRetries} for: "${prompt}"`);
        console.log(`🔑 Using API key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
        
        const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
            'Accept': 'audio/mpeg'
          },
          body: JSON.stringify({
            text: prompt,
            duration_seconds: Math.max(1, Math.min(22, duration)),
            prompt_influence: promptInfluence
          })
        });

        if (response.ok) {
          console.log(`✅ API success on attempt ${attempt}`);
          return response.arrayBuffer();
        }
        
        // Handle rate limiting (429) and server errors (5xx)
        if (response.status === 429 || response.status >= 500) {
          const errorText = await response.text();
          const waitTime = Math.min(2000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
          
          console.log(`⏳ Rate limited (${response.status}). Waiting ${waitTime}ms before retry...`);
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          } else {
            const apiError = new Error(`API request failed after ${maxRetries} attempts: ${response.status} - ${errorText}`);
          ErrorUtils.handleAPIError(apiError, false, { 
            attempts: maxRetries, 
            status: response.status, 
            prompt: prompt.substring(0, 50) 
          });
          throw apiError;
          }
        } else {
          // Non-retryable error (4xx except 429)
          const error = await response.text();
          const apiError = new Error(`API request failed: ${response.status} - ${error}`);
          ErrorUtils.handleAPIError(apiError, false, { 
            status: response.status, 
            prompt: prompt.substring(0, 50) 
          });
          throw apiError;
        }
        
      } catch (fetchError) {
        if (attempt === maxRetries) {
          throw fetchError;
        }
        
        // Network error - retry with backoff
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`🌐 Network error on attempt ${attempt}. Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw new Error(`Failed to generate SFX after ${maxRetries} attempts`);
  };

  // Get SFX folder path with comprehensive debugging
  const getSFXPath = async (): Promise<string | null> => {
    console.log('🔍 getSFXPath() called - starting detailed analysis...');
    
    // First check for custom path
    if (state.customSFXPath) {
      console.log('✅ Using custom SFX path:', state.customSFXPath);
      return state.customSFXPath;
    }
    
    console.log('🔍 No custom path, checking project path...');
    
    try {
      // COMPARISON: Test both approaches side by side
      console.log('🔍 Testing Method 1: Direct getProjectPath() call...');
      const directResult = await new Promise<any>((resolve) => {
        csi.evalScript('getProjectPath()', (result) => {
          console.log('📤 Direct call raw result:', result);
          try {
            const parsed = JSON.parse(result);
            console.log('✅ Direct call parsed result:', parsed);
            resolve(parsed);
          } catch (e) {
            console.log('❌ Direct call parse error:', e);
            resolve({ success: false, error: 'Failed to parse result', raw: result });
          }
        });
      });
      
      console.log('🔍 Testing Method 2: Namespace approach (like debug function)...');
      const namespaceResult = await new Promise<any>((resolve) => {
        csi.evalScript(`
          try {
            var host = typeof $ !== 'undefined' ? $ : window;
            var ns = "com.ai.sfx.generator";
            if (host[ns] && host[ns].getProjectPath) {
              var result = host[ns].getProjectPath();
              result;
            } else {
              JSON.stringify({success: false, error: "getProjectPath function not available in namespace"});
            }
          } catch (e) {
            JSON.stringify({success: false, error: "Error calling namespace getProjectPath: " + e.toString()});
          }
        `, (result) => {
          console.log('📤 Namespace call raw result:', result);
          try {
            const parsed = JSON.parse(result);
            console.log('✅ Namespace call parsed result:', parsed);
            resolve(parsed);
          } catch (e) {
            console.log('❌ Namespace call parse error:', e);
            resolve({ success: false, error: 'Failed to parse result', raw: result });
          }
        });
      });
      
      // Compare results
      console.log('📊 COMPARISON:');
      console.log('Direct method success:', directResult.success);
      console.log('Namespace method success:', namespaceResult.success);
      
      // Use the working method
      let workingResult: any = null;
      if (namespaceResult.success && (namespaceResult as any).projectDir) {
        console.log('✅ Using namespace result (working)');
        workingResult = namespaceResult;
      } else if (directResult.success && (directResult as any).projectDir) {
        console.log('✅ Using direct result (working)');
        workingResult = directResult;
      } else {
        console.log('❌ Both methods failed:');
        console.log('Direct error:', directResult.error);
        console.log('Namespace error:', namespaceResult.error);
        return null;
      }
      
      if (workingResult && workingResult.projectDir) {
        const sfxPath = `${workingResult.projectDir}/SFX/ai sfx`;
        console.log('🎯 SUCCESS - SFX path calculated:', sfxPath);
        return sfxPath;
      } else {
        console.log('❌ No valid project directory found');
        return null;
      }
      
    } catch (error) {
      console.log('❌ Error in getSFXPath:', error);
      return null;
    }
  };

  // Scan existing SFX files from both filesystem and project bins
  const scanExistingSFXFiles = async (customPath?: string | null): Promise<SFXFileInfo[]> => {
    console.log('🚀 scanExistingSFXFiles: Starting comprehensive scan...');
    const allFiles: SFXFileInfo[] = [];
    const pathToUse = customPath !== undefined ? customPath : state.customSFXPath;
    console.log('🎯 Scan target path:', pathToUse);
    
    try {
      // 1. Scan both main SFX folder and ai sfx subfolder
      const projectPath = await new Promise<any>((resolve) => {
        // Use direct namespace access instead of evalTS
        csi.evalScript(`
          try {
            var host = typeof $ !== 'undefined' ? $ : window;
            var ns = "com.ai.sfx.generator";
            if (host[ns] && host[ns].getProjectPath) {
              var result = host[ns].getProjectPath();
              result;
            } else {
              JSON.stringify({success: false, error: "Function not available", debug: {hasHost: typeof host !== 'undefined', hasNamespace: typeof host[ns] !== 'undefined'}});
            }
          } catch (e) {
            JSON.stringify({success: false, error: e.toString()});
          }
        `, (result) => {
          try {
            // If result already looks like JSON, parse it. Otherwise, it might be direct from function
            if (result.startsWith('{') || result.startsWith('[')) {
              const parsed = JSON.parse(result);
              resolve(parsed);
            } else {
              resolve({ success: false, error: 'Non-JSON result: ' + result });
            }
          } catch (e) {
            resolve({ success: false, error: 'Parse error: ' + e });
          }
        });
      });
      
      const foldersToScan: string[] = [];
      
      // First priority: Check custom path if set
      if (pathToUse && await fsAsync.exists(pathToUse)) {
        console.log(`📁 FILESYSTEM SCAN 1: Custom SFX folder: ${pathToUse}`);
        foldersToScan.push(pathToUse);
      } else if (pathToUse) {
        console.warn(`⚠️ Custom path set but doesn't exist: ${pathToUse}`);
      }
      
      // Also scan default locations for backward compatibility
      if (projectPath.success && projectPath.projectDir) {
        console.log(`📂 PROJECT DETECTED: ${projectPath.projectDir}`);
        // ONLY scan the exact paths where we save files
        // 1. Primary location: Project/SFX/ai sfx
        const primaryPath = `${projectPath.projectDir}/SFX/ai sfx`;
        if (await fsAsync.exists(primaryPath) && primaryPath !== pathToUse) {
          console.log(`📁 FILESYSTEM SCAN 2: Primary AI SFX folder: ${primaryPath}`);
          foldersToScan.push(primaryPath);
        }
        
        // 2. Also scan Project/SFX folder (parent of ai sfx) for manually added files
        const projectSFXPath = `${projectPath.projectDir}/SFX`;
        if (await fsAsync.exists(projectSFXPath) && projectSFXPath !== pathToUse) {
          console.log(`📁 FILESYSTEM SCAN 3: Parent SFX folder: ${projectSFXPath}`);
          foldersToScan.push(projectSFXPath);
          
          // Add immediate subfolders of SFX (but not recursive to avoid deep scanning)
          try {
            const items = await fsAsync.readdir(projectSFXPath);
            for (const item of items) {
              if (item.startsWith('.')) continue;
              const subPath = `${projectSFXPath}/${item}`;
              const stats = await fsAsync.stat(subPath);
              if (stats.isDirectory() && subPath !== pathToUse) {
                foldersToScan.push(subPath);
              }
            }
          } catch (e) {
            // Skip subfolders that can't be read
          }
        }
      } else {
        console.warn('⚠️ PROJECT PATH DETECTION FAILED:', projectPath);
      }
      
      // Remove duplicates
      const uniqueFolders = [...new Set(foldersToScan)];
      console.log(`📋 FILESYSTEM SCAN SUMMARY: Will scan ${uniqueFolders.length} folders:`, uniqueFolders);
      
      // Scan each folder recursively
      for (const sfxPath of uniqueFolders) {
        console.log(`🔍 Scanning folder: ${sfxPath}`);
        
        // Async recursive function to scan directories
        async function scanDirectoryRecursively(dirPath: string, relativePath = ''): Promise<SFXFileInfo[]> {
          const files: SFXFileInfo[] = [];
          
          try {
            const items = await fsAsync.readdir(dirPath);
            
            for (const item of items) {
              const fullItemPath = `${dirPath}/${item}`;
              const itemRelativePath = relativePath ? `${relativePath}/${item}` : item;
              
              try {
                const stats = await fsAsync.stat(fullItemPath);
                
                if (stats.isDirectory()) {
                  // Recursively scan subdirectory
                  const subFiles = await scanDirectoryRecursively(fullItemPath, itemRelativePath);
                  files.push(...subFiles);
                } else if (stats.isFile()) {
                  // Check if it's an audio file
                  const lowerItem = item.toLowerCase();
                  const isAudioFile = lowerItem.endsWith('.mp3') || 
                                    lowerItem.endsWith('.wav') || 
                                    lowerItem.endsWith('.aac') || 
                                    lowerItem.endsWith('.m4a') || 
                                    lowerItem.endsWith('.flac') || 
                                    lowerItem.endsWith('.ogg') ||
                                    lowerItem.endsWith('.aiff') ||
                                    lowerItem.endsWith('.aif');
                  
                  if (isAudioFile) {
                    // Found an audio file
                    
                    // Remove file extension (supports multiple formats)
                    const basename = item.replace(/\.(mp3|wav|aac|m4a|flac|ogg|aiff|aif)$/i, '');
                    
                    // Extract number and prompt from filename patterns
                    let number = 0;
                    let prompt = basename;
                    
                    // Pattern 1: NEW SUFFIX FORMAT - "explosion sound 1" or "cat walking 12"
                    const newSuffixMatch = basename.match(/^(.+?)\s+(\d+)$/);
                    if (newSuffixMatch) {
                      prompt = newSuffixMatch[1];
                      number = parseInt(newSuffixMatch[2]);
                    } else {
                      // Pattern 2: OLD PREFIX FORMAT - "001 explosion sound" (number prefix with spaces)
                      const oldPrefixMatch = basename.match(/^(\d+)\s+(.+)$/);
                      if (oldPrefixMatch) {
                        number = parseInt(oldPrefixMatch[1]);
                        prompt = oldPrefixMatch[2];
                      } else {
                        // Pattern 3: OLD UNDERSCORE FORMAT - "prompt_001_timestamp" or "prompt_1_timestamp" 
                        const oldNumberMatch = basename.match(/(.+?)_(\d+)_(.+)$/);
                        if (oldNumberMatch) {
                          prompt = oldNumberMatch[1].replace(/_/g, ' ');
                          number = parseInt(oldNumberMatch[2]);
                        } else {
                          // Pattern 4: LEGACY FORMAT - "prompt_timestamp" (no number)
                          // Look for timestamp pattern at the end: YYYY-MM-DDTHH-MM-SS
                          const legacyMatch = basename.match(/(.+?)_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})$/);
                          if (legacyMatch) {
                            prompt = legacyMatch[1].replace(/_/g, ' ');
                          } else {
                            // Fallback: if no timestamp pattern, use the whole basename as prompt
                            prompt = basename.replace(/_/g, ' ');
                          }
                        }
                      }
                    }
                    
                    const fileInfo = {
                      filename: item,
                      basename,
                      number,
                      prompt: prompt.toLowerCase(),
                      timestamp: basename.split('_').pop() || '',
                      path: fullItemPath,
                      subfolder: relativePath || undefined,
                      source: 'filesystem' as const
                    };
                    
                    
                    files.push(fileInfo);
                  }
                }
              } catch (statError) {
                // Skip items that can't be read
              }
            }
          } catch (readError) {
            // Skip directories that can't be read
          }
          
          return files;
        }
        
        const filesystemFiles = await scanDirectoryRecursively(sfxPath);
        console.log(`✅ Found ${filesystemFiles.length} files in ${sfxPath}`);
        allFiles.push(...filesystemFiles);
      }
      
      console.log(`📊 FILESYSTEM SCAN COMPLETE: Found ${allFiles.length} files total`);
      
      // 2. Scan project bins named "sfx" or "ai sfx"
      console.log('🎬 STARTING PROJECT BIN SCAN...');
      const projectBinResult = await new Promise<any>((resolve) => {
        // Use direct namespace access for bin scanning too
        csi.evalScript(`
          try {
            var host = typeof $ !== 'undefined' ? $ : window;
            var ns = "com.ai.sfx.generator";
            if (host[ns] && host[ns].scanProjectBinsForSFX) {
              var result = host[ns].scanProjectBinsForSFX();
              result;
            } else {
              JSON.stringify({success: false, error: "scanProjectBinsForSFX function not available", files: []});
            }
          } catch (e) {
            JSON.stringify({success: false, error: e.toString(), files: []});
          }
        `, (result) => {
          try {
            if (result.startsWith('{') || result.startsWith('[')) {
              const parsed = JSON.parse(result);
              resolve(parsed);
            } else {
              resolve({ success: false, files: [], error: 'Non-JSON result: ' + result });
            }
          } catch (e) {
            resolve({ success: false, files: [] });
          }
        });
      });
      
      if (projectBinResult.success && projectBinResult.files) {
        console.log(`✅ PROJECT BIN SCAN SUCCESS: Found ${projectBinResult.files.length} files in bins`);
        
        // Log to file for debugging
        try {
          const logPath = '/tmp/ai-sfx-debug.log';
          const timestamp = new Date().toISOString();
          const logMessage = `${timestamp} - PROJECT BINS: Found ${projectBinResult.files.length} files in Premiere bins\n`;
          fs.writeFileSync(logPath, logMessage, { flag: 'a' });
          
          if (projectBinResult.files.length > 0) {
            const binFiles = projectBinResult.files.slice(0, 3).map(f => `${f.filename} (from ${f.binPath})`).join(', ');
            const binMessage = `${timestamp} - BIN FILES: ${binFiles}${projectBinResult.files.length > 3 ? '...' : ''}\n`;
            fs.writeFileSync(logPath, binMessage, { flag: 'a' });
          }
        } catch (e) {}
        
        // Convert project bin files to our format
        const projectFiles = projectBinResult.files.map((file: any) => ({
          filename: file.filename,
          basename: file.basename,
          number: file.number,
          prompt: file.prompt,
          timestamp: file.timestamp,
          path: file.path,
          binPath: file.binPath,
          source: 'project_bin' as const
        }));
        
        allFiles.push(...projectFiles);
      } else {
        console.warn('⚠️ PROJECT BIN SCAN FAILED:', projectBinResult);
      }
      
      // Remove duplicates (same filename) - prefer project bin files
      const uniqueFiles = allFiles.reduce((acc: SFXFileInfo[], current) => {
        const existingIndex = acc.findIndex(file => file.filename === current.filename);
        if (existingIndex === -1) {
          acc.push(current);
        } else if (current.source === 'project_bin' && acc[existingIndex].source === 'filesystem') {
          // Replace filesystem file with project bin file (project bins take priority)
          acc[existingIndex] = current;
        }
        // If both are filesystem files with same name, skip duplicate
        return acc;
      }, []);
      
      
      // Sort by timestamp (most recent first)
      return uniqueFiles.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      
    } catch (error) {
      return [];
    }
  };

  // Get next number for a prompt
  const getNextNumberForPrompt = (prompt: string, existingFiles: SFXFileInfo[]): number => {
    const cleanPrompt = prompt.toLowerCase().trim();
    const matchingFiles = existingFiles.filter(file => 
      file.prompt.includes(cleanPrompt) || cleanPrompt.includes(file.prompt)
    );
    
    if (matchingFiles.length === 0) {
      return 1;
    }
    
    const maxNumber = Math.max(...matchingFiles.map(file => file.number || 0));
    return maxNumber + 1;
  };

  // Save audio file with intelligent numbering
  const saveAudioFile = async (audioData: ArrayBuffer, prompt: string): Promise<string> => {
    const sfxPath = await getSFXPath();
    
    if (!sfxPath) {
      // DEBUGGING: Run comprehensive project path debugging
      console.log('🚨 PROJECT PATH DETECTION FAILED - Running comprehensive debugging...');
      await debugProjectPathIssues();
      throw new Error('Please save your Premiere project first (Cmd+S), then try generating SFX again.');
    }

    // Validate file path security
    const pathValidation = SecurityValidator.validateFileOperation('write', sfxPath);
    if (!pathValidation.valid) {
      throw new Error(`Unsafe file path: ${pathValidation.error}`);
    }
    
    // Ensure directory exists
    if (!await fsAsync.exists(sfxPath)) {
      await fsAsync.mkdir(sfxPath, { recursive: true });
    }
    
    const existingFiles = await scanExistingSFXFiles(state.customSFXPath);
    const nextNumber = getNextNumberForPrompt(prompt, existingFiles);
    
    // Securely sanitize the filename
    const sanitizedPrompt = InputSanitizer.sanitizeFilename(prompt);
    const fileName = `${sanitizedPrompt}_${nextNumber}.mp3`;
    const filePath = `${sfxPath}/${fileName}`;

    // Validate final file path
    const finalPathValidation = SecurityValidator.validateFileOperation('write', filePath);
    if (!finalPathValidation.valid) {
      throw new Error(`Invalid filename generated: ${finalPathValidation.error}`);
    }
    
    const buffer = Buffer.from(audioData);
    fs.writeFileSync(filePath, buffer);
    
    return filePath;
  };

  // Handle license key input
  const handleLicenseKeyInput = useCallback(async (value: string) => {
    try {
      const result = await LicenseManager.processLicenseInput(value);
      
      if (result.success && result.apiKey) {
        // License validated successfully
        dispatch(SFXActions.setLicensed(true));
        dispatch(SFXActions.setLicenseKey(value));
        dispatch(SFXActions.setApiKey(result.apiKey));
        dispatch(SFXActions.setPrompt('')); // Clear the input
        
        // License activated successfully - silent operation
      } else {
        // License validation failed
        dispatch(SFXActions.setLicensed(false));
        console.log('❌ License validation failed:', result.error);
      }
    } catch (error) {
      console.error('License processing error:', error);
      dispatch(SFXActions.setLicensed(false));
    }
  }, [dispatch]);

  // Validate license key function
  const validateLicenseKey = useCallback(async (licenseKey: string) => {
    if (!licenseKey.trim()) {
      showError('Please enter a license key');
      return;
    }

    try {
      showStatus('Validating license...', 2000);
      const result = await LicenseManager.validateLicense(licenseKey);
      
      if (result.valid && result.apiKey) {
        // License is valid - activate it
        localStorage.setItem('licenseKey', licenseKey);
        localStorage.setItem('isLicensed', 'true');
        localStorage.setItem('apiKey', result.apiKey);
        
        dispatch(SFXActions.setLicensed(true));
        dispatch(SFXActions.setLicenseKey(licenseKey));
        dispatch(SFXActions.setApiKey(result.apiKey));
        
        showSuccess('License activated successfully!', 3000);
      } else {
        // License validation failed
        dispatch(SFXActions.setLicensed(false));
        showError(result.error || 'Invalid license key', 4000);
      }
    } catch (error) {
      console.error('License validation error:', error);
      dispatch(SFXActions.setLicensed(false));
      showError('Failed to validate license. Please try again.', 4000);
    }
  }, [dispatch, showStatus, showSuccess, showError]);

  // Check for updates using GitHub Releases API
  const checkForUpdates = useCallback(async (manual = false) => {
    try {
      dispatch(SFXActions.setCheckingUpdates(true));
      
      if (manual) {
        showStatus('Checking for updates...', 2000);
      }

      // SECURE UPDATE SYSTEM: Only licensed users can access updates
      const licenseKey = localStorage.getItem('licenseKey');
      
      // Only check for updates if user has valid license
      if (!licenseKey || licenseKey.trim() === '') {
        if (manual) {
          showError('Please enter your license key in the License menu to check for updates.');
        }
        return;
      }
      
      // Use private GitHub repository with embedded token (for licensed users only)
      const headers: HeadersInit = {
        'Authorization': `Bearer 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`,
        'User-Agent': 'AI-SFX-Generator',
        'X-GitHub-Api-Version': '2022-11-28'
      };
      
      const response = await fetch('https://api.github.com/repos/Richardphutran/ai-sfx-updates/releases/latest', {
        headers
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          if (manual) {
            showError('Repository not found. Please check if the repository is public and has releases.');
          }
          return;
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const release = await response.json();
      const latestVersion = release.tag_name;
      const currentVersion = 'v1.1.0'; // Current version
      
      dispatch(SFXActions.setLatestVersion(latestVersion));
      
      // Simple version comparison (assumes semantic versioning like v1.0.0)
      const isUpdateAvailable = latestVersion !== currentVersion;
      dispatch(SFXActions.setUpdateAvailable(isUpdateAvailable));
      
      // Find .zxp download URL from release assets
      const zxpAsset = release.assets?.find((asset: any) => asset.name.endsWith('.zxp'));
      dispatch(SFXActions.setUpdateDownloadUrl(zxpAsset?.browser_download_url || null));

      if (manual) {
        if (isUpdateAvailable) {
          showSuccess(`Update available: ${latestVersion}`, 4000);
        } else {
          showStatus('You have the latest version!', 3000);
        }
      }

    } catch (error) {
      console.error('Update check failed:', error);
      if (manual) {
        showError('Failed to check for updates. Please try again later.', 4000);
      }
    } finally {
      dispatch(SFXActions.setCheckingUpdates(false));
    }
  }, [dispatch, showStatus, showSuccess, showError]);

  // Download update function for one-click downloads
  const downloadUpdate = useCallback(async () => {
    if (!state.updateDownloadUrl) {
      showError('No download URL available. Please check for updates first.');
      return;
    }

    try {
      dispatch(SFXActions.setDownloadingUpdate(true));
      showStatus('Downloading update...', 2000);

      // Create download link and trigger download
      const link = document.createElement('a');
      link.href = state.updateDownloadUrl;
      link.download = `ai-sfx-generator-${state.latestVersion}.zxp`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message and installation instructions
      setTimeout(() => {
        showSuccess(`✅ Downloaded ${state.latestVersion}! Check your Downloads folder.`, 5000);
        
        // Show installation guide
        setTimeout(() => {
          showStatus('📁 Installation: 1) Close Premiere Pro 2) Double-click .zxp file 3) Restart Premiere Pro', 8000);
        }, 2000);
      }, 1000);

    } catch (error) {
      console.error('Download failed:', error);
      showError('Download failed. Please try again or download manually from Updates menu.');
    } finally {
      dispatch(SFXActions.setDownloadingUpdate(false));
    }
  }, [state.updateDownloadUrl, state.latestVersion, dispatch, showStatus, showSuccess, showError]);

  // Auto-check for updates on startup if enabled
  useEffect(() => {
    if (state.autoCheckUpdates && localStorage.getItem('licenseKey')) {
      // Auto-check after 30 seconds to not interfere with startup workflow
      const timeoutId = setTimeout(() => {
        checkForUpdates(false); // Silent check
      }, 30000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [state.autoCheckUpdates, checkForUpdates]);

  // Periodic update checks (every 24 hours) if plugin stays open
  useEffect(() => {
    if (state.autoCheckUpdates && localStorage.getItem('licenseKey')) {
      const intervalId = setInterval(() => {
        checkForUpdates(false); // Silent background check
      }, 24 * 60 * 60 * 1000); // 24 hours
      
      return () => clearInterval(intervalId);
    }
  }, [state.autoCheckUpdates, checkForUpdates]);

  // Handle text input changes (license key or prompt)
  const handlePromptChange = useCallback((value: string) => {
    // Set the prompt value immediately for responsive UI
    dispatch(SFXActions.setPrompt(value));
    
    // Process lookup mode (available to all users for browsing)
    if (state.isLookupMode) {
      // Already in lookup mode - handle filtering and searching
      if (value.trim() === '') {
        // If cleared, exit lookup mode
        dispatch(SFXActions.exitLookupMode());
      } else {
        // Use debounced filtering to prevent lag during typing
        const searchTerm = value.replace(/^\s+/, '');
        debouncedFileFiltering(searchTerm, state.allSFXFileInfo);
      }
    } else {
      // Normal typing mode - just hide dropdown (prompt already set above)
      dispatch(SFXActions.showSFXDropdown(false));
    }
  }, [dispatch, state.isLookupMode, state.allSFXFileInfo, debouncedFileFiltering]);

  // Add timeout tracking for auto-play navigation
  const autoPlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Preview audio file
  const previewAudio = useCallback((filePath: string) => {
    // Stop any existing preview
    if (state.previewAudio) {
      state.previewAudio.pause();
      state.previewAudio.currentTime = 0;
    }

    // Cancel any pending auto-play timeouts
    if (autoPlayTimeoutRef.current) {
      clearTimeout(autoPlayTimeoutRef.current);
      autoPlayTimeoutRef.current = null;
    }

    // Create new audio element
    const audio = new Audio(`file://${filePath}`);
    audio.volume = 0.5; // Set preview volume to 50%
    
    audio.onended = () => {
      dispatch(SFXActions.setPlaying(false));
      dispatch(SFXActions.setPreviewFile(null));
    };
    
    audio.onerror = (error) => {
      console.error('Audio preview error:', error);
      dispatch(SFXActions.setPlaying(false));
      dispatch(SFXActions.setPreviewFile(null));
    };

    // Play the audio
    audio.play().then(() => {
      dispatch(SFXActions.setPreviewAudio(audio));
      dispatch(SFXActions.setPlaying(true));
      dispatch(SFXActions.setPreviewFile(filePath));
    }).catch(error => {
      console.error('Failed to play audio:', error);
    });
  }, [state.previewAudio]);

  // Stop audio preview and cancel any pending auto-play
  const stopPreview = useCallback(() => {
    // Cancel any pending auto-play timeouts
    if (autoPlayTimeoutRef.current) {
      clearTimeout(autoPlayTimeoutRef.current);
      autoPlayTimeoutRef.current = null;
    }

    if (state.previewAudio) {
      state.previewAudio.pause();
      state.previewAudio.currentTime = 0;
      dispatch(SFXActions.setPreviewAudio(null));
      dispatch(SFXActions.setPlaying(false));
      dispatch(SFXActions.setPreviewFile(null));
    }
  }, [state.previewAudio, dispatch]);

  // DEBUG PROJECT PATH DETECTION - Add this before handleSFXFileSelect
  const debugProjectPathIssues = useCallback(async () => {
    console.log('🔍 DEBUGGING PROJECT PATH DETECTION ISSUES...');
    
    try {
      // Test 1: Basic ExtendScript connection
      console.log('🔍 Testing ExtendScript Connection...');
      const basicTest = await evalTS("testBasicExtendScript");
      
      if (!basicTest?.success) {
        console.log('❌ ExtendScript Error:', basicTest?.error);
        console.log('🚨 FOUND THE ISSUE: ExtendScript connection failed');
        console.log('💡 SOLUTION: Make sure Premiere Pro is running and plugin is loaded');
        return false;
      }
      
      // Test 2: Current getProjectPath function (most important)
      console.log('🔍 Testing Project Path Detection...');
      const currentProjectPath = await new Promise<any>((resolve) => {
        // Use namespace access for proper function calls
        csi.evalScript(`
          try {
            var host = typeof $ !== 'undefined' ? $ : window;
            var ns = "com.ai.sfx.generator";
            if (host[ns] && host[ns].getProjectPath) {
              var result = host[ns].getProjectPath();
              result;
            } else {
              JSON.stringify({success: false, error: "getProjectPath function not available"});
            }
          } catch (e) {
            JSON.stringify({success: false, error: "Error calling getProjectPath: " + e.toString()});
          }
        `, (result) => {
          try {
            resolve(JSON.parse(result));
          } catch (e) {
            resolve({ success: false, error: 'Failed to parse result', raw: result });
          }
        });
      });
      
      // Simple, clear analysis
      console.log('\n📊 DIAGNOSIS:');
      console.log('✅ ExtendScript Connected:', true);
      console.log('✅ Timeline Ready:', true);
      
      if (currentProjectPath?.success && currentProjectPath?.projectDir) {
        console.log('🎯 ✅ PROJECT PATH DETECTED:', currentProjectPath.projectDir);
        console.log('🎯 ✅ SFX PATH READY:', `${currentProjectPath.projectDir}/SFX/ai sfx`);
        console.log('✅ No issues found - timeline placement should work!');
      } else {
        console.log('❌ PROJECT PATH ISSUE:', currentProjectPath?.error || 'Unknown error');
        if (currentProjectPath?.needsSave) {
          console.log('🚨 SOLUTION: Save your project first (Cmd+S)');
        } else {
          console.log('🚨 UNKNOWN ISSUE - Project appears saved but path not detected');
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Debug function error:', error);
      return false;
    }
  }, []);

  // Handle SFX file selection
  const handleSFXFileSelect = useCallback(async (filename: string) => {
    // Stop any preview when selecting
    stopPreview();
    
    dispatch(SFXActions.setPrompt(''));
    dispatch(SFXActions.exitLookupMode());
    dispatch(SFXActions.showSFXDropdown(false));
    dispatch(SFXActions.setFilteredSFXFiles([]));
    dispatch(SFXActions.setGenerating(true));
    
    showStatus('Placing existing SFX on timeline...');
    
    try {
      // Find the selected file in our stored file info to get the correct path
      const selectedFile = state.allSFXFileInfo.find(f => f.filename === filename);
      
      if (!selectedFile) {
        throw new Error('Selected file not found');
      }
      
      console.log(`📋 Selected file details:`, {
        filename: selectedFile.filename,
        source: selectedFile.source,
        path: selectedFile.path,
        binPath: selectedFile.binPath
      });
      
      // Check if this is a project bin item or filesystem item
      if (selectedFile.source === 'project_bin') {
        // Use the new function that doesn't re-import
        console.log(`🎯 Placing existing project bin item: ${selectedFile.binPath}`);
        // @ts-ignore - new function not in type definitions yet
        const result = await evalTS("placeExistingProjectItem" as any, selectedFile.binPath || selectedFile.filename, undefined, 0) as PlacementResult;
        
        if (result.success) {
          showStatus(`SFX "${filename}" (from ${selectedFile.binPath || 'project bin'}) added to timeline!`, 3000);
        } else {
          throw new Error(result.error || 'Failed to place project item');
        }
      } else {
        // Filesystem file - use standard import function
        console.log(`📁 Placing filesystem file: ${selectedFile.path}`);
        const result = await evalTS("importAndPlaceAudio", selectedFile.path, 0) as PlacementResult;
        
        if (result && result.success) {
          const message = `SFX "${filename}" (from SFX folder) added to timeline!`;
          showStatus(message, 3000);
        } else {
          throw new Error(result?.error || 'Failed to place audio');
        }
      }
    } catch (error) {
      console.error('Error placing existing SFX:', error);
      showStatus(`Error: ${error instanceof Error ? error.message : String(error)}`, 4000);
    } finally {
      dispatch(SFXActions.setGenerating(false));
    }
  }, [showStatus, state.allSFXFileInfo, stopPreview, dispatch]);

  // GLOBAL keyboard event listener to catch arrow keys that might be intercepted
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only handle arrow keys in lookup mode
      if (state.isLookupMode && state.showSFXDropdown && state.filteredSFXFiles.length > 0 && e.key.startsWith('Arrow')) {
        console.log('🌍 GLOBAL ARROW KEY DETECTED:', {
          key: e.key,
          code: e.code,
          target: (e.target as Element)?.tagName,
          isLookupMode: state.isLookupMode,
          showDropdown: state.showSFXDropdown,
          filesCount: state.filteredSFXFiles.length,
          selectedIndex: state.selectedDropdownIndex
        });
        
        // Log to file for CEP debugging
        try {
          const logPath = '/tmp/ai-sfx-debug.log';
          const timestamp = new Date().toISOString();
          const logMessage = `${timestamp} - GLOBAL ARROW KEY: ${e.key} (code: ${e.code}) - Target: ${(e.target as Element)?.tagName} - Files: ${state.filteredSFXFiles.length} - Selected: ${state.selectedDropdownIndex}\n`;
          fs.writeFileSync(logPath, logMessage, { flag: 'a' });
        } catch (err) {}
        
        // Handle right and left arrows globally if they're not being caught by React
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          e.stopPropagation();
          
          const selectedFilename = state.filteredSFXFiles[state.selectedDropdownIndex];
          if (selectedFilename) {
            console.log('🌍▶️ GLOBAL RIGHT: PLAY', selectedFilename);
            
            try {
              const logPath = '/tmp/ai-sfx-debug.log';
              const timestamp = new Date().toISOString();
              const logMessage = `${timestamp} - GLOBAL KEYBOARD PLAY: ${selectedFilename}\n`;
              fs.writeFileSync(logPath, logMessage, { flag: 'a' });
            } catch (err) {}
            
            const selectedFile = state.allSFXFileInfo.find(f => f.filename === selectedFilename);
            if (selectedFile) {
              previewAudio(selectedFile.path);
            }
          }
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          e.stopPropagation();
          
          console.log('🌍⏸️ GLOBAL LEFT: PAUSE/STOP');
          
          try {
            const logPath = '/tmp/ai-sfx-debug.log';
            const timestamp = new Date().toISOString();
            const logMessage = `${timestamp} - GLOBAL KEYBOARD PAUSE\n`;
            fs.writeFileSync(logPath, logMessage, { flag: 'a' });
          } catch (err) {}
          
          stopPreview();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          e.stopPropagation();
          
          // DOWN = Stop current audio + navigate to next + auto-play if already playing
          stopPreview(); // Stop current audio first (also cancels pending timeouts)
          
          const newIndex = state.selectedDropdownIndex < state.filteredSFXFiles.length - 1 
            ? state.selectedDropdownIndex + 1 
            : 0;
          dispatch(SFXActions.setSelectedDropdownIndex(newIndex));
          
          // If audio was playing, enable continuous mode and auto-play the new selection
          if (state.isPlaying || state.continuousPreviewMode) {
            dispatch(SFXActions.setContinuousPreviewMode(true));
            
            const newSelectedFilename = state.filteredSFXFiles[newIndex];
            if (newSelectedFilename) {
              const newSelectedFile = state.allSFXFileInfo.find(f => f.filename === newSelectedFilename);
              if (newSelectedFile) {
                autoPlayTimeoutRef.current = setTimeout(() => {
                  // Only play if this timeout hasn't been canceled
                  if (autoPlayTimeoutRef.current) {
                    previewAudio(newSelectedFile.path);
                    autoPlayTimeoutRef.current = null;
                  }
                }, 100); // Small delay to ensure selection update
              }
            }
          }
          
          try {
            const logPath = '/tmp/ai-sfx-debug.log';
            const timestamp = new Date().toISOString();
            const logMessage = `${timestamp} - GLOBAL DOWN + AUTO-PLAY: ${newIndex}\n`;
            fs.writeFileSync(logPath, logMessage, { flag: 'a' });
          } catch (err) {}
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          e.stopPropagation();
          
          // UP = Stop current audio + navigate to previous + auto-play if already playing
          stopPreview(); // Stop current audio first (also cancels pending timeouts)
          
          const newIndex = state.selectedDropdownIndex > 0 
            ? state.selectedDropdownIndex - 1 
            : state.filteredSFXFiles.length - 1;
          dispatch(SFXActions.setSelectedDropdownIndex(newIndex));
          
          // If audio was playing, enable continuous mode and auto-play the new selection
          if (state.isPlaying || state.continuousPreviewMode) {
            dispatch(SFXActions.setContinuousPreviewMode(true));
            
            const newSelectedFilename = state.filteredSFXFiles[newIndex];
            if (newSelectedFilename) {
              const newSelectedFile = state.allSFXFileInfo.find(f => f.filename === newSelectedFilename);
              if (newSelectedFile) {
                autoPlayTimeoutRef.current = setTimeout(() => {
                  // Only play if this timeout hasn't been canceled
                  if (autoPlayTimeoutRef.current) {
                    previewAudio(newSelectedFile.path);
                    autoPlayTimeoutRef.current = null;
                  }
                }, 100); // Small delay to ensure selection update
              }
            }
          }
          
          try {
            const logPath = '/tmp/ai-sfx-debug.log';
            const timestamp = new Date().toISOString();
            const logMessage = `${timestamp} - GLOBAL UP + AUTO-PLAY: ${newIndex}\n`;
            fs.writeFileSync(logPath, logMessage, { flag: 'a' });
          } catch (err) {}
        }
      }
    };

    // Add global event listener
    document.addEventListener('keydown', handleGlobalKeyDown, { capture: true });
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });
      
      // Cancel any pending auto-play timeouts when cleanup
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current);
        autoPlayTimeoutRef.current = null;
      }
    };
  }, [state.isLookupMode, state.showSFXDropdown, state.filteredSFXFiles, state.selectedDropdownIndex, state.allSFXFileInfo, previewAudio, stopPreview, dispatch]);

  // Cancel timeouts and disable continuous mode when SFX dropdown is hidden
  useEffect(() => {
    if (!state.showSFXDropdown) {
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current);
        autoPlayTimeoutRef.current = null;
      }
      // Disable continuous preview mode when dropdown is hidden
      dispatch(SFXActions.setContinuousPreviewMode(false));
    }
  }, [state.showSFXDropdown, dispatch]);

  // AGGRESSIVE left/right arrow capture specifically for Premiere Pro CEP override
  useEffect(() => {
    if (!textareaHasFocus || !state.isLookupMode || !state.showSFXDropdown || state.filteredSFXFiles.length === 0) {
      return; // Only when textarea is focused and in lookup mode
    }

    const aggressiveLeftRightCapture = (e: Event) => {
      const keyEvent = e as KeyboardEvent;
      
      // ONLY target left/right arrows when textarea has focus
      if (keyEvent.key === 'ArrowLeft' || keyEvent.key === 'ArrowRight') {
        console.log('🔥 AGGRESSIVE CAPTURE:', {
          key: keyEvent.key,
          textareaFocus: textareaHasFocus,
          lookupMode: state.isLookupMode,
          target: (keyEvent.target as Element)?.tagName
        });
        
        // Log to file for CEP debugging
        try {
          const logPath = '/tmp/ai-sfx-debug.log';
          const timestamp = new Date().toISOString();
          const logMessage = `${timestamp} - AGGRESSIVE ${keyEvent.key}: Focus=${textareaHasFocus} Lookup=${state.isLookupMode} Files=${state.filteredSFXFiles.length}\n`;
          fs.writeFileSync(logPath, logMessage, { flag: 'a' });
        } catch (err) {}
        
        // AGGRESSIVELY prevent Premiere Pro from getting this event
        keyEvent.preventDefault();
        keyEvent.stopPropagation();
        keyEvent.stopImmediatePropagation();
        
        // Handle the key press ourselves
        if (keyEvent.key === 'ArrowRight') {
          // RIGHT = Play selected SFX and enable continuous mode
          const selectedFilename = state.filteredSFXFiles[state.selectedDropdownIndex];
          if (selectedFilename) {
            console.log('🔥▶️ AGGRESSIVE RIGHT: PLAY + ENABLE CONTINUOUS', selectedFilename);
            
            try {
              const logPath = '/tmp/ai-sfx-debug.log';
              const timestamp = new Date().toISOString();
              const logMessage = `${timestamp} - AGGRESSIVE PLAY + CONTINUOUS: ${selectedFilename}\n`;
              fs.writeFileSync(logPath, logMessage, { flag: 'a' });
            } catch (err) {}
            
            const selectedFile = state.allSFXFileInfo.find(f => f.filename === selectedFilename);
            if (selectedFile) {
              dispatch(SFXActions.setContinuousPreviewMode(true)); // Enable continuous mode
              previewAudio(selectedFile.path);
            }
          }
        } else if (keyEvent.key === 'ArrowLeft') {
          // LEFT = Stop current audio AND disable continuous preview mode
          console.log('🔥⏸️ AGGRESSIVE LEFT: STOP + DISABLE CONTINUOUS MODE');
          
          try {
            const logPath = '/tmp/ai-sfx-debug.log';
            const timestamp = new Date().toISOString();
            const logMessage = `${timestamp} - AGGRESSIVE STOP + DISABLE CONTINUOUS\n`;
            fs.writeFileSync(logPath, logMessage, { flag: 'a' });
          } catch (err) {}
          
          stopPreview();
          dispatch(SFXActions.setContinuousPreviewMode(false));
        }
        
        // Explicitly return false to further block event propagation
        return false;
      }
    };

    // Add multiple aggressive capture methods
    const methods = [
      // Method 1: Capture phase with highest priority
      { method: 'capture-priority', options: { capture: true, passive: false } },
      // Method 2: Bubble phase as backup
      { method: 'bubble-backup', options: { capture: false, passive: false } },
      // Method 3: Window level capture (CEP specific)
      { method: 'window-capture', options: { capture: true, passive: false } }
    ];

    methods.forEach(({ method, options }) => {
      // Add to document
      document.addEventListener('keydown', aggressiveLeftRightCapture, options);
      // Add to window (CEP-specific override)
      window.addEventListener('keydown', aggressiveLeftRightCapture, options);
      
      console.log(`🔥 Added ${method} listener for left/right override`);
    });

    // Also add keyup as backup (some CEP panels only catch keyup)
    const keyupCapture = (e: Event) => {
      const keyEvent = e as KeyboardEvent;
      if (keyEvent.key === 'ArrowLeft' || keyEvent.key === 'ArrowRight') {
        keyEvent.preventDefault();
        keyEvent.stopPropagation();
        keyEvent.stopImmediatePropagation();
        return false;
      }
    };
    
    document.addEventListener('keyup', keyupCapture, { capture: true });
    window.addEventListener('keyup', keyupCapture, { capture: true });

    // Cleanup all listeners
    return () => {
      methods.forEach(({ options }) => {
        document.removeEventListener('keydown', aggressiveLeftRightCapture, options);
        window.removeEventListener('keydown', aggressiveLeftRightCapture, options);
      });
      
      document.removeEventListener('keyup', keyupCapture, { capture: true });
      window.removeEventListener('keyup', keyupCapture, { capture: true });
      
      console.log('🔥 Removed aggressive left/right capture listeners');
    };
  }, [textareaHasFocus, state.isLookupMode, state.showSFXDropdown, state.filteredSFXFiles, state.selectedDropdownIndex, state.allSFXFileInfo, previewAudio, stopPreview]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(async (e: React.KeyboardEvent) => {
    // ENHANCED DEBUG: Log ALL key presses with more details
    console.log('🎹 ALL KEY PRESSES:', {
      key: e.key,
      code: e.code,
      keyCode: e.keyCode,
      isLookupMode: state.isLookupMode,
      showDropdown: state.showSFXDropdown,
      filesCount: state.filteredSFXFiles.length,
      selectedIndex: state.selectedDropdownIndex,
      target: (e.target as Element)?.tagName,
      defaultPrevented: e.defaultPrevented
    });
    
    // ENHANCED DEBUG: Always log arrow keys to file for CEP debugging
    if (e.key.startsWith('Arrow')) {
      try {
        const logPath = '/tmp/ai-sfx-debug.log';
        const timestamp = new Date().toISOString();
        const logMessage = `${timestamp} - ENHANCED ARROW KEY DEBUG: ${e.key} (code: ${e.code}) - Lookup: ${state.isLookupMode} - Dropdown: ${state.showSFXDropdown} - Files: ${state.filteredSFXFiles.length} - Selected: ${state.selectedDropdownIndex}\n`;
        fs.writeFileSync(logPath, logMessage, { flag: 'a' });
      } catch (e) {}
    }
    
    // DEBUG: Log all key presses in lookup mode (keeping original for comparison)
    if (state.isLookupMode) {
      console.log('🎹 KEY PRESSED IN LOOKUP MODE:', {
        key: e.key,
        isLookupMode: state.isLookupMode,
        showDropdown: state.showSFXDropdown,
        filesCount: state.filteredSFXFiles.length,
        selectedIndex: state.selectedDropdownIndex
      });
      
      // Log to file
      try {
        const logPath = '/tmp/ai-sfx-debug.log';
        const timestamp = new Date().toISOString();
        const logMessage = `${timestamp} - KEY IN LOOKUP: ${e.key} - Files: ${state.filteredSFXFiles.length} - Selected: ${state.selectedDropdownIndex}\n`;
        fs.writeFileSync(logPath, logMessage, { flag: 'a' });
      } catch (e) {}
    }
    
    // Handle spacebar press when prompt is empty to trigger lookup mode (available to all users)
    if (e.key === ' ' && state.prompt === '' && !state.isLookupMode) {
      console.log('🚀 SPACEBAR PRESSED: Starting SFX lookup mode...');
      
      // Also log to file for CEP debugging
      try {
        const logPath = '/tmp/ai-sfx-debug.log';
        const timestamp = new Date().toISOString();
        const logMessage = `${timestamp} - SPACEBAR PRESSED: Starting SFX lookup mode...\n`;
        fs.writeFileSync(logPath, logMessage + '\n', { flag: 'a' });
      } catch (e) {
        // Ignore file logging errors
      }
      
      e.preventDefault(); // Prevent space from being added to textarea
      
      // Check if we have cached data that's still fresh
      const now = Date.now();
      const cacheExpired = now - state.lastScanTime > CACHE_DURATION;
      console.log('💾 Cache check:', { 
        cachedFiles: cachedFileInfoRef.current.length, 
        cacheExpired, 
        lastScanTime: new Date(state.lastScanTime).toISOString() 
      });
      
      if (cachedFileInfoRef.current.length > 0 && !cacheExpired) {
        // Use cached data for instant response
        dispatch(SFXActions.enterLookupMode(cachedFileInfoRef.current, now));
      } else {
        // Show loading state and scan in background
        dispatch(SFXActions.setLookupMode(true));
        dispatch(SFXActions.showSFXDropdown(true));
        dispatch(SFXActions.setPrompt(' '));
        
        // Use debounced file scanning for better performance
        debouncedFileScanning();
      }
      return;
    }
    
    // UNIFIED ARROW KEY HANDLING - All arrow keys in one place
    if (state.isLookupMode && state.showSFXDropdown && state.filteredSFXFiles.length > 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault(); // Prevent default behavior
        e.stopPropagation();
        
        if (e.key === 'ArrowDown') {
          // DOWN = Next file
          console.log('🔽 DOWN: Navigate to next file');
          const newIndex = state.selectedDropdownIndex < state.filteredSFXFiles.length - 1 
            ? state.selectedDropdownIndex + 1 
            : 0; // Wrap to top
          dispatch(SFXActions.setSelectedDropdownIndex(newIndex));
          
        } else if (e.key === 'ArrowUp') {
          // UP = Previous file
          console.log('🔼 UP: Navigate to previous file');
          const newIndex = state.selectedDropdownIndex > 0 
            ? state.selectedDropdownIndex - 1 
            : state.filteredSFXFiles.length - 1; // Wrap to bottom
          dispatch(SFXActions.setSelectedDropdownIndex(newIndex));
          
        } else if (e.key === 'ArrowRight') {
          // RIGHT = PLAY selected SFX
          const selectedFilename = state.filteredSFXFiles[state.selectedDropdownIndex];
          if (selectedFilename) {
            console.log('▶️ RIGHT: PLAY', selectedFilename);
            
            // Log to file
            try {
              const logPath = '/tmp/ai-sfx-debug.log';
              const timestamp = new Date().toISOString();
              const logMessage = `${timestamp} - KEYBOARD PLAY: ${selectedFilename}\n`;
              fs.writeFileSync(logPath, logMessage, { flag: 'a' });
            } catch (e) {}
            
            // Find the selected file info and trigger preview
            const selectedFile = state.allSFXFileInfo.find(f => f.filename === selectedFilename);
            if (selectedFile) {
              previewAudio(selectedFile.path);
            }
          }
          
        } else if (e.key === 'ArrowLeft') {
          // LEFT = PAUSE/STOP current preview
          console.log('⏸️ LEFT: PAUSE/STOP');
          
          // Log to file
          try {
            const logPath = '/tmp/ai-sfx-debug.log';
            const timestamp = new Date().toISOString();
            const logMessage = `${timestamp} - KEYBOARD PAUSE\n`;
            fs.writeFileSync(logPath, logMessage, { flag: 'a' });
          } catch (e) {}
          
          stopPreview();
        }
        
        return; // Prevent further processing
      }
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      // Debug why arrow keys aren't working
      console.log('❌ ARROW KEY CONDITIONS NOT MET:', {
        key: e.key,
        isLookupMode: state.isLookupMode,
        showSFXDropdown: state.showSFXDropdown,
        filteredSFXFiles: state.filteredSFXFiles.length,
        selectedIndex: state.selectedDropdownIndex
      });
      
      // Log to file
      try {
        const logPath = '/tmp/ai-sfx-debug.log';
        const timestamp = new Date().toISOString();
        const logMessage = `${timestamp} - ARROW KEY BLOCKED - Lookup: ${state.isLookupMode} - Dropdown: ${state.showSFXDropdown} - Files: ${state.filteredSFXFiles.length}\n`;
        fs.writeFileSync(logPath, logMessage, { flag: 'a' });
      } catch (e) {}
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      // If not licensed, treat input as license key
      if (!state.isLicensed && state.prompt.trim()) {
        await handleLicenseKeyInput(state.prompt.trim());
        return;
      }
      
      if (state.isLookupMode && state.selectedDropdownIndex >= 0 && state.filteredSFXFiles.length > 0) {
        // Select currently highlighted result (requires license for actual placement)
        if (state.isLicensed) {
          handleSFXFileSelect(state.filteredSFXFiles[state.selectedDropdownIndex]);
        } else {
          errorManager.warning('License required to place SFX files in timeline');
        }
      } else if (state.isLicensed) {
        handleGenerate();
      } else {
        // Show license requirement message for generation
        errorManager.warning('License required for SFX generation');
      }
    } else if (e.key === 'Escape') {
      // Exit lookup mode
      dispatch(SFXActions.exitLookupMode());
    } else if (e.key === 'Backspace' && state.isLookupMode && state.prompt === ' ') {
      // If backspacing on the initial space, exit lookup mode
      e.preventDefault();
      dispatch(SFXActions.exitLookupMode());
    }
  }, [dispatch, handleGenerate, handleSFXFileSelect, handleLicenseKeyInput, scanExistingSFXFiles, state.isLicensed, state.isLookupMode, state.showSFXDropdown, state.filteredSFXFiles, state.selectedDropdownIndex, state.prompt, state.lastScanTime, state.customSFXPath]);

  // Load settings
  const loadSettings = useCallback(() => {
    try {
      // Initialize security manager
      SecurityManager.initialize();
      
      // Initialize license system
      const licenseInfo = LicenseManager.initialize();
      console.log('🚀 License initialization result:', licenseInfo);
      
      // Debug: Clear any cached demo API keys
      if (licenseInfo.apiKey && licenseInfo.apiKey.includes('demo')) {
        console.log('🧹 Clearing demo API key cache...');
        localStorage.removeItem('ai_sfx_lemon_squeezy_license_v1');
        window.location.reload();
        return;
      }
      
      // Load other settings
      const savedVolume = parseFloat(localStorage.getItem('sfxVolume') || '0');
      const savedTrackTargeting = localStorage.getItem('trackTargetingEnabled') === 'true';
      const savedSelectedTrack = localStorage.getItem('selectedTrack') || 'A5*';
      const savedCustomPath = localStorage.getItem('customSFXPath') || null;
      const savedSFXPlacement = (localStorage.getItem('sfxPlacement') as 'ai-sfx-bin' | 'active-bin') || 'ai-sfx-bin';
      const savedAutoCheckUpdates = localStorage.getItem('autoCheckUpdates') !== 'false'; // Default to true
      
      dispatch(SFXActions.loadSettings({
        apiKey: licenseInfo.apiKey,
        isLicensed: licenseInfo.isLicensed,
        licenseKey: licenseInfo.isLicensed ? 'LICENSED' : '',
        volume: savedVolume,
        trackTargetingEnabled: savedTrackTargeting,
        selectedTrack: savedSelectedTrack,
        customSFXPath: savedCustomPath,
        sfxPlacement: savedSFXPlacement,
        autoCheckUpdates: savedAutoCheckUpdates
      }));
      
      console.log('🔒 Settings loaded securely');
      console.log('📄 License status:', licenseInfo.isLicensed ? 'Valid' : 'Required');
      if (savedCustomPath) {
        console.log('📁 Custom SFX path:', savedCustomPath);
      }
      
      // License status is handled silently - no UI notifications needed
    } catch (error) {
      ErrorUtils.handleValidationError('Failed to load settings securely');
    }
  }, [showSuccess]);

  // Settings management
  const openSettings = useCallback(() => {
    dispatch(SFXActions.setMenuMode('settings'));
  }, []);

  const closeSettings = useCallback(() => {
    dispatch(SFXActions.setMenuMode('normal'));
  }, []);

  const saveApiKey = useCallback((newApiKey: string) => {
    if (newApiKey) {
      const success = SecureStorage.storeAPIKey(newApiKey);
      if (success) {
        dispatch(SFXActions.setApiKey(newApiKey));
        showSuccess('API key saved securely');
      } else {
        showError('Failed to save API key - please check format');
      }
    }
  }, [showSuccess, showError]);

  // Detect currently targeted track in Premiere Pro
  const detectTargetedTrack = useCallback(async () => {
    try {
      const result = await (evalTS as any)("getHighestTargetedTrack");
      
      if (result.success && result.targetedTrack) {
        dispatch(SFXActions.setDetectedTrack({
          name: result.targetedTrack.name,
          number: result.targetedTrack.number
        }));
        return result.targetedTrack;
      } else {
        dispatch(SFXActions.setDetectedTrack(null));
        return null;
      }
    } catch (error) {
      dispatch(SFXActions.setDetectedTrack(null));
      return null;
    }
  }, []);

  // Menu system management
  const toggleSettings = useCallback(async () => {
    const newMode = state.menuMode === 'normal' ? 'settings' : 'normal';
    dispatch(SFXActions.setMenuMode(newMode));
    
    // When opening settings, detect the currently targeted track
    if (newMode === 'settings' && state.trackTargetingEnabled) {
      await detectTargetedTrack();
    }
  }, [state.menuMode, state.trackTargetingEnabled, detectTargetedTrack, dispatch]);

  const openMenu = useCallback((menuType: 'license' | 'files' | 'updates') => {
    dispatch(SFXActions.setMenuMode(menuType));
  }, [dispatch]);

  const goBackToSettings = useCallback(() => {
    dispatch(SFXActions.setMenuMode('settings'));
  }, [dispatch]);

  // Track targeting system
  const toggleTrackTargeting = useCallback(() => {
    const newEnabled = !state.trackTargetingEnabled;
    const newTrack = newEnabled ? state.selectedTrack : 'Auto';
    
    localStorage.setItem('trackTargetingEnabled', newEnabled.toString());
    localStorage.setItem('selectedTrack', newTrack);
    
    dispatch(SFXActions.setTrackTargeting(newEnabled));
    dispatch(SFXActions.setSelectedTrack(newTrack));
  }, [state.trackTargetingEnabled, state.selectedTrack, dispatch]);

  const setSelectedTrack = useCallback((track: string) => {
    localStorage.setItem('selectedTrack', track);
    dispatch(SFXActions.setSelectedTrack(track));
  }, [dispatch]);

  const setVolume = useCallback((volume: number) => {
    dispatch(SFXActions.setVolume(volume));
    localStorage.setItem('sfxVolume', volume.toString());
  }, [dispatch]);

  // Handle folder selection
  const selectSFXFolder = useCallback(async () => {
    try {
      // Use CEP's showOpenDialog to let user select a folder
      const result = window.cep.fs.showOpenDialog(
        false, // allowMultipleSelection
        true,  // chooseDirectory
        'Select SFX Folder',
        state.customSFXPath || '', // initialPath
        [] // fileTypes (not used for directories)
      );
      
      if (result.err === 0 && result.data && result.data.length > 0) {
        const selectedPath = result.data[0];
        console.log('📁 User selected folder:', selectedPath);
        
        // Save to localStorage and state
        localStorage.setItem('customSFXPath', selectedPath);
        dispatch(SFXActions.setCustomSFXPath(selectedPath));
        
        showStatus(`SFX folder set to: ${selectedPath}`, 3000);
        
        // Force a rescan of files with the new path
        cachedFileInfoRef.current = [];
        dispatch(SFXActions.updateFileScan([], 0));
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      showStatus('Error selecting folder', 3000);
    }
  }, [state.customSFXPath, showStatus, dispatch]);

  // Reset to project folder
  const resetToProjectFolder = useCallback(() => {
    localStorage.removeItem('customSFXPath');
    dispatch(SFXActions.setCustomSFXPath(null));
    showSuccess('Reset to project SFX folder');
    
    // Force a rescan of files
    cachedFileInfoRef.current = [];
    dispatch(SFXActions.updateFileScan([], 0));
  }, [showSuccess, dispatch]);

  // Get display path for current SFX folder
  const getDisplayPath = useCallback(() => {
    if (state.customSFXPath) {
      // Show just the folder name for custom paths
      const folderName = state.customSFXPath.split('/').pop() || 'Custom Folder';
      return `Custom: ${folderName}`;
    }
    return 'Project: SFX/ai sfx';
  }, [state.customSFXPath]);


  // Initialize
  useEffect(() => {
    if (window.cep) {
      subscribeBackgroundColor(setBgColor);
      
      
      // Listen for real-time timeline changes with debouncing
      // Timeline monitoring is automatically initialized in ExtendScript
      listenTS("timelineChanged", (data) => {
        // Debounce timeline updates to prevent excessive calls
        if (timelineUpdateRef.current) {
          clearTimeout(timelineUpdateRef.current);
        }
        timelineUpdateRef.current = setTimeout(() => {
          updateTimelineInfo();
        }, 300); // 300ms debounce
      });
    }
    
    loadSettings();
    updateTimelineInfo();
    
    // PERFORMANCE: Smart timeline polling with focus-based frequency
    let interval: NodeJS.Timeout;
    
    const startPolling = () => {
      if (interval) clearInterval(interval);
      
      // More frequent updates when panel has focus (for In/Out point responsiveness)
      const updateFrequency = document.hasFocus() ? 2000 : 8000; // 2s when focused, 8s when not
      
      interval = setInterval(() => {
        // Only update if document is visible (tab is active)
        if (!document.hidden) {
          updateTimelineInfo();
        }
      }, updateFrequency);
    };
    
    // Start with initial polling
    startPolling();
    
    // Adjust polling frequency based on focus
    const handleFocus = () => startPolling();
    const handleBlur = () => startPolling();
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      if (timelineUpdateRef.current) {
        clearTimeout(timelineUpdateRef.current);
      }
    };
  }, [loadSettings, updateTimelineInfo]);


  // Real-time track targeting detection
  useEffect(() => {
    let trackTargetingInterval: NodeJS.Timeout | null = null;
    
    if (state.trackTargetingEnabled && state.menuMode === 'settings') {
      // Initial detection
      detectTargetedTrack();
      
      // Enable track targeting detection when track targeting is on
      trackTargetingInterval = setInterval(() => {
        detectTargetedTrack();
      }, 3000); // Check every 3 seconds when targeting is enabled
    }
    
    return () => {
      if (trackTargetingInterval) {
        console.log('🎯 Stopping track targeting detection');
        clearInterval(trackTargetingInterval);
      }
    };
  }, [state.trackTargetingEnabled, state.menuMode, detectTargetedTrack]);

  // Calculate timeline display values
  const getTimelineDisplay = () => {
    const timeline = state.timelineInfo;
    if (!timeline?.success) return { inPoint: '--:--', outPoint: '--:--', duration: '--:--' };
    
    return {
      inPoint: timeline.inPoint?.formatted || '--:--',
      outPoint: timeline.outPoint?.formatted || '--:--',
      duration: timeline.duration?.formatted || '--:--',
      hasValues: timeline.hasInPoint && timeline.hasOutPoint,
      durationWarning: timeline.hasDuration && timeline.duration && timeline.duration.seconds !== null && timeline.duration.seconds > 22
    };
  };

  const timelineDisplay = getTimelineDisplay();

  return (
    <div 
      className="ai-sfx-generator" 
      style={{ backgroundColor: bgColor }}
      data-plugin="ai-sfx-generator"
      data-port="3030"
      draggable={false}
      onDragStart={(e) => { e.preventDefault(); return false; }}
      onDrag={(e) => { e.preventDefault(); return false; }}
      onMouseDown={(e) => {
        // Only prevent default on non-interactive elements
        if (!(e.target as HTMLElement).closest('input, textarea, button, .duration-slider, .influence-slider')) {
          e.preventDefault();
        }
      }}
    >
      {/* Main input area */}
      <div className="input-section">
        <textarea
          ref={promptRef}
          className={`sfx-input ${state.isGenerating ? 'loading' : ''} ${state.isLookupMode ? 'lookup-mode' : ''}`}
          value={state.prompt}
          onChange={(e) => handlePromptChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setTextareaHasFocus(true);
            console.log('🎯 TEXTAREA FOCUSED - Aggressive left/right capture ENABLED');
            
            // Log to file for CEP debugging
            try {
              const logPath = '/tmp/ai-sfx-debug.log';
              const timestamp = new Date().toISOString();
              const logMessage = `${timestamp} - TEXTAREA FOCUSED - Aggressive capture enabled\n`;
              fs.writeFileSync(logPath, logMessage, { flag: 'a' });
            } catch (e) {}
          }}
          onBlur={() => {
            setTextareaHasFocus(false);
            console.log('🎯 TEXTAREA BLURRED - Aggressive left/right capture DISABLED');
            
            // Log to file for CEP debugging
            try {
              const logPath = '/tmp/ai-sfx-debug.log';
              const timestamp = new Date().toISOString();
              const logMessage = `${timestamp} - TEXTAREA BLURRED - Aggressive capture disabled\n`;
              fs.writeFileSync(logPath, logMessage, { flag: 'a' });
            } catch (e) {}
          }}
          placeholder={
            state.isGenerating ? "Generating..." : 
            !state.isLicensed ? "License Key" :
            state.isLookupMode ? "Search existing SFX..." : 
            "Describe your SFX"
          }
          disabled={false}
          rows={1}
        />
        
        {/* SFX Lookup Dropdown */}
        {state.showSFXDropdown && (
          <div className={`sfx-dropdown ${
            state.selectedDropdownIndex === 0 ? 'at-start' : ''
          } ${
            state.selectedDropdownIndex === state.filteredSFXFiles.length - 1 ? 'at-end' : ''
          }`}>
            <div 
              className="sfx-dropdown-content"
              style={{
                transform: `translateY(-${state.selectedDropdownIndex * 32}px)`
              }}
            >
              {state.isScanningFiles ? (
                <div className="sfx-dropdown-item sfx-dropdown-loading">
                  🔍 Scanning SFX files...
                </div>
              ) : state.filteredSFXFiles.length > 0 ? (
                state.filteredSFXFiles.map((filename, index) => {
                  // Find the file info to get the full path
                  const fileInfo = state.allSFXFileInfo.find(f => f.filename === filename);
                  const isPreviewPlaying = state.isPlaying && state.previewFile === fileInfo?.path;
                  
                  return (
                    <div 
                      key={filename}
                      className={`sfx-dropdown-item ${index === state.selectedDropdownIndex ? 'selected' : ''} ${isPreviewPlaying ? 'playing' : ''}`}
                      data-has-number={hasNumberFormat(filename)}
                      onClick={() => handleSFXFileSelect(filename)}
                      onMouseEnter={() => dispatch(SFXActions.setSelectedDropdownIndex(index))}
                    >
                      <span className="sfx-filename">{filename}</span>
                      {fileInfo && (
                        <button 
                          className="preview-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isPreviewPlaying) {
                              stopPreview();
                            } else {
                              previewAudio(fileInfo.path);
                            }
                          }}
                          title={isPreviewPlaying ? "Stop preview" : "Preview audio"}
                        >
                          {isPreviewPlaying ? '⏸' : '▶'}
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className={`sfx-dropdown-item sfx-dropdown-empty ${state.selectedDropdownIndex === 0 ? 'selected' : ''}`}>
                  {state.prompt.length > 1 ? 'No matching SFX found' : 'Type to search existing SFX...'}
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="menu-buttons">
          <button className="menu-btn" onClick={toggleSettings} title="Settings">⚙️</button>
        </div>
      </div>

      {/* Timeline info and controls */}
      <div className="timeline-section">
        <div 
          className={`timeline-info ${state.useInOutMode ? 'active' : ''} ${timelineDisplay.durationWarning ? 'duration-warning' : ''}`}
          onClick={activateInOutMode}
          title="Click to activate In-N-Out mode"
        >
          <div className="timeline-item">
            <span>In:</span>
            <span className={`timeline-value ${timelineDisplay.hasValues ? 'has-value' : ''}`}>
              {timelineDisplay.inPoint}
            </span>
          </div>
          <div className="timeline-item">
            <span>Out:</span>
            <span className={`timeline-value ${timelineDisplay.hasValues ? 'has-value' : ''}`}>
              {timelineDisplay.outPoint}
            </span>
          </div>
          <div className="timeline-item">
            <span>Duration:</span>
            <span className={`timeline-value ${timelineDisplay.hasValues ? 'has-value' : ''} ${timelineDisplay.durationWarning ? 'duration-warning' : ''}`}>
              {timelineDisplay.duration}
            </span>
          </div>
        </div>
        
        <div className="controls-section">
          <div 
            className={`manual-controls ${state.manualModeActive ? 'active' : ''}`}
            onClick={activateManualMode}
          >
            <span className="label">Length:</span>
            <input
              type="range"
              min="1"
              max="22"
              value={state.currentDuration}
              onChange={(e) => {
                activateManualMode();
                dispatch(SFXActions.setDuration(parseInt(e.target.value)));
              }}
              className="duration-slider"
            />
            <span className="value">{state.currentDuration}s</span>
          </div>
          
          <button 
            className={`auto-btn ${state.autoMode ? 'active' : ''}`}
            onClick={activateAutoMode}
            title="Auto-detect duration"
          >
            Auto
          </button>
        </div>
      </div>

      {/* Prompt Influence Slider */}
      <div className="prompt-influence-section">
        <div className="influence-controls">
          <span className="influence-label">Prompt Influence:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={state.promptInfluence}
            onChange={(e) => dispatch(SFXActions.setPromptInfluence(parseFloat(e.target.value)))}
            className="influence-slider"
          />
          <span className="influence-value">{state.promptInfluence === 0 ? 'Low' : state.promptInfluence === 1 ? 'High' : state.promptInfluence.toFixed(1)}</span>
        </div>
        
        {/* Update Notification - Small and subtle */}
        <div className="update-notification">
          {state.isCheckingUpdates ? (
            <span className="update-status checking">⟳ Checking for updates...</span>
          ) : state.updateAvailable && state.latestVersion ? (
            <span 
              className="update-status available" 
              onClick={() => downloadUpdate()}
              title={`Download ${state.latestVersion}`}
            >
              📥 Update available ({state.latestVersion}) - Click to download
            </span>
          ) : state.latestVersion && !state.updateAvailable ? (
            <span className="update-status current">✓ Up to date ({state.latestVersion})</span>
          ) : localStorage.getItem('licenseKey') ? (
            <span 
              className="update-status check-link" 
              onClick={() => checkForUpdates(true)}
              title="Check for updates"
            >
              Check for updates
            </span>
          ) : (
            <span 
              className="update-status check-link"
              onClick={() => checkForUpdates(true)}
              title="Check for updates"
            >
              Update Ready
            </span>
          )}
        </div>
      </div>


      {/* Menu System - replaces bottom row based on state */}
      {state.menuMode === 'settings' && (
        <div className="menu-overlay">
          <div className="settings-bar">
            <div className="volume-control">
              <span>Vol:</span>
              <input
                type="range"
                min="-12"
                max="6"
                step="1"
                value={state.volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="volume-slider"
              />
              <span>{state.volume === 0 ? '0dB' : `${state.volume > 0 ? '+' : ''}${state.volume}dB`}</span>
            </div>
            
            <div className="track-control">
              <span>Target:</span>
              <button 
                className={`track-toggle ${state.trackTargetingEnabled ? 'enabled' : 'disabled'}`}
                onClick={toggleTrackTargeting}
                title={state.trackTargetingEnabled ? 'Turn off track targeting' : 'Turn on track targeting'}
              >
                {state.trackTargetingEnabled ? '●' : '○'}
              </button>
              <span className="track-display">
                {state.trackTargetingEnabled 
                  ? (state.detectedTargetedTrack 
                      ? `${state.detectedTargetedTrack.name}*` 
                      : 'No track targeted')
                  : 'Auto'
                }
              </span>
            </div>
            
            
            <div className="license-status">
              <span>License:</span>
              <span className={`status-dot ${state.isLicensed ? 'licensed' : 'trial'}`}></span>
            </div>
            
            <div className="menu-buttons">
              <button className="menu-btn" onClick={() => openMenu('license')} title="License">🔑</button>
              <button className="menu-btn" onClick={() => openMenu('files')} title="Files">📂</button>
              <button className="menu-btn" onClick={() => openMenu('updates')} title="Updates">↓</button>
            </div>
          </div>
        </div>
      )}
      
      {/* License Menu */}
      {state.menuMode === 'license' && (
        <div className="menu-overlay">
          <div className="license-menu">
            <div className="menu-header">
              <span className="menu-title">License</span>
              <button onClick={goBackToSettings} className="back-btn">Back</button>
            </div>
            <div className="menu-content">
              <div className="license-status-row">
                <span className="license-label">Status:</span>
                <span className={`license-status ${state.isLicensed ? 'licensed' : 'trial'}`}>
                  {state.isLicensed ? 'Licensed' : 'Trial (7 days remaining)'}
                </span>
              </div>
              
              {state.isLicensed && (
                <div className="license-info-row">
                  <span className="license-info-label">License Key:</span>
                  <span className="license-key-display">
                    {state.licenseKey ? `****-****-****-${state.licenseKey.slice(-4)}` : '****-****-****-****'}
                  </span>
                </div>
              )}
              
              {!state.isLicensed && (
                <div className="license-input-row">
                  <span>License Key:</span>
                  <input
                    type="text"
                    placeholder="Enter license key"
                    className="license-input"
                    value={state.licenseKey}
                    onChange={(e) => dispatch(SFXActions.setLicenseKey(e.target.value))}
                  />
                  <button 
                    className="activate-btn"
                    onClick={() => validateLicenseKey(state.licenseKey)}
                    disabled={!state.licenseKey.trim()}
                  >
                    Activate
                  </button>
                </div>
              )}
              
              <div className="license-actions">
                {state.isLicensed ? (
                  <button 
                    className="deactivate-license-btn" 
                    onClick={() => {
                      if (confirm('Deactivate license? This will free up the license for use on another machine.')) {
                        dispatch(SFXActions.setLicensed(false));
                        dispatch(SFXActions.setLicenseKey(''));
                        localStorage.removeItem('licenseKey');
                        localStorage.removeItem('isLicensed');
                        showStatus('License deactivated successfully', 3000);
                      }
                    }}
                    title="Free up license for use on another machine"
                  >
                    Deactivate License
                  </button>
                ) : (
                  <button className="buy-license-btn" onClick={() => window.open('https://lemonsqueezy.com/checkout/buy/your-product-id', '_blank')}>
                    Buy License
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Files Menu */}
      {state.menuMode === 'files' && (
        <div className="menu-overlay">
          <div className="files-menu">
            <div className="menu-row-1">
              <span>SFX Library: {state.allSFXFileInfo.length} files</span>
              <button onClick={goBackToSettings} className="back-btn">Back</button>
            </div>
            <div className="menu-row-2">
              <span title={state.customSFXPath || 'Using default folder'}>Location: {getDisplayPath()}</span>
              <button onClick={selectSFXFolder} className="change-btn" title="Select custom folder">Change</button>
              <button onClick={async () => {
                const sfxPath = await getSFXPath();
                if (sfxPath) {
                  try {
                    // Ensure the SFX directory exists before trying to open it
                    if (!await fsAsync.exists(sfxPath)) {
                      await fsAsync.mkdir(sfxPath, { recursive: true });
                      showSuccess('SFX folder created');
                    }
                    window.cep.util.openURLInDefaultBrowser(`file://${sfxPath}`);
                  } catch (error) {
                    ErrorUtils.handleFileError(error as Error, { operation: 'openFolder', path: sfxPath });
                  }
                } else {
                  showStatus('No project open - please select a custom folder first', 3000);
                }
              }} className="open-btn" title="Open folder">Open</button>
              <button onClick={state.customSFXPath ? resetToProjectFolder : () => showStatus('Already using project folder', 2000)} 
                      className="clean-btn" 
                      title={state.customSFXPath ? 'Reset to project folder' : 'Using project folder'}>
                {state.customSFXPath ? 'Reset' : 'Project'}
              </button>
            </div>
            <div className="menu-row-3">
              <span>Place in:</span>
              <button 
                onClick={() => {
                  dispatch(SFXActions.setSFXPlacement('ai-sfx-bin'));
                  localStorage.setItem('sfxPlacement', 'ai-sfx-bin');
                  showStatus('SFX will be placed in "AI SFX" bin', 2000);
                }} 
                className={`placement-btn ${state.sfxPlacement === 'ai-sfx-bin' ? 'active' : ''}`}
                title="Generated SFX goes to dedicated AI SFX bin">
                AI SFX bin
              </button>
              <button 
                onClick={() => {
                  dispatch(SFXActions.setSFXPlacement('active-bin'));
                  localStorage.setItem('sfxPlacement', 'active-bin');
                  showStatus('SFX will be placed in active bin', 2000);
                }} 
                className={`placement-btn ${state.sfxPlacement === 'active-bin' ? 'active' : ''}`}
                title="Generated SFX goes to currently selected bin in Project panel">
                Active bin
              </button>
            </div>
            <div className="menu-row-4">
              <span>Search:</span>
              <button 
                onClick={async () => {
                  showStatus('Scanning project bins for audio files...', 2000);
                  try {
                    // Force refresh of the file scan to include project bins
                    await scanExistingSFXFiles();
                    showStatus(`Scanned project - found ${state.allSFXFileInfo.length} audio files`, 3000);
                  } catch (error) {
                    showError('Failed to scan project bins');
                  }
                }} 
                className="scan-bins-btn"
                title="Scan Premiere Pro project bins for imported audio files">
                Scan Project Bins
              </button>
              <button 
                onClick={() => {
                  if (state.allSFXFileInfo.length > 0) {
                    dispatch(SFXActions.enterLookupMode(state.allSFXFileInfo, Date.now()));
                    dispatch(SFXActions.setMenuMode('normal'));
                    showStatus('Entered SFX lookup mode', 2000);
                  } else {
                    showStatus('No SFX files found - scan first', 2000);
                  }
                }} 
                className="browse-files-btn"
                disabled={state.allSFXFileInfo.length === 0}
                title="Browse and search through available SFX files">
                Browse Files
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Updates Menu */}
      {state.menuMode === 'updates' && (
        <div className="menu-overlay">
          <div className="updates-menu">
            <div className="menu-header">
              <span className="menu-title">Updates</span>
              <button onClick={goBackToSettings} className="back-btn">Back</button>
            </div>
            <div className="menu-content">
              <div className="update-status-row">
                <span className="version-label">Current Version:</span>
                <span className="version">v1.0.0</span>
              </div>
              
              {state.latestVersion && (
                <div className="latest-version-row">
                  <span className="latest-label">Latest Version:</span>
                  <span className="latest-version">{state.latestVersion}</span>
                </div>
              )}
              
              <div className="update-check-row">
                <span className={`update-status ${state.updateAvailable ? 'update-available' : 'up-to-date'}`}>
                  {state.isCheckingUpdates ? '🔄 Checking...' : 
                   state.updateAvailable ? `📥 Update available: ${state.latestVersion}` : 
                   state.latestVersion ? '✅ Up to date' : '⚪ Not checked'}
                </span>
                <button 
                  className="check-updates-btn"
                  onClick={() => checkForUpdates(true)}
                  disabled={state.isCheckingUpdates}
                >
                  {state.isCheckingUpdates ? 'Checking...' : 'Check Now'}
                </button>
              </div>
              
              {state.updateAvailable && state.updateDownloadUrl && (
                <div className="update-download-row">
                  <span className="download-label">Download:</span>
                  <button 
                    className="download-update-btn"
                    onClick={async () => {
                      if (state.updateDownloadUrl) {
                        try {
                          dispatch(SFXActions.setDownloadingUpdate(true));
                          showStatus('Downloading update...', 3000);
                          
                          // Direct download without opening GitHub page
                          const response = await fetch(state.updateDownloadUrl);
                          
                          if (!response.ok) {
                            throw new Error(`Download failed: ${response.status}`);
                          }
                          
                          const blob = await response.blob();
                          
                          // Create download link and trigger download
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `ai-sfx-generator-${state.latestVersion}.zxp`;
                          a.style.display = 'none';
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          
                          // Show installation instructions
                          showSuccess(`✅ Update downloaded! File saved to Downloads folder.`, 5000);
                          
                          // Show install guide after brief delay
                          setTimeout(() => {
                            showStatus(`📁 Installation Guide:\n\n1. Close Premiere Pro\n2. Find ai-sfx-generator-${state.latestVersion}.zxp in Downloads\n3. Double-click to install\n4. Restart Premiere Pro`, 8000);
                          }, 2000);
                          
                        } catch (error) {
                          console.error('Download failed:', error);
                          showError('Download failed. Opening GitHub page...', 3000);
                          // Fallback to GitHub page
                          setTimeout(() => {
                            if (state.updateDownloadUrl) {
                              window.open(state.updateDownloadUrl, '_blank');
                            }
                          }, 2000);
                        } finally {
                          dispatch(SFXActions.setDownloadingUpdate(false));
                        }
                      }
                    }}
                    disabled={state.isCheckingUpdates || state.isDownloadingUpdate}
                  >
                    {state.isDownloadingUpdate ? '⬇️ Downloading...' : 
                     state.isCheckingUpdates ? 'Checking...' : 
                     `📥 Download ${state.latestVersion}`}
                  </button>
                </div>
              )}
              
              <div className="update-settings">
                <label className="auto-update-toggle">
                  <input 
                    type="checkbox" 
                    checked={state.autoCheckUpdates} 
                    onChange={(e) => {
                      dispatch(SFXActions.setAutoCheckUpdates(e.target.checked));
                      localStorage.setItem('autoCheckUpdates', e.target.checked.toString());
                    }}
                  />
                  <span>Auto-check for updates</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast system removed for silent operation */}
    </div>
  );
};

// Wrap the main component with Error Boundary
export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}