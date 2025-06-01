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
    setInterval(updateTimelineInfo, 2000); // Update every 2 seconds
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
    showStatus('Generating...', 0);

    try {
        // Use timeline duration if auto mode is enabled and available, otherwise use slider value
        let duration = currentDuration;
        if (autoMode && durationDisplay.classList.contains('has-value')) {
            const timelineDuration = parseTimeToSeconds(durationDisplay.textContent);
            if (timelineDuration > 0 && timelineDuration <= 22) {
                duration = Math.round(timelineDuration);
                showStatus(`Auto: Using timeline duration ${duration}s`, 1000);
            }
        } else if (!autoMode) {
            showStatus(`Manual: Using ${duration}s`, 500);
        }
        
        // Generate sound effect
        const audioData = await ElevenLabsAPI.generateSoundEffect(prompt, duration);
        
        showStatus('Placing on timeline...', 0);
        
        // Save and place on timeline
        const fileManager = new FileManager();
        const filePath = await fileManager.saveAudioFile(audioData, prompt);
        
        const timeline = new TimelineManager();
        const result = await timeline.importAndPlaceAudio(filePath);
        
        // Success! Clear input and show feedback
        sfxInput.value = '';
        sfxInput.style.height = '48px';
        sfxInput.classList.add('success');
        setTimeout(() => sfxInput.classList.remove('success'), 600);
        
        showStatus('Added to timeline!', 2000);

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
        showStatus('Debugging...', 0);
        
        const timeline = new TimelineManager();
        const result = await timeline.executeScript('getSequenceInfo()');
        
        if (result && result.success) {
            showStatus(`${result.sequenceName} - ${result.audioTrackCount} tracks`, 4000);
        } else {
            showStatus('No sequence found', 3000);
        }
    } catch (error) {
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
        const timeline = new TimelineManager();
        const result = await timeline.executeScript('getSequenceInfo()');
        
        if (result && result.success) {
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
        }
    } catch (error) {
        // Silently fail for timeline updates
        console.log('Timeline update failed:', error);
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