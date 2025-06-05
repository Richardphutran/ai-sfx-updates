# Eleven Labs Sound Generation API

**Status:** ✅ WORKING
**Tokens:** ~85

## Problem
Need to generate sound effects from text descriptions

## Solution
```javascript
// API endpoint
const API_URL = 'https://api.elevenlabs.io/v1/text-to-sound-effects';

// Generate sound
async function generateSound(prompt, apiKey) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey
        },
        body: JSON.stringify({
            text: prompt,
            duration_seconds: 5,
            prompt_influence: 0.3
        })
    });
    
    const data = await response.json();
    return data; // Contains audio URL
}

// Download and save
async function downloadAudio(audioUrl, savePath) {
    const response = await fetch(audioUrl);
    const buffer = await response.arrayBuffer();
    // Save buffer to file
}
```

## When to Use
Generating AI sound effects from text descriptions in Adobe plugins