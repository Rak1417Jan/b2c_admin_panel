const API_ROOT = import.meta.env.VITE_API_BASE;

function getAuthToken() {
  try {
    return globalThis.localStorage.getItem("authToken") || "";
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

/** GET /api/cases */
export async function fetchCases() {
  const res = await fetch(`${API_ROOT}/cases`, {
    method: "GET",
    headers: authHeaders(false),
  });
  if (!res.ok) throw new Error(`Cases fetch failed: ${res.status}`);
  const data = await res.json();

  const cases = Array.isArray(data?.cases) ? data.cases : [];
  return cases.map((c) => ({
    ...c,
    agent_name: typeof c.agent_name === "string" ? c.agent_name : "",
  }));
}

/**
 * Helper: resolve many agent IDs to names WITHOUT extra network calls.
 */
export async function resolveAgentNames(cases) {
  const map = new Map();
  if (!Array.isArray(cases)) return map;

  for (const c of cases) {
    const id = c?.assigned_agent;
    const name = c?.agent_name;
    if (id && typeof name === "string" && name.trim()) {
      map.set(id, name.trim());
    }
  }
  return map;
}

/** PUT /api/cases/:caseId/assign { agent_id } */
export async function assignCase(caseId, agentId) {
  if (!caseId || !agentId) throw new Error("Missing caseId or agentId");
  const res = await fetch(
    `${API_ROOT}/cases/${encodeURIComponent(caseId)}/assign`,
    {
      method: "PUT",
      headers: authHeaders(true),
      body: JSON.stringify({ agent_id: agentId }),
    }
  );
  if (!res.ok) throw new Error(`Assign failed: ${res.status}`);
  return res.json();
}

/* ---------------------- NEW: Case files APIs ---------------------- */

/** GET /api/cases/:caseId/files -> { files: [...] } */
export async function fetchCaseFiles(caseId) {
  if (!caseId) throw new Error("Missing caseId");
  const res = await fetch(
    `${API_ROOT}/cases/${encodeURIComponent(caseId)}/files`,
    {
      method: "GET",
      headers: authHeaders(false),
    }
  );
  if (!res.ok) throw new Error(`Files fetch failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data?.files) ? data.files : [];
}

/**
 * GET /api/files/:fileId -> binary file stream
 * Returns: { blob, contentType, filename }
 */
export async function fetchFileBlob(fileId) {
  if (!fileId) throw new Error("Missing fileId");
  const res = await fetch(`${API_ROOT}/files/${encodeURIComponent(fileId)}`, {
    method: "GET",
    headers: authHeaders(false),
  });
  if (!res.ok) throw new Error(`File download failed: ${res.status}`);

  const contentType = res.headers.get("Content-Type") || "application/octet-stream";
  // Try to get filename from Content-Disposition if present
  const disp = res.headers.get("Content-Disposition") || "";
  let filename = "";
  const m = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(disp);
  if (m) filename = decodeURIComponent(m[1]);

  const blob = await res.blob();
  return { blob, contentType, filename };
}

/* ---------------------- NEW: Generated PDF Report ---------------------- */
/**
 * POST https://rakshitjan-generate-pdf-python.hf.space/generate-report
 * Body: { "case_id": "<uuid>" }
 * Returns a PDF blob, with content-type 'application/pdf'
 */
export async function generateCaseReport(caseId, { signal } = {}) {
  if (!caseId) throw new Error("Missing caseId");

  const res = await fetch(
    "https://rakshitjan-generate-pdf-python.hf.space/generate-report",
    {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ case_id: caseId }),
      // No internal timeout; optional external signal allowed
      signal,
    }
  );

  if (!res.ok) {
    throw new Error(`Report generation failed: HTTP ${res.status}`);
  }

  const contentType = res.headers.get("Content-Type") || "application/pdf";
  const blob = await res.blob();
  const filename = `Case_${caseId}_Report.pdf`;

  return { blob, contentType, filename };
}
