// State synchronization between CEP panel and Electron
// This runs in Premiere's ExtendScript environment

// Global state store
$.global.podcastPilotState = $.global.podcastPilotState || {
    // UI State
    speakers: [],
    cameraMapping: [],
    cutSettings: {},
    selectedPresetId: '',
    
    // Listeners for state changes
    listeners: [],
    
    // Update state and notify listeners
    update: function(key, value) {
        this[key] = value;
        this.notifyListeners({
            type: 'stateChange',
            key: key,
            value: value,
            timestamp: new Date().toISOString()
        });
    },
    
    // Get current state
    getState: function() {
        return {
            speakers: this.speakers,
            cameraMapping: this.cameraMapping,
            cutSettings: this.cutSettings,
            selectedPresetId: this.selectedPresetId
        };
    },
    
    // Add listener
    addListener: function(id) {
        if (this.listeners.indexOf(id) === -1) {
            this.listeners.push(id);
        }
    },
    
    // Remove listener
    removeListener: function(id) {
        var index = this.listeners.indexOf(id);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    },
    
    // Notify all listeners
    notifyListeners: function(event) {
        // Dispatch event to all CEP panels
        try {
            var csEvent = new CSXSEvent();
            csEvent.type = "com.podcastpilot.state.sync";
            csEvent.data = JSON.stringify(event);
            csEvent.dispatch();
        } catch (e) {
            $.writeln("Error dispatching state sync: " + e);
        }
    }
};

// Helper functions for state management
$.global.updatePodcastState = function(key, value) {
    $.global.podcastPilotState.update(key, value);
    return JSON.stringify({ success: true });
};

$.global.getPodcastState = function() {
    return JSON.stringify($.global.podcastPilotState.getState());
};

// Return success
true;