// src/services/AgentStatusService.js
const ORCHESTRATOR_BASE =
  "https://sidbi-orchestrator-india-uat-cpv.b2cdev.com";
const HF_BASE = "https://rakshitjan-cps-b2c.hf.space";
const CPV_BASE =
  "https://cpv-b2c-apis-117274959277.asia-south1.run.app";

/**
 * Helper to read auth token from localStorage.
 * This is the same token stored by loginAdmin in LoginApiServices.js
 */
function getAuthToken() {
  try {
    return localStorage.getItem("authToken") || "";
  } catch (err) {
    console.error("Error reading auth token:", err);
    return "";
  }
}

/**
 * 1️⃣ Change active status in B2C / Orchestrator
 * POST /v2/tasks?slug=change-active-status&internal=true
 */
async function changeB2CActiveStatus({ bankerId, isActive }) {
  const url = `${ORCHESTRATOR_BASE}/v2/tasks?slug=change-active-status&internal=true`;

  const body = {
    banker_id: bankerId,
    is_active: Boolean(isActive),
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json, text/plain, */*",
      "content-type": "application/json",
      "x-region": "usa",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `change-active-status failed (${resp.status}): ${text || "Unknown error"}`
    );
  }

  return resp.json().catch(() => ({}));
}

/**
 * 2️⃣ HF: search agent by email
 * GET /api/agents/search?page=1&limit=20&search=<email>
 */
async function searchHFAgentByEmail(email) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Auth token not found for HF search.");
  }

  const searchParam = encodeURIComponent(email);
  const url = `${HF_BASE}/api/agents/search?page=1&limit=20&search=${searchParam}`;

  const resp = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `HF search failed (${resp.status}): ${text || "Unknown error"}`
    );
  }

  const data = await resp.json();
  if (!data?.data || !Array.isArray(data.data) || data.data.length === 0) {
    throw new Error("HF agent not found for the given email.");
  }

  // Take the first matched agent
  return data.data[0];
}

/**
 * 3️⃣ CPV: update agent status
 * PUT /api/agents/{agent_id}
 * Body: { status: "active" | "inactive" }
 */
async function updateCPVAgentStatus({ agentId, status }) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Auth token not found for CPV update.");
  }

  const url = `${CPV_BASE}/api/agents/${agentId}`;

  const resp = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  // We are NOT going to throw here if it fails in higher-level.
  // But we still log details for debugging.
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `CPV update failed (${resp.status}): ${text || "Unknown error"}`
    );
  }

  return resp.json().catch(() => ({}));
}

/**
 * High-level helper used by UI toggle.
 *  - First: await B2C change-active-status (blocking, important)
 *  - Second: try HF search + CPV update (non-blocking for last call)
 *
 * @param {Object} params
 * @param {string} params.bankerId - B2C banker_id (your agent id column)
 * @param {string} params.email - agent email (for HF search)
 * @param {boolean} params.makeActive - true => active, false => inactive
 */
export async function toggleAgentStatusAcrossSystems({
  bankerId,
  email,
  makeActive,
}) {
  const isActive = Boolean(makeActive);

  // 1️⃣ Critical: B2C change-active-status
  await changeB2CActiveStatus({ bankerId, isActive });

  // 2️⃣ HF search + 3️⃣ CPV update (last one fire-and-forget)
  try {
    const hfAgent = await searchHFAgentByEmail(email);

    if (hfAgent?.agent_id) {
      const statusString = isActive ? "active" : "inactive";

      // 3️⃣ Fire-and-forget, don't block UI
      updateCPVAgentStatus({
        agentId: hfAgent.agent_id,
        status: statusString,
      }).catch((err) => {
        console.error("CPV status sync failed (non-blocking):", err);
      });
    } else {
      console.warn("HF agent_id missing, skipping CPV sync.");
    }
  } catch (err) {
    console.warn("HF/CPV sync failed (non-blocking):", err);
  }
}
