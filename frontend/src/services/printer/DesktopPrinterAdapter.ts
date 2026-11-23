// The dedicated local USB proxy loopback port.
const PROXY_PORT = 28080;

export const printViaDesktopProxy = async (base64Payload: string): Promise<boolean> => {
  const host = (typeof window !== 'undefined' && window.location?.hostname) ? window.location.hostname : '127.0.0.1';
  const targets = [
    `http://127.0.0.1:${PROXY_PORT}/print`,
    `http://localhost:${PROXY_PORT}/print`,
    `http://${host}:${PROXY_PORT}/print`
  ];

  for (const url of targets) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ payload: base64Payload })
      });
      
      if (res.ok) {
        return true;
      }
    } catch {
      // Continue to next candidate loopback URL
    }
  }

  console.warn("Could not reach local generic print daemon at 127.0.0.1:28080. Ensure usb-print-agent is running.");
  return false;
};
