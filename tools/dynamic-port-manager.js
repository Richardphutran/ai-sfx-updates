#!/usr/bin/env node
/**
 * Dynamic Port Manager for CEP Extensions
 * Handles port conflicts, multiple plugins, and automatic reassignment
 */

const net = require('net');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DynamicPortManager {
  constructor() {
    this.configPath = path.join(__dirname, 'cep.config.ts');
    this.portMapFile = path.join(__dirname, '../.cep-port-map.json');
    this.portRanges = {
      dev: { start: 3000, end: 3099 },
      debug: { start: 8800, end: 8899 }
    };
  }

  // Load or create port map for all plugins
  loadPortMap() {
    if (fs.existsSync(this.portMapFile)) {
      return JSON.parse(fs.readFileSync(this.portMapFile, 'utf8'));
    }
    return {
      'ai-text-editor': { dev: 3040, debug: 8870 },
      'ai-podcast': { dev: 3041, debug: 8871 },
      'ai-video-namer': { dev: 3042, debug: 8872 },
      'ai-sfx': { dev: 3043, debug: 8873 }
    };
  }

  savePortMap(portMap) {
    fs.writeFileSync(this.portMapFile, JSON.stringify(portMap, null, 2));
  }

  // Check if a port is available
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
  async findAvailablePort(start, end, exclude = []) {
    for (let port = start; port <= end; port++) {
      if (!exclude.includes(port) && await this.isPortAvailable(port)) {
        return port;
      }
    }
    throw new Error(`No available ports between ${start} and ${end}`);
  }

  // Get all ports currently in use by CEP
  getUsedCEPPorts() {
    const used = [];
    try {
      const processes = execSync('ps aux | grep -i cephtmlengine', { encoding: 'utf8' });
      const matches = processes.match(/--remote-debugging-port=(\d+)/g) || [];
      matches.forEach(match => {
        const port = parseInt(match.match(/\d+/)[0]);
        used.push(port);
      });
    } catch (e) {
      // No CEP processes
    }
    return used;
  }

  // Detect current plugin from directory
  detectPlugin() {
    const cwd = process.cwd();
    const packageJson = path.join(cwd, 'package.json');
    
    if (fs.existsSync(packageJson)) {
      const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
      const name = pkg.name || '';
      
      if (name.includes('text-editor')) return 'ai-text-editor';
      if (name.includes('podcast')) return 'ai-podcast';
      if (name.includes('video-namer')) return 'ai-video-namer';
      if (name.includes('sfx')) return 'ai-sfx';
    }
    
    // Fallback to directory name
    if (cwd.includes('text-editor')) return 'ai-text-editor';
    if (cwd.includes('podcast')) return 'ai-podcast';
    if (cwd.includes('video-namer')) return 'ai-video-namer';
    if (cwd.includes('sfx')) return 'ai-sfx';
    
    return 'unknown-plugin';
  }

  // Update cep.config.ts with new ports
  updateConfig(devPort, debugPort) {
    let config = fs.readFileSync(this.configPath, 'utf8');
    
    // Update dev port
    config = config.replace(/port:\s*\d+/, `port: ${devPort}`);
    config = config.replace(/servePort:\s*\d+/, `servePort: ${devPort}`);
    
    // Update debug port
    config = config.replace(/startingDebugPort:\s*\d+/, `startingDebugPort: ${debugPort}`);
    
    fs.writeFileSync(this.configPath, config);
  }

  // Main function to manage ports
  async manage() {
    console.log('🔍 Dynamic Port Manager\n');
    
    const plugin = this.detectPlugin();
    console.log(`📦 Detected plugin: ${plugin}`);
    
    const portMap = this.loadPortMap();
    const currentPorts = portMap[plugin] || { dev: 3040, debug: 8870 };
    
    console.log(`📊 Current configuration:`);
    console.log(`   Dev port: ${currentPorts.dev}`);
    console.log(`   Debug port: ${currentPorts.debug}`);
    
    // Check if current ports are available
    const devAvailable = await this.isPortAvailable(currentPorts.dev);
    const debugAvailable = await this.isPortAvailable(currentPorts.debug);
    
    if (devAvailable && debugAvailable) {
      console.log('\n✅ Current ports are available!');
      return currentPorts;
    }
    
    // Find new ports if needed
    console.log('\n⚠️  Port conflict detected! Finding new ports...');
    
    const usedPorts = this.getUsedCEPPorts();
    const allUsedPorts = Object.values(portMap).flatMap(p => [p.dev, p.debug]).concat(usedPorts);
    
    let newDevPort = currentPorts.dev;
    let newDebugPort = currentPorts.debug;
    
    if (!devAvailable) {
      newDevPort = await this.findAvailablePort(
        this.portRanges.dev.start,
        this.portRanges.dev.end,
        allUsedPorts
      );
      console.log(`✅ New dev port: ${newDevPort}`);
    }
    
    if (!debugAvailable) {
      newDebugPort = await this.findAvailablePort(
        this.portRanges.debug.start,
        this.portRanges.debug.end,
        allUsedPorts.concat([newDevPort])
      );
      console.log(`✅ New debug port: ${newDebugPort}`);
    }
    
    // Update configuration
    this.updateConfig(newDevPort, newDebugPort);
    
    // Update port map
    portMap[plugin] = { dev: newDevPort, debug: newDebugPort };
    this.savePortMap(portMap);
    
    console.log('\n📝 Configuration updated!');
    console.log('🔨 Run ./start-bulletproof.sh to rebuild with new ports');
    
    return { dev: newDevPort, debug: newDebugPort };
  }

  // Show status of all plugins
  async status() {
    console.log('🔍 CEP Plugin Port Status\n');
    
    const portMap = this.loadPortMap();
    const usedCEPPorts = this.getUsedCEPPorts();
    
    for (const [plugin, ports] of Object.entries(portMap)) {
      console.log(`📦 ${plugin}:`);
      
      const devStatus = await this.isPortAvailable(ports.dev) ? '✅ free' : '❌ in use';
      const debugStatus = await this.isPortAvailable(ports.debug) ? '✅ free' : '❌ in use';
      const cepActive = usedCEPPorts.includes(ports.debug) ? ' (CEP active)' : '';
      
      console.log(`   Dev port ${ports.dev}: ${devStatus}`);
      console.log(`   Debug port ${ports.debug}: ${debugStatus}${cepActive}`);
      console.log('');
    }
    
    if (usedCEPPorts.length > 0) {
      console.log(`🔍 Active CEP debug ports: ${usedCEPPorts.join(', ')}`);
    }
  }
}

// CLI handling
if (require.main === module) {
  const manager = new DynamicPortManager();
  const command = process.argv[2];
  
  switch (command) {
    case 'status':
      manager.status();
      break;
    case 'check':
    default:
      manager.manage();
      break;
  }
}

module.exports = DynamicPortManager;