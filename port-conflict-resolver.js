#!/usr/bin/env node
/**
 * Port Conflict Resolver
 * Automatically detects and resolves CEP debug port vs dev server port conflicts
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

class PortConflictResolver {
  constructor() {
    this.cepConfigPath = path.join(__dirname, 'cep.config.ts');
    this.debugPorts = [];
    this.devPort = null;
  }

  // Find CEP debug ports from running processes
  findCEPDebugPorts() {
    console.log('🔍 Scanning for CEP debug ports...');
    try {
      const psOutput = execSync('ps aux | grep -i cephtmlengine | grep -v grep', { encoding: 'utf8' });
      const lines = psOutput.split('\n').filter(line => line.includes('--remote-debugging-port='));
      
      lines.forEach(line => {
        const match = line.match(/--remote-debugging-port=(\d+)/);
        if (match) {
          const port = parseInt(match[1]);
          this.debugPorts.push(port);
          console.log(`  📍 Found CEP debug port: ${port}`);
        }
      });
      
      if (this.debugPorts.length === 0) {
        console.log('  ℹ️  No CEP processes with debug ports found');
      }
    } catch (error) {
      console.log('  ℹ️  No CEP processes found (this is OK if Premiere is not running)');
    }
    
    return this.debugPorts;
  }

  // Read current dev port from config
  readCurrentDevPort() {
    try {
      const config = fs.readFileSync(this.cepConfigPath, 'utf8');
      const portMatch = config.match(/port:\s*(\d+)/);
      if (portMatch) {
        this.devPort = parseInt(portMatch[1]);
        console.log(`📖 Current dev port in config: ${this.devPort}`);
        return this.devPort;
      }
    } catch (error) {
      console.error('❌ Could not read cep.config.ts');
    }
    return null;
  }

  // Check if a port is available
  async isPortAvailable(port) {
    return new Promise((resolve) => {
      const tester = net.createServer()
        .once('error', () => resolve(false))
        .once('listening', () => {
          tester.once('close', () => resolve(true)).close();
        })
        .listen(port);
    });
  }

  // Find next available port starting from a base port
  async findAvailablePort(startPort) {
    let port = startPort;
    while (port < startPort + 100) { // Check up to 100 ports
      // Skip if it's a known debug port
      if (this.debugPorts.includes(port)) {
        console.log(`  ⚠️  Port ${port} is used by CEP debug, skipping...`);
        port++;
        continue;
      }
      
      // Check if port is available
      if (await this.isPortAvailable(port)) {
        return port;
      }
      
      port++;
    }
    throw new Error('Could not find available port');
  }

  // Update cep.config.ts with new port
  updateConfig(newPort) {
    console.log(`\n✏️  Updating cep.config.ts to use port ${newPort}...`);
    
    let config = fs.readFileSync(this.cepConfigPath, 'utf8');
    
    // Update both port and servePort
    config = config.replace(/port:\s*\d+/, `port: ${newPort}`);
    config = config.replace(/servePort:\s*\d+/, `servePort: ${newPort}`);
    
    fs.writeFileSync(this.cepConfigPath, config);
    console.log('  ✅ Config updated');
  }

  // Main resolution logic
  async resolve() {
    console.log('\n🛠️  CEP Port Conflict Resolver\n');
    
    // Step 1: Find CEP debug ports
    this.findCEPDebugPorts();
    
    // Step 2: Read current dev port
    const currentPort = this.readCurrentDevPort();
    if (!currentPort) {
      console.error('❌ Could not determine current port');
      return false;
    }
    
    // Step 3: Check for conflict
    if (this.debugPorts.includes(currentPort)) {
      console.log(`\n⚠️  CONFLICT DETECTED: Port ${currentPort} is used by CEP debug!`);
      
      // Find new port
      const newPort = await this.findAvailablePort(currentPort + 1);
      console.log(`✅ Found available port: ${newPort}`);
      
      // Update config
      this.updateConfig(newPort);
      
      console.log('\n📋 Summary:');
      console.log(`  • CEP Debug Port: ${currentPort}`);
      console.log(`  • New Dev Port: ${newPort}`);
      console.log('\n✅ Conflict resolved! Please rebuild with: ./start-bulletproof.sh');
      
      return true;
    } else {
      console.log(`\n✅ No conflict: Dev port ${currentPort} is clear`);
      
      if (this.debugPorts.length > 0) {
        console.log('\n📋 Port Usage:');
        this.debugPorts.forEach(port => {
          console.log(`  • CEP Debug: ${port}`);
        });
        console.log(`  • Dev Server: ${currentPort}`);
      }
      
      return false;
    }
  }

  // Get debug console URL
  getDebugConsoleInfo() {
    if (this.debugPorts.length > 0) {
      console.log('\n🔍 Debug Console Access:');
      this.debugPorts.forEach(port => {
        console.log(`  • http://localhost:${port}`);
      });
      console.log('\n💡 Look for "localhost:3040/main/index.html" in the list');
    }
  }
}

// Run if called directly
if (require.main === module) {
  const resolver = new PortConflictResolver();
  resolver.resolve().then(() => {
    resolver.getDebugConsoleInfo();
  });
}

module.exports = PortConflictResolver;