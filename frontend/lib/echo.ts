import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let echoInstance: Echo<any> | null = null;

export function getEcho(token: string): Echo<any> {
  if (echoInstance) return echoInstance;

  if (typeof window !== "undefined") {
    window.Pusher = Pusher;

    echoInstance = new Echo({
      broadcaster: "reverb" as "pusher",
      key: process.env.NEXT_PUBLIC_REVERB_APP_KEY!,
      wsHost: process.env.NEXT_PUBLIC_REVERB_HOST!,
      wsPort: parseInt(process.env.NEXT_PUBLIC_REVERB_PORT ?? "8080"),
      wssPort: parseInt(process.env.NEXT_PUBLIC_REVERB_PORT ?? "443"),
      forceTLS: process.env.NEXT_PUBLIC_REVERB_SCHEME === "https",
      enabledTransports: ["ws", "wss"],
      authEndpoint: `${process.env.NEXT_PUBLIC_API_URL}/api/broadcasting/auth`,
      auth: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });
  }

  return echoInstance!;
}

export function disconnectEcho(): void {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
}
