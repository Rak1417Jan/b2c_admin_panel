// src/services/AgentService.js

// ✅ NEW fixed base URL (no env for now)
const API_ROOT = "https://sidbi-user-india-uat-cpv.b2cdev.com";
const API_ROOT2 = "https://rakshitjan-cps-b2c.hf.space/api";

// ✅ Default row limit for users list (changed 10 -> 50)
const DEFAULT_LIMIT = 50;

// Hardcoded role id as per your backend contract
const DEFAULT_ROLE_ID = "691c48ae1fc6f9213d2fb158";

// Simple timeout so fetch doesn't hang forever
const FETCH_TIMEOUT_MS = 20000;

/* ------------------------------------------------------------------ */
/*  New APIs DON'T need authToken => keep headers minimal             */
/* ------------------------------------------------------------------ */

function jsonHeaders() {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  return headers;
}

/**
 * Utility: fetch with timeout + abort (prevents glitches/race hangs)
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      // ✅ IMPORTANT: do NOT add credentials here
      // credentials: "include"  <-- removed to fix CORS
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/* ------------------------------------------------------------------ */
/*  ✅ BEAUTIFUL ERROR FORMATTER (for createAgent & future use)        */
/* ------------------------------------------------------------------ */

/**
 * Convert backend field keys into human labels.
 * Add more mappings if your backend adds new parameters later.
 */
function humanizeField(param) {
  const map = {
    phone_number: "Phone number",
    email_address: "Email",
    name: "Agent name",
    password: "Password",
    role_id: "Role",
    is_active: "Status",
    contact_number: "Contact number",
    agent_email: "Agent email",
    agent_name: "Agent name",
    agency: "Agency",
    banker_id: "Agent ID",
  };

  if (map[param]) return map[param];

  // fallback: "first_name" -> "First name"
  return String(param || "Field")
    .replaceAll(/_/g, " ")
    .replaceAll(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Reads structured error response safely and returns a clean message.
 * Expected error shape:
 * {
 *   status: "failed",
 *   code: 400,
 *   errors: [{ type, message, parameter }]
 * }
 */
async function readApiError(res) {
  // Try JSON first
  try {
    const data = await res.json();

    const errs = Array.isArray(data?.errors) ? data.errors : [];
    if (errs.length > 0) {
      // Build user-friendly lines
      const lines = errs.map((e) => {
        const field = humanizeField(e?.parameter);
        const msg = e?.message || "Invalid value.";
        return `${field} is invalid. ${msg}`;
      });

      // If multiple errors, join nicely
      return lines.join("  ");
    }

    // If message exists but no errors array
    if (data?.message) return String(data.message);
  } catch {
    // ignore json parse errors and fallback to text
  }

  // Fallback to plain text (if backend returns html/text)
  const text = await res.text().catch(() => "");
  if (text) return text;

  // Last fallback
  return `Request failed (HTTP ${res.status}). Please try again.`;
}

/**
 * Normalize NEW `/users` API item into a stable "agent-like" shape
 * that your UI / modals can safely use.
 */
function normalizeUserToAgent(u) {
  const isActiveBool = Boolean(u?.is_active);
  const isVerifiedBool = Boolean(u?.is_verified);

  return {
    agent_id: String(u?.id || ""),
    agent_name: String(u?.name || ""),
    agent_email: String(u?.email_address || ""),
    contact_number: String(u?.phone_number ?? ""),
    status: isActiveBool ? "active" : "inactive",
    is_verified: isVerifiedBool,
    created_at: u?.created_at || null,

    // keep raw row for edit modal etc.
    __rawUser: u,
  };
}

/**
 * ✅ NEW API
 * GET /api/backend/v1/users?limit=50
 */
export async function fetchAgents({
  page = 1, // kept for compatibility (ignored)
  limit = DEFAULT_LIMIT,
  search = "", // kept for compatibility (ignored)
} = {}) {
  const safeLimit = Number(limit) > 0 ? Number(limit) : DEFAULT_LIMIT;

  const params = new URLSearchParams();
  params.set("limit", String(safeLimit));

  const url = `${API_ROOT}/api/backend/v1/users?${params.toString()}`;

  const res = await fetchWithTimeout(url, {
    method: "GET",
    headers: jsonHeaders(),
  });

  if (!res.ok) {
    const msg = await readApiError(res);
    throw new Error(msg);
  }

  const data = await res.json();

  const raw = Array.isArray(data?.data) ? data.data : [];

  // ✅ Reverse order so last item shows first
  const agents = raw.map(normalizeUserToAgent).reverse();

  // Backend doesn't send pagination -> safe fallback
  const pagination = {
    current_page: 1,
    total_pages: 1,
    total_items: agents.length,
    items_per_page: safeLimit,
    has_next_page: false,
    has_prev_page: false,
  };

  return { agents, pagination };
}

/**
 * ✅ For metrics:
 * reuse `/users` with big limit.
 */
export async function fetchAllAgents() {
  const BIG_LIMIT = 5000;
  const { agents } = await fetchAgents({ limit: BIG_LIMIT });
  return agents;
}

/**
 * ✅ NEW API for updating agent
 * PUT /api/backend/v1/banker_update
 */
export async function updateAgent(
  agentId,
  { agent_name, agent_email, contact_number, status, password }
) {
  const payload = {
    banker_id: agentId,
    is_active: status === "active",
  };

  const trimmedName = (agent_name || "").trim();
  const trimmedEmail = (agent_email || "").trim();
  const trimmedContact = (contact_number || "").trim();
  const trimmedPassword = (password || "").trim();

  // Add name if provided and not empty
  if (trimmedName) {
    payload.name = trimmedName;
  }

  // Add email if provided and not empty
  if (trimmedEmail) {
    payload.email_address = trimmedEmail;
  }

  // Add phone if provided and not empty
  if (trimmedContact) {
    payload.phone_number = trimmedContact;
  }

  // Add password if provided and not empty
  if (trimmedPassword) {
    payload.password = trimmedPassword;
  }

  const res = await fetchWithTimeout(
    `${API_ROOT}/api/backend/v1/banker_update`,
    {
      method: "PUT",
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const msg = await readApiError(res);
    throw new Error(msg);
  }

  return res.json();
}

/**
 * ✅ NEW API
 * POST /api/backend/v1/banker_create
 */
export async function createAgent({
  agent_name,
  agent_email,
  contact_number,
  password,
  is_active = true,
} = {}) {
  const payload = {
    name: String(agent_name || "").trim(),
    email_address: String(agent_email || "").trim(),
    password: String(password || ""),
    role_id: DEFAULT_ROLE_ID,
    is_active: Boolean(is_active),
    phone_number: String(contact_number || "").trim(),
  };

  const res = await fetchWithTimeout(
    `${API_ROOT}/api/backend/v1/banker_create`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const msg = await readApiError(res);
    throw new Error(msg);
  }

  return res.json();
}
