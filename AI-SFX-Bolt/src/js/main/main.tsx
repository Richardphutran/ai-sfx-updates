import { useEffect, useState, useCallback, useRef } from "react";
import { evalTS, subscribeBackgroundColor, listenTS, csi } from "../lib/utils/bolt";
import CSInterface from "../lib/cep/csinterface";
import { fs } from "../lib/cep/node";
import type { TimelineInfo, PlacementResult } from "../../shared/universals";
import { bridgeClient } from "../lib/bridge-client";
import "./main.scss";

interface SFXState {
  prompt: string;
  isGenerating: boolean;
  currentDuration: number;
  useInOutMode: boolean;
  manualModeActive: boolean;
  autoMode: boolean;
  timelineInfo: TimelineInfo | null;
  apiKey: string;
  showSettings: boolean;
  isLookupMode: boolean;
  existingSFXFiles: string[];
  allSFXFileInfo: SFXFileInfo[]; // Store full file info for path resolution
  filteredSFXFiles: string[];
  showSFXDropdown: boolean;
  selectedDropdownIndex: number;
  promptInfluence: number;
  lastScanTime: number; // Track when we last scanned
  isScanningFiles: boolean; // Show loading state
  // Menu system state
  menuMode: 'normal' | 'settings' | 'api' | 'help' | 'files' | 'folder' | 'batch';
  // Track targeting system
  trackTargetingEnabled: boolean;
  selectedTrack: string;
  availableTracks: string[];
  volume: number;
  // Auto-detected targeted track from Premiere
  detectedTargetedTrack: { name: string; number: number } | null;
  // Custom SFX folder path
  customSFXPath: string | null;
  // Preview system
  previewAudio: HTMLAudioElement | null;
  isPlaying: boolean;
  previewFile: string | null;
  // Batch processing
  batchMode: boolean;
  batchPrompts: string[];
  batchProgress: number;
  batchTotal: number;
  isBatchProcessing: boolean;
}

interface SFXFileInfo {
  filename: string;
  basename: string;
  number: number;
  prompt: string;
  timestamp: string;
  path: string;
  binPath?: string;
  subfolder?: string;
  source: 'filesystem' | 'project_bin';
}

