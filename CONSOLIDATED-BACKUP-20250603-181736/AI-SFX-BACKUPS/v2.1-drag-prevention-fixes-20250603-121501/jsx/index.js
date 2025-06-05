(function (thisObj) {// ----- EXTENDSCRIPT INCLUDES ------ //"object"!=typeof JSON&&(JSON={}),function(){"use strict";var rx_one=/^[\],:{}\s]*$/,rx_two=/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,rx_three=/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,rx_four=/(?:^|:|,)(?:\s*\[)+/g,rx_escapable=/[\\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,rx_dangerous=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta,rep;function f(t){return t<10?"0"+t:t}function this_value(){return this.valueOf()}function quote(t){return rx_escapable.lastIndex=0,rx_escapable.test(t)?'"'+t.replace(rx_escapable,function(t){var e=meta[t];return"string"==typeof e?e:"\\u"+("0000"+t.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+t+'"'}function str(t,e){var r,n,o,u,f,a=gap,i=e[t];switch(i&&"object"==typeof i&&"function"==typeof i.toJSON&&(i=i.toJSON(t)),"function"==typeof rep&&(i=rep.call(e,t,i)),typeof i){case"string":return quote(i);case"number":return isFinite(i)?String(i):"null";case"boolean":case"null":return String(i);case"object":if(!i)return"null";if(gap+=indent,f=[],"[object Array]"===Object.prototype.toString.apply(i)){for(u=i.length,r=0;r<u;r+=1)f[r]=str(r,i)||"null";return o=0===f.length?"[]":gap?"[\n"+gap+f.join(",\n"+gap)+"\n"+a+"]":"["+f.join(",")+"]",gap=a,o}if(rep&&"object"==typeof rep)for(u=rep.length,r=0;r<u;r+=1)"string"==typeof rep[r]&&(o=str(n=rep[r],i))&&f.push(quote(n)+(gap?": ":":")+o);else for(n in i)Object.prototype.hasOwnProperty.call(i,n)&&(o=str(n,i))&&f.push(quote(n)+(gap?": ":":")+o);return o=0===f.length?"{}":gap?"{\n"+gap+f.join(",\n"+gap)+"\n"+a+"}":"{"+f.join(",")+"}",gap=a,o}}"function"!=typeof Date.prototype.toJSON&&(Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z":null},Boolean.prototype.toJSON=this_value,Number.prototype.toJSON=this_value,String.prototype.toJSON=this_value),"function"!=typeof JSON.stringify&&(meta={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},JSON.stringify=function(t,e,r){var n;if(gap="",indent="","number"==typeof r)for(n=0;n<r;n+=1)indent+=" ";else"string"==typeof r&&(indent=r);if(rep=e,e&&"function"!=typeof e&&("object"!=typeof e||"number"!=typeof e.length))throw new Error("JSON.stringify");return str("",{"":t})}),"function"!=typeof JSON.parse&&(JSON.parse=function(text,reviver){var j;function walk(t,e){var r,n,o=t[e];if(o&&"object"==typeof o)for(r in o)Object.prototype.hasOwnProperty.call(o,r)&&(void 0!==(n=walk(o,r))?o[r]=n:delete o[r]);return reviver.call(t,e,o)}if(text=String(text),rx_dangerous.lastIndex=0,rx_dangerous.test(text)&&(text=text.replace(rx_dangerous,function(t){return"\\u"+("0000"+t.charCodeAt(0).toString(16)).slice(-4)})),rx_one.test(text.replace(rx_two,"@").replace(rx_three,"]").replace(rx_four,"")))return j=eval("("+text+")"),"function"==typeof reviver?walk({"":j},""):j;throw new SyntaxError("JSON.parse")})}();// ---------------------------------- //// ----- EXTENDSCRIPT PONYFILLS -----function __objectFreeze(obj) { return obj; }// ---------------------------------- //var version = "2.0.0";

var config = {
  version: version,
  id: "com.ai.sfx.generator",
  displayName: "AI SFX Generator (Bolt)",
  symlink: "local",
  port: 3001,
  // Different port to avoid conflicts
  servePort: 5001,
  startingDebugPort: 9230,
  // Different debug port
  extensionManifestVersion: 6.0,
  requiredRuntimeVersion: 9.0,
  hosts: [{
    name: "PPRO",
    version: "[0.0,99.9]"
  } // Premiere Pro only
  ],
  type: "Panel",
  iconDarkNormal: "./src/assets/light-icon.png",
  iconNormal: "./src/assets/dark-icon.png",
  iconDarkNormalRollOver: "./src/assets/light-icon.png",
  iconNormalRollOver: "./src/assets/dark-icon.png",
  parameters: ["--v=0", "--enable-nodejs", "--mixed-context"],
  width: 400,
  height: 300,
  panels: [{
    mainPath: "./main/index.html",
    name: "main",
    panelDisplayName: "AI SFX Generator (Bolt)",
    autoVisible: true,
    width: 400,
    height: 300
  }],
  build: {
    jsxBin: "off",
    sourceMap: true
  },
  zxp: {
    country: "US",
    province: "CA",
    org: "Company",
    password: "password",
    tsa: ["http://timestamp.digicert.com/", // Windows Only
    "http://timestamp.apple.com/ts01" // MacOS Only
    ],
    allowSkipTSA: false,
    sourceMap: false,
    jsxBin: "off"
  },
  installModules: [],
  copyAssets: [],
  copyZipAssets: []
};

var ns = config.id;

var helloVoid = function helloVoid() {
  alert("test");
};
var helloError = function helloError(str) {
  // Intentional Error for Error Handling Demonstration
  
  throw new Error("We're throwing an error");
};
var helloStr = function helloStr(str) {
  alert("ExtendScript received a string: ".concat(str));
  return str;
};
var helloNum = function helloNum(n) {
  alert("ExtendScript received a number: ".concat(n.toString()));
  return n;
};
var helloArrayStr = function helloArrayStr(arr) {
  alert("ExtendScript received an array of ".concat(arr.length, " strings: ").concat(arr.toString()));
  return arr;
};
var helloObj = function helloObj(obj) {
  alert("ExtendScript received an object: ".concat(JSON.stringify(obj)));
  return {
    y: obj.height,
    x: obj.width
  };
};

var helloWorld$7 = function helloWorld() {
  alert("Hello from After Effects!");
  app.project.activeItem;
};

var aeft = /*#__PURE__*/__objectFreeze({
  __proto__: null,
  helloError: helloError,
  helloStr: helloStr,
  helloNum: helloNum,
  helloArrayStr: helloArrayStr,
  helloObj: helloObj,
  helloVoid: helloVoid,
  helloWorld: helloWorld$7
});

var helloWorld$6 = function helloWorld() {
  alert("Hello from Media Encoder");
};

var ame = /*#__PURE__*/__objectFreeze({
  __proto__: null,
  helloError: helloError,
  helloStr: helloStr,
  helloNum: helloNum,
  helloArrayStr: helloArrayStr,
  helloObj: helloObj,
  helloVoid: helloVoid,
  helloWorld: helloWorld$6
});

var helloWorld$5 = function helloWorld() {
  alert("Hello from Animate");
};

var anim = /*#__PURE__*/__objectFreeze({
  __proto__: null,
  helloError: helloError,
  helloStr: helloStr,
  helloNum: helloNum,
  helloArrayStr: helloArrayStr,
  helloObj: helloObj,
  helloVoid: helloVoid,
  helloWorld: helloWorld$5
});

var helloWorld$4 = function helloWorld() {
  alert("Hello from Audtion");
};

var audt = /*#__PURE__*/__objectFreeze({
  __proto__: null,
  helloError: helloError,
  helloStr: helloStr,
  helloNum: helloNum,
  helloArrayStr: helloArrayStr,
  helloObj: helloObj,
  helloVoid: helloVoid,
  helloWorld: helloWorld$4
});

var helloWorld$3 = function helloWorld() {
  alert("Hello from InDesign");
};

var idsn = /*#__PURE__*/__objectFreeze({
  __proto__: null,
  helloError: helloError,
  helloStr: helloStr,
  helloNum: helloNum,
  helloArrayStr: helloArrayStr,
  helloObj: helloObj,
  helloVoid: helloVoid,
  helloWorld: helloWorld$3
});

var helloWorld$2 = function helloWorld() {
  alert("Hello from Illustrator");
};

var ilst = /*#__PURE__*/__objectFreeze({
  __proto__: null,
  helloError: helloError,
  helloStr: helloStr,
  helloNum: helloNum,
  helloArrayStr: helloArrayStr,
  helloObj: helloObj,
  helloVoid: helloVoid,
  helloWorld: helloWorld$2
});

var helloWorld$1 = function helloWorld() {
  alert("Hello from Bridge");
};

var kbrg = /*#__PURE__*/__objectFreeze({
  __proto__: null,
  helloError: helloError,
  helloStr: helloStr,
  helloNum: helloNum,
  helloArrayStr: helloArrayStr,
  helloObj: helloObj,
  helloVoid: helloVoid,
  helloWorld: helloWorld$1
});

var helloWorld = function helloWorld() {
  alert("Hello from Photoshop");
};

var phxs = /*#__PURE__*/__objectFreeze({
  __proto__: null,
  helloError: helloError,
  helloStr: helloStr,
  helloNum: helloNum,
  helloArrayStr: helloArrayStr,
  helloObj: helloObj,
  helloVoid: helloVoid,
  helloWorld: helloWorld
});

/**
 * @function dispatchTS Displatches an event to the CEP panel with Type-Safety
 * See listenTS() in the CEP panel for more info
 * @param event The event name to listen for (defined in EventTS in shared/universals.ts)
 * @param callback The callback function to be executed when the event is triggered
 */

var dispatchTS = function dispatchTS(event, data) {
  if (new ExternalObject("lib:PlugPlugExternalObject")) {
    var eventObj = new CSXSEvent();
    eventObj.type = "".concat(ns, ".").concat(event);
    eventObj.data = JSON.stringify(data);
    eventObj.dispatch();
  }
};

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
// Initialize real-time timeline monitoring automatically

(function initializeTimelineMonitoring() {
  try {
    // Bind to project change event which fires for timeline changes
    app.bind('onProjectChanged', function () {
      // Get updated timeline info and dispatch
      var seq = app.project.activeSequence;

      if (seq) {
        var inPoint = seq.getInPoint();
        var outPoint = seq.getOutPoint();
        dispatchTS("timelineChanged", {
          inPoint: parseFloat(inPoint) || null,
          outPoint: parseFloat(outPoint) || null,
          duration: parseFloat(outPoint) - parseFloat(inPoint) || null
        });
      }
    }); // Log success for debugging

    $.writeln("[AI SFX] Timeline monitoring initialized successfully");
  } catch (error) {
    $.writeln("[AI SFX] Failed to initialize timeline monitoring: " + error.toString());
  }
})();
/**
 * Get lightweight sequence information for frequent updates
 * Optimized for performance with minimal calculations
 */


var getSequenceInfoLite = function getSequenceInfoLite() {
  try {
    if (!app || !app.project || !app.project.activeSequence) {
      return {
        success: false,
        error: "No active sequence"
      };
    }

    var sequence = app.project.activeSequence; // Only get essential timeline data for UI updates

    var inPoint = sequence.getInPoint();
    var outPoint = sequence.getOutPoint();
    var inPointSeconds = parseFloat(inPoint);
    var outPointSeconds = parseFloat(outPoint);
    var hasInPoint = !isNaN(inPointSeconds) && inPointSeconds >= 0;
    var hasOutPoint = !isNaN(outPointSeconds) && outPointSeconds >= 0;
    return {
      success: true,
      sequenceName: sequence.name,
      hasInPoint: hasInPoint,
      hasOutPoint: hasOutPoint,
      inPoint: {
        seconds: hasInPoint ? inPointSeconds : null,
        formatted: hasInPoint ? formatTime(inPointSeconds) : "--:--:--"
      },
      outPoint: {
        seconds: hasOutPoint ? outPointSeconds : null,
        formatted: hasOutPoint ? formatTime(outPointSeconds) : "--:--:--"
      },
      duration: hasInPoint && hasOutPoint ? {
        seconds: outPointSeconds - inPointSeconds,
        formatted: formatTime(outPointSeconds - inPointSeconds)
      } : null
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
};
/**
 * Get comprehensive sequence information including in/out points
 * Uses MVX-style direct access for reliable timeline data
 */

var getSequenceInfo = function getSequenceInfo() {
  try {
    if (!app || !app.project || !app.project.activeSequence) {
      return {
        success: false,
        error: "No active sequence"
      };
    }

    var sequence = app.project.activeSequence;
    var result = {
      success: true,
      sequenceName: sequence.name,
      audioTrackCount: sequence.audioTracks.numTracks,
      videoTrackCount: sequence.videoTracks.numTracks,
      source: "Bolt CEP - MVX-style direct access"
    }; // Get playhead position

    try {
      var playhead = sequence.getPlayerPosition();
      result.playheadPosition = playhead.seconds;
      result.playhead = {
        seconds: playhead.seconds,
        formatted: formatTime(playhead.seconds)
      };
    } catch (playheadError) {
      result.playheadError = playheadError.toString();
      result.playheadPosition = 0;
    } // Direct in/out point access (MVX pattern)


    try {
      var inPoint = sequence.getInPoint();
      var inPointSeconds = parseFloat(inPoint);
      var hasInPoint = !isNaN(inPointSeconds) && inPointSeconds >= 0;
      result.inPoint = {
        seconds: hasInPoint ? inPointSeconds : null,
        formatted: hasInPoint ? formatTime(inPointSeconds) : "--:--:--",
        isActuallySet: hasInPoint,
        rawValue: inPoint
      };
      result.hasInPoint = hasInPoint;
    } catch (inError) {
      result.hasInPoint = false;
      result.inPointError = inError.toString();
      result.inPoint = {
        seconds: null,
        formatted: "--:--:--",
        isActuallySet: false,
        error: inError.toString()
      };
    } // Direct out point access


    try {
      var outPoint = sequence.getOutPoint();
      var outPointSeconds = parseFloat(outPoint);
      var hasOutPoint = !isNaN(outPointSeconds) && outPointSeconds >= 0;
      result.outPoint = {
        seconds: hasOutPoint ? outPointSeconds : null,
        formatted: hasOutPoint ? formatTime(outPointSeconds) : "--:--:--",
        isActuallySet: hasOutPoint,
        rawValue: outPoint
      };
      result.hasOutPoint = hasOutPoint;
    } catch (outError) {
      result.hasOutPoint = false;
      result.outPointError = outError.toString();
      result.outPoint = {
        seconds: null,
        formatted: "--:--:--",
        isActuallySet: false,
        error: outError.toString()
      };
    } // Calculate duration


    if (result.hasInPoint && result.hasOutPoint && result.inPoint.seconds !== null && result.outPoint.seconds !== null) {
      var duration = result.outPoint.seconds - result.inPoint.seconds;
      result.duration = {
        seconds: duration,
        formatted: formatTime(duration),
        isValid: duration > 0
      };
      result.hasDuration = duration > 0;
    } else {
      result.duration = {
        seconds: null,
        formatted: "--:--:--",
        isValid: false
      };
      result.hasDuration = false;
    } // Add sequence length for context


    try {
      if (sequence.end) {
        result.sequenceLength = {
          seconds: sequence.end.seconds,
          formatted: formatTime(sequence.end.seconds)
        };
      }
    } catch (lengthError) {
      result.sequenceLengthError = lengthError.toString();
    }

    return result;
  } catch (e) {
    return {
      success: false,
      error: "Critical error: " + e.toString(),
      source: "Bolt CEP - MVX-style direct access - failed"
    };
  }
};
/**
 * Import and place audio at specific time with smart track management
 * Uses proven QE API for track creation and collision detection
 */

var importAndPlaceAudioAtTime = function importAndPlaceAudioAtTime(filePath, timeSeconds) {
  var startingTrackIndex = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var result = {
    success: false,
    step: "initialization",
    error: "",
    debug: {}
  };

  try {
    // Function to check collision at specific time (exact same logic as working CEP version)
    var hasAudioAtTime = function hasAudioAtTime(track, timeValue) {
      try {
        if (!track.clips || track.clips.numItems === 0) {
          return false; // No clips = no conflict
        } // Handle both time object and raw seconds value


        var timeInSeconds = _typeof(timeValue) === 'object' ? timeValue.seconds : timeValue;

        for (var _i = 0; _i < track.clips.numItems; _i++) {
          var clip = track.clips[_i];
          var clipStart = clip.start.seconds;
          var clipEnd = clip.end.seconds; // Check if placement time overlaps with existing clip (with small buffer)

          if (timeInSeconds >= clipStart - 0.1 && timeInSeconds <= clipEnd + 0.1) {
            return true;
          }
        }

        return false;
      } catch (e) {
        // If we can't check, assume there's a conflict to be safe
        return true;
      }
    }; // Find available track


    // Validate inputs
    result.step = "validating_inputs";

    if (!filePath || typeof timeSeconds !== 'number') {
      result.error = "Invalid parameters: filePath and timeSeconds required";
      return result;
    } // Check app availability


    result.step = "checking_app";

    if (typeof app === 'undefined' || !app) {
      result.error = "app object not available";
      return result;
    } // Check project


    result.step = "checking_project";

    if (!app.project) {
      result.error = "No project loaded";
      return result;
    } // Check sequence


    result.step = "checking_sequence";

    if (!app.project.activeSequence) {
      result.error = "No active sequence";
      return result;
    }

    var sequence = app.project.activeSequence;
    result.debug.sequenceName = sequence.name;
    result.debug.placementTimeSeconds = timeSeconds;
    result.debug.placementTimeFormatted = formatTime(timeSeconds); // Import file

    result.step = "importing_file";
    result.debug.filePath = filePath;
    var importResult = app.project.importFiles([filePath]);

    if (!importResult) {
      result.error = "Failed to import file";
      return result;
    } // Find imported item


    result.step = "finding_imported_item";
    var fileName = filePath.split('/').pop();
    var baseName = fileName.replace(/\.[^.]*$/, '');
    result.debug.fileName = fileName;
    result.debug.baseName = baseName;
    var importedItem = null;
    var rootItem = app.project.rootItem;

    for (var i = 0; i < rootItem.children.numItems; i++) {
      var item = rootItem.children[i];

      if (item.name && item.name.indexOf(baseName) !== -1) {
        importedItem = item;
        break;
      }
    }

    if (!importedItem) {
      result.error = "Could not find imported item in project";
      result.debug.searchedFor = baseName;
      return result;
    }

    result.debug.importedItemName = importedItem.name; // Organize into "AI SFX" bin

    result.step = "organizing_into_bin";
    var aiSfxBin = null; // Check if "AI SFX" bin exists

    for (var j = 0; j < rootItem.children.numItems; j++) {
      var child = rootItem.children[j];

      if (child.type === ProjectItemType.BIN && child.name === "AI SFX") {
        aiSfxBin = child;
        break;
      }
    } // Create bin if needed


    if (!aiSfxBin) {
      try {
        aiSfxBin = rootItem.createBin("AI SFX");
        result.debug.createdBin = true;
      } catch (binError) {
        result.debug.binError = "Could not create bin: " + binError.toString();
        result.debug.createdBin = false;
      }
    } else {
      result.debug.createdBin = false;
    } // Move to bin


    if (aiSfxBin && importedItem) {
      try {
        importedItem.moveBin(aiSfxBin);
        result.debug.movedToBin = "AI SFX";
      } catch (moveError) {
        result.debug.moveError = "Could not move to bin: " + moveError.toString();
        result.debug.movedToBin = "failed";
      }
    } // Smart timeline placement with collision detection


    result.step = "smart_timeline_placement";
    var startingTrackIdx = parseInt(startingTrackIndex) || 0;
    var finalTrackIndex = -1;
    var placementAttempts = [];
    var foundAvailableTrack = false;

    for (var trackIdx = startingTrackIdx; trackIdx < sequence.audioTracks.numTracks; trackIdx++) {
      var track = sequence.audioTracks[trackIdx];
      var hasConflict = hasAudioAtTime(track, timeSeconds);
      placementAttempts.push({
        trackIndex: trackIdx,
        hasConflict: hasConflict,
        timePosition: timeSeconds,
        trackClipCount: track.clips ? track.clips.numItems : 0,
        trackName: track.name || "Audio ".concat(trackIdx + 1)
      });

      if (!hasConflict) {
        finalTrackIndex = trackIdx;
        foundAvailableTrack = true;
        result.debug.foundAvailableTrack = trackIdx;
        break;
      }
    } // Create new track if needed (using proven working logic from original CEP)


    if (!foundAvailableTrack) {
      result.debug.beforeTrackCreation = sequence.audioTracks.numTracks;
      result.debug.attemptingNewTrack = true;
      var newTrack = null;
      var trackCreationAttempts = []; // First, enable QE API access

      try {
        app.enableQE();
        trackCreationAttempts.push("app.enableQE() - SUCCESS");
        result.debug.qeEnabled = true;
      } catch (qeError) {
        trackCreationAttempts.push("app.enableQE() - ERROR: " + qeError.toString());
        result.debug.qeEnabled = false;
      } // Attempt 1: Use QE API to add tracks (Boombox method)


      if (result.debug.qeEnabled) {
        try {
          var qeSequence = qe.project.getActiveSequence();

          if (qeSequence) {
            // Use CORRECT QE API syntax with all 7 parameters (like Boombox!)
            if (typeof qeSequence.addTracks === 'function') {
              // Get current track count to add track at the END
              var currentAudioTracks = sequence.audioTracks.numTracks; // qe.addTracks(numberOfVideoTracks, afterWhichVideoTrack, numberOfAudioTracks, audioTrackType, afterWhichAudioTrack, numberOfSubmixTracks, submixTrackType)
              // Add 1 stereo audio track at the END: (0 video, 0 pos, 1 audio, 1=stereo, currentAudioTracks pos, 0 submix, 0 type)

              qeSequence.addTracks(0, 0, 1, 1, currentAudioTracks, 0, 0);
              newTrack = true; // QE doesn't return track object

              trackCreationAttempts.push("qe.addTracks(0,0,1,1," + currentAudioTracks + ",0,0) STEREO AT END - SUCCESS");
            } else {
              trackCreationAttempts.push("qe.addTracks() - NOT AVAILABLE");
            }
          } else {
            trackCreationAttempts.push("qe.project.getActiveSequence() - FAILED");
          }
        } catch (qeAddError) {
          trackCreationAttempts.push("qe.addTracks() - ERROR: " + qeAddError.toString());
        }
      } // Attempt 2: Try alternative QE methods


      if (!newTrack && result.debug.qeEnabled) {
        try {
          var _qeSequence = qe.project.getActiveSequence();

          if (_qeSequence && typeof _qeSequence.insertTracks === 'function') {
            _qeSequence.insertTracks(0, 1); // Insert 1 audio track


            newTrack = true;
            trackCreationAttempts.push("qe.insertTracks(0, 1) - SUCCESS");
          } else {
            trackCreationAttempts.push("qe.insertTracks() - NOT AVAILABLE");
          }
        } catch (qeInsertError) {
          trackCreationAttempts.push("qe.insertTracks() - ERROR: " + qeInsertError.toString());
        }
      } // Attempt 3: Try direct sequence manipulation


      if (!newTrack) {
        try {
          // Some Adobe apps support this pattern
          if (typeof sequence.insertAudioTrack === 'function') {
            newTrack = sequence.insertAudioTrack();
            trackCreationAttempts.push("sequence.insertAudioTrack() - SUCCESS");
          } else {
            trackCreationAttempts.push("sequence.insertAudioTrack() - NOT AVAILABLE");
          }
        } catch (e3) {
          trackCreationAttempts.push("sequence.insertAudioTrack() - ERROR: " + e3.toString());
        }
      }

      result.debug.trackCreationAttempts = trackCreationAttempts;

      if (!newTrack) {
        // If we can't create tracks, fall back to using existing tracks
        result.debug.trackCreationFailed = true;
        result.debug.apiLimitation = "Premiere Pro ExtendScript may not support dynamic track creation";
        result.debug.fallbackStrategy = "Will place on existing tracks, even if there are conflicts"; // Use the last available track instead of creating a new one

        finalTrackIndex = sequence.audioTracks.numTracks - 1;
        foundAvailableTrack = true;
        result.debug.usingFallbackTrack = finalTrackIndex;
        result.debug.createdNewTrack = false;
      } else {
        // Successfully created a new track (hopefully with QE API!)
        result.debug.afterTrackCreation = sequence.audioTracks.numTracks; // Check if track count actually increased

        if (sequence.audioTracks.numTracks > result.debug.beforeTrackCreation) {
          // Success! Track was actually created - use the NEW track at the end
          finalTrackIndex = sequence.audioTracks.numTracks - 1; // This should be the NEW empty track

          result.debug.createdNewTrack = true;
          result.debug.newTrackIndex = finalTrackIndex;
          result.debug.trackCreationSuccess = true;
          result.debug.trackCreationConfirmed = "YES - from " + result.debug.beforeTrackCreation + " to " + result.debug.afterTrackCreation;
          result.debug.usingNewlyCreatedTrack = "Track " + (finalTrackIndex + 1) + " (should be empty)";
          foundAvailableTrack = true;
        } else {
          // Track creation call succeeded but no new track appeared
          result.debug.trackCreationConfirmed = "NO - track count stayed " + sequence.audioTracks.numTracks;
          result.debug.trackCreationFailed = true; // Fall back to using existing tracks

          finalTrackIndex = sequence.audioTracks.numTracks - 1;
          foundAvailableTrack = true;
          result.debug.usingFallbackTrack = finalTrackIndex;
          result.debug.createdNewTrack = false;
        }
      }
    }

    result.debug.placementAttempts = placementAttempts;
    result.debug.finalTrackIndex = finalTrackIndex;
    result.debug.totalTracksNow = sequence.audioTracks.numTracks; // Place audio at specific time

    result.step = "placing_audio";
    var targetTrack = sequence.audioTracks[finalTrackIndex];

    try {
      targetTrack.insertClip(importedItem, timeSeconds);
      result.debug.placementMethod = "insertClip at specific time";
      result.debug.placementSuccess = true;
    } catch (insertError) {
      result.error = "Failed to insert clip at time " + timeSeconds + "s: " + insertError.toString();
      return result;
    } // Success!


    result.success = true;
    result.step = "completed";
    var message = "Audio placed at " + formatTime(timeSeconds) + " on track " + (finalTrackIndex + 1);

    if (result.debug.createdNewTrack) {
      message += " (new track created)";
    } else if (finalTrackIndex !== startingTrackIdx) {
      message += " (avoided conflicts)";
    }

    result.message = message;
    result.fileName = importedItem.name;
    result.trackIndex = finalTrackIndex;
    result.position = timeSeconds;
    result.positionFormatted = formatTime(timeSeconds);
    return result;
  } catch (error) {
    result.error = "Exception in step '" + result.step + "': " + error.toString();
    return result;
  }
};
/**
 * Standard audio import at playhead position (for non-in/out mode)
 */

var importAndPlaceAudio = function importAndPlaceAudio(filePath) {
  var trackIndex = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

  try {
    var sequence = app.project.activeSequence;

    if (!sequence) {
      return {
        success: false,
        error: "No active sequence"
      };
    }

    var currentTime = sequence.getPlayerPosition();
    return importAndPlaceAudioAtTime(filePath, currentTime.seconds, trackIndex);
  } catch (error) {
    return {
      success: false,
      error: "Failed to place at playhead: " + error.toString()
    };
  }
};
/**
 * Utility function to format time as HH:MM:SS
 */

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00:00";
  }

  var hours = Math.floor(seconds / 3600);
  var minutes = Math.floor(seconds % 3600 / 60);
  var secs = Math.floor(seconds % 60);
  var hoursStr = hours < 10 ? "0" + hours : hours.toString();
  var minutesStr = minutes < 10 ? "0" + minutes : minutes.toString();
  var secsStr = secs < 10 ? "0" + secs : secs.toString();
  return hoursStr + ":" + minutesStr + ":" + secsStr;
}
/**
 * Test function for Bolt CEP connectivity
 */


var testConnection = function testConnection() {
  return {
    success: true,
    message: "AI SFX Generator ExtendScript connected via Bolt CEP!",
    timestamp: new Date().toISOString(),
    premiereVersion: app.version,
    projectName: app.project ? app.project.name : "No project"
  };
};
/**
 * Get basic app info for debugging
 */

var getAppInfo = function getAppInfo() {
  return {
    appName: app.appName,
    version: app.version,
    projectName: app.project ? app.project.name : "No project",
    hasActiveSequence: !!(app.project && app.project.activeSequence),
    sequenceName: app.project && app.project.activeSequence ? app.project.activeSequence.name : null
  };
};

var ppro = /*#__PURE__*/__objectFreeze({
  __proto__: null,
  getSequenceInfoLite: getSequenceInfoLite,
  getSequenceInfo: getSequenceInfo,
  importAndPlaceAudioAtTime: importAndPlaceAudioAtTime,
  importAndPlaceAudio: importAndPlaceAudio,
  testConnection: testConnection,
  getAppInfo: getAppInfo
});

var host = typeof $ !== "undefined" ? $ : window; // A safe way to get the app name since some versions of Adobe Apps broken BridgeTalk in various places (e.g. After Effects 24-25)
// in that case we have to do various checks per app to deterimine the app name

var getAppNameSafely = function getAppNameSafely() {
  var compare = function compare(a, b) {
    return a.toLowerCase().indexOf(b.toLowerCase()) > -1;
  };

  var exists = function exists(a) {
    return typeof a !== "undefined";
  };

  var isBridgeTalkWorking = typeof BridgeTalk !== "undefined" && typeof BridgeTalk.appName !== "undefined";

  if (isBridgeTalkWorking) {
    return BridgeTalk.appName;
  } else if (app) {
    
    if (exists(app.name)) {
      
      var name = app.name;
      if (compare(name, "photoshop")) return "photoshop";
      if (compare(name, "illustrator")) return "illustrator";
      if (compare(name, "audition")) return "audition";
      if (compare(name, "bridge")) return "bridge";
      if (compare(name, "indesign")) return "indesign";
    } 


    if (exists(app.appName)) {
      
      var appName = app.appName;
      if (compare(appName, "after effects")) return "aftereffects";
      if (compare(appName, "animate")) return "animate";
    } 


    if (exists(app.path)) {
      
      var path = app.path;
      if (compare(path, "premiere")) return "premierepro";
    } 


    if (exists(app.getEncoderHost) && exists(AMEFrontendEvent)) {
      return "ame";
    }
  }

  return "unknown";
};

switch (getAppNameSafely()) {
  // BOLT_AEFT_START
  case "aftereffects":
  case "aftereffectsbeta":
    host[ns] = aeft;
    break;
  // BOLT_AEFT_END
  // BOLT_AME_START

  case "ame":
  case "amebeta":
    host[ns] = ame;
    break;
  // BOLT_AME_END
  // BOLT_ANIM_START

  case "animate":
  case "animatebeta":
    host[ns] = anim;
    break;
  // BOLT_ANIM_END
  // BOLT_AUDT_START

  case "audition":
  case "auditionbeta":
    host[ns] = audt;
    break;
  // BOLT_AUDT_END
  // BOLT_IDSN_START

  case "indesign":
  case "indesignbeta":
    host[ns] = idsn;
    break;
  // BOLT_IDSN_END
  // BOLT_ILST_START

  case "illustrator":
  case "illustratorbeta":
    host[ns] = ilst;
    break;
  // BOLT_ILST_END
  // BOLT_KBRG_START

  case "bridge":
  case "bridgebeta":
    host[ns] = kbrg;
    break;
  // BOLT_KBRG_END
  // BOLT_PHXS_START

  case "photoshop":
  case "photoshopbeta":
    host[ns] = phxs;
    break;
  // BOLT_PHXS_END
  // BOLT_PPRO_START

  case "premierepro":
  case "premiereprobeta":
    host[ns] = ppro;
    break;
  // BOLT_PPRO_END
}
// https://extendscript.docsforadobe.dev/interapplication-communication/bridgetalk-class.html?highlight=bridgetalk#appname
})(this);//# sourceMappingURL=index.js.map
