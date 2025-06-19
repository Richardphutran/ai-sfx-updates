/**
 * Custom hook for audio preview functionality
 * Handles audio playback, volume control, and preview state management
 */

import { useCallback, useRef, useEffect } from 'react';
import { errorManager, ErrorUtils } from '../lib/error-manager';
import { SecurityValidator, InputSanitizer } from '../lib/security-manager';
import type { SFXState, SFXAction, SFXFileInfo } from '../lib/state-manager';
import { SFXActions } from '../lib/state-manager';

interface UseAudioPreviewProps {
  state: SFXState;
  dispatch: React.Dispatch<SFXAction>;
}

export const useAudioPreview = ({ state, dispatch }: UseAudioPreviewProps) => {
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const volumeUpdateTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * Create or get cached audio element
   */
  const getAudioElement = useCallback((filePath: string): HTMLAudioElement | null => {
    try {
      // Validate file path
      const validation = SecurityValidator.validateFileOperation('read', filePath);
      if (!validation.valid) {
        ErrorUtils.handleValidationError(`Invalid audio file path: ${validation.error}`);
        return null;
      }

      // Check cache first
      let audio = audioCache.current.get(filePath);
      
      if (!audio) {
        // Create new audio element
        audio = new Audio();
        audio.preload = 'none'; // Load on demand
        audio.crossOrigin = 'anonymous';
        
        // Set up event listeners
        audio.addEventListener('loadstart', () => {
          console.log('Audio loading started:', filePath);
        });

        audio.addEventListener('canplay', () => {
          console.log('Audio ready to play:', filePath);
        });

        audio.addEventListener('error', (event) => {
          const error = new Error(`Audio load error: ${audio?.error?.message || 'Unknown error'}`);
          ErrorUtils.handleFileError(error as Error, { 
            operation: 'loadAudio', 
            path: filePath 
          });
        });

        audio.addEventListener('ended', () => {
          dispatch(SFXActions.setPlaying(false));
          dispatch(SFXActions.setPreviewFile(null));
        });

        // Set the source
        audio.src = `file://${filePath}`;
        
        // Cache the audio element
        audioCache.current.set(filePath, audio);
        
        // Limit cache size to prevent memory issues
        if (audioCache.current.size > 10) {
          const firstKey = audioCache.current.keys().next().value;
          const oldAudio = audioCache.current.get(firstKey);
          if (oldAudio) {
            oldAudio.pause();
            oldAudio.src = '';
          }
          audioCache.current.delete(firstKey);
        }
      }

      return audio;
    } catch (error) {
      ErrorUtils.handleFileError(error as Error, { 
        operation: 'getAudioElement', 
        path: filePath 
      });
      return null;
    }
  }, [dispatch]);

  /**
   * Play audio file
   */
  const playAudio = useCallback(async (filePath: string): Promise<void> => {
    try {
      // Stop current audio if playing
      if (currentAudioRef.current && !currentAudioRef.current.paused) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      }

      const audio = getAudioElement(filePath);
      if (!audio) {
        throw new Error('Failed to load audio file');
      }

      // Update state
      dispatch(SFXActions.setPreviewAudio(audio));
      dispatch(SFXActions.setPreviewFile(filePath));
      dispatch(SFXActions.setPlaying(true));

      // Set volume
      audio.volume = Math.max(0, Math.min(1, state.volume / 100));

      // Store reference
      currentAudioRef.current = audio;

      // Play audio
      await audio.play();
      
      errorManager.info('Audio preview started');

    } catch (error) {
      dispatch(SFXActions.setPlaying(false));
      dispatch(SFXActions.setPreviewFile(null));
      
      if (error instanceof Error && error.name === 'NotAllowedError') {
        errorManager.warning('Audio playback blocked by browser. Click to enable audio.');
      } else {
        ErrorUtils.handleFileError(error as Error, { 
          operation: 'playAudio', 
          path: filePath 
        });
      }
    }
  }, [getAudioElement, state.volume, dispatch]);

  /**
   * Stop audio playback
   */
  const stopAudio = useCallback((): void => {
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      }

      dispatch(SFXActions.setPlaying(false));
      dispatch(SFXActions.setPreviewFile(null));
      dispatch(SFXActions.setPreviewAudio(null));

      currentAudioRef.current = null;
      
    } catch (error) {
      ErrorUtils.handleFileError(error as Error, { operation: 'stopAudio' });
    }
  }, [dispatch]);

  /**
   * Pause audio playback
   */
  const pauseAudio = useCallback((): void => {
    try {
      if (currentAudioRef.current && !currentAudioRef.current.paused) {
        currentAudioRef.current.pause();
        dispatch(SFXActions.setPlaying(false));
      }
    } catch (error) {
      ErrorUtils.handleFileError(error as Error, { operation: 'pauseAudio' });
    }
  }, [dispatch]);

  /**
   * Resume audio playback
   */
  const resumeAudio = useCallback(async (): Promise<void> => {
    try {
      if (currentAudioRef.current && currentAudioRef.current.paused) {
        await currentAudioRef.current.play();
        dispatch(SFXActions.setPlaying(true));
      }
    } catch (error) {
      ErrorUtils.handleFileError(error as Error, { operation: 'resumeAudio' });
    }
  }, [dispatch]);

  /**
   * Toggle play/pause
   */
  const togglePlayback = useCallback(async (filePath?: string): Promise<void> => {
    if (state.isPlaying && currentAudioRef.current) {
      // Currently playing - pause or stop
      if (filePath && state.previewFile !== filePath) {
        // Different file - stop current and play new
        stopAudio();
        await playAudio(filePath);
      } else {
        // Same file or no file specified - pause
        pauseAudio();
      }
    } else {
      // Not playing - start playback
      if (filePath) {
        await playAudio(filePath);
      } else if (state.previewFile) {
        // Resume current file
        await resumeAudio();
      }
    }
  }, [state.isPlaying, state.previewFile, playAudio, stopAudio, pauseAudio, resumeAudio]);

  /**
   * Update volume for current audio
   */
  const updateVolume = useCallback((volume: number): void => {
    try {
      // Clamp volume between 0 and 100
      const clampedVolume = Math.max(0, Math.min(100, volume));
      
      // Update state
      dispatch(SFXActions.setVolume(clampedVolume));

      // Update current audio volume
      if (currentAudioRef.current) {
        currentAudioRef.current.volume = clampedVolume / 100;
      }

      // Debounced success message
      if (volumeUpdateTimeoutRef.current) {
        clearTimeout(volumeUpdateTimeoutRef.current);
      }
      
      volumeUpdateTimeoutRef.current = setTimeout(() => {
        errorManager.info(`Volume set to ${clampedVolume}%`);
      }, 500);

    } catch (error) {
      ErrorUtils.handleFileError(error as Error, { operation: 'updateVolume' });
    }
  }, [dispatch]);

  /**
   * Get audio duration if available
   */
  const getAudioDuration = useCallback((filePath: string): number | null => {
    try {
      const audio = audioCache.current.get(filePath);
      return audio && !isNaN(audio.duration) ? audio.duration : null;
    } catch (error) {
      return null;
    }
  }, []);

  /**
   * Get current playback time
   */
  const getCurrentTime = useCallback((): number => {
    try {
      return currentAudioRef.current?.currentTime || 0;
    } catch (error) {
      return 0;
    }
  }, []);

  /**
   * Seek to specific time
   */
  const seekTo = useCallback((time: number): void => {
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.currentTime = Math.max(0, time);
      }
    } catch (error) {
      ErrorUtils.handleFileError(error as Error, { operation: 'seekTo' });
    }
  }, []);

  /**
   * Preload audio file for faster playback
   */
  const preloadAudio = useCallback((filePath: string): void => {
    try {
      const audio = getAudioElement(filePath);
      if (audio) {
        audio.preload = 'metadata';
        audio.load();
      }
    } catch (error) {
      console.warn('Preload failed:', error);
    }
  }, [getAudioElement]);

  /**
   * Clear audio cache
   */
  const clearCache = useCallback((): void => {
    try {
      audioCache.current.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      audioCache.current.clear();
      
      if (currentAudioRef.current) {
        currentAudioRef.current = null;
      }

      dispatch(SFXActions.setPreviewAudio(null));
      dispatch(SFXActions.setPlaying(false));
      dispatch(SFXActions.setPreviewFile(null));

    } catch (error) {
      ErrorUtils.handleFileError(error as Error, { operation: 'clearCache' });
    }
  }, [dispatch]);

  /**
   * Get playback status for a specific file
   */
  const getPlaybackStatus = useCallback((filePath: string) => {
    return {
      isCurrentFile: state.previewFile === filePath,
      isPlaying: state.isPlaying && state.previewFile === filePath,
      isPaused: !state.isPlaying && state.previewFile === filePath,
      duration: getAudioDuration(filePath),
      currentTime: state.previewFile === filePath ? getCurrentTime() : 0
    };
  }, [state.previewFile, state.isPlaying, getAudioDuration, getCurrentTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearCache();
      
      if (volumeUpdateTimeoutRef.current) {
        clearTimeout(volumeUpdateTimeoutRef.current);
      }
    };
  }, [clearCache]);

  // Update volume when state changes
  useEffect(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.volume = state.volume / 100;
    }
  }, [state.volume]);

  return {
    // Playback controls
    playAudio,
    stopAudio,
    pauseAudio,
    resumeAudio,
    togglePlayback,
    
    // Volume controls
    updateVolume,
    
    // Seek controls
    seekTo,
    getCurrentTime,
    getAudioDuration,
    
    // Utility functions
    preloadAudio,
    clearCache,
    getPlaybackStatus,
    
    // State
    isPlaying: state.isPlaying,
    currentFile: state.previewFile,
    volume: state.volume,
    
    // Audio element access (for advanced use cases)
    getCurrentAudio: () => currentAudioRef.current,
    
    // Cache info
    getCacheSize: () => audioCache.current.size,
    isCached: (filePath: string) => audioCache.current.has(filePath)
  };
};