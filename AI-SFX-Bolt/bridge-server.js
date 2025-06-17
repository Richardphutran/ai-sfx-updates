#!/usr/bin/env node

/**
 * Professional WebSocket Bridge Server for AI SFX Plugin
 * Handles CEP-Electron communication with robust error handling
 */

const WebSocket = require('ws');
const http = require('http');
const path = require('path');

class AIsfxBridgeServer {
  constructor(port = 8090) {
    this.port = port;
    this.wss = null;
    this.server = null;
    this.connections = new Map();
    this.messageQueue = [];
    this.isShuttingDown = false;
  }

  /**
   * Start the bridge server with professional error handling
   */
  async start() {
    try {
      // Create HTTP server first
      this.server = http.createServer();
      
      // Create WebSocket server
      this.wss = new WebSocket.Server({ 
        server: this.server,
        perMessageDeflate: false,
        maxPayload: 1024 * 1024 // 1MB max message size
      });

      // Set up connection handling
      this.setupConnectionHandling();
      
      // Set up graceful shutdown
      this.setupGracefulShutdown();

      // Start listening
      await new Promise((resolve, reject) => {
        this.server.listen(this.port, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log(`🚀 AI SFX Bridge Server running on ws://localhost:${this.port}`);
      console.log(`📊 Server Status: READY`);
      console.log(`🔗 Ready for CEP connections`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to start bridge server:', error.message);
      throw error;
    }
  }

  /**
   * Set up WebSocket connection handling
   */
  setupConnectionHandling() {
    this.wss.on('connection', (ws, req) => {
      const connectionId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`✅ New connection: ${connectionId}`);
      
      // Store connection
      this.connections.set(connectionId, {
        ws,
        id: connectionId,
        connectedAt: new Date(),
        pluginId: null,
        isRegistered: false
      });

      // Set up message handling
      ws.on('message', (data) => {
        this.handleMessage(connectionId, data);
      });

      // Handle disconnection
      ws.on('close', () => {
        console.log(`❌ Connection closed: ${connectionId}`);
        this.connections.delete(connectionId);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`⚠️ WebSocket error for ${connectionId}:`, error.message);
        this.connections.delete(connectionId);
      });

      // Send welcome message
      this.sendToConnection(connectionId, {
        type: 'welcome',
        connectionId,
        server: 'ai-sfx-bridge',
        version: '1.0.0'
      });
    });

    this.wss.on('error', (error) => {
      console.error('❌ WebSocket Server Error:', error.message);
    });
  }

  /**
   * Handle incoming messages with proper validation
   */
  handleMessage(connectionId, data) {
    try {
      const message = JSON.parse(data.toString());
      const connection = this.connections.get(connectionId);
      
      if (!connection) {
        console.warn(`⚠️ Message from unknown connection: ${connectionId}`);
        return;
      }

      console.log(`📨 Message from ${connectionId}:`, message.type || 'unknown');

      switch (message.type) {
        case 'register':
          this.handleRegistration(connectionId, message);
          break;
          
        case 'premiere-action':
          this.handlePremiereAction(connectionId, message);
          break;
          
        case 'sfx-request':
          this.handleSfxRequest(connectionId, message);
          break;
          
        case 'ping':
          this.sendToConnection(connectionId, { type: 'pong', timestamp: Date.now() });
          break;
          
        default:
          console.warn(`⚠️ Unknown message type: ${message.type}`);
          this.sendToConnection(connectionId, {
            type: 'error',
            message: `Unknown message type: ${message.type}`
          });
      }
    } catch (error) {
      console.error(`❌ Error handling message from ${connectionId}:`, error.message);
      this.sendToConnection(connectionId, {
        type: 'error',
        message: 'Invalid message format'
      });
    }
  }

  /**
   * Handle plugin registration
   */
  handleRegistration(connectionId, message) {
    const connection = this.connections.get(connectionId);
    
    if (message.pluginId === 'ai-sfx') {
      connection.pluginId = message.pluginId;
      connection.isRegistered = true;
      
      console.log(`✅ AI SFX plugin registered: ${connectionId}`);
      
      this.sendToConnection(connectionId, {
        type: 'registration-success',
        pluginId: message.pluginId,
        capabilities: ['sfx-generation', 'timeline-placement', 'search']
      });
    } else {
      console.warn(`⚠️ Invalid plugin registration: ${message.pluginId}`);
      this.sendToConnection(connectionId, {
        type: 'registration-failed',
        reason: 'Invalid plugin ID'
      });
    }
  }

  /**
   * Handle Premiere Pro actions
   */
  handlePremiereAction(connectionId, message) {
    console.log(`🎬 Premiere action: ${message.action}`);
    
    // Broadcast to all registered AI SFX connections
    this.broadcastToPlugin('ai-sfx', {
      type: 'premiere-response',
      action: message.action,
      data: message.data,
      success: true
    });
  }

  /**
   * Handle SFX generation requests
   */
  handleSfxRequest(connectionId, message) {
    console.log(`🎵 SFX request: ${message.prompt || 'search'}`);
    
    // Process SFX request (placeholder - integrate with your SFX logic)
    this.sendToConnection(connectionId, {
      type: 'sfx-response',
      requestId: message.requestId,
      status: 'processing',
      message: 'SFX generation started'
    });
  }

  /**
   * Send message to specific connection
   */
  sendToConnection(connectionId, message) {
    const connection = this.connections.get(connectionId);
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all connections of a specific plugin
   */
  broadcastToPlugin(pluginId, message) {
    for (const [id, connection] of this.connections) {
      if (connection.pluginId === pluginId && connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Get server status
   */
  getStatus() {
    return {
      running: this.wss !== null,
      port: this.port,
      connections: this.connections.size,
      registeredPlugins: Array.from(this.connections.values())
        .filter(conn => conn.isRegistered)
        .map(conn => conn.pluginId)
    };
  }

  /**
   * Set up graceful shutdown handling
   */
  setupGracefulShutdown() {
    const shutdown = () => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;
      
      console.log('\n🛑 Shutting down bridge server...');
      
      // Close all connections
      for (const [id, connection] of this.connections) {
        connection.ws.close();
      }
      
      // Close server
      if (this.server) {
        this.server.close(() => {
          console.log('✅ Bridge server closed');
          process.exit(0);
        });
      }
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      shutdown();
    });
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new AIsfxBridgeServer(8090);
  server.start().catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = AIsfxBridgeServer;