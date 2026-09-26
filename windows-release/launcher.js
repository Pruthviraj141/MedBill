const { spawn, exec } = require('child_process');
const http = require('http');

console.log("[✔] Launcher Sequence Activated...");

console.log(" [~] Booting Secure Web Interface (8080)...");
const webServer = spawn(process.execPath, ['web-server.js'], { stdio: 'inherit' });

console.log(" [~] Booting Native Print Router (28080)...");
const printAgent = spawn(process.execPath, ['server.js'], { cwd: 'usb-print-agent', stdio: 'inherit' });

const checkServiceReady = (port, path = '/') => {
  return new Promise((resolve) => {
    const attempt = () => {
      const req = http.get(`http://127.0.0.1:${port}${path}`, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          setTimeout(attempt, 500);
        }
      });
      req.on('error', () => { setTimeout(attempt, 500); });
    };
    attempt();
  });
};

const startBrowser = () => {
  console.log("Both services verified active. Launching Default Browser...");
  exec('start "" "http://127.0.0.1:8080"');
};

Promise.all([
  checkServiceReady(8080, '/'),
  checkServiceReady(28080, '/health')
]).then(() => {
  console.log("\n====================================================");
  console.log("             ✅ TBT Cafe POS is READY! ✅");
  console.log("====================================================\n");
  startBrowser();
});

const handleExit = () => {
  console.log("\nInitiating safe POS shutdown...");
  try { webServer.kill('SIGTERM'); } catch (e) {}
  try { printAgent.kill('SIGTERM'); } catch (e) {}
  process.exit();
};

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);
