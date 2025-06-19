/**
 * DEBUG PROJECT PATH DETECTION ISSUES
 * Comprehensive debugging script to identify why project path detection fails
 */

/**
 * Enhanced project path debug function with deep introspection
 */
export const debugProjectPathDetailed = () => {
    try {
        const debug = {
            timestamp: (new Date()).toString(),
            environment: {
                hasApp: typeof app !== 'undefined',
                appType: typeof app,
                hasGlobalThis: typeof globalThis !== 'undefined',
                hasWindow: typeof window !== 'undefined',
                hasDollarSign: typeof $ !== 'undefined'
            },
            app: {
                exists: typeof app !== 'undefined',
                appName: null,
                version: null,
                hasProject: false,
                projectObject: null
            },
            project: {
                exists: false,
                name: null,
                path: null,
                pathType: null,
                pathLength: 0,
                hasPath: false,
                pathAccessible: false
            },
            extendscript: {
                canWriteln: false,
                dollarWritelnAvailable: false
            },
            errors: []
        };

        // Test $ and $.writeln availability
        try {
            if (typeof $ !== 'undefined' && typeof $.writeln === 'function') {
                debug.extendscript.dollarWritelnAvailable = true;
                debug.extendscript.canWriteln = true;
                $.writeln("[DEBUG] Project path debugging started");
            }
        } catch (e) {
            debug.errors.push("$.writeln error: " + e.toString());
        }

        // Deep app object inspection
        if (typeof app !== 'undefined') {
            debug.app.exists = true;
            
            try {
                debug.app.appName = app.appName || "Unknown";
                debug.app.version = app.version || "Unknown";
            } catch (e) {
                debug.errors.push("App properties error: " + e.toString());
            }

            // Deep project object inspection
            try {
                debug.app.hasProject = typeof app.project !== 'undefined' && app.project !== null;
                
                if (debug.app.hasProject) {
                    debug.project.exists = true;
                    
                    // Project name
                    try {
                        debug.project.name = app.project.name || "Untitled";
                    } catch (e) {
                        debug.errors.push("Project name error: " + e.toString());
                    }
                    
                    // Project path - the critical part
                    try {
                        const projectPath = app.project.path;
                        debug.project.path = projectPath;
                        debug.project.pathType = typeof projectPath;
                        debug.project.pathLength = projectPath ? projectPath.length : 0;
                        debug.project.hasPath = !!(projectPath && projectPath !== "");
                        
                        // Test if path is accessible
                        if (projectPath && projectPath !== "") {
                            try {
                                // Test basic string operations on path
                                const lastSlash = Math.max(projectPath.lastIndexOf('/'), projectPath.lastIndexOf('\\'));
                                debug.project.pathAccessible = lastSlash >= 0;
                            } catch (e) {
                                debug.errors.push("Path processing error: " + e.toString());
                                debug.project.pathAccessible = false;
                            }
                        }
                        
                    } catch (e) {
                        debug.errors.push("Project path access error: " + e.toString());
                    }
                }
            } catch (e) {
                debug.errors.push("Project object error: " + e.toString());
            }
        } else {
            debug.errors.push("App object not available");
        }

        // Log debug information
        if (debug.extendscript.canWriteln) {
            $.writeln("[DEBUG] App exists: " + debug.app.exists);
            $.writeln("[DEBUG] Project exists: " + debug.project.exists);
            $.writeln("[DEBUG] Project has path: " + debug.project.hasPath);
            $.writeln("[DEBUG] Project path: " + (debug.project.path || "NULL"));
            $.writeln("[DEBUG] Errors count: " + debug.errors.length);
        }

        return JSON.stringify({
            success: true,
            debug: debug,
            summary: {
                appAvailable: debug.app.exists,
                projectAvailable: debug.project.exists,
                projectHasPath: debug.project.hasPath,
                pathValue: debug.project.path,
                errorCount: debug.errors.length
            }
        });

    } catch (error) {
        return JSON.stringify({
            success: false,
            error: "Critical error in debug function: " + error.toString(),
            debug: {
                criticalError: true,
                errorMessage: error.toString()
            }
        });
    }
};

/**
 * Test project save status in different ways
 */
export const testProjectSaveStatus = () => {
    try {
        const tests = {
            method1_directPath: null,
            method2_nameCheck: null,
            method3_documentPath: null,
            results: {
                hasValidPath: false,
                pathsMatch: false,
                projectAppearsSaved: false
            }
        };

        if (!app || !app.project) {
            return JSON.stringify({
                success: false,
                error: "No app or project available",
                tests: tests
            });
        }

        // Method 1: Direct path access
        try {
            tests.method1_directPath = app.project.path || null;
        } catch (e) {
            tests.method1_directPath = "ERROR: " + e.toString();
        }

        // Method 2: Check project name (unsaved projects often have generic names)
        try {
            const projectName = app.project.name;
            tests.method2_nameCheck = {
                name: projectName,
                isUntitled: !projectName || projectName.toLowerCase().includes('untitled'),
                hasExtension: projectName && (projectName.includes('.prproj') || projectName.includes('.ppj'))
            };
        } catch (e) {
            tests.method2_nameCheck = "ERROR: " + e.toString();
        }

        // Method 3: Try alternative document access methods
        try {
            if (app.documents && app.documents.length > 0) {
                const doc = app.documents[0];
                tests.method3_documentPath = doc.path || "No path in document";
            } else {
                tests.method3_documentPath = "No documents array";
            }
        } catch (e) {
            tests.method3_documentPath = "ERROR: " + e.toString();
        }

        // Analyze results
        tests.results.hasValidPath = !!(tests.method1_directPath && 
                                        typeof tests.method1_directPath === 'string' && 
                                        tests.method1_directPath.length > 0 &&
                                        !tests.method1_directPath.startsWith('ERROR'));

        tests.results.projectAppearsSaved = tests.results.hasValidPath;

        return JSON.stringify({
            success: true,
            tests: tests,
            conclusion: tests.results.projectAppearsSaved ? 
                "Project appears to be saved" : 
                "Project does not appear to be saved or path inaccessible"
        });

    } catch (error) {
        return JSON.stringify({
            success: false,
            error: "Error testing project save status: " + error.toString()
        });
    }
};

/**
 * Test if we can create SFX directory structure
 */
export const testSFXDirectoryCreation = () => {
    try {
        if (!app || !app.project) {
            return JSON.stringify({
                success: false,
                error: "No app or project available"
            });
        }

        const projectPath = app.project.path;
        if (!projectPath || projectPath === "") {
            return JSON.stringify({
                success: false,
                error: "Project not saved - no path available",
                needsSave: true
            });
        }

        // Extract directory from project file path
        const lastSlash = Math.max(projectPath.lastIndexOf('/'), projectPath.lastIndexOf('\\'));
        const projectDir = projectPath.substring(0, lastSlash);
        const sfxDir = projectDir + "/SFX";
        const aiSfxDir = projectDir + "/SFX/ai sfx";

        return JSON.stringify({
            success: true,
            paths: {
                projectFile: projectPath,
                projectDir: projectDir,
                sfxDir: sfxDir,
                aiSfxDir: aiSfxDir
            },
            message: "SFX directory paths calculated successfully"
        });

    } catch (error) {
        return JSON.stringify({
            success: false,
            error: "Error calculating SFX directory paths: " + error.toString()
        });
    }
};