export const App = () => {

  const [bgColor, setBgColor] = useState("#2a2a2a");
  const [state, setState] = useState<SFXState>({
    prompt: "",
    isGenerating: false,
    currentDuration: 10,
    useInOutMode: false,
    manualModeActive: false,
    autoMode: true,
    timelineInfo: null,
    apiKey: "",
    showSettings: false,
    isLookupMode: false,
    existingSFXFiles: [],
    allSFXFileInfo: [],
    filteredSFXFiles: [],
    showSFXDropdown: false,
    selectedDropdownIndex: -1,
    promptInfluence: 0.5,
    lastScanTime: 0,
    isScanningFiles: false,
    // Menu system state
    menuMode: 'normal',
    // Track targeting system  
    trackTargetingEnabled: true,
    selectedTrack: 'A5*',
    availableTracks: ['A1', 'A2', 'A3', 'A4', 'A5*', 'A6', 'A7'],
    volume: 0,
    detectedTargetedTrack: null,
    customSFXPath: null,
    // Preview system
    previewAudio: null,
    isPlaying: false,
    previewFile: null,
    // Batch processing
    batchMode: false,
    batchPrompts: [],
    batchProgress: 0,
    batchTotal: 0,
    isBatchProcessing: false
  });

  const promptRef = useRef<HTMLTextAreaElement>(null);
  const timelineUpdateRef = useRef<NodeJS.Timeout>();
  const cachedFileInfoRef = useRef<SFXFileInfo[]>([]);
  const CACHE_DURATION = 30000; // 30 seconds cache

  // Initialize bridge connection and console forwarding
  useEffect(() => {
    // Set up console forwarding to multi-plugin debugger
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleInfo = console.info;
    const originalConsoleDebug = console.debug;
    
    // Override console methods to forward to bridge
    console.log = function(...args) {
      const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
      if (bridgeClient.getStatus().connected) {
        bridgeClient.sendConsoleMessage('log', message, args.length > 1 ? args.slice(1) : undefined);
      }
      originalConsoleLog.apply(console, args);
    };
    
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
    
    // Connect to bridge
    bridgeClient.connect().then(connected => {
      if (connected) {
        console.log('✅ Bridge client connected successfully');
        console.log('🔊 AI SFX plugin ready for multi-plugin debugging');
        
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

    return () => {
      // Restore original console methods
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.info = originalConsoleInfo;
      console.debug = originalConsoleDebug;
      
      bridgeClient.disconnect();
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
  const showStatus = useCallback((message: string, duration = 0) => {
    // Status display for user feedback
  }, []);


  // Update timeline info (optimized with change detection)
  const updateTimelineInfo = useCallback(async () => {
    try {
      const timelineInfo = await evalTS("getSequenceInfo");
      setState(prev => {
        // Only update if the essential data changed (performance optimization)
        const prevHash = prev.timelineInfo ? 
          `${prev.timelineInfo.hasInPoint}-${prev.timelineInfo.hasOutPoint}-${prev.timelineInfo.sequenceName}` : '';
        const newHash = timelineInfo ? 
          `${timelineInfo.hasInPoint}-${timelineInfo.hasOutPoint}-${timelineInfo.sequenceName}` : '';
        
        if (prevHash !== newHash) {
          return { ...prev, timelineInfo };
        }
        return prev;
      });
    } catch (error) {
      // Timeline update failed
    }
  }, []);


  // Handle mode changes
  const activateInOutMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      useInOutMode: true,
      manualModeActive: false,
      autoMode: false
    }));
  }, []);

  const activateManualMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      useInOutMode: false,
      manualModeActive: true,
      autoMode: false
    }));
  }, []);

  const activateAutoMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      useInOutMode: false,
      manualModeActive: false,
      autoMode: true
    }));
  }, []);

  // Handle generation
  const handleGenerate = useCallback(async () => {
    console.log('🎬 handleGenerate called with prompt:', `"${state.prompt}"`, 'isGenerating:', state.isGenerating);
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

    if (!state.apiKey) {
      console.log('❌ No API key found - stopping generation');
      showStatus('Please set your API key first', 3000);
      return;
    }
    
    console.log('✅ API key found, continuing with generation...');

    // Store the prompt before starting generation
    const promptToGenerate = state.prompt.trim();
    
    setState(prev => ({ ...prev, isGenerating: true }));
    showStatus('Detecting timeline...');

    try {
      // Get current timeline info and capture playhead position immediately
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
          setState(prev => ({ ...prev, isGenerating: false }));
          return;
        } else if (timelineDuration > 0) {
          duration = Math.min(timelineDuration, 22);
          placementPosition = inPointSeconds;
          showStatus(`Using in/out points: ${timelineInfo.inPoint?.formatted} to ${timelineInfo.outPoint?.formatted} (${duration.toFixed(1)}s)`, 2000);
        } else {
          showStatus('Invalid timeline selection. Please set valid in/out points.', 3000);
          setState(prev => ({ ...prev, isGenerating: false }));
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
      
      showStatus('Generating SFX...');
      
      // Generate audio using Eleven Labs API
      const audioData = await generateSFX(promptToGenerate, duration, state.apiKey, state.promptInfluence);
      
      showStatus('Placing on timeline...');
      
      // Save audio file
      const filePath = await saveAudioFile(audioData, promptToGenerate);
      
      
      // Place audio on timeline with enhanced error handling
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
        if (placementPosition !== null) {
          result = await evalTS("importAndPlaceAudioAtTime", filePath, placementPosition, targetTrackIndex);
        } else {
          result = await evalTS("importAndPlaceAudioAtTime", filePath, currentPlayheadPosition, targetTrackIndex);
        }
        
        
        
        
        // Enhanced error reporting
        if (!result || !result.success) {
          showStatus('Trying alternative placement...');
          
          // Fallback: Try with captured playhead position and same target track
          const fallbackResult = await evalTS("importAndPlaceAudioAtTime", filePath, currentPlayheadPosition, targetTrackIndex);
          
          if (fallbackResult && fallbackResult.success) {
            result = fallbackResult;
          } else {
            throw new Error(result?.error || 'Timeline placement failed completely');
          }
        }
      } catch (placementError) {
        // Last resort: Show user where file was saved
        showStatus(`SFX saved to ${filePath}. Please manually drag to timeline.`, 5000);
        throw new Error(`Timeline placement failed: ${placementError instanceof Error ? placementError.message : String(placementError)}`);
      }
      
      if (result.success) {
        // Only clear the prompt that was actually generated, not the current one
        setState(prev => {
          // If user hasn't typed anything new, clear the prompt
          if (prev.prompt.trim() === promptToGenerate) {
            return { ...prev, prompt: "" };
          }
          // Otherwise keep their new prompt intact
          return prev;
        });
        
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
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  }, [state, showStatus]);

  // Generate SFX using Eleven Labs API with retry logic
  const generateSFX = async (prompt: string, duration: number, apiKey: string, promptInfluence: number): Promise<ArrayBuffer> => {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        attempt++;
        console.log(`🎵 API attempt ${attempt}/${maxRetries} for: "${prompt}"`);
        
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
            throw new Error(`API request failed after ${maxRetries} attempts: ${response.status} - ${errorText}`);
          }
        } else {
          // Non-retryable error (4xx except 429)
          const error = await response.text();
          throw new Error(`API request failed: ${response.status} - ${error}`);
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

  // Get SFX folder path
  const getSFXPath = async (): Promise<string | null> => {
    // First check for custom path
    if (state.customSFXPath) {
      return state.customSFXPath;
    }
    
    try {
      // Get project directory from ExtendScript
      const result = await new Promise<any>((resolve) => {
        csi.evalScript('getProjectPath()', (result) => {
          try {
            resolve(JSON.parse(result));
          } catch (e) {
            resolve({ success: false, error: 'Failed to parse result' });
          }
        });
      });
      
      if (result.success && result.projectDir) {
        // Return project folder > SFX > ai sfx path
        return `${result.projectDir}/SFX/ai sfx`;
      } else {
        // Fallback to desktop path
        const userPath = window.cep_node.global.process.env.HOME || window.cep_node.global.process.env.USERPROFILE;
        return `${userPath}/Desktop/SFX AI`;
      }
    } catch (error) {
      // Fallback to desktop path
      const userPath = window.cep_node.global.process.env.HOME || window.cep_node.global.process.env.USERPROFILE;
      return `${userPath}/Desktop/SFX AI`;
    }
  };

  // Scan existing SFX files from both filesystem and project bins
  const scanExistingSFXFiles = async (customPath?: string | null): Promise<SFXFileInfo[]> => {
    const allFiles: SFXFileInfo[] = [];
    const pathToUse = customPath !== undefined ? customPath : state.customSFXPath;
    
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
      if (pathToUse && fs.existsSync(pathToUse)) {
        console.log(`📁 Scanning custom SFX folder: ${pathToUse}`);
        foldersToScan.push(pathToUse);
      }
      
      // Also scan default locations for backward compatibility
      if (projectPath.success && projectPath.projectDir) {
        // ONLY scan the exact paths where we save files
        // 1. Primary location: Project/SFX/ai sfx
        const primaryPath = `${projectPath.projectDir}/SFX/ai sfx`;
        if (fs.existsSync(primaryPath) && primaryPath !== pathToUse) {
          foldersToScan.push(primaryPath);
        }
        
        // 2. Also scan Project/SFX folder (parent of ai sfx) for manually added files
        const projectSFXPath = `${projectPath.projectDir}/SFX`;
        if (fs.existsSync(projectSFXPath) && projectSFXPath !== pathToUse) {
          console.log(`🎯 Found project SFX folder: ${projectSFXPath}`);
          foldersToScan.push(projectSFXPath);
          
          // Add immediate subfolders of SFX (but not recursive to avoid deep scanning)
          try {
            const items = fs.readdirSync(projectSFXPath);
            for (const item of items) {
              if (item.startsWith('.')) continue;
              const subPath = `${projectSFXPath}/${item}`;
              if (fs.statSync(subPath).isDirectory() && subPath !== pathToUse) {
                foldersToScan.push(subPath);
              }
            }
          } catch (e) {
            // Skip subfolders that can't be read
          }
        }
      } else if (!pathToUse) {
        // Project not saved and no custom path - check fallback Desktop location
        const userPath = window.cep_node.global.process.env.HOME || window.cep_node.global.process.env.USERPROFILE;
        const fallbackPath = `${userPath}/Desktop/SFX AI`;
        
        if (fs.existsSync(fallbackPath)) {
          foldersToScan.push(fallbackPath);
        }
      }
      
      // Remove duplicates
      const uniqueFolders = [...new Set(foldersToScan)];
      
      
      // Scan each folder recursively
      for (const sfxPath of uniqueFolders) {
        
        // Recursive function to scan directories
        function scanDirectoryRecursively(dirPath: string, relativePath = ''): SFXFileInfo[] {
          const files: SFXFileInfo[] = [];
          
          try {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
              const fullItemPath = `${dirPath}/${item}`;
              const itemRelativePath = relativePath ? `${relativePath}/${item}` : item;
              
              try {
                const stats = fs.statSync(fullItemPath);
                
                if (stats.isDirectory()) {
                  // Recursively scan subdirectory
                  const subFiles = scanDirectoryRecursively(fullItemPath, itemRelativePath);
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
        
        const filesystemFiles = scanDirectoryRecursively(sfxPath);
        allFiles.push(...filesystemFiles);
      }
      
      
      // 2. Scan project bins named "sfx" or "ai sfx"
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
      throw new Error('Could not determine SFX folder path');
    }
    
    // Ensure directory exists
    if (!fs.existsSync(sfxPath)) {
      fs.mkdirSync(sfxPath, { recursive: true });
    }
    
    const existingFiles = await scanExistingSFXFiles(state.customSFXPath);
    const nextNumber = getNextNumberForPrompt(prompt, existingFiles);
    
    // NEW: Use numbered suffix naming convention: "explosion sound 1.mp3" (single digit unless multi-digit)
    const cleanPrompt = prompt.slice(0, 30).replace(/[^a-zA-Z0-9 ]/g, '').trim();
    const fileName = `${cleanPrompt} ${nextNumber}.mp3`;
    const filePath = `${sfxPath}/${fileName}`;
    
    
    const buffer = Buffer.from(audioData);
    fs.writeFileSync(filePath, buffer);
    
    return filePath;
  };

  // Handle text input changes
  const handlePromptChange = useCallback((value: string) => {
    console.log('📝 Input changed to:', `"${value}"`, 'length:', value.length, 'isLookupMode:', state.isLookupMode); // Debug log
    
    if (state.isLookupMode) {
      // Already in lookup mode - handle filtering and searching
      if (value.trim() === '') {
        // If cleared, exit lookup mode
        setState(prev => ({ 
          ...prev, 
          isLookupMode: false, 
          showSFXDropdown: false,
          filteredSFXFiles: [],
          selectedDropdownIndex: -1,
          prompt: ''
        }));
      } else {
        // Filter files based on search term (excluding the initial space)
        const searchTerm = value.replace(/^\s+/, '').toLowerCase();
        
        console.log(`🔍 Searching for: "${searchTerm}" in ${state.allSFXFileInfo.length} files`);
        
        // Enhanced parsing: Check if search term ends with a number (e.g., "explosion 3")
        const searchMatch = searchTerm.match(/^(.+?)\s+(\d+)$/);
        const hasPromptAndNumber = searchMatch !== null;
        const searchPrompt = hasPromptAndNumber ? searchMatch[1].trim() : '';
        const searchNumber = hasPromptAndNumber ? parseInt(searchMatch[2]) : 0;
        
        // Filter existing files using the full file info
        const filteredFileInfo = state.allSFXFileInfo.filter(file => {
          // Check if search term is ONLY a number (for numbered file retrieval)
          const isNumberOnlySearch = /^\d+$/.test(searchTerm);
          
          if (hasPromptAndNumber) {
            // Smart search: "explosion 3" finds exactly the 3rd explosion
            const normalizedPrompt = file.prompt.toLowerCase().replace(/_/g, ' ');
            const promptMatches = normalizedPrompt.includes(searchPrompt) || searchPrompt.includes(normalizedPrompt);
            const numberMatches = file.number === searchNumber;
            
            const isMatch = promptMatches && numberMatches;
            if (isMatch) {
              console.log(`🎯 Smart match: "${file.filename}" for search "${searchTerm}" (prompt: "${file.prompt}", number: ${file.number})`);
            }
            return isMatch;
          } else if (isNumberOnlySearch) {
            // Search by number suffix: if user types "1" or "12", match files ending with those numbers
            const searchNum = parseInt(searchTerm);
            const fileNumber = file.number || 0;
            
            // Match if the file number equals the search number, or if filename ends with " number.extension"
            const numberMatch = fileNumber === searchNum || 
                               file.filename.match(new RegExp(`\\s${searchTerm}\\.[a-zA-Z0-9]+$`));
            
            if (numberMatch) {
              console.log(`🔢 Number match found: ${file.filename} (file number: ${fileNumber}, search: ${searchTerm})`);
            }
            
            return numberMatch;
          } else {
            // Text search in both the prompt and filename, handling underscores as spaces
            const normalizedPrompt = file.prompt.replace(/_/g, ' ');
            const normalizedBasename = file.basename.replace(/_/g, ' ');
            const normalizedFilename = file.filename.replace(/_/g, ' ');
            
            // Also normalize search term to handle underscores
            const normalizedSearchTerm = searchTerm.replace(/_/g, ' ');
            
            const searchableText = `${normalizedPrompt} ${normalizedBasename} ${normalizedFilename}`.toLowerCase();
            const matches = searchableText.includes(normalizedSearchTerm) || 
                           searchableText.includes(searchTerm); // Also try original search term
            
            if (matches) {
              console.log(`✅ Text match found: ${file.filename} (prompt: "${file.prompt}", basename: "${file.basename}", display: "${formatFileDisplayName(file.filename)}")`);
            }
            
            return matches;
          }
        });
        
        console.log(`📊 Found ${filteredFileInfo.length} matches for "${searchTerm}"`);
        
        // Keep the full filename (with extension) for display
        const filteredNames = filteredFileInfo.map(f => f.filename);
        
        console.log(`🎯 Setting filtered files to: ${filteredNames.length} items`, filteredNames);
        setState(prev => ({ 
          ...prev, 
          prompt: value,
          filteredSFXFiles: filteredNames,
          selectedDropdownIndex: filteredNames.length > 0 ? 0 : -1,
          showSFXDropdown: true // Ensure dropdown stays visible
        }));
      }
    } else {
      // Normal typing mode - just update prompt for generation
      setState(prev => ({ 
        ...prev, 
        prompt: value,
        showSFXDropdown: false
      }));
    }
  }, [state.isLookupMode, state.allSFXFileInfo]);

  // Preview audio file
  const previewAudio = useCallback((filePath: string) => {
    // Stop any existing preview
    if (state.previewAudio) {
      state.previewAudio.pause();
      state.previewAudio.currentTime = 0;
    }

    // Create new audio element
    const audio = new Audio(`file://${filePath}`);
    audio.volume = 0.5; // Set preview volume to 50%
    
    audio.onended = () => {
      setState(prev => ({ ...prev, isPlaying: false, previewFile: null }));
    };
    
    audio.onerror = (error) => {
      console.error('Audio preview error:', error);
      setState(prev => ({ ...prev, isPlaying: false, previewFile: null }));
    };

    // Play the audio
    audio.play().then(() => {
      setState(prev => ({ 
        ...prev, 
        previewAudio: audio, 
        isPlaying: true, 
        previewFile: filePath 
      }));
    }).catch(error => {
      console.error('Failed to play audio:', error);
    });
  }, [state.previewAudio]);

  // Stop audio preview
  const stopPreview = useCallback(() => {
    if (state.previewAudio) {
      state.previewAudio.pause();
      state.previewAudio.currentTime = 0;
      setState(prev => ({ 
        ...prev, 
        previewAudio: null, 
        isPlaying: false, 
        previewFile: null 
      }));
    }
  }, [state.previewAudio]);

  // Handle SFX file selection
  const handleSFXFileSelect = useCallback(async (filename: string) => {
    // Stop any preview when selecting
    stopPreview();
    
    setState(prev => ({ 
      ...prev, 
      prompt: '',
      isLookupMode: false,
      showSFXDropdown: false,
      filteredSFXFiles: [],
      isGenerating: true
    }));
    
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
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  }, [showStatus, state.allSFXFileInfo, stopPreview]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    console.log('🎹 Key pressed:', e.key, 'Prompt:', `"${state.prompt}"`, 'isLookupMode:', state.isLookupMode);
    
    // Handle spacebar press when prompt is empty to trigger lookup mode
    if (e.key === ' ' && state.prompt === '' && !state.isLookupMode) {
      console.log('🔍 Spacebar pressed - triggering lookup mode');
      e.preventDefault(); // Prevent space from being added to textarea
      
      // Check if we have cached data that's still fresh
      const now = Date.now();
      const cacheExpired = now - state.lastScanTime > CACHE_DURATION;
      
      if (cachedFileInfoRef.current.length > 0 && !cacheExpired) {
        // Use cached data for instant response
        console.log(`📚 Using cached data: ${cachedFileInfoRef.current.length} SFX files`);
        const fileNames = cachedFileInfoRef.current.map(f => f.filename);
        
        setState(prev => ({ 
          ...prev, 
          isLookupMode: true, 
          showSFXDropdown: true,
          prompt: ' ',
          allSFXFileInfo: cachedFileInfoRef.current,
          existingSFXFiles: fileNames,
          filteredSFXFiles: fileNames,
          selectedDropdownIndex: fileNames.length > 0 ? 0 : -1
        }));
      } else {
        // Show loading state and scan in background
        setState(prev => ({ 
          ...prev, 
          isLookupMode: true, 
          showSFXDropdown: true,
          prompt: ' ',
          isScanningFiles: true
        }));
        
        // Scan files asynchronously
        (async () => {
          const allFiles = await scanExistingSFXFiles(state.customSFXPath);
          console.log(`📚 Loaded ${allFiles.length} SFX files for lookup`);
          
          // Cache the results
          cachedFileInfoRef.current = allFiles;
          const fileNames = allFiles.map(f => f.filename);
          
          setState(prev => ({ 
            ...prev, 
            allSFXFileInfo: allFiles,
            existingSFXFiles: fileNames,
            filteredSFXFiles: fileNames,
            selectedDropdownIndex: fileNames.length > 0 ? 0 : -1,
            lastScanTime: now,
            isScanningFiles: false
          }));
        })().catch(console.error);
      }
      return;
    }
    
    // Arrow key navigation in lookup mode - prevent default cursor movement
    if (state.isLookupMode && state.showSFXDropdown && state.filteredSFXFiles.length > 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        console.log(`🔼 Arrow ${e.key} pressed - current index: ${state.selectedDropdownIndex}, total files: ${state.filteredSFXFiles.length}`);
        e.preventDefault(); // Prevent text cursor movement
        e.stopPropagation();
        
        if (e.key === 'ArrowDown') {
          const newIndex = state.selectedDropdownIndex < state.filteredSFXFiles.length - 1 
            ? state.selectedDropdownIndex + 1 
            : 0; // Wrap to top
          console.log(`⬇️ Moving down to index: ${newIndex}`);
          setState(prev => ({
            ...prev,
            selectedDropdownIndex: newIndex
          }));
        } else { // ArrowUp
          const newIndex = state.selectedDropdownIndex > 0 
            ? state.selectedDropdownIndex - 1 
            : state.filteredSFXFiles.length - 1; // Wrap to bottom
          console.log(`⬆️ Moving up to index: ${newIndex}`);
          setState(prev => ({
            ...prev,
            selectedDropdownIndex: newIndex
          }));
        }
        return; // Early return to prevent further processing
      }
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      console.log('🚀 Enter pressed - isLookupMode:', state.isLookupMode, 'selectedIndex:', state.selectedDropdownIndex, 'filteredFiles:', state.filteredSFXFiles.length);
      e.preventDefault();
      if (state.isLookupMode && state.selectedDropdownIndex >= 0 && state.filteredSFXFiles.length > 0) {
        // Select currently highlighted result
        console.log('📁 Selecting SFX file:', state.filteredSFXFiles[state.selectedDropdownIndex]);
        handleSFXFileSelect(state.filteredSFXFiles[state.selectedDropdownIndex]);
      } else {
        console.log('🎵 Calling handleGenerate with prompt:', `"${state.prompt}"`);
        handleGenerate();
      }
    } else if (e.key === 'Escape') {
      // Exit lookup mode
      setState(prev => ({ 
        ...prev, 
        isLookupMode: false, 
        showSFXDropdown: false,
        selectedDropdownIndex: -1,
        prompt: ''
      }));
    } else if (e.key === 'Backspace' && state.isLookupMode && state.prompt === ' ') {
      // If backspacing on the initial space, exit lookup mode
      e.preventDefault();
      setState(prev => ({ 
        ...prev, 
        isLookupMode: false, 
        showSFXDropdown: false,
        selectedDropdownIndex: -1,
        prompt: ''
      }));
    }
  }, [handleGenerate, handleSFXFileSelect, scanExistingSFXFiles, state.isLookupMode, state.showSFXDropdown, state.filteredSFXFiles, state.selectedDropdownIndex, state.prompt, state.lastScanTime, state.customSFXPath]);

  // Load settings
  const loadSettings = useCallback(() => {
    try {
      let savedApiKey = localStorage.getItem('elevenLabsApiKey') || '';
      
      // Development fallback - use a test key if none is saved
      if (!savedApiKey) {
        savedApiKey = 'sk-test-key-for-development'; // You'll need to replace this with your actual key
        localStorage.setItem('elevenLabsApiKey', savedApiKey);
        console.log('🔧 Development: Auto-set test API key');
      }
      
      const savedVolume = parseFloat(localStorage.getItem('sfxVolume') || '0');
      const savedTrackTargeting = localStorage.getItem('trackTargetingEnabled') !== 'false';
      const savedSelectedTrack = localStorage.getItem('selectedTrack') || 'A5*';
      const savedCustomPath = localStorage.getItem('customSFXPath') || null;
      
      setState(prev => ({ 
        ...prev, 
        apiKey: savedApiKey,
        volume: savedVolume,
        trackTargetingEnabled: savedTrackTargeting,
        selectedTrack: savedSelectedTrack,
        customSFXPath: savedCustomPath
      }));
      
      console.log('⚙️ Settings loaded - API key:', savedApiKey ? 'Present' : 'Missing');
      if (savedCustomPath) {
        console.log('📁 Custom SFX path:', savedCustomPath);
      }
      
      if (savedApiKey && savedApiKey !== 'sk-test-key-for-development') {
        showStatus('Ready', 1000);
      } else {
        showStatus('Set your real API key in settings', 3000);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, [showStatus]);

  // Settings management
  const openSettings = useCallback(() => {
    setState(prev => ({ ...prev, showSettings: true }));
  }, []);

  const closeSettings = useCallback(() => {
    setState(prev => ({ ...prev, showSettings: false }));
  }, []);

  const saveApiKey = useCallback((newApiKey: string) => {
    if (newApiKey) {
      localStorage.setItem('elevenLabsApiKey', newApiKey);
      setState(prev => ({ ...prev, apiKey: newApiKey }));
      showStatus('API key saved!', 2000);
    }
  }, [showStatus]);

  // Detect currently targeted track in Premiere Pro
  const detectTargetedTrack = useCallback(async () => {
    try {
      const result = await (evalTS as any)("getHighestTargetedTrack");
      
      if (result.success && result.targetedTrack) {
        setState(prev => ({ 
          ...prev, 
          detectedTargetedTrack: {
            name: result.targetedTrack.name,
            number: result.targetedTrack.number
          }
        }));
        return result.targetedTrack;
      } else {
        setState(prev => ({ ...prev, detectedTargetedTrack: null }));
        return null;
      }
    } catch (error) {
      setState(prev => ({ ...prev, detectedTargetedTrack: null }));
      return null;
    }
  }, []);

  // Menu system management
  const toggleSettings = useCallback(async () => {
    const newMode = state.menuMode === 'normal' ? 'settings' : 'normal';
    setState(prev => ({ 
      ...prev, 
      menuMode: newMode 
    }));
    
    // When opening settings, detect the currently targeted track
    if (newMode === 'settings' && state.trackTargetingEnabled) {
      await detectTargetedTrack();
    }
  }, [state.menuMode, state.trackTargetingEnabled, detectTargetedTrack]);

  const openMenu = useCallback((menuType: 'api' | 'help' | 'files' | 'folder' | 'batch') => {
    setState(prev => ({ ...prev, menuMode: menuType }));
  }, []);

  const goBackToSettings = useCallback(() => {
    setState(prev => ({ ...prev, menuMode: 'settings' }));
  }, []);

  // Track targeting system
  const toggleTrackTargeting = useCallback(() => {
    setState(prev => {
      const newEnabled = !prev.trackTargetingEnabled;
      const newTrack = newEnabled ? prev.selectedTrack : 'Auto';
      
      localStorage.setItem('trackTargetingEnabled', newEnabled.toString());
      localStorage.setItem('selectedTrack', newTrack);
      
      return { 
        ...prev, 
        trackTargetingEnabled: newEnabled,
        selectedTrack: newTrack
      };
    });
  }, []);

  const setSelectedTrack = useCallback((track: string) => {
    localStorage.setItem('selectedTrack', track);
    setState(prev => ({ ...prev, selectedTrack: track }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setState(prev => ({ ...prev, volume }));
    localStorage.setItem('sfxVolume', volume.toString());
  }, []);

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
        setState(prev => ({ ...prev, customSFXPath: selectedPath }));
        
        showStatus(`SFX folder set to: ${selectedPath}`, 3000);
        
        // Force a rescan of files with the new path
        cachedFileInfoRef.current = [];
        setState(prev => ({ ...prev, lastScanTime: 0 }));
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      showStatus('Error selecting folder', 3000);
    }
  }, [state.customSFXPath, showStatus]);

  // Reset to default folder
  const resetToDefaultFolder = useCallback(() => {
    localStorage.removeItem('customSFXPath');
    setState(prev => ({ ...prev, customSFXPath: null }));
    showStatus('Reset to default SFX folder', 2000);
    
    // Force a rescan of files
    cachedFileInfoRef.current = [];
    setState(prev => ({ ...prev, lastScanTime: 0 }));
  }, [showStatus]);

  // Get display path for current SFX folder
  const getDisplayPath = useCallback(() => {
    if (state.customSFXPath) {
      // Shorten path for display if too long
      const parts = state.customSFXPath.split('/');
      if (parts.length > 4) {
        return `.../${parts.slice(-3).join('/')}`;
      }
      return state.customSFXPath;
    }
    return 'Auto (Project or Desktop)';
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
    
    // Reduce polling frequency - rely more on events
    const interval = setInterval(updateTimelineInfo, 10000);
    
    return () => {
      clearInterval(interval);
      if (timelineUpdateRef.current) {
        clearTimeout(timelineUpdateRef.current);
      }
    };
  }, [loadSettings, updateTimelineInfo]);

  // Batch processing functionality
  const processBatch = useCallback(async () => {
    if (state.batchPrompts.length === 0 || !state.apiKey) {
      showStatus('No prompts to process or missing API key', 3000);
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isBatchProcessing: true, 
      batchProgress: 0,
      batchTotal: prev.batchPrompts.length 
    }));

    try {
      for (let i = 0; i < state.batchPrompts.length; i++) {
        const prompt = state.batchPrompts[i].trim();
        if (!prompt) continue;

        // Update progress
        setState(prev => ({ ...prev, batchProgress: i + 1 }));
        showStatus(`Processing ${i + 1}/${state.batchPrompts.length}: ${prompt}`, 2000);

        // Generate the SFX
        try {
          // Determine duration based on current mode
          let duration = state.currentDuration;
          if (state.useInOutMode && state.timelineInfo?.duration?.seconds) {
            duration = Math.max(1, Math.min(22, Math.round(state.timelineInfo.duration.seconds)));
          } else if (state.autoMode) {
            duration = 10; // Default for auto mode
          }

          const audioData = await generateSFX(prompt, duration, state.apiKey, state.promptInfluence);
          const filePath = await saveAudioFile(audioData, prompt);
          
          // Place on timeline with spacing
          const timelineInfo = state.timelineInfo;
          let placementPosition = null;
          
          if (timelineInfo?.success && timelineInfo.currentTime?.seconds !== null) {
            // Place each SFX with spacing (duration + 0.5 seconds gap)
            placementPosition = timelineInfo.currentTime.seconds + (i * (duration + 0.5));
          }

          // Import and place the audio
          const result = await evalTS(`importAndPlaceAudioAtTime`, {
            audioPath: filePath,
            placementTime: placementPosition,
            trackIndex: state.trackTargetingEnabled && state.selectedTrack !== 'Auto' 
              ? parseInt(state.selectedTrack.replace(/[^0-9]/g, '')) - 1 
              : undefined,
            volume: state.volume
          });

          if (!result.success) {
            console.error(`Failed to place SFX ${i + 1}:`, result.error);
          }

        } catch (error) {
          console.error(`Error processing prompt ${i + 1}:`, error);
          showStatus(`Failed: ${prompt}`, 2000);
        }

        // Add delay between generations to avoid rate limiting
        if (i < state.batchPrompts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      showStatus(`Batch complete! Generated ${state.batchProgress} SFX`, 4000);
      
      // Clear batch prompts after successful processing
      setState(prev => ({ 
        ...prev, 
        batchPrompts: [], 
        batchMode: false,
        menuMode: 'normal' 
      }));

    } catch (error) {
      showStatus(`Batch error: ${error instanceof Error ? error.message : String(error)}`, 4000);
    } finally {
      setState(prev => ({ 
        ...prev, 
        isBatchProcessing: false,
        batchProgress: 0,
        batchTotal: 0
      }));
    }
  }, [state.batchPrompts, state.apiKey, state.currentDuration, state.useInOutMode, state.timelineInfo, 
      state.autoMode, state.promptInfluence, state.trackTargetingEnabled, state.selectedTrack, 
      state.volume, generateSFX, saveAudioFile, evalTS, showStatus]);

  // Real-time track targeting detection
  useEffect(() => {
    let trackTargetingInterval: NodeJS.Timeout | null = null;
    
    if (state.trackTargetingEnabled && state.menuMode === 'settings') {
      console.log('🎯 Starting real-time track targeting detection...');
      
      // Initial detection
      detectTargetedTrack();
      
      // Poll for changes every 2 seconds while settings are open
      trackTargetingInterval = setInterval(() => {
        detectTargetedTrack();
      }, 2000);
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
          placeholder={state.isGenerating ? "Generating..." : (state.isLookupMode ? "Search existing SFX..." : "Describe your SFX")}
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
                      onMouseEnter={() => setState(prev => ({ ...prev, selectedDropdownIndex: index }))}
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
                setState(prev => ({ ...prev, currentDuration: parseInt(e.target.value) }));
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
            onChange={(e) => setState(prev => ({ ...prev, promptInfluence: parseFloat(e.target.value) }))}
            className="influence-slider"
          />
          <span className="influence-value">{state.promptInfluence === 0 ? 'Low' : state.promptInfluence === 1 ? 'High' : state.promptInfluence.toFixed(1)}</span>
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
              {state.trackTargetingEnabled && (
                <button 
                  onClick={detectTargetedTrack}
                  className="refresh-btn"
                  title="Refresh targeted track detection"
                >
                  🔄
                </button>
              )}
            </div>
            
            <div className="api-status">
              <span>API:</span>
              <span className={`status-indicator ${state.apiKey ? 'connected' : 'disconnected'}`}>
                {state.apiKey ? '●' : '○'}
              </span>
            </div>
            
            <div className="menu-buttons">
              <button className="menu-btn" onClick={() => openMenu('batch')} title="Batch Mode">📋</button>
              <button className="menu-btn" onClick={() => openMenu('api')} title="API Setup">🔧</button>
              <button className="menu-btn" onClick={() => openMenu('folder')} title="Folder Settings">📁</button>
              <button className="menu-btn" onClick={() => openMenu('files')} title="Files">📂</button>
              <button className="menu-btn" onClick={() => openMenu('help')} title="Help">❓</button>
            </div>
          </div>
        </div>
      )}
      
      {/* API Setup Menu */}
      {state.menuMode === 'api' && (
        <div className="menu-overlay">
          <div className="api-menu">
            <div className="menu-header">
              <span className="menu-title">API Configuration</span>
              <button onClick={goBackToSettings} className="back-btn">Back</button>
            </div>
            <div className="menu-content">
              <div className="api-input-row">
                <span>API Key:</span>
                <input
                  type="password"
                  placeholder="ElevenLabs API Key"
                  value={state.apiKey}
                  onChange={(e) => setState(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="api-input"
                />
                <button onClick={() => saveApiKey(state.apiKey)} className="save-btn">Save</button>
              </div>
              <div className="api-status-row">
                <span className={`api-status ${state.apiKey ? 'connected' : 'disconnected'}`}>
                  {state.apiKey ? '✅ Connected' : '❌ No API Key'}
                </span>
                <span className="usage">Usage: --/1000 generations</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Folder Menu */}
      {state.menuMode === 'folder' && (
        <div className="menu-overlay">
          <div className="folder-menu">
            <div className="menu-header">
              <span className="menu-title">SFX Folder Settings</span>
              <button onClick={goBackToSettings} className="back-btn">Back</button>
            </div>
            <div className="menu-content">
              <div className="folder-path-row">
                <span className="folder-label">Current Location:</span>
                <span className="folder-path" title={state.customSFXPath || 'Using default folder'}>
                  {getDisplayPath()}
                </span>
              </div>
              <div className="folder-actions">
                <button onClick={selectSFXFolder} className="action-btn primary" title="Choose a custom folder">
                  📁 Select Folder
                </button>
                <button onClick={async () => {
                  const sfxPath = await getSFXPath();
                  if (sfxPath) {
                    window.cep.util.openURLInDefaultBrowser(`file://${sfxPath}`);
                  }
                }} className="action-btn" title="Open folder in file browser">
                  📂 Open Folder
                </button>
                <button 
                  onClick={state.customSFXPath ? resetToDefaultFolder : () => showStatus('Already using default folder', 2000)} 
                  className="action-btn" 
                  title={state.customSFXPath ? 'Reset to default folder' : 'Using default folder'}
                  disabled={!state.customSFXPath}
                >
                  🔄 Reset to Default
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Help Menu */}
      {state.menuMode === 'help' && (
        <div className="menu-overlay">
          <div className="help-menu">
            <div className="menu-row-1">
              <span>Quick Help</span>
              <button onClick={goBackToSettings} className="back-btn">Back</button>
            </div>
            <div className="menu-row-2">
              <span>Type description → Enter → SFX generated</span>
              <button onClick={() => window.open('mailto:support@aisfx.com', '_blank')} className="email-btn">Email</button>
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
                  window.cep.util.openURLInDefaultBrowser(`file://${sfxPath}`);
                }
              }} className="open-btn" title="Open folder">Open</button>
              <button onClick={state.customSFXPath ? resetToDefaultFolder : () => showStatus('Already using default folder', 2000)} 
                      className="clean-btn" 
                      title={state.customSFXPath ? 'Reset to default folder' : 'Using default folder'}>
                {state.customSFXPath ? 'Reset' : 'Default'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Batch Processing Menu */}
      {state.menuMode === 'batch' && (
        <div className="menu-overlay batch-menu-overlay">
          <div className="batch-menu">
            <div className="batch-header">
              <span className="menu-title">Batch Processing</span>
              <button onClick={() => setState(prev => ({ ...prev, menuMode: 'normal' }))} className="close-btn">✕</button>
            </div>
            <div className="batch-content">
              <div className="batch-instructions">
                Enter multiple SFX prompts (one per line):
              </div>
              <textarea
                className="batch-textarea"
                placeholder="explosion sound&#10;footsteps on gravel&#10;door creaking open&#10;thunder rumble"
                value={state.batchPrompts.join('\n')}
                onChange={(e) => {
                  const prompts = e.target.value.split('\n');
                  setState(prev => ({ ...prev, batchPrompts: prompts }));
                }}
                disabled={state.isBatchProcessing}
                rows={6}
              />
              {state.isBatchProcessing && (
                <div className="batch-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(state.batchProgress / state.batchTotal) * 100}%` }}
                    />
                  </div>
                  <span className="progress-text">
                    Processing {state.batchProgress} of {state.batchTotal}...
                  </span>
                </div>
              )}
              <div className="batch-actions">
                <button 
                  onClick={processBatch} 
                  className="batch-process-btn"
                  disabled={state.isBatchProcessing || state.batchPrompts.filter(p => p.trim()).length === 0}
                >
                  {state.isBatchProcessing ? 'Processing...' : `Generate ${state.batchPrompts.filter(p => p.trim()).length} SFX`}
                </button>
                <button 
                  onClick={() => setState(prev => ({ ...prev, batchPrompts: [] }))} 
                  className="batch-clear-btn"
                  disabled={state.isBatchProcessing}
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};