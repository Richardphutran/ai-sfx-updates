# XML Generation & Processing Patterns for Premiere Pro

## 🎯 Frame-Accurate XMEML Generation

**Critical Constants**:
```javascript
const PREMIERE_TICKS_PER_SECOND = 254016000000;
const pproTicksPerSecond = 254016000000; // For FCP XML compatibility

// Frame to ticks conversion (corrected for accuracy)
function frameToPproTicks(frameNumber, timebase) {
    const numerator = frameNumber * PREMIERE_TICKS_PER_SECOND;
    return Math.floor(numerator / timebase); // Use floor, not round!
}

// NTSC frame rate handling
function getRealTimebase(timebase, ntsc) {
    if (ntsc === 'TRUE') {
        if (timebase === 24) return 23.976;
        if (timebase === 30) return 29.97;
        if (timebase === 60) return 59.94;
    }
    return timebase;
}
```

## 🎯 Multi-File XML Mapping Fix

**Problem**: Generated XML was forcing all clips to reference only the first source file, causing black/invalid clips.

**Solution**: Map each segment to its correct source file based on timeline position:

```javascript
// Extract clip boundaries from original XML
function extractClipBoundariesFromXML(xmlContent, files) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    const clipBoundaries = [];
    
    // Parse video clips
    const videoClips = xmlDoc.querySelectorAll('video track clipitem');
    videoClips.forEach((clip, index) => {
        const fileId = clip.querySelector('file')?.getAttribute('id');
        const file = files.find(f => f.id === fileId);
        
        const start = parseInt(clip.querySelector('start')?.textContent || '0');
        const end = parseInt(clip.querySelector('end')?.textContent || '0');
        
        clipBoundaries.push({
            index,
            fileId,
            file,
            start,
            end,
            startSeconds: start / timebase,
            endSeconds: end / timebase
        });
    });
    
    return clipBoundaries;
}

// Find correct source file for each AI segment
function findSourceFileForSegment(segmentStartTime, clipBoundaries) {
    for (const boundary of clipBoundaries) {
        if (segmentStartTime >= boundary.startSeconds && 
            segmentStartTime < boundary.endSeconds) {
            return boundary;
        }
    }
    return clipBoundaries[0]; // Fallback
}
```

## 🎯 Proper XMEML Structure

**Essential XML elements for Premiere compatibility**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="4">
  <sequence>
    <name>Sequence Name</name>
    <duration>{totalDuration}</duration>
    <rate>
      <ntsc>{isNTSC}</ntsc>
      <timebase>{timebase}</timebase>
    </rate>
    <media>
      <video>
        <format>
          <samplecharacteristics>
            <width>1920</width>
            <height>1080</height>
            <pixelaspectratio>Square</pixelaspectratio>
          </samplecharacteristics>
        </format>
        <track>
          <clipitem id="clipitem-{id}">
            <masterclipid>masterclip-{fileIndex}</masterclipid>
            <name>{clipName}</name>
            <start>{startFrame}</start>
            <end>{endFrame}</end>
            <in>{inFrame}</in>
            <out>{outFrame}</out>
            <file id="{fileId}">
              <duration>{fileDuration}</duration>
              <rate>
                <ntsc>{isNTSC}</ntsc>
                <timebase>{timebase}</timebase>
              </rate>
              <media>
                <video>
                  <duration>{fileDuration}</duration>
                </video>
                <audio>
                  <channelcount>2</channelcount>
                </audio>
              </media>
            </file>
            <sourcetrack>
              <mediatype>video</mediatype>
            </sourcetrack>
            <labels>
              <label2>{colorLabel}</label2>
            </labels>
          </clipitem>
        </track>
      </video>
      <audio>
        <!-- Mirror video structure for linked audio -->
      </audio>
    </media>
  </sequence>
