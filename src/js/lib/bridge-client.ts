/**
 * Professional WebSocket Bridge Client for AI SFX Plugin
 * Handles connection to bridge server with automatic reconnection
 */

export interface BridgeMessage {
  type: string;
  [key: string]: any;
}

export interface BridgeOptions {
  url?: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  debug?: boolean;
}

export class AIsfxBridgeClient {
  private ws: WebSocket | null = null;
  private url: string;
  private isConnected = false;
  private isConnecting = false;
  private isRegistered = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectInterval: number;
  private autoReconnect: boolean;
  private debug: boolean;
  private messageHandlers = new Map<string, Function[]>();
  private connectionId: string | null = null;

  constructor(options: BridgeOptions = {}) {
    this.url = options.url || 'ws://localhost:8090';
    this.autoReconnect = options.autoReconnect !== false;
    this.reconnectInterval = options.reconnectInterval || 2000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 30;
    this.debug = options.debug || false;

    this.log('Bridge client initialized');
  }

  /**
   * Connect to bridge server
   */
  async connect(): Promise<boolean> {
    if (this.isConnecting || this.isConnected) {
      return this.isConnected;
    }

    this.isConnecting = true;
    this.log('Connecting to bridge server...');

    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.log('✅ Connected to bridge server');
        this.register();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.isRegistered = false;
        this.connectionId = null;
        this.log('❌ Disconnected from bridge server');
        
        if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        this.isConnecting = false;
        this.log('❌ WebSocket error:', error);
      };

      // Wait for connection
      return new Promise((resolve) => {
        const checkConnection = () => {
          if (this.isConnected) {
            resolve(true);
          } else if (!this.isConnecting) {
            resolve(false);
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        setTimeout(checkConnection, 100);
      });

    } catch (error) {
      this.isConnecting = false;
      this.log('❌ Connection failed:', error);
      return false;
    }
  }

  /**
   * Register with bridge server as AI SFX plugin
   */
  private register() {
    // Use multi-plugin format from integration guide
    const message = {
      action: 'register',
      plugin: 'ai-sfx',
      type: 'cep',
      payload: {
        version: '1.0.0',
        sessionId: 'session-' + Date.now(),
        type: 'cep'
      }
    };
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      this.log('📤 Sent registration:', message);
      
      // Also send initial console message
      this.sendConsoleMessage('log', '✅ AI SFX plugin connected to debugging bridge');
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(data: string) {
    try {
      const message: BridgeMessage = JSON.parse(data);
      this.log('📨 Received:', message.type);

      // Handle system messages
      switch (message.type) {
        case 'welcome':
          this.connectionId = message.connectionId;
          this.log(`✅ Welcome received, connection ID: ${this.connectionId}`);
          break;

        case 'registration-success':
          this.isRegistered = true;
          this.log('✅ Successfully registered as AI SFX plugin');
          this.emit('registered', message);
          break;

        case 'registration-failed':
          this.log('❌ Registration failed:', message.reason);
          this.emit('registration-failed', message);
          break;

        case 'pong':
          this.emit('pong', message);
          break;

        default:
          // Forward to registered handlers
          this.emit(message.type, message);
          break;
      }

    } catch (error) {
      this.log('❌ Error parsing message:', error);
    }
  }

  /**
   * Send message to bridge server
   */
  send(message: BridgeMessage): boolean {
    if (!this.isConnected || !this.ws) {
      this.log('⚠️ Cannot send message: not connected');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      this.log('📤 Sent:', message.type || message.action);
      return true;
    } catch (error) {
      this.log('❌ Error sending message:', error);
      return false;
    }
  }

  /**
   * Send console message to multi-plugin debugger
   */
  sendConsoleMessage(level: string, message: string, data?: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const consoleMessage = {
        action: 'console',
        plugin: 'ai-sfx',
        payload: {
          level: level,
          message: message,
          source: 'cep',
          timestamp: new Date().toISOString(),
          data: data
        }
      };
      this.ws.send(JSON.stringify(consoleMessage));
    }
  }

  /**
   * Send SFX generation request
   */
  requestSfx(prompt: string, options: any = {}): boolean {
    return this.send({
      type: 'sfx-request',
      requestId: `sfx-${Date.now()}`,
      prompt,
      options,
      timestamp: Date.now()
    });
  }

  /**
   * Send Premiere Pro action
   */
  premiereAction(action: string, data: any = {}): boolean {
    return this.send({
      type: 'premiere-action',
      action,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Send ping to server
   */
  ping(): boolean {
    return this.send({
      type: 'ping',
      timestamp: Date.now()
    });
  }

  /**
   * Add message handler
   */
  on(type: string, handler: Function) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  /**
   * Remove message handler
   */
  off(type: string, handler: Function) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to handlers
   */
  private emit(type: string, data: any) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          this.log('❌ Error in event handler:', error);
        }
      });
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect() {
    this.reconnectAttempts++;
    this.log(`⏳ Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect();
      }
    }, this.reconnectInterval);
  }

  /**
   * Disconnect from bridge server
   */
  disconnect() {
    this.autoReconnect = false;
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnected = false;
    this.isRegistered = false;
    this.connectionId = null;
    this.log('Disconnected');
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      registered: this.isRegistered,
      connectionId: this.connectionId,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Log message with debug flag and forward to multi-plugin console
   */
  private log(message: string, ...args: any[]) {
    if (this.debug) {
      console.log(`[AIsfxBridge] ${message}`, ...args);
      // Forward to multi-plugin debugger
      this.sendConsoleMessage('log', `[AIsfxBridge] ${message}`, args.length > 0 ? args : undefined);
    }
  }
}

// Create singleton instance
export const bridgeClient = new AIsfxBridgeClient({
  debug: process.env.NODE_ENV === 'development'
});