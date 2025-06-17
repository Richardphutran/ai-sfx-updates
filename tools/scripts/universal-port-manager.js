#!/usr/bin/env node

/**
 * Universal Port Manager
 * Centralized port management for all plugins
 */

const fs = require('fs');
const path = require('path');
const net = require('net');
const os = require('os');

class UniversalPortManager {
    constructor() {
        this.configDir = path.join(os.homedir(), '.claude');
        this.portFile = path.join(this.configDir, 'ports.json');
        this.lockFile = path.join(this.configDir, 'ports.lock');
        
        // Port ranges for different services
        this.ranges = {
            dev: { start: 3040, end: 3060 },      // Development servers
            debug: { start: 8870, end: 8890 },     // Debug consoles
            electron: { start: 5170, end: 5190 },  // Electron apps
            bridge: { start: 8090, end: 8099 }     // Bridge WebSockets
        };
        
        // Default plugin registry
        this.defaultPlugins = {
            'ai-podcast': { dev: 3041, debug: 8871 },
            'ai-text-editor': { dev: 3040, debug: 8870 },
            'ai-video-namer': { dev: 3042, debug: 8872 },
            'ai-sfx': { dev: 3043, debug: 8873 }
        };
        
        this.ensureConfigDir();
    }
    
    ensureConfigDir() {
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
        }
    }
    
    // Load port assignments
    loadPorts() {
        if (fs.existsSync(this.portFile)) {
            try {
                return JSON.parse(fs.readFileSync(this.portFile, 'utf8'));
            } catch (e) {
                console.error('Error loading ports:', e);
                return this.defaultPlugins;
            }
        }
        return this.defaultPlugins;
    }
    
    // Save port assignments
    savePorts(ports) {
        fs.writeFileSync(this.portFile, JSON.stringify(ports, null, 2));
    }
    
    // Check if port is available
    async isPortAvailable(port) {
        return new Promise((resolve) => {
            const server = net.createServer();
            server.once('error', () => resolve(false));
            server.once('listening', () => {
                server.close();
                resolve(true);
            });
            server.listen(port);
        });
    }
    
    // Find next available port in range
    async findAvailablePort(rangeType) {
        const range = this.ranges[rangeType];
        if (!range) throw new Error(`Unknown range type: ${rangeType}`);
        
        for (let port = range.start; port <= range.end; port++) {
            if (await this.isPortAvailable(port)) {
                return port;
            }
        }
        
        throw new Error(`No available ports in ${rangeType} range`);
    }
    
    // Register a new plugin
    async registerPlugin(pluginName) {
        const ports = this.loadPorts();
        
        if (ports[pluginName]) {
            console.log(`Plugin ${pluginName} already registered`);
            return ports[pluginName];
        }
        
        // Find available ports
        const devPort = await this.findAvailablePort('dev');
        const debugPort = await this.findAvailablePort('debug');
        
        ports[pluginName] = {
            dev: devPort,
            debug: debugPort,
            registered: new Date().toISOString()
        };
        
        this.savePorts(ports);
        console.log(`Registered ${pluginName} with ports:`, ports[pluginName]);
        
        return ports[pluginName];
    }
    
    // Get ports for a plugin
    getPluginPorts(pluginName) {
        const ports = this.loadPorts();
        return ports[pluginName] || null;
    }
    
    // Check all plugin ports
    async checkAllPorts() {
        const ports = this.loadPorts();
        const status = {};
        
        for (const [plugin, config] of Object.entries(ports)) {
            status[plugin] = {
                ...config,
                devAvailable: await this.isPortAvailable(config.dev),
                debugAvailable: await this.isPortAvailable(config.debug)
            };
        }
        
        return status;
    }
    
    // Reassign ports for a plugin if conflicts
    async reassignPorts(pluginName) {
        const ports = this.loadPorts();
        const current = ports[pluginName];
        
        if (!current) {
            return this.registerPlugin(pluginName);
        }
        
        // Check if current ports are available
        const devOk = await this.isPortAvailable(current.dev);
        const debugOk = await this.isPortAvailable(current.debug);
        
        if (devOk && debugOk) {
            console.log(`Ports for ${pluginName} are available`);
            return current;
        }
        
        // Find new ports
        if (!devOk) {
            current.dev = await this.findAvailablePort('dev');
            console.log(`Reassigned dev port for ${pluginName}: ${current.dev}`);
        }
        
        if (!debugOk) {
            current.debug = await this.findAvailablePort('debug');
            console.log(`Reassigned debug port for ${pluginName}: ${current.debug}`);
        }
        
        current.reassigned = new Date().toISOString();
        ports[pluginName] = current;
        this.savePorts(ports);
        
        return current;
    }
    
    // Get bridge port (shared by all plugins)
    getBridgePort() {
        return 8090; // Fixed for now, could be dynamic later
    }
    
    // Export configuration for a plugin
    exportPluginConfig(pluginName) {
        const ports = this.getPluginPorts(pluginName);
        if (!ports) {
            throw new Error(`Plugin ${pluginName} not registered`);
        }
        
        return {
            plugin: pluginName,
            ports: {
                dev: ports.dev,
                debug: ports.debug,
                bridge: this.getBridgePort()
            },
            urls: {
                dev: `http://localhost:${ports.dev}`,
                debug: `http://localhost:${ports.debug}`,
                bridge: `ws://localhost:${this.getBridgePort()}`
            }
        };
    }
    
    // Generate cep.config.ts content
    generateCepConfig(pluginName) {
        const config = this.exportPluginConfig(pluginName);
        
        return `import { CEP_Config } from "vite-cep-plugin";

const cepConfig: CEP_Config = {
  version: "1.0.0",
  id: "com.${pluginName.replace(/-/g, '.')}.cep",
  displayName: "${pluginName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}",
  symlink: "local",
  port: ${config.ports.dev},
  servePort: ${config.ports.dev},
  startingDebugPort: ${config.ports.debug},
  extensionManifestVersion: 6.0,
  requiredRuntimeVersion: 9.0,
  hosts: [
    { name: "PPRO", version: "[0.0,99.9]" }
  ],
  type: "Panel",
  iconDarkNormal: "./src/assets/light-icon.png",
  iconNormal: "./src/assets/dark-icon.png",
  iconDarkNormalRollOver: "./src/assets/light-icon.png",
  iconNormalRollOver: "./src/assets/dark-icon.png",
  parameters: ["--v=0", "--enable-nodejs", "--mixed-context"],
  width: 500,
  height: 650,
  panels: [
    {
      mainPath: "./main/index.html",
      name: "main",
      panelDisplayName: "${config.plugin.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}",
      autoVisible: true,
      width: 600,
      height: 650
    }
  ]
};

export default cepConfig;
`;
    }
}

