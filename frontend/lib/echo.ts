import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

// ✅ Store both the instance AND the token it was created with.
// If token changes (re-login), old instance is discarded.
let echoInstance: { client: Echo<any>; token: string } | null = null; // eslint-disable-line @typescript-eslint/no-explicit-any

export function getEcho(token: string): Echo<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
  // ✅ Reuse only if same token — prevents stale auth after re-login
  if (echoInstance && echoInstance.token === token) {
    return echoInstance.client;
  }

  // Disconnect old instance cleanly before creating a new one
  if (echoInstance) {
    try { echoInstance.client.disconnect(); } catch { /* ignore */ }
    echoInstance = null;
  }

  if (typeof window === "undefined") {
    throw new Error("Echo can only be initialised in the browser");
  }

  window.Pusher = Pusher;

  const client = new Echo({
    broadcaster:       "reverb" as "pusher",
    key:               process.env.NEXT_PUBLIC_REVERB_APP_KEY!,
    wsHost:            process.env.NEXT_PUBLIC_REVERB_HOST!,
    wsPort:            parseInt(process.env.NEXT_PUBLIC_REVERB_PORT ?? "8080"),
    wssPort:           parseInt(process.env.NEXT_PUBLIC_REVERB_PORT ?? "443"),
    forceTLS:          process.env.NEXT_PUBLIC_REVERB_SCHEME === "https",
    enabledTransports: ["ws", "wss"],
    authEndpoint:      `${process.env.NEXT_PUBLIC_API_URL}/api/broadcasting/auth`,
    auth: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });

  echoInstance = { client, token };
  return client;
}

export function disconnectEcho(): void {
  if (echoInstance) {
    try { echoInstance.client.disconnect(); } catch { /* ignore */ }
    echoInstance = null;
  }
}
