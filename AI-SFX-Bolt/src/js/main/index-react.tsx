import React from "react";
import ReactDOM from "react-dom/client";
import { initBolt } from "../lib/utils/bolt";
import { initAutoReconnect } from "../lib/auto-reconnect";
import "../index.scss";
import { App } from "./main";

// Initialize auto-reconnect for development
initAutoReconnect();

initBolt();

// Connect to AI Podcast debugger
(function connectToDebugger() {
  const PLUGIN_ID = 'ai-sfx';
  let ws: WebSocket | null = null;
  let reconnectTimer: number | null = null;
  
  function connect() {
    if (ws && ws.readyState === WebSocket.OPEN) return;
    
    try {
      ws = new WebSocket('ws://localhost:8090');
      
      ws.onopen = function() {
        console.log(`[${PLUGIN_ID}] Connected to AI Podcast debugger`);
        
        ws!.send(JSON.stringify({
          action: 'register',
          plugin: PLUGIN_ID,
          type: 'cep',
          payload: { version: '1.0.0', source: 'react-app' }
        }));
        
        // Override console methods
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        
        console.log = function(...args: any[]) {
          originalLog.apply(console, args);
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              action: 'console',
              plugin: PLUGIN_ID,
              payload: {
                level: 'log',
                message: args.join(' '),
                source: 'cep'
              }
            }));
          }
        };
        
        console.warn = function(...args: any[]) {
          originalWarn.apply(console, args);
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              action: 'console',
              plugin: PLUGIN_ID,
              payload: {
                level: 'warn',
                message: args.join(' '),
                source: 'cep'
              }
            }));
          }
        };
        
        console.error = function(...args: any[]) {
          originalError.apply(console, args);
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              action: 'console',
              plugin: PLUGIN_ID,
              payload: {
                level: 'error',
                message: args.join(' '),
                source: 'cep'
              }
            }));
          }
        };
        
        console.log(`[${PLUGIN_ID}] Console forwarding enabled`);
      };
      
      ws.onclose = function() {
        console.log(`[${PLUGIN_ID}] Disconnected from debugger`);
        clearTimeout(reconnectTimer!);
        reconnectTimer = window.setTimeout(connect, 5000);
      };
      
      ws.onerror = function(error) {
        console.error(`[${PLUGIN_ID}] Debugger connection error:`, error);
      };
    } catch (e) {
      console.error(`[${PLUGIN_ID}] Failed to connect to debugger:`, e);
      clearTimeout(reconnectTimer!);
      reconnectTimer = window.setTimeout(connect, 5000);
    }
  }
  
  // Start connection
  connect();
  
  // Expose for debugging
  (window as any).aiSfxDebugger = {
    ws: () => ws,
    connect: connect,
    pluginId: PLUGIN_ID
  };
})();

ReactDOM.createRoot(document.getElementById("app") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
