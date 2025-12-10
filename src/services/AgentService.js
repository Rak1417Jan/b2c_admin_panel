// src/services/AgentService.js

// ✅ Existing base URLs
const API_ROOT = "https://sidbi-user-india-uat-cpv.b2cdev.com";
const API_ROOT2 = "https://rakshitjan-cps-b2c.hf.space/api";

// ✅ NEW: Orchestrator base URL for agent-list
const ORCHESTRATOR_ROOT = "https://sidbi-orchestrator-india-uat-cpv.b2cdev.com";

// ✅ Default row limit for users list (now 10 per page for agent-list pagination)
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
 * Normalize orchestrator `agent-list` item into a stable "agent-like" shape
 * that your UI / modals can safely use.
 *
 * Source shape (from orchestrator):
 * {
 *   "id": "6937e677f417c181ab72bf04",
 *   "name": "Garv",
 *   "email_address": "garv123@gmail.com",
 *   "phone_number": 8130871483,
 *   "is_active": true,
 *   "is_verified": true,
 *   "created_at": "2025-12-09T09:05:59.000Z",
 *   ...
 * }
 */
function normalizeOrchestratorAgent(u) {
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

/* ------------------------------------------------------------------ */
/*  ✅ NEW orchestrator-based list + search + pagination               */
/*      GET /v2/tasks?slug=agent-list&...                              */
/* ------------------------------------------------------------------ */

/**
 * Fetch agents via orchestrator `agent-list` task.
 *
 * Supports:
 * - pagination (limit + skip/page)
 * - search via partial_match on name / email_address / phone_number
 *
 * Search behaviour:
 * - searchField: "name" | "email" | "phone"
 * - searchTerm: text typed by user
 *
 * When searchTerm is empty -> no partial_match params => returns full list page.
 */
export async function fetchAgents({
  page,
  skip,
  limit = DEFAULT_LIMIT,
  searchField,
  searchTerm,
} = {}) {
  const safeLimit = Number(limit) > 0 ? Number(limit) : DEFAULT_LIMIT;

  let safeSkip = 0;
  if (typeof skip === "number" && skip >= 0) {
    safeSkip = skip;
  } else if (typeof page === "number" && page > 1) {
    safeSkip = (page - 1) * safeLimit;
  }

  const params = new URLSearchParams();
  params.set("slug", "agent-list");
  params.set("response_type", "object");
  params.set("internal", "true");
  params.set("limit", String(safeLimit));
  params.set("skip", String(safeSkip));

  const trimmedSearch = (searchTerm || "").trim();
  if (trimmedSearch && searchField) {
    let partial = "";
    let key = "";

    if (searchField === "name") {
      partial = "name";
      key = "name";
    } else if (searchField === "email") {
      partial = "email_address";
      key = "email_address";
    } else if (searchField === "phone") {
      partial = "phone_number";
      key = "phone_number";
    }

    if (partial && key) {
      params.set("partial_match", partial);
      params.set(key, trimmedSearch);
    }
  }

  const url = `${ORCHESTRATOR_ROOT}/v2/tasks?${params.toString()}`;

  const res = await fetchWithTimeout(url, {
    method: "GET",
    headers: jsonHeaders(),
  });

  if (!res.ok) {
    const msg = await readApiError(res);
    throw new Error(msg);
  }

  const data = await res.json();

  const result =
    data?.data?.response_data?.get_banker?.data?.data?.result || [];
  const total =
    data?.data?.response_data?.get_banker?.data?.data?.total || result.length;

  const agents = result.map(normalizeOrchestratorAgent);

  const currentPage = Math.floor(safeSkip / safeLimit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  const pagination = {
    current_page: currentPage,
    total_pages: totalPages,
    total_items: total,
    items_per_page: safeLimit,
    has_next_page: safeSkip + safeLimit < total,
    has_prev_page: safeSkip > 0,
    skip: safeSkip,
    limit: safeLimit,
  };

  return { agents, pagination };
}

/**
 * ✅ For metrics:
 * reuse orchestrator `agent-list` with big limit and skip=0
 */
export async function fetchAllAgents() {
  const BIG_LIMIT = 5000;
  const { agents } = await fetchAgents({ limit: BIG_LIMIT, skip: 0 });
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
