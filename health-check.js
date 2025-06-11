#!/usr/bin/env node
/**
 * Health Check - Validates CEP extension setup
 * Part of the bulletproof "Structure First" approach
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

class HealthChecker {
  constructor() {
    this.issues = [];
    this.port = this.readPortFromConfig();
    this.debugPorts = [];
  }

  readPortFromConfig() {
    try {
      const cepConfigPath = path.join(__dirname, 'cep.config.ts');
      const cepConfigContent = fs.readFileSync(cepConfigPath, 'utf8');
      const portMatch = cepConfigContent.match(/port:\s*(\d+)/);
      return portMatch ? parseInt(portMatch[1]) : 3000;
    } catch (error) {
      console.error('❌ Could not read port from cep.config.ts');
      return 3000;
    }
  }

  checkManifestExists() {
    console.log('🔍 Checking manifest.xml...');
    const manifestPath = path.join(__dirname, 'dist', 'cep', 'CSXS', 'manifest.xml');
    
    if (!fs.existsSync(manifestPath)) {
      this.issues.push('manifest.xml not found - run npm run build first');
      console.log('  ❌ manifest.xml missing');
      return false;
    }
    
    console.log('  ✅ manifest.xml exists');
    return true;
  }

  checkPortConsistency() {
    console.log('🔍 Checking port consistency...');
    
    try {
      // Check manifest.xml port (Note: manifest.xml doesn't control dev server port)
      const manifestPath = path.join(__dirname, 'dist', 'cep', 'CSXS', 'manifest.xml');
      if (fs.existsSync(manifestPath)) {
        const manifestContent = fs.readFileSync(manifestPath, 'utf8');
        // Manifest port is for debug console, not dev server
        console.log('  ℹ️  manifest.xml checked (debug port only)');
      }
      
      // Check .debug file port in both locations
      const debugPaths = [
        path.join(__dirname, '.debug'),
        path.join(__dirname, 'dist', 'cep', '.debug')
      ];
      
      for (const debugPath of debugPaths) {
        if (fs.existsSync(debugPath)) {
          const debugContent = fs.readFileSync(debugPath, 'utf8');
          const debugPortMatch = debugContent.match(/Port="(\d+)"/);
          const debugPort = debugPortMatch ? parseInt(debugPortMatch[1]) : null;
          
          if (debugPort && debugPort !== this.port) {
            this.issues.push(`Port mismatch: cep.config.ts has ${this.port}, ${path.basename(debugPath)} has ${debugPort}`);
            console.log(`  ❌ Debug port mismatch in ${debugPath}`);
            return false;
          }
        }
      }
      
      console.log('  ✅ All ports consistent');
      return true;
    } catch (error) {
      console.log('  ⚠️  Could not check port consistency:', error.message);
      return false;
    }
  }

  async checkServerRunning() {
    console.log(`🔍 Checking server on port ${this.port}...`);
    
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: this.port,
        path: '/main/',
        method: 'GET',
        timeout: 2000
      };

      const req = http.request(options, (res) => {
        if (res.statusCode === 200 || res.statusCode === 404) {
          console.log(`  ✅ Server responding on port ${this.port}`);
          resolve(true);
        } else {
          console.log(`  ⚠️  Server returned status ${res.statusCode}`);
          resolve(false);
        }
      });

      req.on('error', (err) => {
        if (err.code === 'ECONNREFUSED') {
          console.log(`  ❌ Server not running on port ${this.port}`);
          this.issues.push(`Server not running - use ./start-bulletproof.sh`);
        } else {
          console.log(`  ❌ Server error: ${err.message}`);
        }
        resolve(false);
      });

      req.on('timeout', () => {
        console.log(`  ❌ Server timeout`);
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  }

  checkDistStructure() {
    console.log('🔍 Checking dist structure...');
    
    const requiredPaths = [
      'dist/cep',
      'dist/cep/main',
      'dist/cep/CSXS',
      'dist/cep/jsx'
    ];
    
    let allExist = true;
    for (const p of requiredPaths) {
      const fullPath = path.join(__dirname, p);
      if (!fs.existsSync(fullPath)) {
        console.log(`  ❌ Missing: ${p}`);
        allExist = false;
      }
    }
    
    if (allExist) {
      console.log('  ✅ All required directories exist');
    } else {
      this.issues.push('Incomplete dist structure - run npm run build');
    }
    
    return allExist;
  }

  findDebugPorts() {
    try {
      const { execSync } = require('child_process');
      const output = execSync('ps aux | grep -i cephtmlengine | grep -v grep', { encoding: 'utf8' });
      const matches = output.match(/--remote-debugging-port=(\d+)/g) || [];
      this.debugPorts = matches.map(m => parseInt(m.match(/\d+/)[0]));
    } catch (e) {
      // No CEP processes
    }
  }

  async runHealthCheck() {
    console.log('\n🏥 CEP Extension Health Check\n');
    console.log(`📍 Dev Server Port: ${this.port}\n`);
    
    // Find debug ports
    this.findDebugPorts();
    if (this.debugPorts.length > 0) {
      console.log(`🔍 Debug Console Ports: ${this.debugPorts.join(', ')}`);
    }
    
    // Check for port conflict
    if (this.debugPorts.includes(this.port)) {
      this.issues.push(`Port conflict: Dev server port ${this.port} is used by CEP debug console`);
      console.log(`\n⚠️  PORT CONFLICT DETECTED!`);
      console.log(`  Run: node port-conflict-resolver.js`);
    }
    
    // Run all checks
    this.checkDistStructure();
    this.checkManifestExists();
    this.checkPortConsistency();
    await this.checkServerRunning();
    
    // Summary
    console.log('\n📊 Summary:');
    if (this.issues.length === 0) {
      console.log('✅ All systems healthy!');
      console.log(`🌐 Dev Server: http://localhost:${this.port}/main/`);
      if (this.debugPorts.length > 0) {
        console.log(`🔍 Debug Console: http://localhost:${this.debugPorts[0]}`);
      }
    } else {
      console.log(`❌ Found ${this.issues.length} issues:\n`);
      this.issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue}`);
      });
      console.log('\n💡 To fix: ./start-bulletproof.sh');
    }
    
    process.exit(this.issues.length > 0 ? 1 : 0);
  }
}

// Run health check
const checker = new HealthChecker();
checker.runHealthCheck();