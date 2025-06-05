import { useEffect, useState, useCallback, useRef } from "react";
import { evalTS, subscribeBackgroundColor, listenTS, csi } from "../lib/utils/bolt";
import CSInterface from "../lib/cep/csinterface";
import { fs } from "../lib/cep/node";
import type { TimelineInfo, PlacementResult } from "../../shared/universals";
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
  // CRITICAL: Verify this is the correct plugin - NEVER show wrong plugin content
  useEffect(() => {
    const extensionId = csi.getExtensionID();
    const expectedId = "com.ai.sfx.generator";
    
    // Allow both main extension ID and panel-specific ID
    if (extensionId !== expectedId && !extensionId.startsWith(expectedId)) {
      console.error(`🚨 CRITICAL ERROR: Wrong plugin loaded!`);
      console.error(`Expected: ${expectedId} (or variant)`);
      console.error(`Got: ${extensionId}`);
      
      // Force correct identity
      document.title = "AI SFX Generator";
      
      // Clear any cached content
      if (window.location.port !== "3030") {
        console.error(`🚨 WRONG PORT! Redirecting to correct port...`);
        window.location.href = "http://localhost:3030/main/index.html";
        return;
      }
    } else {
      console.log(`✅ AI SFX Generator loaded correctly (ID: ${extensionId})`);
    }
  }, []);

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
    isScanningFiles: false
  });

  const promptRef = useRef<HTMLTextAreaElement>(null);
  const timelineUpdateRef = useRef<NodeJS.Timeout>();
  const cachedFileInfoRef = useRef<SFXFileInfo[]>([]);
  const CACHE_DURATION = 30000; // 30 seconds cache

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
    console.log('Status:', message);
  }, []);

  // Test ExtendScript connectivity on component mount
  const testExtendScriptConnection = useCallback(async () => {
    try {
      console.log('🧪 Testing basic ExtendScript connectivity...');
      
      // Test 1: Basic CSInterface test
      const csi = new CSInterface();
      console.log('✅ CSInterface available:', !!csi);
      
      // Test 2: Simple script evaluation
      const simpleResult = await new Promise((resolve) => {
        csi.evalScript('1 + 1', (result) => {
          console.log('🧮 Simple math result:', result);
          resolve(result);
        });
      });
      
      // Test 3: Test namespace availability
      const namespaceTest = await new Promise((resolve) => {
        csi.evalScript('typeof app', (result) => {
          console.log('📱 App object type:', result);
          resolve(result);
        });
      });
      
      // Test 4: Test our namespace
      const nsTest = await new Promise((resolve) => {
        csi.evalScript(`
          try {
            var host = typeof $ !== 'undefined' ? $ : window;
            var ns = "com.ai.sfx.generator";
            var result = {
              hasHost: typeof host !== 'undefined',
              hasNamespace: typeof host[ns] !== 'undefined',
              namespaceType: typeof host[ns],
              availableFunctions: typeof host[ns] !== 'undefined' ? Object.keys(host[ns]) : []
            };
            JSON.stringify(result);
          } catch (e) {
            JSON.stringify({error: e.toString()});
          }
        `, (result) => {
          console.log('🏠 Namespace test result:', result);
          try {
            const parsed = JSON.parse(result);
            console.log('📋 Parsed namespace test:', parsed);
          } catch (e) {
            console.log('❌ Failed to parse namespace test:', e);
          }
          resolve(result);
        });
      });
      
      // Test 5: Direct function call
      const directFunctionTest = await new Promise((resolve) => {
        csi.evalScript(`
          try {
            var host = typeof $ !== 'undefined' ? $ : window;
            var ns = "com.ai.sfx.generator";
            if (host[ns] && host[ns].getAppInfo) {
              var result = host[ns].getAppInfo();
              JSON.stringify({success: true, result: result});
            } else {
              JSON.stringify({success: false, error: "Function not available"});
            }
          } catch (e) {
            JSON.stringify({success: false, error: e.toString()});
          }
        `, (result) => {
          console.log('🎯 Direct function test result:', result);
          resolve(result);
        });
      });
      
    } catch (error) {
      console.error('❌ ExtendScript connection test failed:', error);
    }
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
      console.log('Timeline update failed:', error);
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
    console.log('🎯 IN-OUT MODE ACTIVATED');
  }, []);

  const activateManualMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      useInOutMode: false,
      manualModeActive: true,
      autoMode: false
    }));
    console.log('🎯 MANUAL MODE ACTIVATED');
  }, []);

  const activateAutoMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      useInOutMode: false,
      manualModeActive: false,
      autoMode: true
    }));
    console.log('🎯 AUTO MODE ACTIVATED');
  }, []);

  // Handle generation
  const handleGenerate = useCallback(async () => {
    if (!state.prompt.trim() || state.isGenerating) return;

    if (!state.apiKey) {
      showStatus('Please set your API key first', 3000);
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true }));
    showStatus('Detecting timeline...');

    try {
      // Get current timeline info and capture playhead position immediately
      const timelineInfo = await evalTS("getSequenceInfo");
      const currentPlayheadPosition = timelineInfo?.playheadPosition || timelineInfo?.playhead?.seconds || 0;
      
      console.log(`🎯 Captured playhead position at generation start: ${currentPlayheadPosition}s`);
      
      let duration = state.currentDuration;
      let placementPosition: number | null = null;
      
      console.log('🧪 GENERATION CONDITIONS:');
      console.log('useInOutMode:', state.useInOutMode);
      console.log('timelineInfo.success:', timelineInfo?.success);
      console.log('timelineInfo.hasInPoint:', timelineInfo?.hasInPoint);
      console.log('timelineInfo.hasOutPoint:', timelineInfo?.hasOutPoint);
      
      // Check for In-N-Out mode
      if (state.useInOutMode && timelineInfo?.success && timelineInfo?.hasInPoint && timelineInfo?.hasOutPoint) {
        const inPointSeconds = timelineInfo.inPoint?.seconds ?? 0;
        const outPointSeconds = timelineInfo.outPoint?.seconds ?? 0;
        const timelineDuration = outPointSeconds - inPointSeconds;
        
        console.log('=== DETECTED USER TIMELINE VALUES ===');
        console.log(`IN POINT: ${timelineInfo.inPoint?.formatted} (${inPointSeconds}s)`);
        console.log(`OUT POINT: ${timelineInfo.outPoint?.formatted} (${outPointSeconds}s)`);
        console.log(`DURATION: ${timelineInfo.duration?.formatted} (${timelineDuration}s)`);
        
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
      
      console.log('🚀 STARTING GENERATION:', { prompt: state.prompt, duration, placementPosition, promptInfluence: state.promptInfluence });
      
      // First test basic ExtendScript connection
      console.log('🧪 Testing ExtendScript connection...');
      try {
        // Temporarily use getAppInfo as a connection test
        const basicTest = await evalTS("getAppInfo");
        console.log('🧪 Basic ExtendScript test result:', basicTest);
        
        if (!basicTest) {
          throw new Error('ExtendScript connection failed');
        }
      } catch (extendScriptError) {
        console.error('❌ ExtendScript test failed:', extendScriptError);
        throw new Error('Cannot connect to Premiere Pro. Make sure a project is open.');
      }
      
      showStatus('Generating SFX...');
      
      // Generate audio using Eleven Labs API
      const audioData = await generateSFX(state.prompt, duration, state.apiKey, state.promptInfluence);
      
      showStatus('Placing on timeline...');
      
      // Save audio file
      const filePath = await saveAudioFile(audioData, state.prompt);
      console.log('📁 Audio file saved:', filePath);
      
      // Debug timeline placement prerequisites - use sequence info for now
      const timelineDebug = await evalTS("getSequenceInfo");
      console.log('🔍 Timeline debug info:', timelineDebug);
      
      // Place audio on timeline with enhanced error handling
      let result: PlacementResult;
      
      console.log('🎯 Starting timeline placement...');
      console.log('📄 File path:', filePath);
      console.log('⏰ Placement position:', placementPosition);
      
      try {
        if (placementPosition !== null) {
          console.log('📍 Using In-N-Out placement at:', placementPosition, 'seconds');
          result = await evalTS("importAndPlaceAudioAtTime", filePath, placementPosition, 0);
        } else {
          console.log('📍 Using captured playhead position at:', currentPlayheadPosition, 'seconds');
          result = await evalTS("importAndPlaceAudioAtTime", filePath, currentPlayheadPosition, 0);
        }
        
        console.log('✅ Timeline placement result:', result);
        
        // Log detailed debug info if available
        if (result?.debug) {
          console.log('📊 Import Debug Info:');
          if (result.debug.binsBeforeImport) {
            console.log('  Pre-import bins:', result.debug.binsBeforeImport);
          }
          if (result.debug.binsAfterImport) {
            console.log('  Post-import bins:', result.debug.binsAfterImport);
          }
          if (result.debug.foundInBin !== undefined) {
            console.log('  Found in bin:', result.debug.foundInBin);
          }
          if (result.debug.itemLocationBeforeMove) {
            console.log('  Item location before move:', result.debug.itemLocationBeforeMove);
          }
          if (result.debug.itemLocationAfterMove) {
            console.log('  Item location after move:', result.debug.itemLocationAfterMove);
          }
          if (result.debug.movedToBin !== undefined) {
            console.log('  Move result:', result.debug.movedToBin);
          }
          if (result.debug.foundExistingSFXBin || result.debug.createdNewSFXBin) {
            console.log('  SFX Bin:', result.debug.foundExistingSFXBin || result.debug.createdNewSFXBin);
          }
        }
        
        // Enhanced error reporting
        if (!result || !result.success) {
          console.error('❌ Timeline placement failed:', {
            error: result?.error || 'Unknown error',
            step: result?.step || 'Unknown step',
            debug: result?.debug || {},
            fullResult: result
          });
          
          // Try a simpler fallback approach
          console.log('🔄 Trying fallback placement method...');
          showStatus('Trying alternative placement...');
          
          // Fallback: Try with captured playhead position
          const fallbackResult = await evalTS("importAndPlaceAudioAtTime", filePath, currentPlayheadPosition, 0);
          console.log('🔄 Fallback result:', fallbackResult);
          
          if (fallbackResult && fallbackResult.success) {
            result = fallbackResult;
            console.log('✅ Fallback placement succeeded!');
          } else {
            throw new Error(result?.error || 'Timeline placement failed completely');
          }
        }
      } catch (placementError) {
        console.error('❌ Critical placement error:', placementError);
        
        // Last resort: Show user where file was saved
        showStatus(`SFX saved to ${filePath}. Please manually drag to timeline.`, 5000);
        throw new Error(`Timeline placement failed: ${placementError instanceof Error ? placementError.message : String(placementError)}`);
      }
      
      if (result.success) {
        setState(prev => ({ ...prev, prompt: "" }));
        
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
      console.error('Generation error:', error);
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
        console.warn('Could not get project path:', result.error);
        // Fallback to desktop path
        const userPath = window.cep_node.global.process.env.HOME || window.cep_node.global.process.env.USERPROFILE;
        return `${userPath}/Desktop/SFX AI`;
      }
    } catch (error) {
      console.error('Error getting project path:', error);
      // Fallback to desktop path
      const userPath = window.cep_node.global.process.env.HOME || window.cep_node.global.process.env.USERPROFILE;
      return `${userPath}/Desktop/SFX AI`;
    }
  };

  // Scan existing SFX files from both filesystem and project bins
  const scanExistingSFXFiles = async (): Promise<SFXFileInfo[]> => {
    const allFiles: SFXFileInfo[] = [];
    
    try {
      // 1. Scan both main SFX folder and ai sfx subfolder
      console.log('🔍 Getting project path...');
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
          console.log('📦 Raw getProjectPath result:', result);
          try {
            // If result already looks like JSON, parse it. Otherwise, it might be direct from function
            if (result.startsWith('{') || result.startsWith('[')) {
              const parsed = JSON.parse(result);
              console.log('📦 Parsed getProjectPath result:', parsed);
              resolve(parsed);
            } else {
              console.log('📦 Non-JSON result:', result);
              resolve({ success: false, error: 'Non-JSON result: ' + result });
            }
          } catch (e) {
            console.error('❌ Failed to parse getProjectPath result:', e);
            console.log('Raw result was:', result);
            resolve({ success: false, error: 'Parse error: ' + e });
          }
        });
      });
      
      const foldersToScan: string[] = [];
      
      // Helper function to scan directory for SFX folders (limited depth for performance)
      const findSFXFolders = (basePath: string, maxDepth: number = 1, currentDepth: number = 0): string[] => {
        const sfxFolders: string[] = [];
        
        if (currentDepth > maxDepth || !fs.existsSync(basePath)) {
          return sfxFolders;
        }
        
        try {
          const items = fs.readdirSync(basePath);
          
          for (const item of items) {
            // Skip hidden folders and system folders
            if (item.startsWith('.') || item === 'node_modules' || item === 'Library') {
              continue;
            }
            
            const fullPath = `${basePath}/${item}`;
            
            try {
              const stats = fs.statSync(fullPath);
              
              if (stats.isDirectory()) {
                const lowerItem = item.toLowerCase();
                
                // More specific matching for SFX folders only
                if (lowerItem === 'sfx' || 
                    lowerItem === 'ai sfx' || 
                    lowerItem === 'aisfx' ||
                    lowerItem === 'sound effects' ||
                    lowerItem === 'audio' ||
                    lowerItem.includes('sfx')) {
                  sfxFolders.push(fullPath);
                  console.log(`🎯 Found SFX folder: ${fullPath}`);
                  
                  // IMPORTANT: Also scan all subdirectories of SFX folders
                  // This ensures we find audio files in nested folders like /SFX/explosions/
                  const getAllSubfolders = (dir: string): string[] => {
                    let allFolders: string[] = [];
                    try {
                      const subItems = fs.readdirSync(dir);
                      for (const subItem of subItems) {
                        if (subItem.startsWith('.')) continue;
                        const subPath = `${dir}/${subItem}`;
                        try {
                          if (fs.statSync(subPath).isDirectory()) {
                            allFolders.push(subPath);
                            // Recursively get all nested folders
                            allFolders = allFolders.concat(getAllSubfolders(subPath));
                          }
                        } catch (e) {}
                      }
                    } catch (e) {}
                    return allFolders;
                  };
                  
                  // Add all subfolders of this SFX folder
                  const subfolders = getAllSubfolders(fullPath);
                  sfxFolders.push(...subfolders);
                }
                
                // Only recurse if we're not too deep
                if (currentDepth < maxDepth) {
                  const subFolders = findSFXFolders(fullPath, maxDepth, currentDepth + 1);
                  sfxFolders.push(...subFolders);
                }
              }
            } catch (e) {
              // Skip folders we can't access
            }
          }
        } catch (e) {
          console.warn(`⚠️ Could not scan: ${basePath}`);
        }
        
        return sfxFolders;
      };
      
      if (projectPath.success && projectPath.projectDir) {
        console.log(`📁 Project directory: ${projectPath.projectDir}`);
        
        // 1. Search within the project directory (max 1 level deep for performance)
        const projectSFXFolders = findSFXFolders(projectPath.projectDir, 1);
        foldersToScan.push(...projectSFXFolders);
        
        // 2. Also check for direct SFX folder in project root (common case)
        const directSFXPath = `${projectPath.projectDir}/SFX`;
        if (fs.existsSync(directSFXPath) && !foldersToScan.includes(directSFXPath)) {
          console.log(`🎯 Found direct SFX folder: ${directSFXPath}`);
          foldersToScan.push(directSFXPath);
          
          // Add all its subfolders too
          const getAllSubfolders = (dir: string): string[] => {
            let allFolders: string[] = [];
            try {
              const items = fs.readdirSync(dir);
              for (const item of items) {
                if (item.startsWith('.')) continue;
                const subPath = `${dir}/${item}`;
                if (fs.statSync(subPath).isDirectory()) {
                  allFolders.push(subPath);
                  allFolders = allFolders.concat(getAllSubfolders(subPath));
                }
              }
            } catch (e) {}
            return allFolders;
          };
          
          const subfolders = getAllSubfolders(directSFXPath);
          foldersToScan.push(...subfolders);
        }
        
        // 3. CRITICAL: Also scan parent directory (Desktop) for SFX folders
        // This finds folders like "/Users/user/Desktop/SFX AI/" that are siblings to the project
        const projectParentDir = projectPath.projectDir.split('/').slice(0, -1).join('/');
        console.log(`🔍 Scanning parent directory for SFX folders: ${projectParentDir}`);
        const parentSFXFolders = findSFXFolders(projectParentDir, 1); // Only 1 level deep to avoid scanning entire system
        foldersToScan.push(...parentSFXFolders);
        
        // 4. Common SFX locations on Desktop
        const commonSFXPaths = [
          `${projectParentDir}/SFX`,
          `${projectParentDir}/SFX AI`, 
          `${projectParentDir}/Sound Effects`,
          `${projectParentDir}/Audio`,
          `${projectParentDir}/Sounds`
        ];
        
        for (const sfxPath of commonSFXPaths) {
          if (fs.existsSync(sfxPath) && !foldersToScan.includes(sfxPath)) {
            console.log(`🎯 Found common SFX folder: ${sfxPath}`);
            foldersToScan.push(sfxPath);
            
            // Add all subfolders
            const getAllSubfolders = (dir: string): string[] => {
              let allFolders: string[] = [];
              try {
                const items = fs.readdirSync(dir);
                for (const item of items) {
                  if (item.startsWith('.')) continue;
                  const subPath = `${dir}/${item}`;
                  if (fs.statSync(subPath).isDirectory()) {
                    allFolders.push(subPath);
                    allFolders = allFolders.concat(getAllSubfolders(subPath));
                  }
                }
              } catch (e) {}
              return allFolders;
            };
            
            const subfolders = getAllSubfolders(sfxPath);
            foldersToScan.push(...subfolders);
          }
        }
        
        // Optionally check immediate parent (in case SFX folder is one level up)
        const parentDir = projectPath.projectDir.split('/').slice(0, -1).join('/');
        if (parentDir) {
          // Only look for direct SFX folders in parent, not recursive
          const parentPath = `${parentDir}/SFX`;
          if (fs.existsSync(parentPath) && !foldersToScan.includes(parentPath)) {
            console.log(`🎯 Found parent SFX folder: ${parentPath}`);
            foldersToScan.push(parentPath);
            
            // Add all its subfolders
            const getAllSubfolders = (dir: string): string[] => {
              let allFolders: string[] = [];
              try {
                const items = fs.readdirSync(dir);
                for (const item of items) {
                  if (item.startsWith('.')) continue;
                  const subPath = `${dir}/${item}`;
                  if (fs.statSync(subPath).isDirectory()) {
                    allFolders.push(subPath);
                    allFolders = allFolders.concat(getAllSubfolders(subPath));
                  }
                }
              } catch (e) {}
              return allFolders;
            };
            
            const subfolders = getAllSubfolders(parentPath);
            foldersToScan.push(...subfolders);
          }
        }
      } else {
        // Project exists but not saved yet - try to work with bins only
        console.warn('⚠️ Project not saved yet - will only scan project bins, no filesystem search');
        console.log('💡 To enable full search: Save your project (Cmd+S) and reload the plugin');
      }
      
      // Remove duplicates
      const uniqueFolders = [...new Set(foldersToScan)];
      
      console.log(`📁 Found ${uniqueFolders.length} folders to scan:`, uniqueFolders);
      
      // Scan each folder recursively
      for (const sfxPath of uniqueFolders) {
        console.log(`📂 Scanning folder: ${sfxPath}`);
        
        // Recursive function to scan directories
        function scanDirectoryRecursively(dirPath: string, relativePath = ''): SFXFileInfo[] {
          const files: SFXFileInfo[] = [];
          
          try {
            const items = fs.readdirSync(dirPath);
            console.log(`📂 Scanning directory: ${dirPath} (${items.length} items)`);
            
            for (const item of items) {
              const fullItemPath = `${dirPath}/${item}`;
              const itemRelativePath = relativePath ? `${relativePath}/${item}` : item;
              
              try {
                const stats = fs.statSync(fullItemPath);
                
                if (stats.isDirectory()) {
                  // Recursively scan subdirectory
                  console.log(`📁 Found subdirectory: ${item}`);
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
                    console.log(`🎵 Found audio file: ${itemRelativePath}`);
                    
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
                      console.log(`📝 Parsed new suffix format: "${basename}" → prompt: "${prompt}", number: ${number}`);
                    } else {
                      // Pattern 2: OLD PREFIX FORMAT - "001 explosion sound" (number prefix with spaces)
                      const oldPrefixMatch = basename.match(/^(\d+)\s+(.+)$/);
                      if (oldPrefixMatch) {
                        number = parseInt(oldPrefixMatch[1]);
                        prompt = oldPrefixMatch[2];
                        console.log(`📝 Parsed old prefix format: "${basename}" → number: ${number}, prompt: "${prompt}"`);
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
                    
                    // Debug log for cat files
                    if (prompt.toLowerCase().includes('cat')) {
                      console.log(`🐱 Cat file found:`, fileInfo);
                    }
                    
                    files.push(fileInfo);
                  }
                }
              } catch (statError) {
                console.warn(`⚠️ Could not stat item: ${fullItemPath}`, statError);
              }
            }
          } catch (readError) {
            console.error(`❌ Could not read directory: ${dirPath}`, readError);
          }
          
          return files;
        }
        
        const filesystemFiles = scanDirectoryRecursively(sfxPath);
        console.log(`✅ Found ${filesystemFiles.length} files in ${sfxPath}`);
        allFiles.push(...filesystemFiles);
      }
      
      console.log(`📁 Total filesystem files from all folders: ${allFiles.length}`);
      console.log('📋 All files before deduplication:', allFiles.map(f => ({ filename: f.filename, path: f.path, prompt: f.prompt })));
      
      // 2. Scan project bins named "sfx" or "ai sfx"
      console.log('🎬 Scanning project bins...');
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
          console.log('📦 Raw project bin result:', result);
          try {
            if (result.startsWith('{') || result.startsWith('[')) {
              const parsed = JSON.parse(result);
              console.log('📦 Parsed project bin result:', parsed);
              resolve(parsed);
            } else {
              console.log('📦 Non-JSON bin result:', result);
              resolve({ success: false, files: [], error: 'Non-JSON result: ' + result });
            }
          } catch (e) {
            console.error('❌ Failed to parse project bin result:', e);
            resolve({ success: false, files: [] });
          }
        });
      });
      
      if (projectBinResult.success && projectBinResult.files) {
        console.log('🎯 Project bin files found:', projectBinResult.files.length);
        console.log('📋 Project bin files:', projectBinResult.files);
        
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
        console.log('✅ Added', projectFiles.length, 'project bin files to search');
      } else {
        console.warn('⚠️ No project bin files found or scan failed:', projectBinResult.error);
      }
      
      // Remove duplicates (same filename) - prefer project bin files
      const uniqueFiles = allFiles.reduce((acc: SFXFileInfo[], current) => {
        const existingIndex = acc.findIndex(file => file.filename === current.filename);
        if (existingIndex === -1) {
          acc.push(current);
        } else if (current.source === 'project_bin' && acc[existingIndex].source === 'filesystem') {
          // Replace filesystem file with project bin file (project bins take priority)
          console.log(`🔄 Replacing filesystem file with project bin file: ${current.filename}`);
          console.log(`   Filesystem path: ${acc[existingIndex].path}`);
          console.log(`   Project bin path: ${current.binPath}`);
          acc[existingIndex] = current;
        } else {
          console.log(`⚠️ Skipping duplicate: ${current.filename} (keeping ${acc[existingIndex].source} version)`);
        }
        // If both are filesystem files with same name, skip duplicate
        return acc;
      }, []);
      
      console.log('📋 Files after deduplication:', uniqueFiles.map(f => ({ filename: f.filename, path: f.path, prompt: f.prompt, display: formatFileDisplayName(f.filename) })));
      
      // Detailed file breakdown for debugging
      uniqueFiles.forEach((file, index) => {
        console.log(`📄 File ${index + 1}: "${file.filename}"`);
        console.log(`   💬 Prompt: "${file.prompt}"`);
        console.log(`   🏷️ Display: "${formatFileDisplayName(file.filename)}"`);
        console.log(`   📁 Path: ${file.path}`);
        console.log('   ---');
      });
      
      // Sort by timestamp (most recent first)
      return uniqueFiles.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      
    } catch (error) {
      console.error('Error scanning SFX files:', error);
      return [];
    }
  };

  // Get next number for a prompt
  const getNextNumberForPrompt = (prompt: string, existingFiles: SFXFileInfo[]): number => {
    const cleanPrompt = prompt.toLowerCase().trim();
    const matchingFiles = existingFiles.filter(file => 
      file.prompt.includes(cleanPrompt) || cleanPrompt.includes(file.prompt)
    );
    
    console.log(`🔢 Finding next number for "${cleanPrompt}":`, {
      totalFiles: existingFiles.length,
      matchingFiles: matchingFiles.length,
      existingNumbers: matchingFiles.map(f => ({ name: f.filename, number: f.number }))
    });
    
    if (matchingFiles.length === 0) {
      console.log(`✨ First file for "${cleanPrompt}" - using number 001`);
      return 1;
    }
    
    const maxNumber = Math.max(...matchingFiles.map(file => file.number || 0));
    const nextNumber = maxNumber + 1;
    console.log(`📈 Next number for "${cleanPrompt}": ${nextNumber.toString().padStart(3, '0')}`);
    
    return nextNumber;
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
    
    const existingFiles = await scanExistingSFXFiles();
    const nextNumber = getNextNumberForPrompt(prompt, existingFiles);
    
    // NEW: Use numbered suffix naming convention: "explosion sound 1.mp3" (single digit unless multi-digit)
    const cleanPrompt = prompt.slice(0, 30).replace(/[^a-zA-Z0-9 ]/g, '').trim();
    const fileName = `${cleanPrompt} ${nextNumber}.mp3`;
    const filePath = `${sfxPath}/${fileName}`;
    
    console.log(`💾 Saving new SFX with numbered suffix: "${fileName}" (number: ${nextNumber})`);
    
    const buffer = Buffer.from(audioData);
    fs.writeFileSync(filePath, buffer);
    
    return filePath;
  };

  // Handle text input changes
  const handlePromptChange = useCallback((value: string) => {
    console.log('📝 Input changed to:', value); // Debug log
    
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
        
        // Filter existing files using the full file info
        const filteredFileInfo = state.allSFXFileInfo.filter(file => {
          // Check if search term is a number (for numbered file retrieval)
          const isNumberSearch = /^\d+$/.test(searchTerm);
          
          if (isNumberSearch) {
            // Search by number suffix: if user types "1" or "12", match files ending with those numbers
            const searchNumber = parseInt(searchTerm);
            const fileNumber = file.number || 0;
            
            // Match if the file number equals the search number, or if filename ends with " number.extension"
            const numberMatch = fileNumber === searchNumber || 
                               file.filename.endsWith(' ' + searchTerm + '.mp3') ||
                               file.filename.endsWith(' ' + searchTerm + '.wav') ||
                               file.filename.endsWith(' ' + searchTerm + '.aac') ||
                               file.filename.endsWith(' ' + searchTerm + '.m4a') ||
                               file.filename.endsWith(' ' + searchTerm + '.flac') ||
                               file.filename.endsWith(' ' + searchTerm + '.ogg') ||
                               file.filename.endsWith(' ' + searchTerm + '.aiff') ||
                               file.filename.endsWith(' ' + searchTerm + '.aif');
            
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

  // Handle SFX file selection
  const handleSFXFileSelect = useCallback(async (filename: string) => {
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
  }, [showStatus, state.allSFXFileInfo]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
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
          const allFiles = await scanExistingSFXFiles();
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
      e.preventDefault();
      if (state.isLookupMode && state.selectedDropdownIndex >= 0 && state.filteredSFXFiles.length > 0) {
        // Select currently highlighted result
        handleSFXFileSelect(state.filteredSFXFiles[state.selectedDropdownIndex]);
      } else {
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
  }, [handleGenerate, handleSFXFileSelect, scanExistingSFXFiles, state.isLookupMode, state.showSFXDropdown, state.filteredSFXFiles, state.selectedDropdownIndex, state.prompt]);

  // Load settings
  const loadSettings = useCallback(() => {
    try {
      const savedApiKey = localStorage.getItem('elevenLabsApiKey') || '';
      setState(prev => ({ ...prev, apiKey: savedApiKey }));
      if (savedApiKey) {
        showStatus('Ready', 1000);
      } else {
        showStatus('Set API key in settings', 3000);
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


  // Initialize
  useEffect(() => {
    if (window.cep) {
      subscribeBackgroundColor(setBgColor);
      
      // Test ExtendScript connection immediately
      setTimeout(() => {
        testExtendScriptConnection();
      }, 1000);
      
      // Listen for real-time timeline changes with debouncing
      // Timeline monitoring is automatically initialized in ExtendScript
      listenTS("timelineChanged", (data) => {
        console.log("Timeline changed event received:", data);
        
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
    // testConnection(); // Remove initial connection test to improve startup
    updateTimelineInfo();
    
    // Add debug functions to global window for console access
    (window as any).debugAISFX = async () => {
      console.log('🧪 === AI SFX DEBUG SUITE ===');
      
      try {
        // Test 1: Basic ExtendScript
        console.log('1. Testing ExtendScript connection...');
        const basicTest = await evalTS("getAppInfo");
        console.log('   ✅ ExtendScript test:', basicTest);
        
        // Test 2: Timeline debug - use existing function
        console.log('2. Testing timeline info...');
        const timelineTest = await evalTS("getSequenceInfo");
        console.log('   ✅ Timeline test:', timelineTest);
        
        // Test 3: Try simple import (if user provides path)
        console.log('3. Use window.testAudioImport("/path/to/test.mp3") to test audio import');
        
        console.log('🧪 === DEBUG COMPLETE ===');
        return { basicTest, timelineTest };
        
      } catch (error) {
        console.error('❌ Debug failed:', error);
        return { error: String(error) };
      }
    };
    
    (window as any).testAudioImport = async (filePath: string) => {
      try {
        console.log('🎵 Testing audio import for:', filePath);
        const result = await evalTS("importAndPlaceAudio", filePath, 0);
        console.log('🎵 Import result:', result);
        return result;
      } catch (error) {
        console.error('❌ Import test failed:', error);
        return { success: false, error: String(error) };
      }
    };
    
    console.log('🛠️ Debug functions available in console:');
    console.log('   window.debugAISFX() - Run full debug suite');
    console.log('   window.testAudioImport("/path/to/file.mp3") - Test audio import');
    
    // Reduce polling frequency - rely more on events
    const interval = setInterval(updateTimelineInfo, 10000); // Reduced from 5s to 10s
    
    return () => {
      clearInterval(interval);
      if (timelineUpdateRef.current) {
        clearTimeout(timelineUpdateRef.current);
      }
    };
  }, [loadSettings, updateTimelineInfo]);

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
          placeholder={state.isLookupMode ? "Search existing SFX..." : "Describe your SFX"}
          disabled={state.isGenerating}
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
                state.filteredSFXFiles.map((filename, index) => (
                  <div 
                    key={filename}
                    className={`sfx-dropdown-item ${index === state.selectedDropdownIndex ? 'selected' : ''}`}
                    data-has-number={hasNumberFormat(filename)}
                    onClick={() => handleSFXFileSelect(filename)}
                    onMouseEnter={() => setState(prev => ({ ...prev, selectedDropdownIndex: index }))}
                  >
                    {filename}
                  </div>
                ))
              ) : (
                <div className={`sfx-dropdown-item sfx-dropdown-empty ${state.selectedDropdownIndex === 0 ? 'selected' : ''}`}>
                  {state.prompt.length > 1 ? 'No matching SFX found' : 'Type to search existing SFX...'}
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="menu-buttons">
          <button className="menu-btn" onClick={openSettings} title="Settings">⚙️</button>
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


      {/* Settings Overlay - positioned over text input */}
      {state.showSettings && (
        <div className="settings-overlay-input" onClick={closeSettings}>
          <div className="settings-dropdown-overlay">
            <div className="settings-row">
              <button className="settings-btn" onClick={(e) => {
                e.stopPropagation();
                const newApiKey = prompt('Enter your Eleven Labs API Key:', state.apiKey);
                if (newApiKey !== null) saveApiKey(newApiKey);
                closeSettings();
              }} title="Configure API Key">
                🔑
              </button>
              
              <button className="settings-btn" onClick={(e) => {
                e.stopPropagation();
                const userPath = window.cep_node.global.process.env.HOME || window.cep_node.global.process.env.USERPROFILE;
                const sfxPath = `${userPath}/Desktop/SFX AI`;
                window.cep.util.openURLInDefaultBrowser(`file://${sfxPath}`);
                closeSettings();
              }} title="Open Storage Folder">
                📁
              </button>
              
              <button className="settings-btn" onClick={(e) => {
                e.stopPropagation();
                window.open('https://elevenlabs.io/docs/api-reference', '_blank');
                closeSettings();
              }} title="API Documentation">
                📚
              </button>
              
              <button className="settings-btn" onClick={(e) => {
                e.stopPropagation();
                window.open('https://github.com/your-repo/issues', '_blank');
                closeSettings();
              }} title="Report Bugs">
                🐛
              </button>
              
              <button className="settings-btn" onClick={(e) => {
                e.stopPropagation();
                alert(`AI SFX Generator v2.0.0\n\nBuilt with Bolt CEP\nPowered by Eleven Labs\n\n© 2025 AI SFX`);
                closeSettings();
              }} title="About Plugin">
                ℹ️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};