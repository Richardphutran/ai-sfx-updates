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
let inputRow;
let isGenerating = false;
let currentDuration = 10;
let autoMode = true;

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
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const cleanPrompt = prompt.slice(0, 30).replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/ /g, '_');
            const fileName = `${cleanPrompt}_${timestamp}.mp3`;
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

    // Length slider controls
    lengthSlider.addEventListener('input', (e) => {
        currentDuration = parseInt(e.target.value);
        lengthValue.textContent = currentDuration + 's';
        // Disable auto mode when manually adjusting slider
        if (autoMode) {
            autoMode = false;
            autoButton.classList.remove('active');
        }
    });

    // Auto button toggle
    autoButton.addEventListener('click', () => {
        autoMode = !autoMode;
        if (autoMode) {
            autoButton.classList.add('active');
        } else {
            autoButton.classList.remove('active');
        }
    });

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
    showStatus('Detecting timeline...', 0);

    try {
        // First, get current timeline info to check for in/out points
        const timelineInfo = await TimelineManager.executeScript('getSequenceInfo()');
        
        let duration = currentDuration;
        let placementPosition = null;
        
        // Check if user has set in/out points for precise placement
        if (timelineInfo && timelineInfo.success && timelineInfo.hasInPoint && timelineInfo.hasOutPoint) {
            const inPointSeconds = timelineInfo.inPoint.seconds;
            const outPointSeconds = timelineInfo.outPoint.seconds;
            const timelineDuration = outPointSeconds - inPointSeconds;
            
            console.log('=== DETECTED USER TIMELINE VALUES ===');
            console.log(`IN POINT: ${timelineInfo.inPoint.formatted} (${inPointSeconds}s)`);
            console.log(`OUT POINT: ${timelineInfo.outPoint.formatted} (${outPointSeconds}s)`);
            console.log(`DURATION: ${timelineInfo.duration.formatted} (${timelineDuration}s)`);
            console.log('=== WILL PLACE SFX AT IN POINT ===');
            
            // Use timeline duration for SFX generation
            if (timelineDuration > 0 && timelineDuration <= 22) {
                duration = Math.round(timelineDuration);
                placementPosition = inPointSeconds;
                showStatus(`Using in/out points: ${timelineInfo.inPoint.formatted} to ${timelineInfo.outPoint.formatted}`, 2000);
            } else {
                showStatus(`In/out duration too long (${timelineDuration}s), using default`, 2000);
            }
        } else if (autoMode && durationDisplay.classList.contains('has-value')) {
            const timelineDuration = parseTimeToSeconds(durationDisplay.textContent);
            if (timelineDuration > 0 && timelineDuration <= 22) {
                duration = Math.round(timelineDuration);
                showStatus(`Auto: Using timeline duration ${duration}s`, 1000);
            }
        } else if (!autoMode) {
            showStatus(`Manual: Using ${duration}s`, 500);
        }
        
        showStatus('Generating SFX...', 0);
        
        // Generate sound effect
        const audioData = await ElevenLabsAPI.generateSoundEffect(prompt, duration);
        
        showStatus('Placing on timeline...', 0);
        
        // Save audio file
        const fileManager = new FileManager();
        const filePath = await fileManager.saveAudioFile(audioData, prompt);
        
        // Import and place audio at specific position if we have in/out points
        let result;
        if (placementPosition !== null) {
            // Use custom placement script for in/out point positioning
            result = await TimelineManager.executeScript(`importAndPlaceAudioAtTime("${filePath}", 0, ${placementPosition})`);
        } else {
            // Use standard placement at playhead
            const timelineManager = new TimelineManager();
            result = await timelineManager.importAndPlaceAudio(filePath);
        }
        
        // Success! Clear input and show feedback
        sfxInput.value = '';
        sfxInput.style.height = '48px';
        sfxInput.classList.add('success');
        setTimeout(() => sfxInput.classList.remove('success'), 600);
        
        if (placementPosition !== null) {
            showStatus(`SFX placed at in point (${timelineInfo.inPoint.formatted})!`, 3000);
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
            
            // Update duration
            if (result.hasDuration && result.duration && result.duration.formatted) {
                durationDisplay.textContent = result.duration.formatted;
                durationDisplay.classList.add('has-value');
            } else {
                durationDisplay.textContent = '--:--';
                durationDisplay.classList.remove('has-value');
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
        
        // Try to register for ExtendScript events from within Premiere
        csInterface.evalScript(`
            try {
                // Register for sequence events if possible
                app.bind("onSequenceActivated", function() {
                    // Send custom event to CEP
                    var event = new CSXSEvent();
                    event.type = "sequence.activated";
                    event.data = "sequence changed";
                    event.dispatch();
                });
                
                app.bind("onTimelineChanged", function() {
                    var event = new CSXSEvent();
                    event.type = "timeline.changed";  
                    event.data = "timeline changed";
                    event.dispatch();
                });
                
                "ExtendScript events registered";
            } catch(e) {
                "ExtendScript event registration failed: " + e.toString();
            }
        `, (result) => {
            console.log('ExtendScript event registration result:', result);
        });
        
        // Listen for our custom events
        csInterface.addEventListener('sequence.activated', () => {
            console.log('Custom sequence activated event');
            updateTimelineInfo();
        });
        
        csInterface.addEventListener('timeline.changed', () => {
            console.log('Custom timeline changed event');
            updateTimelineInfo();
        });
        
        // Only update when plugin becomes active (user clicks on it)
        window.addEventListener('focus', () => {
            console.log('Plugin focused - checking timeline');
            updateTimelineInfo();
        });
        
        console.log('Event-driven timeline monitoring setup complete');
        
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