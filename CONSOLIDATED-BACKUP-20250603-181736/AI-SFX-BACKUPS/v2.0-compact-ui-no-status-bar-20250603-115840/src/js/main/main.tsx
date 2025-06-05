import { useEffect, useState, useCallback, useRef } from "react";
import { evalTS, subscribeBackgroundColor, listenTS } from "../lib/utils/bolt";
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
  filteredSFXFiles: string[];
  showSFXDropdown: boolean;
  selectedDropdownIndex: number;
  promptInfluence: number;
}

interface SFXFileInfo {
  filename: string;
  basename: string;
  number: number;
  prompt: string;
  timestamp: string;
  path: string;
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
    filteredSFXFiles: [],
    showSFXDropdown: false,
    selectedDropdownIndex: -1,
    promptInfluence: 0.5
  });

  const promptRef = useRef<HTMLTextAreaElement>(null);
  const timelineUpdateRef = useRef<NodeJS.Timeout>();

  // Clean up filename for display (remove timestamps, clean up format)
  const formatFileDisplayName = (filename: string): string => {
    // Remove .mp3 extension if present
    let name = filename.replace('.mp3', '');
    
    // Check if it's new format (prompt_001_timestamp) or old format (prompt_timestamp)
    const newFormatMatch = name.match(/^(.+?)_(\d{3})_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
    if (newFormatMatch) {
      // New format: show "prompt (001)"
      const [, prompt, number] = newFormatMatch;
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
    const name = filename.replace('.mp3', '');
    return /^(.+?)_(\d{3})_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/.test(name);
  };

  // Show status in console for debugging
  const showStatus = useCallback((message: string, duration = 0) => {
    console.log('Status:', message);
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
      // Get current timeline info
      const timelineInfo = await evalTS("getSequenceInfo");
      
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
      showStatus('Generating SFX...');
      
      // Generate audio using Eleven Labs API
      const audioData = await generateSFX(state.prompt, duration, state.apiKey, state.promptInfluence);
      
      showStatus('Placing on timeline...');
      
      // Save audio file
      const filePath = await saveAudioFile(audioData, state.prompt);
      console.log('📁 Audio file saved:', filePath);
      
      // Place audio on timeline
      let result: PlacementResult;
      if (placementPosition !== null) {
        console.log('📍 Using In-N-Out placement at:', placementPosition, 'seconds');
        result = await evalTS("importAndPlaceAudioAtTime", filePath, placementPosition, 0);
      } else {
        console.log('📍 Using playhead placement');
        result = await evalTS("importAndPlaceAudio", filePath, 0);
      }
      
      console.log('✅ Timeline placement result:', result);
      
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

  // Generate SFX using Eleven Labs API
  const generateSFX = async (prompt: string, duration: number, apiKey: string, promptInfluence: number): Promise<ArrayBuffer> => {
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

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} - ${error}`);
    }

    return response.arrayBuffer();
  };

  // Get SFX folder path
  const getSFXPath = (): string => {
    const userPath = window.cep_node.global.process.env.HOME || window.cep_node.global.process.env.USERPROFILE;
    return `${userPath}/Desktop/SFX AI`;
  };

  // Scan existing SFX files
  const scanExistingSFXFiles = (): SFXFileInfo[] => {
    const sfxPath = getSFXPath();
    
    if (!fs.existsSync(sfxPath)) {
      return [];
    }
    
    try {
      const files = fs.readdirSync(sfxPath)
        .filter((file: string) => file.endsWith('.mp3'))
        .map((file: string) => {
          const fullPath = `${sfxPath}/${file}`;
          const basename = file.replace('.mp3', '');
          
          // Extract number and prompt from filename patterns
          let number = 0;
          let prompt = basename;
          
          // Pattern 1: prompt_001_timestamp or prompt_1_timestamp 
          const numberMatch = basename.match(/(.+?)_(\d+)_(.+)$/);
          if (numberMatch) {
            prompt = numberMatch[1].replace(/_/g, ' ');
            number = parseInt(numberMatch[2]);
          } else {
            // Pattern 2: prompt_timestamp (legacy)
            const legacyMatch = basename.match(/(.+?)_(.+)$/);
            if (legacyMatch) {
              prompt = legacyMatch[1].replace(/_/g, ' ');
            }
          }
          
          return {
            filename: file,
            basename,
            number,
            prompt: prompt.toLowerCase(),
            timestamp: basename.split('_').pop() || '',
            path: fullPath
          };
        })
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp)); // Most recent first
      
      return files;
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
    
    if (matchingFiles.length === 0) {
      return 1;
    }
    
    const maxNumber = Math.max(...matchingFiles.map(file => file.number || 0));
    return maxNumber + 1;
  };

  // Save audio file with intelligent numbering
  const saveAudioFile = async (audioData: ArrayBuffer, prompt: string): Promise<string> => {
    const sfxPath = getSFXPath();
    
    // Ensure directory exists
    if (!fs.existsSync(sfxPath)) {
      fs.mkdirSync(sfxPath, { recursive: true });
    }
    
    const existingFiles = scanExistingSFXFiles();
    const nextNumber = getNextNumberForPrompt(prompt, existingFiles);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const cleanPrompt = prompt.slice(0, 20).replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/ /g, '_');
    const fileName = `${cleanPrompt}_${nextNumber.toString().padStart(3, '0')}_${timestamp}.mp3`;
    const filePath = `${sfxPath}/${fileName}`;
    
    const buffer = Buffer.from(audioData);
    fs.writeFileSync(filePath, buffer);
    
    return filePath;
  };

  // Handle text input changes
  const handlePromptChange = useCallback((value: string) => {
    // Check if entering lookup mode (space on empty input)
    if (value === ' ' && state.prompt === '') {
      // Trigger lookup mode
      const allFiles = scanExistingSFXFiles().map(f => f.filename.replace('.mp3', ''));
      setState(prev => ({ 
        ...prev, 
        isLookupMode: true, 
        showSFXDropdown: true,
        prompt: ' ', // Keep the space
        existingSFXFiles: allFiles,
        filteredSFXFiles: allFiles,
        selectedDropdownIndex: allFiles.length > 0 ? 0 : -1
      }));
    } else if (state.isLookupMode) {
      // Already in lookup mode - filter based on search term
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
        const existingFiles = scanExistingSFXFiles();
        const filtered = existingFiles
          .filter(file => 
            file.prompt.includes(searchTerm) || 
            file.filename.toLowerCase().includes(searchTerm)
          )
          .map(f => f.filename.replace('.mp3', ''));
        
        setState(prev => ({ 
          ...prev, 
          prompt: value, 
          filteredSFXFiles: filtered,
          selectedDropdownIndex: filtered.length > 0 ? 0 : -1
        }));
      }
    } else {
      // Normal text input mode
      setState(prev => ({ ...prev, prompt: value }));
    }
  }, [state.isLookupMode, state.prompt]);

  // Handle SFX file selection
  const handleSFXFileSelect = useCallback(async (filename: string) => {
    const sfxPath = getSFXPath();
    const filePath = `${sfxPath}/${filename}.mp3`;
    
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
      // Place existing audio on timeline
      const result = await evalTS("importAndPlaceAudio", filePath, 0);
      
      if (result.success) {
        showStatus(`SFX "${filename}" added to timeline!`, 3000);
      } else {
        throw new Error(result.error || 'Failed to place audio');
      }
    } catch (error) {
      console.error('Error placing existing SFX:', error);
      showStatus(`Error: ${error instanceof Error ? error.message : String(error)}`, 4000);
    } finally {
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  }, [showStatus]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Arrow key navigation in lookup mode - prevent default cursor movement
    if (state.isLookupMode && state.showSFXDropdown && state.filteredSFXFiles.length > 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); // Prevent text cursor movement
        e.stopPropagation();
        
        if (e.key === 'ArrowDown') {
          setState(prev => ({
            ...prev,
            selectedDropdownIndex: prev.selectedDropdownIndex < prev.filteredSFXFiles.length - 1 
              ? prev.selectedDropdownIndex + 1 
              : 0 // Wrap to top
          }));
        } else { // ArrowUp
          setState(prev => ({
            ...prev,
            selectedDropdownIndex: prev.selectedDropdownIndex > 0 
              ? prev.selectedDropdownIndex - 1 
              : prev.filteredSFXFiles.length - 1 // Wrap to bottom
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
  }, [handleGenerate, handleSFXFileSelect, state.isLookupMode, state.showSFXDropdown, state.filteredSFXFiles, state.selectedDropdownIndex, state.prompt]);

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
    <div className="ai-sfx-generator" style={{ backgroundColor: bgColor }}>
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
              {state.filteredSFXFiles.length > 0 ? (
                state.filteredSFXFiles.map((filename, index) => (
                  <div 
                    key={filename}
                    className={`sfx-dropdown-item ${index === state.selectedDropdownIndex ? 'selected' : ''}`}
                    data-has-number={hasNumberFormat(filename)}
                    onClick={() => handleSFXFileSelect(filename)}
                    onMouseEnter={() => setState(prev => ({ ...prev, selectedDropdownIndex: index }))}
                  >
                    {formatFileDisplayName(filename)}
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