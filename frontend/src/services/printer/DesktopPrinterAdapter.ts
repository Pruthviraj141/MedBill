// The dedicated local USB proxy loopback port.
const PROXY_PORT = 28080;

export const printViaDesktopProxy = async (base64Payload: string): Promise<boolean> => {
  try {
    const res = await fetch(`http://127.0.0.1:${PROXY_PORT}/print`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      // Pass the raw base64 buffer directly to the agent to dispatch securely.
      body: JSON.stringify({ payload: base64Payload })
    });
    
    if (res.ok) {
       return true;
    } else {
       console.error("Local print agent responded with an HTTP Error: ", res.status);
       return false;
    }
  } catch (error) {
    console.error("Could not reach local generic print daemon. Ensure usb-print-agent is running.", error);
    return false;
  }
};
