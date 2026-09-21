/**
 * Dispatches the ESC/POS payload to the RawBT Android application via the rawbt: URI scheme.
 *
 * RETURN VALUE SEMANTICS:
 *   true  → Intent handoff to RawBT was confirmed (document became hidden within 2 s).
 *           Physical printing success CANNOT be confirmed — that is managed entirely by RawBT
 *           and the Bluetooth printer hardware.
 *   false → Intent was NOT handled within 2 s (RawBT not installed, wrong scheme, or
 *           a synchronous throw). The caller should queue the job for retry.
 *
 * Do NOT interpret `true` as "receipt printed". It means "RawBT took over the screen".
 */
export const printViaAndroidRawBT = (base64Payload: string): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      // Listen for the document losing visibility — this happens when Android
      // hands the rawbt: intent to the RawBT app and brings it to the foreground.
      // If no visibility change occurs within 2 s, the intent was not handled
      // (RawBT not installed, no matching app) and we report failure so the
      // printQueue can record the job for retry.
      const TIMEOUT_MS = 2000;

      let settled = false;

      const settle = (success: boolean) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        resolve(success);
      };

      const onVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          // RawBT took over the foreground.
          // NOTE: This confirms intent HANDOFF only — physical print outcome is unknown.
          settle(true);
        }
      };

      const timer = setTimeout(() => {
        // 2 s elapsed with no visibility change — intent was not handled.
        console.warn('[RawBT] Intent dispatch timeout — RawBT may not be installed or Bluetooth is off.');
        settle(false);
      }, TIMEOUT_MS);

      document.addEventListener('visibilitychange', onVisibilityChange);

      // Fire the rawbt: intent URI. The RawBT app hooks this scheme to extract
      // the Base64 ESC/POS payload and route it to the configured Bluetooth sink.
      window.location.href = `rawbt:base64,${base64Payload}`;
    } catch (e) {
      console.error('[RawBT] Intent dispatch threw synchronously:', e);
      resolve(false);
    }
  });
};
