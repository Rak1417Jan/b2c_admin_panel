// src/components/AgentMangament/AgentProfiles.jsx
import React, { useMemo } from "react";
import PropTypes from "prop-types";
import {
  UserPlus,
  Mail,
  Phone,
  CheckCircle2,
  Clock3,
  BarChart3,
  PencilLine,
  RefreshCcw,
} from "lucide-react";

const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

export default function AgentProfiles({
  title = "Agent Management",
  subtitle = "Manage and monitor all agents",
  agents = [],
  onAddNew,
  onEdit,
  onRefresh,
}) {
  const list = useMemo(() => agents, [agents]);

  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-gray-50">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between p-5">
        <div>
          <h2 className="text-[18px] font-semibold text-gray-800">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-label="Refresh agents"
            title="Refresh"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>

          <button
            type="button"
            onClick={onAddNew}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white shadow
                     bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 transition
                     focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            aria-label="Add new agent"
          >
            <UserPlus className="h-4 w-4" />
            Add New Agent
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200" />

      {/* Chip */}
      <div className="px-5 pt-4 pb-2">
        <div className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-6 py-2 text-sm text-gray-700 shadow-sm">
          Agent Profiles
        </div>
      </div>

      {/* Desktop / Tablet (Table) */}
      <div className="hidden md:block px-5 pb-5">
        <div className="relative overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="max-h-[420px] overflow-y-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50 text-sm text-gray-600 sticky top-0 z-10">
                <tr className="[&>th]:py-3 [&>th]:px-4">
                  <th className="w-28">Agent ID</th>
                  <th className="min-w-[220px]">Name</th>
                  {/* NEW: Agency */}
                  <th className="min-w-[160px]">Agency</th>
                  <th className="min-w-[240px]">Email</th>
                  <th className="min-w-[160px]">Contact</th>
                  <th className="w-32">Status</th>
                  <th className="w-36">Completed</th>
                  <th className="w-32">Pending</th>
                  <th className="w-36">Total Cases</th>
                  <th className="w-28 text-right pr-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-sm">
                {list.length === 0 ? (
                  <tr>
                    {/* updated colSpan from 9 → 10 because of the new column */}
                    <td colSpan={10} className="py-10 px-4">
                      <div className="flex flex-col items-center justify-center text-center">
                        <p className="text-gray-700 font-medium">No agents to display</p>
                        <p className="text-gray-500 text-sm mt-1">
                          Add a new agent to get started.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  list.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50/60">
                      <td
                        className="py-4 px-4 font-medium text-gray-700 whitespace-nowrap truncate max-w-[140px]"
                        title={a.id}
                      >
                        {a.id}
                      </td>

                      <td
                        className="py-4 px-4 whitespace-nowrap truncate max-w-[200px] text-gray-800"
                        title={a.name}
                      >
                        {a.name}
                      </td>

                      {/* NEW: Agency cell */}
                      <td
                        className="py-4 px-4 whitespace-nowrap truncate max-w-[180px] text-gray-700"
                        title={a.agency || "-"}
                      >
                        {a.agency || "-"}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-[13px] text-blue-600 whitespace-nowrap truncate max-w-[220px]">
                          <Mail className="h-3.5 w-3.5 min-w-3.5" />
                          <a
                            href={`mailto:${a.email}`}
                            className="hover:underline break-all truncate"
                            title={a.email}
                          >
                            {a.email}
                          </a>
                        </div>
                      </td>

                      <td
                        className="py-4 px-4 whitespace-nowrap truncate max-w-[160px] text-gray-600"
                        title={a.phone}
                      >
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 min-w-4" />
                          <span className="truncate">{a.phone}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium border ${
                            a.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                          title={a.status}
                        >
                          {a.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 text-emerald-700 px-3 py-1.5 border border-emerald-100 whitespace-nowrap">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="font-medium">{fmt(a.completed)}</span>
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-2 rounded-lg bg-amber-50 text-amber-700 px-3 py-1.5 border border-amber-100 whitespace-nowrap">
                          <Clock3 className="h-4 w-4" />
                          <span className="font-medium">{fmt(a.pending)}</span>
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-2 rounded-lg bg-blue-50 text-blue-700 px-3 py-1.5 border border-blue-100 whitespace-nowrap">
                          <BarChart3 className="h-4 w-4" />
                          <span className="font-medium">{fmt(a.total)}</span>
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onEdit?.(a)}
                          className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-gray-700 hover:bg-gray-50 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          aria-label={`Edit ${a.name}`}
                        >
                          <PencilLine className="h-4 w-4" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mobile (Cards) */}
      <div className="md:hidden px-5 pb-5">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10 rounded-xl border border-gray-200 bg-white">
            <p className="text-gray-700 font-medium">No agents to display</p>
            <p className="text-gray-500 text-sm mt-1">Add a new agent to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {list.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">Agent ID</div>
                  <div className="text-sm font-semibold text-gray-800 truncate max-w-[180px]" title={a.id}>
                    {a.id}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-gray-900 font-medium truncate" title={a.name}>
                    {a.name}
                  </div>

                  {/* NEW: Agency on mobile */}
                  <div className="mt-0.5 text-xs text-gray-600 truncate" title={a.agency || "-"}>
                    Agency: <span className="font-medium text-gray-700">{a.agency || "-"}</span>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-[13px] text-blue-600">
                    <Mail className="h-3.5 w-3.5" />
                    <a href={`mailto:${a.email}`} className="hover:underline break-all truncate" title={a.email}>
                      {a.email}
                    </a>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span className="break-all truncate" title={a.phone}>{a.phone}</span>
                </div>

                <div className="mt-3">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium border ${
                      a.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-gray-100 text-gray-700 border-gray-200"
                    }`}
                  >
                    {a.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 px-2 py-1.5 border border-emerald-100 text-sm">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    {fmt(a.completed)}
                  </div>
                  <div className="flex items-center justify-center rounded-lg bg-amber-50 text-amber-700 px-2 py-1.5 border border-amber-100 text-sm">
                    <Clock3 className="h-4 w-4 mr-1" />
                    {fmt(a.pending)}
                  </div>
                  <div className="flex items-center justify-center rounded-lg bg-blue-50 text-blue-700 px-2 py-1.5 border border-blue-100 text-sm">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    {fmt(a.total)}
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onEdit?.(a)}
                    className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-gray-700 hover:bg-gray-50 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    aria-label={`Edit ${a.name}`}
                  >
                    <PencilLine className="h-4 w-4" />
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

AgentProfiles.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  agents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      agency: PropTypes.string, // NEW
      email: PropTypes.string.isRequired,
      phone: PropTypes.string.isRequired,
      status: PropTypes.string,
      completed: PropTypes.number.isRequired,
      pending: PropTypes.number.isRequired,
      total: PropTypes.number.isRequired,
      __raw: PropTypes.object,
    })
  ),
  onAddNew: PropTypes.func,
  onEdit: PropTypes.func,
  onRefresh: PropTypes.func,
};