// CLI Interface
if (require.main === module) {
    const manager = new UniversalPortManager();
    const args = process.argv.slice(2);
    const command = args[0];
    
    async function main() {
        switch (command) {
            case 'register':
                const pluginName = args[1];
                if (!pluginName) {
                    console.error('Usage: universal-port-manager register <plugin-name>');
                    process.exit(1);
                }
                await manager.registerPlugin(pluginName);
                break;
                
            case 'get':
                const plugin = args[1];
                if (!plugin) {
                    console.error('Usage: universal-port-manager get <plugin-name>');
                    process.exit(1);
                }
                const ports = manager.getPluginPorts(plugin);
                console.log(JSON.stringify(ports, null, 2));
                break;
                
            case 'check':
                const status = await manager.checkAllPorts();
                console.log('Port Status:');
                console.log(JSON.stringify(status, null, 2));
                break;
                
            case 'reassign':
                const pluginToFix = args[1];
                if (!pluginToFix) {
                    console.error('Usage: universal-port-manager reassign <plugin-name>');
                    process.exit(1);
                }
                await manager.reassignPorts(pluginToFix);
                break;
                
            case 'export':
                const pluginToExport = args[1];
                if (!pluginToExport) {
                    console.error('Usage: universal-port-manager export <plugin-name>');
                    process.exit(1);
                }
                const config = manager.exportPluginConfig(pluginToExport);
                console.log(JSON.stringify(config, null, 2));
                break;
                
            case 'generate-config':
                const pluginForConfig = args[1];
                if (!pluginForConfig) {
                    console.error('Usage: universal-port-manager generate-config <plugin-name>');
                    process.exit(1);
                }
                const cepConfig = manager.generateCepConfig(pluginForConfig);
                console.log(cepConfig);
                break;
                
            case 'list':
                const allPorts = manager.loadPorts();
                console.log('Registered Plugins:');
                console.log(JSON.stringify(allPorts, null, 2));
                break;
                
            default:
                console.log(`
Universal Port Manager - Manage ports for all plugins

Commands:
  register <plugin>      Register a new plugin with auto-assigned ports
  get <plugin>          Get ports for a specific plugin
  check                 Check availability of all registered ports
  reassign <plugin>     Reassign ports if conflicts detected
  export <plugin>       Export full configuration for a plugin
  generate-config <plugin>  Generate cep.config.ts content
  list                  List all registered plugins and ports

Examples:
  node universal-port-manager.js register ai-color-grader
  node universal-port-manager.js check
  node universal-port-manager.js export ai-podcast
`);
        }
    }
    
    main().catch(console.error);
}

module.exports = UniversalPortManager;