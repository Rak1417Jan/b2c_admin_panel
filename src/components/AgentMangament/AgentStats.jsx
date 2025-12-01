// src/components/AgentMangament/AgentStats.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { UsersRound, Clock2, CheckCircle2 } from "lucide-react";
import AgentProfiles from "./AgentProfiles.jsx";

import {
  fetchAgents,
  fetchAllAgents,
  createAgent,
} from "../../services/AgentService";

import { addAgentToHFAgency } from "../../services/Addagent"; // ✅ HF (2nd API)
import AddAgentModal from "./AddAgentModal.jsx";
import EditAgentModal from "./EditAgentModal.jsx";

const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

/* --------- Skeleton metric cards for loading state --------- */
function MetricCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded-full bg-gray-200" />
          <div className="mt-3 h-4 w-16 rounded-full bg-gray-200" />
        </div>
        <div className="h-10 w-10 rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}

export default function AgentStats({
  title = "Agent Management",
  subtitle = "Manage and monitor all agents",
}) {
  const [agents, setAgents] = useState([]);
  const [allAgents, setAllAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);

  // ✅ default limit changed 10 -> 50
  const [limit, setLimit] = useState(50);
  const requestIdRef = useRef(0);

  const load = async (limitOverride) => {
    const effectiveLimit =
      Number(limitOverride) > 0 ? Number(limitOverride) : limit;

    const currentId = ++requestIdRef.current;
    setLoading(true);
    setErr("");

    try {
      const { agents: list } = await fetchAgents({ limit: effectiveLimit });
      if (currentId !== requestIdRef.current) return;
      setAgents(list);
      setLimit(effectiveLimit);
    } catch (error) {
      if (currentId !== requestIdRef.current) return;
      const msg =
        error instanceof Error && error.message
          ? `Failed to load agents: ${error.message}`
          : "Failed to load agents.";
      setErr(msg);
    } finally {
      if (currentId === requestIdRef.current) setLoading(false);
    }
  };

  const loadAllAgentsMetrics = async () => {
    try {
      const list = await fetchAllAgents();
      setAllAgents(list);
    } catch (error) {
      console.error("Failed to load metrics list:", error);
    }
  };

  useEffect(() => {
    // ✅ initial load 50 instead of 10
    load(50);
    loadAllAgentsMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const metrics = useMemo(() => {
    let totalUsers = 0;
    let activeUsers = 0;
    let verifiedUsers = 0;

    for (const a of allAgents) {
      totalUsers += 1;
      if (a?.status === "active" || a?.is_active === true) activeUsers += 1;
      if (a?.is_verified === true) verifiedUsers += 1;
    }

    return { totalUsers, activeUsers, verifiedUsers };
  }, [allAgents]);

  const onAddNew = () => setAdding(true);

  const onCreateAgent = async ({
    agent_name,
    agent_email,
    contact_number,
    password,
    is_active,
    agency,
  }) => {
    if (saving) return null;

    try {
      setSaving(true);

      const resp1 = await createAgent({
        agent_name: (agent_name || "").trim(),
        agent_email: (agent_email || "").trim(),
        contact_number: (contact_number || "").trim(),
        password,
        is_active: Boolean(is_active),
      });

      const failedByBody =
        resp1?.status === "failed" ||
        (typeof resp1?.code === "number" && resp1.code >= 400);

      if (failedByBody) return resp1;

      try {
        await addAgentToHFAgency({
          agent_name,
          agent_email,
          contact_number,
          password,
          agency,
        });
      } catch (hfErr) {
        console.warn("HF agency create failed (ignored):", hfErr);
      }

      setAdding(false);
      await load(limit);
      await loadAllAgentsMetrics();

      return resp1;
    } catch (error) {
      setErr(
        error instanceof Error && error.message
          ? error.message
          : "Failed to create agent. Please try again."
      );
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    await load(limit);
    await loadAllAgentsMetrics();
  };

  const handleLimitChange = async (nextLimit) => {
    const val = Number(nextLimit);
    if (!val || val <= 0 || val === limit) return;
    await load(val);
  };

  return (
    <>
      {/* Cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="mt-3 text-lg font-semibold text-gray-800">
                    {fmt(metrics.totalUsers)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <UsersRound className="h-5 w-5 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="mt-3 text-lg font-semibold text-gray-800">
                    {fmt(metrics.activeUsers)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">Verified Users</p>
                  <p className="mt-3 text-lg font-semibold text-gray-800">
                    {fmt(metrics.verifiedUsers)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock2 className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {err && <p className="mt-4 text-sm text-red-600">{err}</p>}

      {loading && !err && (
        <div className="mt-4 inline-flex items-center gap-2 text-sm text-gray-500">
          <div className="h-4 w-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <span>Loading users…</span>
        </div>
      )}

      <AgentProfiles
        title={title}
        subtitle={subtitle}
        onRefresh={handleRefresh}
        onAddNew={onAddNew}
        loading={loading}
        agents={agents.map((a) => ({
          id: a.agent_id,
          name: a.agent_name,
          email: a.agent_email,
          phone: a.contact_number,
          is_active: a.status === "active",
          is_verified: Boolean(a.is_verified),
          created_at: a.created_at,
          __raw: a,
        }))}
        limit={limit}
        onLimitChange={handleLimitChange}
      />

      <AddAgentModal
        open={adding}
        onClose={() => setAdding(false)}
        onSubmit={onCreateAgent}
      />

      {saving && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-gray-900 text-white text-sm px-3 py-2 shadow">
          Saving changes…
        </div>
      )}
    </>
  );
}

AgentStats.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
};



