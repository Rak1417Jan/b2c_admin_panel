// src/components/AgentMangament/AgentStats.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { UsersRound, Clock2, CheckCircle2 } from "lucide-react";
import AgentProfiles from "./AgentProfiles.jsx";

import {
  fetchAgents,
  fetchAllAgents,
  updateAgent,
  createAgent,
} from "../../services/AgentService";
import EditAgentModal from "./EditAgentModal.jsx";
import AddAgentModal from "./AddAgentModal.jsx";

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
  const [allAgents, setAllAgents] = useState([]); // full list for metrics
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);

  // ✅ limit state (default 10)
  const [limit, setLimit] = useState(10);

  // Guard against race conditions
  const requestIdRef = useRef(0);

  /**
   * ✅ New load: only depends on limit.
   * page/search removed because new API doesn't support them.
   */
  const load = async (limitOverride) => {
    const effectiveLimit =
      Number(limitOverride) > 0 ? Number(limitOverride) : limit;

    const currentId = ++requestIdRef.current;
    setLoading(true);
    setErr("");

    try {
      const { agents: list } = await fetchAgents({
        limit: effectiveLimit,
      });

      if (currentId !== requestIdRef.current) return;

      setAgents(list);
      setLimit(effectiveLimit);
    } catch (error) {
      if (currentId !== requestIdRef.current) return;
      console.error("Failed to load agents:", error);
      const msg =
        error instanceof Error && error.message
          ? `Failed to load agents: ${error.message}`
          : "Failed to load agents.";
      setErr(msg);
    } finally {
      if (currentId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  /**
   * ✅ Metrics list: full fetch using /users with big limit.
   */
  const loadAllAgentsMetrics = async () => {
    try {
      const list = await fetchAllAgents();
      setAllAgents(list);
    } catch (error) {
      console.error("Failed to load all agents for metrics:", error);
    }
  };

  // Initial load
  useEffect(() => {
    load(10);
    loadAllAgentsMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * ✅ New Metrics based on NEW API fields.
   */
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

  /**
   * ✅ Edit click -> open modal with normalized agent row
   */
  const onEdit = (agentRow) => {
    if (!agentRow?.__raw) return;
    setEditing(agentRow.__raw);
  };

  /**
   * ❗ Update API unchanged (still old endpoint)
   */
  const onSaveEdit = async ({
    agent_name,
    contact_number,
    status,
    password,
  }) => {
    if (!editing?.agent_id) return;
    try {
      setSaving(true);
      await updateAgent(editing.agent_id, {
        agent_name,
        contact_number,
        status,
        password,
      });
      setEditing(null);
      await load(limit);
      await loadAllAgentsMetrics();
    } catch (error) {
      console.error("Failed to update agent:", error);
      setErr("Failed to save changes. Please try again.");
      throw error; // ✅ so Edit modal can react if needed later
    } finally {
      setSaving(false);
    }
  };

  const onAddNew = () => setAdding(true);

  /**
   * ✅ Create agent with NEW API fields.
   * IMPORTANT: return response so AddAgentModal can detect body-failed.
   */
  const onCreateAgent = async ({
    agent_name,
    agent_email,
    contact_number,
    password,
    is_active,
  }) => {
    if (saving) return null;
    try {
      setSaving(true);

      const resp = await createAgent({
        agent_name: (agent_name || "").trim(),
        agent_email: (agent_email || "").trim(),
        contact_number: (contact_number || "").trim(),
        password,
        is_active: Boolean(is_active),
      });

      // ✅ Only close modal + reload after success-like response
      // (Modal itself handles body-failed; if body-failed, it won't reach here)
      setAdding(false);
      await load(limit);
      await loadAllAgentsMetrics();

      return resp; // ✅ CRITICAL
    } catch (error) {
      console.error("Failed to create agent:", error);

      // Don’t force success UI here; modal will show errors using thrown msg
      setErr("Failed to create agent. Please check details and try again.");
      throw error; // ✅ CRITICAL
    } finally {
      setSaving(false);
    }
  };

  /**
   * ✅ Refresh keeps same limit.
   */
  const handleRefresh = async () => {
    await load(limit);
    await loadAllAgentsMetrics();
  };

  /**
   * ✅ Limit change handler (live reload)
   */
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
            {/* Total Users */}
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

            {/* Active Users */}
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

            {/* Verified Users */}
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

      {/* Errors / Loading */}
      {err && <p className="mt-4 text-sm text-red-600">{err}</p>}

      {loading && !err && (
        <div className="mt-4 inline-flex items-center gap-2 text-sm text-gray-500">
          <div className="h-4 w-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <span>Loading users…</span>
        </div>
      )}

      {/* Profiles table */}
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
        onEdit={onEdit}
        limit={limit}
        onLimitChange={handleLimitChange}
      />

      {/* Modals */}
      <EditAgentModal
        open={Boolean(editing)}
        agent={editing}
        onClose={() => setEditing(null)}
        onSubmit={onSaveEdit}
      />
      <AddAgentModal
        open={adding}
        onClose={() => setAdding(false)}
        onSubmit={onCreateAgent}
      />

      {/* Saving hint */}
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
