// src/components/AgentMangament/AgentStats.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { UsersRound, Clock2, CheckCircle2 } from "lucide-react";
import AgentProfiles from "./AgentProfiles.jsx";

import { fetchAgents, updateAgent, createAgent } from "../../services/AgentService";
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
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr("");
      const list = await fetchAgents();
      setAgents(list);
    } catch (error) {
      console.error("Failed to load agents:", error);
      const msg =
        error instanceof Error && error.message
          ? `Failed to load agents: ${error.message}`
          : "Failed to load agents.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const metrics = useMemo(() => {
    let totalAgents = 0;
    let totalCompleted = 0;
    let totalPending = 0;
    for (const a of agents) {
      totalAgents += 1;
      totalCompleted += Number(
        a?.case_stats?.completed_cases || a?.completed_cases || 0
      );
      totalPending += Number(
        a?.case_stats?.pending_cases || a?.pending_cases || 0
      );
    }
    return { totalAgents, totalCompleted, totalPending };
  }, [agents]);

  const onEdit = (agentRow) => setEditing(agentRow.__raw);

  const onSaveEdit = async ({ agent_name, contact_number, status, password }) => {
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
      await load();
    } catch (error) {
      console.error("Failed to update agent:", error);
      setErr("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const onAddNew = () => setAdding(true);

  // Include `agency` when creating an agent
  const onCreateAgent = async ({
    agent_name,
    agent_email,
    contact_number,
    agency,
    password,
  }) => {
    if (saving) return;
    try {
      setSaving(true);
      await createAgent({
        agent_name: (agent_name || "").trim(),
        agent_email: (agent_email || "").trim(),
        contact_number: (contact_number || "").trim(),
        agency: (agency || "").trim(),
        password,
      });
      setAdding(false);
      await load();
    } catch (error) {
      console.error("Failed to create agent:", error);
      setErr("Failed to create agent. Please check details and try again.");
    } finally {
      setSaving(false);
    }
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
            {/* Total Agents */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Agents</p>
                  <p className="mt-3 text-lg font-semibold text-gray-800">
                    {fmt(metrics.totalAgents)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <UsersRound className="h-5 w-5 text-indigo-600" />
                </div>
              </div>
            </div>

            {/* Cases Completed */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cases Completed</p>
                  <p className="mt-3 text-lg font-semibold text-gray-800">
                    {fmt(metrics.totalCompleted)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </div>

            {/* Pending Cases */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Cases</p>
                  <p className="mt-3 text-lg font-semibold text-gray-800">
                    {fmt(metrics.totalPending)}
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
          <span>Loading agents…</span>
        </div>
      )}

      {/* Table after cards */}
      <AgentProfiles
        title={title}
        subtitle={subtitle}
        onRefresh={load}
        onAddNew={onAddNew}
        agents={agents.map((a) => ({
          id: a.agent_id,
          name: a.agent_name,
          agency: a.agency, // pass through agency (can be undefined)
          email: a.agent_email,
          phone: a.contact_number,
          status: a.status,
          completed: Number(a?.case_stats?.completed_cases ?? a?.completed_cases ?? 0),
          pending: Number(a?.case_stats?.pending_cases ?? a?.pending_cases ?? 0),
          total: Number(a?.case_stats?.all_cases ?? a?.total_cases ?? 0),
          __raw: a,
        }))}
        onEdit={onEdit}
        loading={loading} // IMPORTANT: pass loading so skeleton table shows
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