</xmeml>
```

## 🎯 Color Label Mapping for Dramatic Arc

**Premiere Pro color labels**:
```javascript
const colorLabelMap = {
    'setup': 'Cerulean',        // Blue
    'rising_action': 'Forest',   // Green  
    'conflict': 'Rose',          // Red/Pink
    'climax': 'Mango',          // Orange
    'resolution': 'Lavender'     // Purple
};

// In XML:
<labels>
  <label2>{colorLabel}</label2>
</labels>
```

## 🎯 Defensive JSON Parsing from AI

**Problem**: AI sometimes returns JSON with helpful comments that break parsing.

**Solution**:
```javascript
function parseAIResponse(responseText) {
    try {
        // Extract JSON object from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON object found');
        }
        
        let jsonString = jsonMatch[0];
        
        // Remove single-line comments
        jsonString = jsonString.replace(/\/\/[^\n]*/g, '');
        
        // Remove multi-line comments
        jsonString = jsonString.replace(/\/\*[\s\S]*?\*\//g, '');
        
        // Remove trailing commas
        jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
        
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Failed to parse AI response:', error);
        // Fallback: try to extract segments array
        const segmentsMatch = responseText.match(/"segments"\s*:\s*\[([\s\S]*?)\]/);
        if (segmentsMatch) {
            return { segments: JSON.parse(`[${segmentsMatch[1]}]`) };
        }
        throw error;
    }
}
```

## 🎯 XML Validation

**Always validate generated XML**:
```javascript
function validateXML(xmlContent) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlContent, 'text/xml');
        
        // Check for parsing errors
        const parserError = doc.getElementsByTagName('parsererror');
        if (parserError.length > 0) {
            console.error('XML parsing error:', parserError[0].textContent);
            return false;
        }
        
        // Validate structure
        const sequence = doc.querySelector('sequence');
        if (!sequence) {
            console.error('No sequence element found');
            return false;
        }
        
        // Check required elements
        const required = ['name', 'duration', 'rate', 'media'];
        for (const elem of required) {
            if (!sequence.querySelector(elem)) {
                console.error(`Missing required element: ${elem}`);
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.error('XML validation error:', error);
        return false;
    }
}
```

## 🎯 Sync Fix for Linked Clips

**Issue**: Audio/video showing sync markers due to timing mismatch.

**Fix**: Ensure identical frame values for linked clips:
```javascript
// Generate matching audio clip for each video clip
function generateLinkedAudioClip(videoClip) {
    const audioClip = { ...videoClip }; // Copy all properties
    
    // Change specific audio properties
    audioClip.id = videoClip.id.replace('clipitem-', 'clipitem-audio-');
    audioClip.sourcetrack = { mediatype: 'audio' };
    
    // CRITICAL: Use exact same frame values
    audioClip.start = videoClip.start;
    audioClip.end = videoClip.end;
    audioClip.in = videoClip.in;
    audioClip.out = videoClip.out;
    
    return audioClip;
}
```

## 🎯 Master Clip ID Rules

**Important**: All clips from same source file must share masterclipid:
```javascript
// Generate master clip ID based on source file
function getMasterClipId(fileIndex) {
    return `masterclip-${fileIndex}`;
}

// All timeline instances reference same master
<masterclipid>masterclip-1</masterclipid>  // All clips from file 1
<masterclipid>masterclip-2</masterclipid>  // All clips from file 2
```

## 🎯 Key Takeaways

1. **Frame accuracy** - Use floor() not round() for tick conversions
2. **Multi-file support** - Map segments to correct source files by timeline position
3. **NTSC handling** - Always check and convert 24→23.976, 30→29.97
4. **Linked clips** - Audio must have identical timing to video
5. **Validation** - Always validate XML before attempting import
6. **Color labels** - Use label2 for Premiere Pro compatibility
7. **Master clips** - Share IDs across timeline instances from same source

These patterns ensure professional, frame-accurate XML generation that imports cleanly into Premiere Pro.