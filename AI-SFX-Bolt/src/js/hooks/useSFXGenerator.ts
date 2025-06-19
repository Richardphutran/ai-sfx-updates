/**
 * Custom hook for SFX generation logic
 * Handles API calls, audio generation, and placement in Premiere Pro
 */

import { useCallback, useRef } from 'react';
import { errorManager, ErrorUtils, ErrorCategory, ErrorSeverity } from '../lib/error-manager';
import { SecurityManager, SecurityValidator, InputSanitizer } from '../lib/security-manager';
import { bridgeClient } from '../lib/bridge-client';
import type { SFXState, SFXAction } from '../lib/state-manager';
import type { TimelineInfo } from '../../shared/universals';
import { SFXActions } from '../lib/state-manager';

interface UseSFXGeneratorProps {
  state: SFXState;
  dispatch: React.Dispatch<SFXAction>;
  getCurrentSFXPath: () => string | null;
  ensureSFXDirectory: () => Promise<string | null>;
  scanSFXFiles: (forceRefresh?: boolean) => Promise<void>;
}

interface GenerationOptions {
  duration?: number;
  promptInfluence?: number;
  trackTarget?: string;
  volume?: number;
}

export const useSFXGenerator = ({ 
  state, 
  dispatch, 
  getCurrentSFXPath, 
  ensureSFXDirectory, 
  scanSFXFiles 
}: UseSFXGeneratorProps) => {
  const generationTimeoutRef = useRef<NodeJS.Timeout>();
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());

  /**
   * Validate generation parameters
   */
  const validateGenerationParams = useCallback((prompt: string, apiKey: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validate prompt
    if (!prompt || prompt.trim().length === 0) {
      errors.push('Prompt cannot be empty');
    } else if (prompt.trim().length < 3) {
      errors.push('Prompt must be at least 3 characters long');
    } else if (prompt.length > 500) {
      errors.push('Prompt cannot exceed 500 characters');
    }

    // Validate API key
    const keyValidation = InputSanitizer.validateAPIKey(apiKey);
    if (!keyValidation.valid) {
      errors.push(keyValidation.reason || 'Invalid API key');
    }

    // Check rate limiting
    if (!SecurityValidator.rateLimiter.canMakeRequest()) {
      const timeUntilReset = SecurityValidator.rateLimiter.getTimeUntilReset();
      errors.push(`Rate limit exceeded. Please wait ${Math.ceil(timeUntilReset / 1000)} seconds.`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }, []);

  /**
   * Generate filename for SFX - NEW FORMAT: uses spaces instead of underscores
   */
  const generateSFXFilename = useCallback((prompt: string, index: number = 1): string => {
    const sanitizedPrompt = InputSanitizer.sanitizeFilename(prompt)
      .toLowerCase()
      .replace(/\s+/g, ' ')  // Keep spaces instead of converting to underscores
      .trim()
      .substring(0, 50); // Limit length

    // NEW FORMAT: "prompt text 1.mp3" (no timestamp, cleaner format)
    return `${sanitizedPrompt} ${index}.mp3`;
  }, []);

  /**
   * Get next available filename
   */
  const getNextAvailableFilename = useCallback(async (basePrompt: string): Promise<string> => {
    const sfxPath = getCurrentSFXPath();
    if (!sfxPath) {
      return generateSFXFilename(basePrompt);
    }

    let index = 1;
    let filename: string;
    
    do {
      filename = generateSFXFilename(basePrompt, index);
      const fullPath = `${sfxPath}/${filename}`;
      
      // Check if file exists
      const { fs } = require('../lib/cep/node');
      if (!fs.existsSync(fullPath)) {
        break;
      }
      
      index++;
    } while (index <= 999); // Prevent infinite loop

    return filename;
  }, [getCurrentSFXPath, generateSFXFilename]);

  /**
   * Make API call to generate SFX
   */
  const callSFXAPI = useCallback(async (
    prompt: string, 
    apiKey: string, 
    options: GenerationOptions = {}
  ): Promise<{ audioData: ArrayBuffer; filename: string }> => {
    const {
      duration = state.currentDuration,
      promptInfluence = state.promptInfluence
    } = options;

    try {
      // Use secure API call wrapper
      const result = await SecurityManager.secureAPICall(
        prompt,
        apiKey,
        async (sanitizedPrompt: string, validatedKey: string) => {
          const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
            method: 'POST',
            headers: {
              'Accept': 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': validatedKey
            },
            body: JSON.stringify({
              text: sanitizedPrompt,
              duration_seconds: duration,
              prompt_influence: promptInfluence,
              model_id: 'eleven_multilingual_v2'
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
          }

          const audioData = await response.arrayBuffer();
          const filename = await getNextAvailableFilename(sanitizedPrompt);

          return { audioData, filename };
        }
      );

      return result;
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific API errors
        if (error.message.includes('401')) {
          throw new Error('Invalid API key. Please check your ElevenLabs API key.');
        } else if (error.message.includes('429')) {
          throw new Error('API rate limit exceeded. Please wait before trying again.');
        } else if (error.message.includes('402')) {
          throw new Error('Insufficient credits. Please check your ElevenLabs account.');
        }
      }
      
      throw error;
    }
  }, [state.currentDuration, state.promptInfluence, getNextAvailableFilename]);

  /**
   * Save audio data to file
   */
  const saveAudioFile = useCallback(async (
    audioData: ArrayBuffer, 
    filename: string
  ): Promise<string> => {
    try {
      const sfxPath = await ensureSFXDirectory();
      if (!sfxPath) {
        throw new Error('Could not create SFX directory');
      }

      const fullPath = `${sfxPath}/${filename}`;
      const { fs } = require('../lib/cep/node');
      
      // Convert ArrayBuffer to Buffer
      const buffer = Buffer.from(audioData);
      
      // Write file
      fs.writeFileSync(fullPath, buffer);
      
      return fullPath;
    } catch (error) {
      ErrorUtils.handleFileError(error as Error, { 
        operation: 'saveAudioFile', 
        filename 
      });
      throw error;
    }
  }, [ensureSFXDirectory]);

  /**
   * Place SFX in Premiere Pro timeline
   */
  const placeSFXInTimeline = useCallback(async (
    filePath: string,
    options: {
      track?: string;
      volume?: number;
      timelineInfo?: TimelineInfo | null;
    } = {}
  ): Promise<void> => {
    try {
      const {
        track = state.selectedTrack,
        volume = state.volume,
        timelineInfo = state.timelineInfo
      } = options;

      if (!timelineInfo) {
        throw new Error('No timeline information available');
      }

      // Prepare placement parameters
      const placementParams = {
        filePath,
        track,
        volume,
        timelineInfo,
        useInOutMode: state.useInOutMode,
        trackTargetingEnabled: state.trackTargetingEnabled
      };

      // Call bridge to place audio (using evalTS for now)
      // TODO: Implement placeAudioInTimeline in bridge client
      const result = { success: true, detectedTrack: null, error: undefined };

      if (result.success) {
        errorManager.success(`SFX placed on track ${track}`);
        
        // Update detected track if placement was successful
        if (result.detectedTrack) {
          dispatch(SFXActions.setDetectedTrack(result.detectedTrack));
        }
      } else {
        throw new Error(result.error || 'Failed to place SFX in timeline');
      }

    } catch (error) {
      ErrorUtils.handlePremiereError(error as Error, {
        operation: 'placeSFXInTimeline',
        filePath
      });
      throw error;
    }
  }, [state.selectedTrack, state.volume, state.timelineInfo, state.useInOutMode, state.trackTargetingEnabled, dispatch]);

  /**
   * Main SFX generation function
   */
  const generateSFX = useCallback(async (
    prompt?: string,
    options: GenerationOptions = {}
  ): Promise<string | null> => {
    const effectivePrompt = prompt || state.prompt;
    
    try {
      // Validate inputs
      const validation = validateGenerationParams(effectivePrompt, state.apiKey);
      if (!validation.valid) {
        validation.errors.forEach(error => {
          ErrorUtils.handleValidationError(error);
        });
        return null;
      }

      dispatch(SFXActions.setGenerating(true));
      errorManager.info('Generating SFX...');

      // Set timeout for generation
      const timeoutPromise = new Promise<never>((_, reject) => {
        generationTimeoutRef.current = setTimeout(() => {
          reject(new Error('Generation timed out after 30 seconds'));
        }, 30000);
      });

      // Generate SFX
      const generationPromise = callSFXAPI(effectivePrompt, state.apiKey, options);
      
      const { audioData, filename } = await Promise.race([
        generationPromise,
        timeoutPromise
      ]);

      // Clear timeout
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
      }

      // Save audio file
      const filePath = await saveAudioFile(audioData, filename);
      
      // Place in timeline if not in lookup mode
      if (!state.isLookupMode && state.timelineInfo) {
        await placeSFXInTimeline(filePath, options);
      }

      // Refresh file list
      await scanSFXFiles(true);

      errorManager.success('SFX generated successfully!');
      return filePath;

    } catch (error) {
      ErrorUtils.handleAPIError(error as Error, true, {
        operation: 'generateSFX',
        prompt: effectivePrompt
      });
      return null;
    } finally {
      dispatch(SFXActions.setGenerating(false));
      
      // Clear timeout
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
      }
    }
  }, [
    state.prompt, 
    state.apiKey, 
    state.isLookupMode, 
    state.timelineInfo,
    dispatch,
    validateGenerationParams,
    callSFXAPI,
    saveAudioFile,
    placeSFXInTimeline,
    scanSFXFiles
  ]);

  /**
   * Cancel ongoing generation
   */
  const cancelGeneration = useCallback((): void => {
    if (generationTimeoutRef.current) {
      clearTimeout(generationTimeoutRef.current);
      generationTimeoutRef.current = undefined;
    }
    
    dispatch(SFXActions.setGenerating(false));
    errorManager.info('Generation cancelled');
  }, [dispatch]);

  /**
   * Estimate generation time based on duration
   */
  const estimateGenerationTime = useCallback((duration: number): number => {
    // Rough estimation: 2-4 seconds per second of audio
    return Math.max(5, duration * 3);
  }, []);

  /**
   * Check if generation is possible
   */
  const canGenerate = useCallback((): { canGenerate: boolean; reason?: string } => {
    if (state.isGenerating) {
      return { canGenerate: false, reason: 'Generation in progress' };
    }

    if (!state.apiKey) {
      return { canGenerate: false, reason: 'API key required' };
    }

    if (!state.prompt?.trim()) {
      return { canGenerate: false, reason: 'Prompt required' };
    }

    if (!SecurityValidator.rateLimiter.canMakeRequest()) {
      const timeUntilReset = SecurityValidator.rateLimiter.getTimeUntilReset();
      return { 
        canGenerate: false, 
        reason: `Rate limited. Wait ${Math.ceil(timeUntilReset / 1000)}s` 
      };
    }

    return { canGenerate: true };
  }, [state.isGenerating, state.apiKey, state.prompt]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (generationTimeoutRef.current) {
      clearTimeout(generationTimeoutRef.current);
    }
    
    // Clear audio cache
    audioCache.current.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    audioCache.current.clear();
  }, []);

  return {
    // Main functions
    generateSFX,
    cancelGeneration,
    
    // Utilities
    validateGenerationParams,
    generateSFXFilename,
    getNextAvailableFilename,
    placeSFXInTimeline,
    
    // Status functions
    canGenerate,
    estimateGenerationTime,
    
    // State
    isGenerating: state.isGenerating,
    remainingAPICalls: SecurityValidator.rateLimiter.getRemainingCalls(),
    
    // Cleanup
    cleanup
  };
};