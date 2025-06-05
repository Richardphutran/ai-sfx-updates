/*
 * AI SFX Generator CEP Plugin - Original Horizontal UI
 * Simple horizontal layout: just input field + 3-dot menu, press Enter to generate
 */

// Global variables
let csInterface;
let sfxInput, menuButton, menuDropdown, statusIndicator, settingsOverlay;
let settingsApiKey, saveSettings, cancelSettings;
let inPointDisplay, outPointDisplay, durationDisplay;
let lengthSlider, lengthValue, autoButton;
let timelineInfo, manualControls;
let inputRow, generationIndicator, generationText;
let isGenerating = false;
let currentDuration = 10;
let useInOutMode = false; // Default to manual mode until user clicks timeline
let manualModeActive = false; // Track if user has interacted with manual controls
let autoMode = true; // Start with auto mode active by default

// ============= ELEVEN LABS API MODULE =============
class ElevenLabsAPI {
    static API_BASE = 'https://api.elevenlabs.io/v1';
    
    static async generateSoundEffect(prompt, duration = 10) {
        if (!window.elevenLabsApiKey) {
            throw new Error('Please set your API key first');
        }

        try {
            const response = await fetch(`${this.API_BASE}/sound-generation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': window.elevenLabsApiKey,
                    'Accept': 'audio/mpeg'
                },
                body: JSON.stringify({
                    text: prompt,
                    duration_seconds: Math.max(1, Math.min(22, duration))
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`API request failed: ${response.status} - ${error}`);
            }

            const audioBlob = await response.blob();
            const arrayBuffer = await audioBlob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            
            return uint8Array;

        } catch (error) {
            console.error('Eleven Labs API error:', error);
            throw error;
        }
    }
}

// ============= FILE MANAGER MODULE =============
class FileManager {
    constructor() {
        this.sfxFolder = null;
    }

    async ensureSfxFolder() {
        try {
            const userPath = csInterface.getSystemPath('userData');
            const sfxPath = userPath + '/Desktop/SFX AI';
            this.sfxFolder = sfxPath;
            
            const fs = require('fs');
            if (!fs.existsSync(sfxPath)) {
                fs.mkdirSync(sfxPath, { recursive: true });
            }
            
            return sfxPath;
        } catch (error) {
            console.error('Error creating SFX folder:', error);
            throw error;
        }
    }

    async saveAudioFile(audioData, prompt) {
        try {
            if (!this.sfxFolder) {
                await this.ensureSfxFolder();
            }
            
            // Get the next available number for this prompt type
            const nextNumber = await this.getNextSfxNumber(prompt);
            
            const cleanPrompt = prompt.slice(0, 30).replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/ /g, '_');
            const fileName = `${nextNumber}_${cleanPrompt}.mp3`;
            const filePath = this.sfxFolder + '/' + fileName;
            
            const fs = require('fs');
            const buffer = Buffer.from(audioData);
            fs.writeFileSync(filePath, buffer);
            
            return filePath;
            
        } catch (error) {
            console.error('Error saving audio file:', error);
            throw error;
        }
    }

    async getNextSfxNumber(prompt) {
        try {
            // Clean the prompt for matching
            const cleanPrompt = prompt.slice(0, 30).replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/ /g, '_');
            
            // Check both local filesystem and Premiere bins for existing numbers
            const localNumbers = await this.scanLocalSfxNumbers(cleanPrompt);
            const binNumbers = await this.scanPremiereBinNumbers(cleanPrompt);
            
            // Combine both sources and find the highest number
            const allNumbers = [...localNumbers, ...binNumbers];
            const maxNumber = allNumbers.length > 0 ? Math.max(...allNumbers) : 0;
            
            return maxNumber + 1;
            
        } catch (error) {
            console.error('Error getting next SFX number:', error);
            return 1; // Fallback to 1 if anything fails
        }
    }

    async scanLocalSfxNumbers(cleanPrompt) {
        try {
            if (!this.sfxFolder) {
                return [];
            }
            
            const fs = require('fs');
            if (!fs.existsSync(this.sfxFolder)) {
                return [];
            }
            
            const files = fs.readdirSync(this.sfxFolder);
            const numbers = [];
            
            // Pattern: number_prompt.mp3
            const pattern = new RegExp(`^(\\d+)_${cleanPrompt}\\.mp3$`, 'i');
            
            for (const file of files) {
                const match = file.match(pattern);
                if (match) {
                    numbers.push(parseInt(match[1]));
                }
            }
            
            return numbers;
            
        } catch (error) {
            console.error('Error scanning local SFX numbers:', error);
            return [];
        }
    }

    async scanPremiereBinNumbers(cleanPrompt) {
        try {
            // Ask ExtendScript to scan the AI SFX bin for existing files with this prompt
            const result = await TimelineManager.executeScript(`scanAiSfxBinForNumbers("${cleanPrompt}")`);
            
            if (result && Array.isArray(result.numbers)) {
                return result.numbers;
            }
            
            return [];
            
        } catch (error) {
            console.error('Error scanning Premiere bin numbers:', error);
            return [];
        }
    }
}

// ============= TIMELINE MANAGER MODULE =============
class TimelineManager {
    static async executeScript(script) {
        return new Promise((resolve, reject) => {
            csInterface.evalScript(script, (result) => {
                try {
                    if (result === 'EvalScript error.' || result === '' || result === 'undefined') {
                        reject(new Error(`ExtendScript execution failed`));
                        return;
                    }
                    
                    try {
                        const parsed = JSON.parse(result);
                        resolve(parsed);
                    } catch (parseError) {
                        resolve(result);
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    async importAndPlaceAudio(filePath) {
        // Always use first available audio track (track 0)
        const script = `importAndPlaceAudio(\"${filePath}\", 0)`;
        const result = await TimelineManager.executeScript(script);
        
        if (typeof result === 'object' && result.success !== undefined) {
            if (result.success) {
                return result;
            } else {
                throw new Error(result.error || 'Failed to place audio');
            }
        } else {
            throw new Error(`Unexpected response: ${result}`);
        }
    }
}

// ============= MAIN PLUGIN CODE =============

document.addEventListener('DOMContentLoaded', () => {
    console.log('AI SFX Generator - Original Horizontal UI loaded');
    
    csInterface = new CSInterface();
    
    // Immediate test - write a file to confirm plugin is loading
    try {
        const fs = require('fs');
        const testData = {
            timestamp: new Date().toISOString(),
            message: "Plugin successfully loaded and running",
            csInterfaceExists: !!csInterface,
            nodeJsWorking: true
        };
        fs.writeFileSync('/Users/richardtran/Desktop/plugin-status.json', JSON.stringify(testData, null, 2));
        console.log('Plugin status written to desktop');
    } catch (error) {
        console.log('Failed to write plugin status:', error);
    }
    
    initializeUI();
    loadSettings();
});

function initializeUI() {
    // Get elements
    sfxInput = document.getElementById('sfxInput');
    menuButton = document.getElementById('menuButton');
    menuDropdown = document.getElementById('menuDropdown');
    statusIndicator = document.getElementById('statusIndicator');
    settingsOverlay = document.getElementById('settingsOverlay');
    settingsApiKey = document.getElementById('settingsApiKey');
    saveSettings = document.getElementById('saveSettings');
    cancelSettings = document.getElementById('cancelSettings');
    inputRow = document.querySelector('.input-row');
    
    // Timeline elements
    inPointDisplay = document.getElementById('inPointDisplay');
    outPointDisplay = document.getElementById('outPointDisplay');
    durationDisplay = document.getElementById('durationDisplay');
    lengthSlider = document.getElementById('lengthSlider');
    lengthValue = document.getElementById('lengthValue');
    autoButton = document.getElementById('autoButton');
    
    // Interactive elements
    timelineInfo = document.getElementById('timelineInfo');
    manualControls = document.getElementById('manualControls');
    
    // Generation indicator elements
    generationIndicator = document.getElementById('generationIndicator');
    generationText = document.querySelector('.generation-text');

    // Main input event listener - Enter to generate (exactly like the original)
    sfxInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isGenerating && sfxInput.value.trim()) {
                handleGenerate();
            }
        }
    });

    // Auto-resize textarea to fit content
    sfxInput.addEventListener('input', () => {
        sfxInput.style.height = 'auto';
        sfxInput.style.height = Math.min(100, Math.max(48, sfxInput.scrollHeight)) + 'px';
    });

    // Menu button - show/hide dropdown with overlay effect
    menuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const isShowing = menuDropdown.classList.contains('show');
        
        if (isShowing) {
            // Hide menu
            menuDropdown.classList.remove('show');
            inputRow.classList.remove('menu-active');
        } else {
            // Show menu
            menuDropdown.classList.add('show');
            inputRow.classList.add('menu-active');
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!menuButton.contains(e.target) && !menuDropdown.contains(e.target)) {
            menuDropdown.classList.remove('show');
            inputRow.classList.remove('menu-active');
        }
    });

    // Menu item clicks
    menuDropdown.addEventListener('click', (e) => {
        if (e.target.classList.contains('menu-item')) {
            const action = e.target.getAttribute('data-action');
            menuDropdown.classList.remove('show');
            inputRow.classList.remove('menu-active');
            
            switch (action) {
                case 'settings':
                    showSettings();
                    break;
                case 'about':
                    showStatus('AI SFX Generator v1.0 - Press Enter to generate!', 3000);
                    break;
                case 'debug':
                    runDebug();
                    break;
                case 'deep-debug':
                    deepDebugInOutWorkflow();
                    break;
                case 'clear':
                    clearCache();
                    break;
            }
        }
    });

    // Settings overlay events
    saveSettings.addEventListener('click', saveApiKey);
    cancelSettings.addEventListener('click', hideSettings);
    
    // Close settings when clicking outside modal
    settingsOverlay.addEventListener('click', (e) => {
        if (e.target === settingsOverlay) {
            hideSettings();
        }
    });


    // Timeline info click - activate in/out mode
    timelineInfo.addEventListener('click', () => {
        useInOutMode = true;
        manualModeActive = false;
        autoMode = false;
        timelineInfo.classList.add('active');
        manualControls.classList.remove('active');
        autoButton.classList.remove('active');
        
        console.log('🎯 IN-OUT MODE ACTIVATED');
        console.log('📊 UI STATE:', {
            useInOutMode,
            manualModeActive, 
            autoMode,
            currentDuration,
            timelineInfoHasActiveClass: timelineInfo.classList.contains('active')
        });
    });
    
    // Manual controls interaction - activate manual mode
    const activateManualMode = () => {
        useInOutMode = false;
        manualModeActive = true;
        autoMode = false;
        manualControls.classList.add('active');
        timelineInfo.classList.remove('active');
        autoButton.classList.remove('active');
        console.log('Activated manual duration mode');
    };
    
    // Slider interaction
    lengthSlider.addEventListener('input', (e) => {
        activateManualMode();
        currentDuration = parseInt(e.target.value);
        lengthValue.textContent = currentDuration + 's';
    });
    
    lengthSlider.addEventListener('mousedown', activateManualMode);
    lengthSlider.addEventListener('focus', activateManualMode);
    
    // Manual controls click
    manualControls.addEventListener('click', activateManualMode);
    
    // Auto button click - activate auto mode
    if (autoButton) {
        autoButton.addEventListener('click', () => {
            useInOutMode = false;
            manualModeActive = false;
            autoMode = true;
            timelineInfo.classList.remove('active');
            manualControls.classList.remove('active');
            autoButton.classList.add('active');
            console.log('Activated auto duration mode');
        });
    }


    // Initialize UI state - auto mode active by default
    timelineInfo.classList.remove('active');
    manualControls.classList.remove('active');
    autoButton.classList.add('active');

    // Initialize ExtendScript and timeline monitoring
    loadExtendScript();
    updateTimelineInfo();
    setupTimelineEventListeners(); // Event-driven updates instead of polling
}

