// src/services/AgentService.js
import { encryptText } from "../utils/cryptoService";

// ✅ NEW fixed base URL (no env for now)
const API_ROOT = "https://sidbi-user-india-uat-cpv.b2cdev.com";

// Default row limit for users list
const DEFAULT_LIMIT = 10;

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
 * GET /api/backend/v1/users?limit=10
 *
 * Old signature kept to avoid UI glitches.
 * page/search ignored because backend doesn't support them now.
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
    const text = await res.text().catch(() => "");
    throw new Error(
      `Users fetch failed (HTTP ${res.status})${text ? `: ${text}` : ""}`
    );
  }

  const data = await res.json();

  const raw = Array.isArray(data?.data) ? data.data : [];
  const agents = raw.map(normalizeUserToAgent);

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
 * Old `/agents` is gone, so reuse `/users` with big limit.
 */
export async function fetchAllAgents() {
  const BIG_LIMIT = 5000;
  const { agents } = await fetchAgents({ limit: BIG_LIMIT });
  return agents;
}

/**
 * ❗Still old endpoint unless your backend provides new update API.
 * No auth, no credentials.
 * If update endpoint changes, replace URL only.
 */
export async function updateAgent(
  agentId,
  { agent_name, contact_number, status, password }
) {
  const payload = {
    agent_name: encryptText(agent_name || ""),
    contact_number: encryptText(contact_number || ""),
    status,
  };

  if (typeof password === "string" && password.trim().length > 0) {
    payload.password = password.trim();
  }

  const res = await fetchWithTimeout(`${API_ROOT}/agents/${agentId}`, {
    method: "PUT",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Update failed (HTTP ${res.status})${text ? `: ${text}` : ""}`
    );
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
    const text = await res.text().catch(() => "");
    throw new Error(
      `Create failed (HTTP ${res.status})${text ? `: ${text}` : ""}`
    );
  }

  return res.json();
}
