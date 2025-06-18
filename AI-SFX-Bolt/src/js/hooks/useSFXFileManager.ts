/**
 * Custom hook for SFX file management operations
 * Handles file scanning, path management, and file system operations
 */

import { useCallback, useRef } from 'react';
import { fs } from '../lib/cep/node';
import { errorManager, ErrorUtils, ErrorCategory, ErrorSeverity } from '../lib/error-manager';
import { SecurityValidator, InputSanitizer } from '../lib/security-manager';
import type { SFXState, SFXFileInfo, SFXAction } from '../lib/state-manager';
import { SFXActions } from '../lib/state-manager';

// Async file system utilities
const fsAsync = {
  exists: async (path: string): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        resolve(fs.existsSync(path));
      } catch {
        resolve(false);
      }
    });
  },
  
  readdir: async (path: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      try {
        const items = fs.readdirSync(path);
        resolve(items);
      } catch (error) {
        reject(error);
      }
    });
  },
  
  stat: async (path: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      try {
        const stats = fs.statSync(path);
        resolve(stats);
      } catch (error) {
        reject(error);
      }
    });
  },
  
  mkdir: async (path: string, options?: { recursive?: boolean }): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        fs.mkdirSync(path, options);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
};

interface UseSFXFileManagerProps {
  state: SFXState;
  dispatch: React.Dispatch<SFXAction>;
}