async function loadSettings() {
    try {
        const apiKey = localStorage.getItem('elevenLabsApiKey');
        if (apiKey) {
            window.elevenLabsApiKey = apiKey;
            showStatus('Ready', 1000);
        } else {
            showStatus('Click ⚙️ to set API key', 3000);
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function handleGenerate() {
    const prompt = sfxInput.value.trim();
    if (!prompt) return;

    if (!window.elevenLabsApiKey) {
        showStatus('Please set your API key first', 3000);
        showSettings();
        return;
    }

    // Start generation
    isGenerating = true;
    sfxInput.classList.add('loading');
    showGenerationIndicator('Detecting timeline...');
    showStatus('Detecting timeline...', 0);

    try {
        // First, get current timeline info to check for in/out points
        const timelineInfo = await TimelineManager.executeScript('getSequenceInfo()');
        
        let duration = currentDuration;
        let placementPosition = null;
        
        // Check mode and handle duration logic
        console.log('🧪 CONDITION BREAKDOWN:');
        console.log('useInOutMode:', useInOutMode);
        console.log('timelineInfo exists:', !!timelineInfo);
        console.log('timelineInfo.success:', timelineInfo?.success);
        console.log('timelineInfo.hasInPoint:', timelineInfo?.hasInPoint);
        console.log('timelineInfo.hasOutPoint:', timelineInfo?.hasOutPoint);
        console.log('timelineInfo RAW:', JSON.stringify(timelineInfo, null, 2));

        const allConditionsMet = useInOutMode && timelineInfo && timelineInfo.success && timelineInfo.hasInPoint && timelineInfo.hasOutPoint;
        console.log('🎯 ALL CONDITIONS MET:', allConditionsMet);
        
        if (useInOutMode && timelineInfo && timelineInfo.success && timelineInfo.hasInPoint && timelineInfo.hasOutPoint) {
            const inPointSeconds = timelineInfo.inPoint.seconds;
            const outPointSeconds = timelineInfo.outPoint.seconds;
            const timelineDuration = outPointSeconds - inPointSeconds;
            
            console.log('=== DETECTED USER TIMELINE VALUES ===');
            console.log(`IN POINT: ${timelineInfo.inPoint.formatted} (${inPointSeconds}s)`);
            console.log(`OUT POINT: ${timelineInfo.outPoint.formatted} (${outPointSeconds}s)`);
            console.log(`DURATION: ${timelineInfo.duration.formatted} (${timelineDuration}s)`);
            console.log('=== WILL PLACE SFX AT IN POINT ===');
            
            // Check if timeline duration exceeds API limit
            if (timelineDuration > 22) {
                // Duration too long - block generation and show error
                sfxInput.classList.add('error');
                setTimeout(() => sfxInput.classList.remove('error'), 500);
                showStatus(`Timeline duration too long (${Math.round(timelineDuration)}s). Maximum is 22s for AI generation.`, 4000);
                hideGenerationIndicator();
                isGenerating = false;
                sfxInput.classList.remove('loading');
                return; // Exit early - don't generate
            } else if (timelineDuration > 0) {
                // Valid duration - use exact timeline duration for precise fit
                duration = Math.min(timelineDuration, 22); // Use exact duration, capped at 22s
                placementPosition = inPointSeconds;
                showStatus(`Using in/out points: ${timelineInfo.inPoint.formatted} to ${timelineInfo.outPoint.formatted} (${duration.toFixed(1)}s) - AI may vary slightly`, 2000);
            } else {
                // Invalid duration (negative or zero)
                showStatus(`Invalid timeline selection. Please set valid in/out points.`, 3000);
                hideGenerationIndicator();
                isGenerating = false;
                sfxInput.classList.remove('loading');
                return;
            }
        } else {
            // Use manual duration when not in in/out mode or no in/out points
            duration = currentDuration;
            if (useInOutMode && !manualModeActive) {
                showStatus(`No in/out points set - using manual duration ${duration}s`, 2000);
            } else if (manualModeActive) {
                showStatus(`Manual mode: Using ${duration}s`, 500);
            } else {
                showStatus(`Using default duration ${duration}s`, 500);
            }
        }
        
        console.log('🚀 STARTING GENERATION:', { prompt, duration, placementPosition });
        updateGenerationIndicator('Generating SFX with AI...');
        showStatus('Generating SFX...', 0);
        
        // Generate sound effect
        console.log('📡 Calling Eleven Labs API...');
        const audioData = await ElevenLabsAPI.generateSoundEffect(prompt, duration);
        
        updateGenerationIndicator('Placing on timeline...');
        showStatus('Placing on timeline...', 0);
        
        // Save audio file
        console.log('💾 Saving audio file...');
        const fileManager = new FileManager();
        const filePath = await fileManager.saveAudioFile(audioData, prompt);
        console.log('📁 Audio file saved:', filePath);
        
        // Import and place audio with smart track placement
        console.log('🎬 Placing on timeline...', { placementPosition });
        let result;
        if (placementPosition !== null) {
            // Use In-N-Out placement: Call the proper function that handles time objects correctly
            console.log('📍 Using In-N-Out placement at:', placementPosition, 'seconds');
            
            try {
                // Use the proper function from safe-timeline.jsx that handles time object creation
                const script = `importAndPlaceAudioAtTimeWithSmartTracks("${filePath}", 0, ${placementPosition})`;
                result = await TimelineManager.executeScript(script);
                
                if (typeof result === 'object' && result.success !== undefined) {
                    if (!result.success) {
                        throw new Error(result.error || 'Failed to place audio at specific time');
                    }
                } else {
                    throw new Error(`Unexpected response: ${result}`);
                }
            } catch (scriptError) {
                console.log('❌ In/Out placement failed:', scriptError);
                // Fallback to regular placement at playhead
                const timelineManager = new TimelineManager();
                result = await timelineManager.importAndPlaceAudio(filePath);
            }
        } else {
            // Use standard placement at playhead (existing smart track logic)
            console.log('📍 Using playhead placement');
            const timelineManager = new TimelineManager();
            result = await timelineManager.importAndPlaceAudio(filePath);
        }
        console.log('✅ Timeline placement result:', result);
        
        // Success! Clear input and show feedback
        sfxInput.value = '';
        sfxInput.style.height = '48px';
        sfxInput.classList.add('success');
        setTimeout(() => sfxInput.classList.remove('success'), 600);
        hideGenerationIndicator();
        
        if (placementPosition !== null) {
            // Enhanced status message for In-N-Out mode with smart track info
            let statusMsg = `SFX placed at ${timelineInfo.inPoint.formatted}`;
            if (result && result.message) {
                // Extract track info from result message
                if (result.message.includes('track')) {
                    const trackMatch = result.message.match(/track (\d+)/);
                    if (trackMatch) {
                        statusMsg += ` on track ${trackMatch[1]}`;
                    }
                }
                if (result.message.includes('new track created')) {
                    statusMsg += ' (new track)';
                } else if (result.message.includes('avoided conflicts')) {
                    statusMsg += ' (avoided conflicts)';
                }
            }
            statusMsg += ' - Duration may vary due to AI generation';
            showStatus(statusMsg, 4000);
        } else {
            showStatus('Added to timeline!', 2000);
        }

    } catch (error) {
        console.error('Generation error:', error);
        sfxInput.classList.add('error');
        setTimeout(() => sfxInput.classList.remove('error'), 500);
        showStatus(`Error: ${error.message}`, 4000);
    } finally {
        isGenerating = false;
        sfxInput.classList.remove('loading');
        hideGenerationIndicator();
    }
}

function showSettings() {
    if (window.elevenLabsApiKey) {
        settingsApiKey.value = window.elevenLabsApiKey;
    }
    settingsOverlay.classList.add('show');
    setTimeout(() => settingsApiKey.focus(), 100);
}

function hideSettings() {
    settingsOverlay.classList.remove('show');
}

function saveApiKey() {
    const apiKey = settingsApiKey.value.trim();
    if (!apiKey) {
        showStatus('Please enter a valid API key', 3000);
        return;
    }

    localStorage.setItem('elevenLabsApiKey', apiKey);
    window.elevenLabsApiKey = apiKey;
    hideSettings();
    showStatus('API key saved!', 2000);
}

function showStatus(message, duration = 0) {
    statusIndicator.textContent = message;
    statusIndicator.classList.add('show');
    
    if (duration > 0) {
        setTimeout(() => {
            statusIndicator.classList.remove('show');
        }, duration);
    }
}

function showGenerationIndicator(text = 'Generating SFX...') {
    if (generationIndicator && generationText) {
        generationText.textContent = text;
        generationIndicator.classList.add('show');
    }
}

function updateGenerationIndicator(text) {
    if (generationText) {
        generationText.textContent = text;
    }
}

function hideGenerationIndicator() {
    if (generationIndicator) {
        generationIndicator.classList.remove('show');
    }
}

async function loadExtendScript() {
    try {
        // Test basic ExtendScript
        const testResult = await new Promise((resolve) => {
            csInterface.evalScript('1+1', resolve);
        });
        
        if (testResult === '2') {
            // Load our timeline script
            const extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION);
            const jsxPath = extensionPath + '/jsx/safe-timeline.jsx';
            
            await new Promise((resolve) => {
                csInterface.evalScript(`$.evalFile(\"${jsxPath}\")`, resolve);
            });
            
            console.log('ExtendScript loaded successfully');
        }
    } catch (error) {
        console.error('ExtendScript load error:', error);
        showStatus('ExtendScript failed to load', 3000);
    }
}

async function runDebug() {
    try {
        showStatus('Debugging timeline...', 0);
        
        const result = await TimelineManager.executeScript('getSequenceInfo()');
        
        if (result && result.success) {
            console.log('=== TIMELINE DEBUG INFO ===');
            console.log('Sequence:', result.sequenceName);
            console.log('Audio Tracks:', result.audioTrackCount);
            console.log('Has In Point:', result.hasInPoint);
            console.log('Has Out Point:', result.hasOutPoint);
            
            if (result.hasInPoint) {
                console.log('IN POINT:', result.inPoint.formatted, '(' + result.inPoint.seconds + 's)');
            } else {
                console.log('IN POINT: Not set');
            }
            
            if (result.hasOutPoint) {
                console.log('OUT POINT:', result.outPoint.formatted, '(' + result.outPoint.seconds + 's)');
            } else {
                console.log('OUT POINT: Not set');
            }
            
            if (result.hasDuration) {
                console.log('DURATION:', result.duration.formatted, '(' + result.duration.seconds + 's)');
            } else {
                console.log('DURATION: Not calculated');
            }
            
            console.log('Playhead Position:', result.playhead ? result.playhead.formatted : 'Unknown');
            console.log('=== END DEBUG INFO ===');
            
            // Show detailed status with actual values
            let statusMsg = `${result.sequenceName} - `;
            if (result.hasInPoint && result.hasOutPoint) {
                statusMsg += `In: ${result.inPoint.formatted} Out: ${result.outPoint.formatted} Duration: ${result.duration.formatted}`;
            } else if (result.hasInPoint) {
                statusMsg += `In: ${result.inPoint.formatted} (no out point)`;
            } else if (result.hasOutPoint) {
                statusMsg += `Out: ${result.outPoint.formatted} (no in point)`;
            } else {
                statusMsg += 'No in/out points set on timeline';
            }
            showStatus(statusMsg, 8000);
            
            // Also alert the values for immediate visibility
            if (result.hasInPoint && result.hasOutPoint) {
                alert(`DETECTED YOUR TIMELINE VALUES:\n\nIn Point: ${result.inPoint.formatted} (${result.inPoint.seconds}s)\nOut Point: ${result.outPoint.formatted} (${result.outPoint.seconds}s)\nDuration: ${result.duration.formatted} (${result.duration.seconds}s)`);
            } else {
                alert(`TIMELINE STATUS:\n\nIn Point: ${result.hasInPoint ? result.inPoint.formatted : 'NOT SET'}\nOut Point: ${result.hasOutPoint ? result.outPoint.formatted : 'NOT SET'}\n\nPlease set both in and out points on your timeline first.`);
            }
        } else {
            console.error('Debug failed:', result);
            showStatus('Timeline debug failed', 3000);
        }
    } catch (error) {
        console.error('Debug error:', error);
        showStatus(`Debug error: ${error.message}`, 4000);
    }
}

async function deepDebugInOutWorkflow() {
    console.log('🚀 === DEEP DEBUG SESSION START ===');
    
    // Step 1: Capture current UI state
    console.log('📱 UI STATE SNAPSHOT:');
    console.log({
        useInOutMode,
        manualModeActive,
        autoMode,
        currentDuration,
        timelineInfoActive: timelineInfo.classList.contains('active'),
        manualControlsActive: manualControls.classList.contains('active'),
        autoButtonActive: autoButton.classList.contains('active')
    });
    
    // Step 2: Test ExtendScript communication
    console.log('🔌 TESTING EXTENDSCRIPT COMMUNICATION:');
    try {
        const basicTest = await TimelineManager.executeScript('1+1');
        console.log('Basic test result:', basicTest);
        
        const appTest = await TimelineManager.executeScript('typeof app');
        console.log('App availability:', appTest);
        
        const sequenceTest = await TimelineManager.executeScript('app.project && app.project.activeSequence ? "sequence_exists" : "no_sequence"');
        console.log('Sequence test:', sequenceTest);
    } catch (error) {
        console.log('❌ ExtendScript communication failed:', error);
        return;
    }
    
    // Step 3: Get comprehensive timeline info
    console.log('📊 GETTING COMPREHENSIVE TIMELINE DATA:');
    try {
        const rawTimelineInfo = await TimelineManager.executeScript('getSequenceInfo()');
        console.log('Raw timeline response:', rawTimelineInfo);
        
        // Test each condition that leads to failure
        if (rawTimelineInfo) {
            console.log('Timeline info exists: ✅');
            if (rawTimelineInfo.success) {
                console.log('Timeline success flag: ✅');
                console.log('Has in point flag:', rawTimelineInfo.hasInPoint);
                console.log('Has out point flag:', rawTimelineInfo.hasOutPoint);
                console.log('In point data:', rawTimelineInfo.inPoint);
                console.log('Out point data:', rawTimelineInfo.outPoint);
            } else {
                console.log('❌ Timeline success flag: FALSE - Error:', rawTimelineInfo.error);
            }
        } else {
            console.log('❌ Timeline info is null/undefined');
        }
    } catch (error) {
        console.log('❌ Timeline info retrieval failed:', error);
    }
    
    // Step 4: Test raw Premiere in/out point access
    console.log('🎬 TESTING RAW PREMIERE IN/OUT POINT ACCESS:');
    try {
        const rawInOut = await TimelineManager.executeScript(`
            try {
                var seq = app.project.activeSequence;
                var result = {
                    sequenceName: seq.name,
                    rawInPoint: seq.getInPoint(),
                    rawOutPoint: seq.getOutPoint(),
                    inPointType: typeof seq.getInPoint(),
                    outPointType: typeof seq.getOutPoint(),
                    inPointString: String(seq.getInPoint()),
                    outPointString: String(seq.getOutPoint()),
                    inPointParsed: parseFloat(seq.getInPoint()),
                    outPointParsed: parseFloat(seq.getOutPoint()),
                    inPointIsNaN: isNaN(parseFloat(seq.getInPoint())),
                    outPointIsNaN: isNaN(parseFloat(seq.getOutPoint())),
                    hasInPointMethod: typeof seq.getInPoint,
                    hasOutPointMethod: typeof seq.getOutPoint
                };
                JSON.stringify(result);
            } catch (e) {
                JSON.stringify({ error: e.toString() });
            }
        `);
        console.log('🔬 Raw in/out data:', rawInOut);
    } catch (error) {
        console.log('❌ Raw in/out test failed:', error);
    }
    
    // Step 5: Test the exact condition chain from handleGenerate
    console.log('🧪 TESTING EXACT CONDITION CHAIN:');
    try {
        const timelineInfo = await TimelineManager.executeScript('getSequenceInfo()');
        
        console.log('🧪 CONDITION BREAKDOWN:');
        console.log('useInOutMode:', useInOutMode);
        console.log('timelineInfo exists:', !!timelineInfo);
        console.log('timelineInfo.success:', timelineInfo?.success);
        console.log('timelineInfo.hasInPoint:', timelineInfo?.hasInPoint);
        console.log('timelineInfo.hasOutPoint:', timelineInfo?.hasOutPoint);
        
        const allConditionsMet = useInOutMode && timelineInfo && timelineInfo.success && timelineInfo.hasInPoint && timelineInfo.hasOutPoint;
        console.log('🎯 ALL CONDITIONS MET:', allConditionsMet);
        
        if (!allConditionsMet) {
            console.log('❌ CONDITION FAILURE ANALYSIS:');
            if (!useInOutMode) console.log('   - useInOutMode is FALSE');
            if (!timelineInfo) console.log('   - timelineInfo is null/undefined');
            if (timelineInfo && !timelineInfo.success) console.log('   - timelineInfo.success is FALSE');
            if (timelineInfo && !timelineInfo.hasInPoint) console.log('   - timelineInfo.hasInPoint is FALSE');
            if (timelineInfo && !timelineInfo.hasOutPoint) console.log('   - timelineInfo.hasOutPoint is FALSE');
        }
        
        // Also test what duration and placement would be calculated
        if (allConditionsMet) {
            const inPointSeconds = timelineInfo.inPoint.seconds;
            const outPointSeconds = timelineInfo.outPoint.seconds;
            const timelineDuration = outPointSeconds - inPointSeconds;
            
            console.log('📏 CALCULATED VALUES:');
            console.log('inPointSeconds:', inPointSeconds);
            console.log('outPointSeconds:', outPointSeconds);
            console.log('timelineDuration:', timelineDuration);
            console.log('would use duration:', Math.round(timelineDuration));
            console.log('would place at position:', inPointSeconds);
        }
        
    } catch (error) {
        console.log('❌ Condition chain test failed:', error);
    }
    
    console.log('✅ === DEEP DEBUG SESSION COMPLETE ===');
    
    // Show user-friendly summary
    showStatus('Deep debug complete - check console for detailed results', 5000);
}

function clearCache() {
    try {
        const apiKey = localStorage.getItem('elevenLabsApiKey');
        localStorage.clear();
        if (apiKey) {
            localStorage.setItem('elevenLabsApiKey', apiKey);
            window.elevenLabsApiKey = apiKey;
        }
        showStatus('Cache cleared!', 2000);
    } catch (error) {
        showStatus('Error clearing cache', 3000);
    }
}

async function updateTimelineInfo() {
    try {
        const result = await TimelineManager.executeScript('getSequenceInfo()');
        
        if (result && result.success) {
            // Store timeline values globally for debugging
            window.currentTimelineValues = result;
            
            // Update in point
            if (result.hasInPoint && result.inPoint && result.inPoint.formatted) {
                inPointDisplay.textContent = result.inPoint.formatted;
                inPointDisplay.classList.add('has-value');
            } else {
                inPointDisplay.textContent = '--:--';
                inPointDisplay.classList.remove('has-value');
            }
            
            // Update out point
            if (result.hasOutPoint && result.outPoint && result.outPoint.formatted) {
                outPointDisplay.textContent = result.outPoint.formatted;
                outPointDisplay.classList.add('has-value');
            } else {
                outPointDisplay.textContent = '--:--';
                outPointDisplay.classList.remove('has-value');
            }
            
            // Update duration with red warning for excessive length
            if (result.hasDuration && result.duration && result.duration.formatted) {
                durationDisplay.textContent = result.duration.formatted;
                durationDisplay.classList.add('has-value');
                
                // Add red warning if duration exceeds 22s and in In-N-Out mode
                if (useInOutMode && result.duration.seconds > 22) {
                    timelineInfo.classList.add('duration-warning');
                    durationDisplay.classList.add('duration-warning');
                } else {
                    timelineInfo.classList.remove('duration-warning');
                    durationDisplay.classList.remove('duration-warning');
                }
            } else {
                durationDisplay.textContent = '--:--';
                durationDisplay.classList.remove('has-value');
                timelineInfo.classList.remove('duration-warning');
                durationDisplay.classList.remove('duration-warning');
            }
            
            // Log timeline values only when they change
            if (result.hasInPoint && result.hasOutPoint) {
                const currentValues = `${result.inPoint.seconds},${result.outPoint.seconds}`;
                if (window.lastTimelineValues !== currentValues) {
                    window.lastTimelineValues = currentValues;
                    console.log('=== TIMELINE VALUES CHANGED ===');
                    console.log(`IN POINT: ${result.inPoint.formatted} (${result.inPoint.seconds}s)`);
                    console.log(`OUT POINT: ${result.outPoint.formatted} (${result.outPoint.seconds}s)`);
                    console.log(`DURATION: ${result.duration.formatted} (${result.duration.seconds}s)`);
                    console.log('=== END VALUES ===');
                }
                
                // Write timeline values to a file for external access
                try {
                    const fs = require('fs');
                    const timelineData = {
                        timestamp: new Date().toISOString(),
                        inPoint: {
                            formatted: result.inPoint.formatted,
                            seconds: result.inPoint.seconds
                        },
                        outPoint: {
                            formatted: result.outPoint.formatted,
                            seconds: result.outPoint.seconds
                        },
                        duration: {
                            formatted: result.duration.formatted,
                            seconds: result.duration.seconds
                        }
                    };
                    
                    const filePath = '/Users/richardtran/Desktop/timeline-values.json';
                    fs.writeFileSync(filePath, JSON.stringify(timelineData, null, 2));
                    console.log('Timeline values written to:', filePath);
                } catch (writeError) {
                    console.log('Failed to write timeline values to file:', writeError);
                }
            }
        }
    } catch (error) {
        // Silently fail for timeline updates
        console.log('Timeline update failed:', error);
    }
}

function setupTimelineEventListeners() {
    try {
        // Register for Premiere Pro specific events
        console.log('Registering for Premiere Pro timeline events...');
        
        // Try all possible Premiere Pro event types
        const premiereEvents = [
            'com.adobe.premiereProEvents.sequenceChanged',
            'com.adobe.premiereProEvents.sequenceSelection',
            'com.adobe.premiereProEvents.inOutPointsChanged',
            'com.adobe.premiereProEvents.playheadMoved',
            'com.adobe.csxs.events.ApplicationActivate',
            'com.adobe.csxs.events.ApplicationActivated',
            'com.adobe.csxs.events.ThemeColorChanged',
            'applicationactivated',
            'timelinechanged',
            'selectionchanged'
        ];
        
        premiereEvents.forEach(eventType => {
            try {
                csInterface.addEventListener(eventType, (event) => {
                    console.log(`Premiere event received: ${eventType}`, event);
                    setTimeout(updateTimelineInfo, 50);
                });
            } catch (e) {
                console.log(`Failed to register event: ${eventType}`);
            }
        });
        
        // Deep dive into Premiere Pro's actual event system
        csInterface.evalScript(`
            try {
                var registeredEvents = [];
                
                // Try to register for ALL possible Premiere events
                var eventTypes = [
                    "afterSequenceChanged",
                    "beforeSequenceChanged", 
                    "onSequenceActivated",
                    "onSequenceDeactivated",
                    "onTimelineChanged",
                    "onPlayheadChanged",
                    "onInPointChanged",
                    "onOutPointChanged",
                    "onSelectionChanged",
                    "afterProjectChanged",
                    "onApplicationActivated",
                    "onApplicationDeactivated"
                ];
                
                // Try each event type
                for (var i = 0; i < eventTypes.length; i++) {
                    try {
                        var eventType = eventTypes[i];
                        
                        // Try app.bind() method
                        if (typeof app.bind === 'function') {
                            app.bind(eventType, function(eventName) {
                                return function() {
                                    var event = new CSXSEvent();
                                    event.type = "timeline.event";
                                    event.data = eventName + " fired";
                                    event.dispatch();
                                };
                            }(eventType));
                            registeredEvents.push(eventType + " (app.bind)");
                        }
                        
                        // Try app.addEventListener() method
                        if (typeof app.addEventListener === 'function') {
                            app.addEventListener(eventType, function(eventName) {
                                return function() {
                                    var event = new CSXSEvent();
                                    event.type = "timeline.event"; 
                                    event.data = eventName + " addEventListener fired";
                                    event.dispatch();
                                };
                            }(eventType));
                            registeredEvents.push(eventType + " (addEventListener)");
                        }
                        
                    } catch(innerE) {
                        // Silently continue trying other events
                    }
                }
                
                // Try to hook into sequence object directly
                if (app.project && app.project.activeSequence) {
                    var seq = app.project.activeSequence;
                    
                    // Try to add event listeners to sequence
                    if (typeof seq.addEventListener === 'function') {
                        var seqEvents = ["change", "update", "modified", "inPointChanged", "outPointChanged"];
                        for (var j = 0; j < seqEvents.length; j++) {
                            try {
                                seq.addEventListener(seqEvents[j], function(eventName) {
                                    return function() {
                                        var event = new CSXSEvent();
                                        event.type = "timeline.event";
                                        event.data = "sequence." + eventName + " fired";
                                        event.dispatch();
                                    };
                                }(seqEvents[j]));
                                registeredEvents.push("sequence." + seqEvents[j]);
                            } catch(seqE) {
                                // Continue trying
                            }
                        }
                    }
                }
                
                JSON.stringify({
                    success: true,
                    registeredEvents: registeredEvents,
                    totalAttempts: eventTypes.length,
                    appMethods: {
                        bind: typeof app.bind,
                        addEventListener: typeof app.addEventListener
                    }
                });
                
            } catch(e) {
                JSON.stringify({
                    success: false,
                    error: e.toString(),
                    registeredEvents: registeredEvents || []
                });
            }
        `, (result) => {
            console.log('🔍 Deep Premiere event registration result:', result);
            try {
                const parsed = JSON.parse(result);
                if (parsed.registeredEvents && parsed.registeredEvents.length > 0) {
                    console.log('✅ Successfully registered events:', parsed.registeredEvents);
                } else {
                    console.log('❌ No events could be registered. Available methods:', parsed.appMethods);
                }
            } catch (e) {
                console.log('Raw result:', result);
            }
        });
        
        // WORKING SOLUTION: Use onProjectChanged events
        csInterface.addEventListener('sequence.activity', (event) => {
            console.log('🎯 SEQUENCE ACTIVITY:', event.data);
            
            // onProjectChanged fires when in/out points change!
            if (event.data.includes('onProjectChanged')) {
                console.log('⚡ Project changed - updating timeline!');
                updateTimelineInfo();
            }
        });
        
        // Simple focus-based detection (since Premiere events don't fire)
        window.addEventListener('focus', () => {
            console.log('Plugin focused - checking timeline');
            updateTimelineInfo();
        });
        
        console.log('✅ Focus-based timeline detection setup complete');
        
    } catch (error) {
        console.error('Error setting up timeline event listeners:', error);
    }
}

// Global function to get timeline values for automation
async function getTimelineValues() {
    try {
        const result = await TimelineManager.executeScript('getSequenceInfo()');
        
        if (result && result.success && result.hasInPoint && result.hasOutPoint) {
            const values = {
                inPoint: {
                    formatted: result.inPoint.formatted,
                    seconds: result.inPoint.seconds
                },
                outPoint: {
                    formatted: result.outPoint.formatted,
                    seconds: result.outPoint.seconds
                },
                duration: {
                    formatted: result.duration.formatted,
                    seconds: result.duration.seconds
                }
            };
            
            console.log('AUTOMATION_RESULT:', JSON.stringify(values));
            return values;
        } else {
            console.log('AUTOMATION_RESULT: NO_INOUT_POINTS');
            return null;
        }
    } catch (error) {
        console.log('AUTOMATION_ERROR:', error.message);
        return null;
    }
}

function parseTimeToSeconds(timeString) {
    if (!timeString || timeString === '--:--') return 0;
    
    try {
        const parts = timeString.split(':');
        if (parts.length === 2) {
            // MM:SS format
            return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        } else if (parts.length === 3) {
            // HH:MM:SS format
            return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
        }
    } catch (e) {
        return 0;
    }
    return 0;
}