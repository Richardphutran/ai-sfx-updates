# CEP Version Stability Pattern

## Breakthrough Discovery
CEP 7.0 is more stable than newer versions (12.0) for ExtendScript communication.

## Working Manifest Configuration
```xml
<!-- WORKING - Based on Boombox pattern -->
<RequiredRuntime Name="CSXS" Version="7.0" />  <!-- NOT 12.0! -->

<Resources>
  <MainPath>./index.html</MainPath>
  <!-- NO ScriptPath here - use dynamic loading instead -->
  <CEFCommandLine>
    <Parameter>--allow-file-access-from-files</Parameter>
    <Parameter>--allow-file-access</Parameter>
    <Parameter>--enable-nodejs</Parameter>
    <Parameter>--mixed-context</Parameter>
    <Parameter>--disable-web-security</Parameter>  <!-- CRUCIAL! -->
  </CEFCommandLine>
</Resources>
```

## Dynamic ExtendScript Loading
```javascript
// Load ExtendScript dynamically instead of manifest ScriptPath
async function loadExtendScript() {
    return new Promise((resolve, reject) => {
        // Test basic ExtendScript first
        csInterface.evalScript('1+1', (result) => {
            if (result === '2') {
                // ExtendScript engine working
                const extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION);
                const jsxPath = extensionPath + '/jsx/your-script.jsx';
                
                // Dynamic load
                csInterface.evalScript(`$.evalFile("${jsxPath}")`, (loadResult) => {
                    resolve(true);
                });
            } else {
                reject(new Error('ExtendScript engine not responding'));
            }
        });
    });
}
```

## Benefits
- ExtendScript responds immediately
- No hanging or "Heartbeat call failed" errors
- Dynamic loading more reliable than manifest ScriptPath

## Token Savings
~300 tokens avoiding version compatibility issues