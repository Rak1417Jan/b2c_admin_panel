// src/services/AgentService.js
import { encryptText } from "../utils/cryptoService";

const API_ROOT = import.meta.env.VITE_API_BASE;

function getAuthToken() {
  try {
    const t = globalThis.localStorage.getItem("authToken");
    return t || "";
  } catch {
    return "";
  }
}

function authHeaders(json = true) {
  const headers = new Headers();
  if (json) headers.set("Content-Type", "application/json");
  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

/** Ensure numbers & attach a consistent `case_stats` object to each agent */
function normalizeAgent(agent) {
  const completed = Number(agent?.completed_cases ?? agent?.case_stats?.completed_cases ?? 0);
  const pending = Number(agent?.pending_cases ?? agent?.case_stats?.pending_cases ?? 0);
  const total = Number(agent?.total_cases ?? agent?.case_stats?.all_cases ?? 0);

  return {
    ...agent,
    case_stats: {
      completed_cases: completed,
      pending_cases: pending,
      all_cases: total,
    },
  };
}

/** GET /api/agents */
export async function fetchAgents() {
  const res = await fetch(`${API_ROOT}/agents`, {
    method: "GET",
    headers: authHeaders(false),
  });
  if (!res.ok) throw new Error(`Agents fetch failed: ${res.status}`);
  const data = await res.json();

  const raw = Array.isArray(data?.agents) ? data.agents : [];
  return raw.map(normalizeAgent);
}

/** PUT /api/agents/:agent_id
 * Encrypts agent_name and contact_number before sending.
 * Optionally includes plain "password" to update password.
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

  const res = await fetch(`${API_ROOT}/agents/${agentId}`, {
    method: "PUT",
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Update failed: ${res.status}`);
  return res.json();
}

/** POST /api/agents
 * Encrypts agent_name, agent_email, contact_number. Password is plain.
 */
export async function createAgent({ agent_name, agent_email, contact_number, agency, password }) {
  const payload = {
    agent_name: encryptText(agent_name || ""),
    agent_email: encryptText(agent_email || ""),
    contact_number: encryptText(contact_number || ""),
    agency: encryptText(agency || ""),
    password, // as-is per backend contract
  };

  const res = await fetch(`${API_ROOT}/agents`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Create failed: ${res.status}`);
  return res.json();
}