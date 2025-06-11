#\!/usr/bin/env python3
import requests
import json

try:
    # Get available debug targets
    response = requests.get('http://localhost:9240/json', timeout=5)
    targets = response.json()
    
    if targets:
        target_id = targets[0]['id']
        print(f"🔍 Found debug target: {target_id}")
        
        # Try to get console messages using Runtime.evaluate
        import websocket
        import time
        
        ws = websocket.WebSocket()
        ws.connect(f"ws://localhost:9240/devtools/page/{target_id}")
        
        # Enable Runtime and Console
        ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
        ws.send(json.dumps({"id": 2, "method": "Console.enable"}))
        
        # Get console history
        ws.send(json.dumps({
            "id": 3, 
            "method": "Runtime.evaluate", 
            "params": {
                "expression": "console.log('🔍 Console check from Python'); window.location.href; document.title;"
            }
        }))
        
        print("📋 Recent Console Activity:")
        print("=" * 60)
        
        # Read a few messages
        for i in range(10):
            try:
                message = ws.recv()
                data = json.loads(message)
                
                if data.get("method") == "Console.messageAdded":
                    entry = data["params"]["message"]
                    level = entry.get("level", "log")
                    text = entry.get("text", "")
                    print(f"[{level.upper()}] {text}")
                elif data.get("method") == "Runtime.consoleAPICalled":
                    args = data["params"]["args"]
                    if args:
                        text = " ".join([str(arg.get("value", "")) for arg in args])
                        print(f"[LOG] {text}")
                elif data.get("result"):
                    if data["result"].get("value"):
                        print(f"[EVAL] {data['result']['value']}")
                        
            except Exception as e:
                break
        
        ws.close()
        
    else:
        print("❌ No debug targets found")
        
except Exception as e:
    print(f"❌ Error: {e}")
    print("💡 Make sure Chrome debug port 9240 is accessible")
EOF < /dev/null