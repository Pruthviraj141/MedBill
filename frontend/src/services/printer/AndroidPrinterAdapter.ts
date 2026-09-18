export const printViaAndroidRawBT = (base64Payload: string): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      // The RawBT Android application securely hooks into this exact intent filter
      // to extract the Base64 ESC/POS payload and pipe it to standard bluetooth sinks locally.
      window.location.href = `rawbt:base64,${base64Payload}`;
      
      // Since it's a URL intent, we assume success if it didn't synchronously throw.
      // Real offline-queue state will handle it if it actually fails.
      resolve(true); 
    } catch (e) {
      console.error("RawBT Intent failed:", e);
      resolve(false);
    }
  });
};
