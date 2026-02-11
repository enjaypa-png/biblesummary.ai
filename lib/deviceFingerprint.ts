/**
 * Basic device fingerprinting for abuse detection.
 * NOT enterprise DRM — just enough to detect casual account sharing.
 */

export function generateFingerprint(): string {
  if (typeof window === "undefined") return "server";

  const components = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}`,
    `${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency?.toString() || "",
    navigator.maxTouchPoints?.toString() || "0",
  ];

  const str = components.join("|");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function getOrCreateSessionToken(): string {
  const key = "bs_session_token";
  let token = localStorage.getItem(key);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(key, token);
  }
  return token;
}
