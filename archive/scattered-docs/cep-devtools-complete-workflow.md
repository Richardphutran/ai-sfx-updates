# CEP Chrome DevTools Complete Workflow

**Status:** ✅ CRITICAL WORKFLOW
**Tokens:** ~100

## Problem
Getting Chrome DevTools working with CEP plugins is notoriously difficult

## Solution

### 1. Create .debug file in plugin root:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<ExtensionList>
    <Extension Id="com.yourcompany.yourplugin.cep">
        <HostList>
            <Host Name="PPRO" Port="9225"/>
        </HostList>
    </Extension>
</ExtensionList>
```

### 2. Add to manifest.xml:
```xml
<CEFCommandLine>
    <Parameter>--remote-debugging-port=9225</Parameter>
    <Parameter>--enable-nodejs</Parameter>
</CEFCommandLine>
```

### 3. Check port conflicts:
```bash
lsof -i :9225
ps aux | grep CEPHtml | grep "remote-debugging-port"
```

### 4. Access DevTools:
```bash
# After restarting Premiere Pro completely
open "http://localhost:9225"
```

## When to Use
Setting up debugging for any CEP plugin - use unique ports for each plugin!