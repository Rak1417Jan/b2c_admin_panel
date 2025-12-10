// src/services/AgentSearchService.js

// You can override this base using Vite env if needed
const ORCHESTRATOR_BASE_URL =
  import.meta.env.VITE_ORCHESTRATOR_BASE_URL ||
  "https://sidbi-orchestrator-india-uat-cpv.b2cdev.com";

/**
 * Normalizes backend agent object into the same shape used by fetchAgents.
 * This keeps table mapping unchanged.
 */
function mapBackendAgent(raw = {}) {
  // Agent ID
  const agent_id = raw.agent_id || raw.id || raw._id || "";

  // Name
  const agent_name = raw.agent_name || raw.name || "";

  // Email
  const agent_email =
    raw.agent_email || raw.email_address || raw.email || "";

  // Contact number
  const contact_number =
    raw.contact_number || raw.phone_number || raw.phone || "";

  // Status -> "active" | "inactive"
  let status = raw.status;
  if (!status && typeof raw.is_active === "boolean") {
    status = raw.is_active ? "active" : "inactive";
  }

  // Verified flag
  const is_verified =
    typeof raw.is_verified === "boolean"
      ? raw.is_verified
      : Boolean(raw.verified || raw.isVerified);

  const created_at = raw.created_at || raw.createdAt || null;

  return {
    agent_id,
    agent_name,
    agent_email,
    contact_number,
    status,
    is_verified,
    created_at,
    __raw: raw,
  };
}

/**
 * Search agents by name or email using orchestrator API.
 *
 * @param {Object} params
 * @param {string} [params.name]  - search text for name
 * @param {string} [params.email] - search text for email
 * @param {number} [params.limit] - number of rows to fetch
 *
 * @returns {Promise<{ agents: any[], total: number }>}
 */
export async function searchAgents({ name, email, limit = 50 } = {}) {
  const trimmedName = (name || "").trim();
  const trimmedEmail = (email || "").trim();

  // If nothing to search, early return
  if (!trimmedName && !trimmedEmail) {
    return { agents: [], total: 0 };
  }

  const params = new URLSearchParams();
  params.set("slug", "agent-list");
  params.set("response_type", "object");
  params.set("internal", "true");
  if (limit) params.set("limit", String(limit));

  if (trimmedEmail) {
    // Search by email
    params.set("partial_match", "email_address");
    params.set("email_address", trimmedEmail);
  } else {
    // Search by name (default)
    params.set("partial_match", "name");
    params.set("name", trimmedName);
  }

  const url = `${ORCHESTRATOR_BASE_URL}/v2/tasks?${params.toString()}`;

  const headers = {
    accept: "application/json, text/plain, */*",
    // Only add extra headers if you have them:
    // 'x-region': 'usa',
    // 'x-session-id': mySessionId,
  };

  const res = await fetch(url, {
    method: "GET",
    headers,
    // ❌ REMOVE credentials: "include" because server sends ACAO: "*"
    // credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Search request failed (${res.status})${text ? `: ${text}` : ""}`
    );
  }

  const json = await res.json();

  // Safely walk the nested response structure you shared
  const resultArray =
    json?.data?.response_data?.get_banker?.data?.data?.result ??
    json?.data?.response_data?.get_banker?.data?.data?.agents ??
    json?.data?.agents ??
    [];

  const total =
    json?.data?.response_data?.get_banker?.data?.data?.total ??
    json?.data?.total ??
    (Array.isArray(resultArray) ? resultArray.length : 0);

  const agents = Array.isArray(resultArray)
    ? resultArray.map(mapBackendAgent)
    : [];

  return { agents, total };
}