export const useSFXFileManager = ({ state, dispatch }: UseSFXFileManagerProps) => {
  const cachedFileInfoRef = useRef<SFXFileInfo[]>([]);
  const CACHE_DURATION = 30000; // 30 seconds cache

  /**
   * Parse SFX filename to extract metadata
   */
  const parseSFXFilename = useCallback((filename: string, fullPath: string, source: 'filesystem' | 'project_bin' = 'filesystem'): SFXFileInfo => {
    const basename = filename.replace(/\.[^/.]+$/, ''); // Remove extension
    const parts = basename.split('_');
    
    // Try to extract number and prompt from filename
    let number = 0;
    let prompt = basename;
    
    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];
      const numberMatch = lastPart.match(/(\d+)$/);
      if (numberMatch) {
        number = parseInt(numberMatch[1], 10);
        prompt = parts.slice(0, -1).join('_');
      }
    }
    
    // Get file stats for timestamp
    let timestamp = '';
    try {
      const stats = fs.statSync(fullPath);
      timestamp = stats.mtime.toISOString();
    } catch (error) {
      timestamp = new Date().toISOString();
    }
    
    return {
      filename,
      basename,
      number,
      prompt: prompt.replace(/_/g, ' '),
      timestamp,
      path: fullPath,
      source
    };
  }, []);

  /**
   * Get the current SFX directory path
   */
  const getCurrentSFXPath = useCallback((): string | null => {
    if (state.customSFXPath) {
      return state.customSFXPath;
    }
    
    // Note: Project path needs to be determined by caller since
    // TimelineInfo doesn't contain project path information
    return null;
  }, [state.customSFXPath]);

  /**
   * Get display name for current SFX location
   */
  const getSFXLocationDisplay = useCallback((): string => {
    if (state.customSFXPath) {
      const folderName = state.customSFXPath.split('/').pop() || 'Custom';
      return `Custom: ${folderName}`;
    }
    
    // Default display when no custom path is set
    return 'Project: SFX/ai sfx';
  }, [state.customSFXPath]);

  /**
   * Ensure SFX directory exists
   */
  const ensureSFXDirectory = useCallback(async (): Promise<string | null> => {
    try {
      const sfxPath = getCurrentSFXPath();
      if (!sfxPath) {
        errorManager.warning('No SFX storage location available');
        return null;
      }

      // Validate path security
      const validation = SecurityValidator.validateFileOperation('mkdir', sfxPath);
      if (!validation.valid) {
        ErrorUtils.handleValidationError(`Invalid SFX path: ${validation.error}`);
        return null;
      }

      // Create directory if it doesn't exist
      const exists = await fsAsync.exists(sfxPath);
      if (!exists) {
        await fsAsync.mkdir(sfxPath, { recursive: true });
        errorManager.success('SFX directory created successfully');
      }

      return sfxPath;
    } catch (error) {
      ErrorUtils.handleFileError(error as Error, { operation: 'ensureSFXDirectory' });
      return null;
    }
  }, [getCurrentSFXPath]);

  /**
   * Scan for existing SFX files
   */
  const scanSFXFiles = useCallback(async (forceRefresh = false): Promise<void> => {
    try {
      // Check cache first
      const now = Date.now();
      if (!forceRefresh && 
          cachedFileInfoRef.current.length > 0 && 
          now - state.lastScanTime < CACHE_DURATION) {
        return;
      }

      dispatch(SFXActions.setScanningFiles(true));

      const sfxPath = getCurrentSFXPath();
      if (!sfxPath) {
        dispatch(SFXActions.updateFileScan([], now));
        return;
      }

      const pathExists = await fsAsync.exists(sfxPath);
      if (!pathExists) {
        dispatch(SFXActions.updateFileScan([], now));
        return;
      }

      const files = await fsAsync.readdir(sfxPath);
      const audioFiles = files.filter(file => 
        /\.(mp3|wav|m4a|aac|flac|ogg)$/i.test(file)
      );

      const fileInfoPromises = audioFiles.map(async (filename) => {
        const fullPath = `${sfxPath}/${filename}`;
        return parseSFXFilename(filename, fullPath);
      });

      const fileInfo = await Promise.all(fileInfoPromises);
      
      // Sort by timestamp (newest first)
      fileInfo.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Update cache
      cachedFileInfoRef.current = fileInfo;
      
      dispatch(SFXActions.updateFileScan(fileInfo, now));
      
      if (fileInfo.length > 0) {
        errorManager.info(`Found ${fileInfo.length} SFX files`);
      }

    } catch (error) {
      ErrorUtils.handleFileError(error as Error, { operation: 'scanSFXFiles' });
      dispatch(SFXActions.setScanningFiles(false));
    }
  }, [getCurrentSFXPath, parseSFXFilename, state.lastScanTime, dispatch]);

  /**
   * Set custom SFX folder
   */
  const setCustomSFXFolder = useCallback(async (folderPath: string): Promise<boolean> => {
    try {
      // Sanitize path
      const sanitizedPath = InputSanitizer.sanitizeFilePath(folderPath);
      
      // Validate path
      const validation = SecurityValidator.validateFileOperation('access', sanitizedPath);
      if (!validation.valid) {
        ErrorUtils.handleValidationError(`Invalid folder path: ${validation.error}`);
        return false;
      }

      // Check if folder exists
      const exists = await fsAsync.exists(sanitizedPath);
      if (!exists) {
        errorManager.warning('Selected folder does not exist');
        return false;
      }

      // Check if it's a directory
      try {
        const stats = await fsAsync.stat(sanitizedPath);
        if (!stats.isDirectory()) {
          errorManager.warning('Selected path is not a folder');
          return false;
        }
      } catch (error) {
        ErrorUtils.handleFileError(error as Error, { operation: 'validateFolder' });
        return false;
      }

      dispatch(SFXActions.setCustomSFXPath(sanitizedPath));
      
      // Trigger file scan for new location
      await scanSFXFiles(true);
      
      errorManager.success('Custom SFX folder set successfully');
      return true;

    } catch (error) {
      ErrorUtils.handleFileError(error as Error, { operation: 'setCustomSFXFolder' });
      return false;
    }
  }, [dispatch, scanSFXFiles]);

  /**
   * Clear custom SFX folder (revert to project folder)
   */
  const clearCustomSFXFolder = useCallback(async (): Promise<void> => {
    dispatch(SFXActions.setCustomSFXPath(null));
    await scanSFXFiles(true);
    errorManager.success('Reverted to project SFX folder');
  }, [dispatch, scanSFXFiles]);

  /**
   * Open SFX folder in system file explorer
   */
  const openSFXFolder = useCallback(async (): Promise<void> => {
    try {
      const sfxPath = await ensureSFXDirectory();
      if (!sfxPath) {
        return;
      }

      // Use system command to open folder
      const { exec } = require('child_process');
      const platform = require('os').platform();
      
      let command: string;
      switch (platform) {
        case 'darwin': // macOS
          command = `open "${sfxPath}"`;
          break;
        case 'win32': // Windows
          command = `explorer "${sfxPath}"`;
          break;
        default: // Linux
          command = `xdg-open "${sfxPath}"`;
          break;
      }

      exec(command, (error: any) => {
        if (error) {
          ErrorUtils.handleFileError(error as Error, { operation: 'openSFXFolder' });
        } else {
          errorManager.success('SFX folder opened');
        }
      });

    } catch (error) {
      ErrorUtils.handleFileError(error as Error, { operation: 'openSFXFolder' });
    }
  }, [ensureSFXDirectory]);

  /**
   * Filter SFX files based on search query
   */
  const filterSFXFiles = useCallback((query: string): void => {
    if (!query.trim()) {
      dispatch(SFXActions.setFilteredSFXFiles(state.existingSFXFiles));
      return;
    }

    const sanitizedQuery = InputSanitizer.sanitizePrompt(query.toLowerCase());
    const filtered = state.allSFXFileInfo
      .filter(file => 
        file.prompt.toLowerCase().includes(sanitizedQuery) ||
        file.filename.toLowerCase().includes(sanitizedQuery)
      )
      .map(file => file.filename);

    dispatch(SFXActions.setFilteredSFXFiles(filtered));
  }, [state.existingSFXFiles, state.allSFXFileInfo, dispatch]);

  return {
    // State getters
    getCurrentSFXPath,
    getSFXLocationDisplay,
    
    // File operations
    ensureSFXDirectory,
    scanSFXFiles,
    setCustomSFXFolder,
    clearCustomSFXFolder,
    openSFXFolder,
    
    // Search and filtering
    filterSFXFiles,
    parseSFXFilename,
    
    // Computed values
    hasValidSFXPath: getCurrentSFXPath() !== null,
    fileCount: state.allSFXFileInfo.length,
    isScanning: state.isScanningFiles,
    lastScanTime: state.lastScanTime
  };
};