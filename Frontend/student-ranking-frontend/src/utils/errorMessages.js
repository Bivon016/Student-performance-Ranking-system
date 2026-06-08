const STATUS_MESSAGES = {
  400: "Please check your input and try again.",
  401: "Please sign in again to continue.",
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  409: "This action conflicts with existing data. Please refresh and try again.",
  500: "Something went wrong on our end. Please try again in a moment.",
  502: "The server is temporarily unavailable. Please try again shortly.",
  503: "The server is busy right now. Please try again in a moment.",
};

const FRIENDLY_OVERRIDES = {
  "Login failed": "Invalid username or password.",
  "Signup failed": "Could not create your account. Please try again.",
};

function extractStatus(text) {
  const match = String(text).match(/failed:\s*(\d{3})/i);
  return match ? Number(match[1]) : null;
}

function looksTechnical(text) {
  const s = String(text);
  return (
    /^(GET|POST|PUT|DELETE)\s+/i.test(s) ||
    s.includes("http://") ||
    s.includes("https://") ||
    s.includes("<!doctype") ||
    s.includes("Unexpected token") ||
    /failed:\s*\d{3}/i.test(s) ||
    s.length > 160
  );
}

export function getFriendlyError(err) {
  const raw = (err?.message ?? err ?? "").toString().trim();
  if (!raw) return "Something went wrong. Please try again.";

  if (FRIENDLY_OVERRIDES[raw]) return FRIENDLY_OVERRIDES[raw];

  if (raw.includes("Failed to fetch") || raw.includes("NetworkError")) {
    return "Unable to reach the server. Check your connection and try again.";
  }

  const status = extractStatus(raw);
  if (status && STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];

  if (raw.includes("403") || /forbidden/i.test(raw)) {
    return STATUS_MESSAGES[403];
  }
  if (raw.includes("401") || /unauthorized/i.test(raw)) {
    return STATUS_MESSAGES[401];
  }
  if (raw.includes("404") || /not found/i.test(raw)) {
    return STATUS_MESSAGES[404];
  }

  if (looksTechnical(raw)) {
    return "We couldn't complete that request. Please try again.";
  }

  return raw;
}

export async function readErrorMessage(res) {
  const text = await res.text().catch(() => "");
  if (!text) return null;
  try {
    const json = JSON.parse(text);
    return json.message || json.error || json.detail || null;
  } catch {
    return text.trim() || null;
  }
}
