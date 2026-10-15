const { spawn } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const proc = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9223',
  '--user-data-dir=C:\\Users\\abhij\\AppData\\Local\\Temp\\chrome_test_profile',
  '--disable-gpu',
  'http://localhost:5173/timetable.html'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://localhost:9223/json');
    const tabs = await listRes.json();
    const target = tabs.find(t => t.url.includes('timetable.html')) || tabs[0];
    if (target && target.webSocketDebuggerUrl) {
      const ws = new WebSocket(target.webSocketDebuggerUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
        ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
        ws.send(JSON.stringify({ id: 3, method: 'Console.enable' }));
      };
      ws.onmessage = e => {
        const msg = JSON.parse(e.data);
        if (msg.method === 'Runtime.consoleAPICalled') {
          console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
        }
        if (msg.method === 'Runtime.exceptionThrown') {
          console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
        }
      };
      setTimeout(() => {
        ws.close();
        proc.kill();
        process.exit(0);
      }, 3500);
    } else {
      proc.kill();
      process.exit(0);
    }
  } catch (e) {
    console.error('Error connecting to Chrome:', e.message);
    proc.kill();
    process.exit(1);
  }
}, 1500);
