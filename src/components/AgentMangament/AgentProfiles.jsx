// src/components/AgentManagement/AgentProfiles.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import {
  UserPlus,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  BadgeCheck,
  BadgeX,
  RefreshCcw,
  CalendarClock,
  PencilIcon,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import EditAgentModal from "./EditAgentModal";
import { updateAgent } from "../../services/AgentService";
import { syncEditedAgentToHFAndCPV } from "../../services/Addagent";
import { toggleAgentStatusAcrossSystems } from "../../services/AgentStatusService";

const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* ---------- Skeleton helpers ---------- */
const SKELETON_ROW_KEYS = ["row-a", "row-b", "row-c", "row-d", "row-e", "row-f"];
const SKELETON_CARD_KEYS = ["card-a", "card-b", "card-c", "card-d"];

function SkeletonBar({ width = "w-24" }) {
  return (
    <div className={`h-3.5 rounded-full bg-gray-200/80 animate-pulse ${width}`} />
  );
}
SkeletonBar.propTypes = { width: PropTypes.string };

function SkeletonPill({ width = "w-20" }) {
  return (
    <div className="inline-flex items-center rounded-full px-3 py-1.5 border border-gray-200 bg-gray-100 animate-pulse">
      <div className={`h-3.5 rounded-full bg-gray-200 ${width}`} />
    </div>
  );
}
SkeletonPill.propTypes = { width: PropTypes.string };

function SkeletonTableRow() {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-4 px-4">
        <SkeletonBar width="w-28" />
      </td>
      <td className="py-4 px-4">
        <SkeletonBar width="w-40" />
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded-full bg-gray-200 animate-pulse" />
          <SkeletonBar width="w-52" />
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded-full bg-gray-200 animate-pulse" />
          <SkeletonBar width="w-28" />
        </div>
      </td>
      <td className="py-4 px-4">
        <SkeletonPill width="w-14" />
      </td>
      <td className="py-4 px-4">
        <SkeletonPill width="w-16" />
      </td>
      <td className="py-4 px-4">
        <SkeletonBar width="w-36" />
      </td>
      <td className="py-4 px-4">
        <SkeletonBar width="w-36" />
      </td>
    </tr>
  );
}

function SkeletonMobileCard() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-2.5 w-20 rounded-full bg-gray-200" />
        <div className="h-3 w-24 rounded-full bg-gray-200" />
      </div>

      <div className="mt-3 space-y-2">
        <div className="h-3.5 w-40 rounded-full bg-gray-200" />
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded-full bg-gray-200" />
          <div className="h-2.5 w-48 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded-full bg-gray-200" />
          <div className="h-2.5 w-32 rounded-full bg-gray-200" />
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <div className="h-7 w-20 rounded-full bg-gray-100" />
        <div className="h-7 w-24 rounded-full bg-gray-100" />
      </div>

      <div className="mt-3 h-2.5 w-40 rounded-full bg-gray-200" />
    </div>
  );
}

/* ---------- Limit options ---------- */
const LIMIT_OPTIONS = [10, 25, 50];

const SEARCH_PLACEHOLDER = {
  name: "Search by name",
  email: "Search by email",
  phone: "Search by phone number",
};

export default function AgentProfiles({
  title = "Agent Management",
  subtitle = "Manage and monitor all agents",
  agents = [],
  onAddNew,
  onEdit, // kept for compatibility (unused)
  onRefresh,
  loading = false,
  limit = 10,
  onLimitChange,
  page = 1,
  totalItems = 0,
  onPageChange,
  searchField = "name",
  searchTerm = "",
  onSearchFieldChange,
  onSearchTermChange,
}) {
  const list = useMemo(() => agents, [agents]);
  const isEmpty = !loading && list.length === 0;

  const [limitInput, setLimitInput] = useState(String(limit));
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [togglingId, setTogglingId] = useState(null); // 🔄 status toggle loading state
  const debounceRef = useRef(null);

  useEffect(() => {
    setLimitInput(String(limit));
  }, [limit]);

  const commitLimit = (val) => {
    const num = Number(val);
    if (!num || num <= 0) return;
    onLimitChange?.(num);
  };

  const handleLimitSelect = (e) => {
    const val = e.target.value;
    setLimitInput(String(val));
    commitLimit(val);
  };

  const handleLimitInput = (e) => {
    const val = e.target.value.replaceAll(/[^\d]/g, "");
    setLimitInput(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      commitLimit(val);
    }, 500);
  };

  const handleLimitKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      commitLimit(limitInput);
    }
  };

  const handleEditClick = (agent) => {
    const modalAgentData = {
      agent_id: agent.id,
      agent_name: agent.name,
      agent_email: agent.email,
      contact_number: agent.phone || "",
      status: agent.is_active ? "active" : "inactive",
      is_verified: agent.is_verified,
    };

    setSelectedAgent(modalAgentData);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (formData) => {
    if (!selectedAgent) return;

    try {
      await updateAgent(selectedAgent.agent_id, formData);

      const hfSyncPayload = {
        agent_email: selectedAgent.agent_email,
        agent_name: formData.agent_name,
        contact_number: formData.contact_number,
        status: formData.status,
        password: formData.password,
      };

      // background sync
      syncEditedAgentToHFAndCPV(hfSyncPayload);

      if (onRefresh) {
        await onRefresh();
      }

      setEditModalOpen(false);
      setSelectedAgent(null);
    } catch (error) {
      console.error("Failed to update agent:", error);
      throw error;
    }
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setSelectedAgent(null);
  };

  /**
   * 🔁 Status toggle handler
   * - Optimistic + safe refresh
   */
  const handleToggleStatus = async (agent) => {
    if (!agent?.id || !agent?.email) return;
    if (togglingId === agent.id) return; // avoid double click

    const nextIsActive = !agent.is_active;

    try {
      setTogglingId(agent.id);

      await toggleAgentStatusAcrossSystems({
        bankerId: agent.id,    // first column: banker_id
        email: agent.email,    // HF search
        makeActive: nextIsActive,
      });

      // refresh table from backend to keep all data in sync
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.error("Status toggle failed:", err);
      window.alert(
        err?.message || "Failed to change status. Please try again."
      );
    } finally {
      setTogglingId(null);
    }
  };

  /**
   * Pretty toggle UI component
   */
  const StatusToggle = ({ agent }) => {
    const isActive = agent.is_active;
    const isBusy = togglingId === agent.id;

    return (
      <button
        type="button"
        onClick={() => handleToggleStatus(agent)}
        disabled={isBusy}
        className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-xs font-semibold shadow-sm border transition
          ${
            isActive
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-700"
          }
          ${isBusy ? "opacity-70 cursor-wait" : "hover:shadow-md cursor-pointer"}
        `}
        aria-label={`Toggle status for ${agent.name}`}
      >
        <span
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition
            ${isActive ? "bg-emerald-500/80" : "bg-red-500/80"}
          `}
        >
          <span
            className={`h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200
              ${isActive ? "translate-x-4" : "translate-x-1"}
            `}
          />
        </span>
        <span className="whitespace-nowrap">
          {isBusy ? "Updating…" : isActive ? "Active" : "Inactive"}
        </span>
      </button>
    );
  };

  StatusToggle.propTypes = {
    agent: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      email: PropTypes.string,
      is_active: PropTypes.bool,
    }).isRequired,
  };

  let tableBodyContent;
  if (loading) {
    tableBodyContent = SKELETON_ROW_KEYS.map((k) => (
      <SkeletonTableRow key={k} />
    ));
  } else if (isEmpty) {
    tableBodyContent = (
      <tr>
        <td colSpan={9} className="py-12 px-4">
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-gray-800 font-semibold text-base">
              No users found
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Try increasing limit or add a new user.
            </p>
          </div>
        </td>
      </tr>
    );
  } else {
    tableBodyContent = list.map((a) => (
      <tr
        key={a.id}
        className="group transition-colors duration-150 odd:bg-white even:bg-slate-50/60 hover:bg-blue-50/70"
      >
        <td className="py-4 px-4 font-semibold text-gray-800 whitespace-nowrap">
          {a.id}
        </td>

        <td className="py-4 px-4 whitespace-nowrap text-gray-900" title={a.name}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              {(a.name || "U").slice(0, 1).toUpperCase()}
            </div>
            <span className="font-medium">{a.name}</span>
          </div>
        </td>

        <td className="py-4 px-4">
          <div className="flex items-center gap-2 text-[13px] text-blue-700 whitespace-nowrap">
            <Mail className="h-3.5 w-3.5 min-w-3.5" />
            <a
              href={`mailto:${a.email}`}
              className="hover:underline underline-offset-2"
              title={a.email}
            >
              {a.email}
            </a>
          </div>
        </td>

        <td className="py-4 px-4 whitespace-nowrap text-gray-700">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 min-w-4 text-gray-500" />
            <span>{a.phone || "—"}</span>
          </div>
        </td>

        <td className="py-4 px-4">
          {a.is_active ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1.5 border border-emerald-100 text-xs font-semibold whitespace-nowrap">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 text-gray-700 px-3 py-1.5 border border-gray-200 text-xs font-semibold whitespace-nowrap">
              <XCircle className="h-3.5 w-3.5" />
              Inactive
            </span>
          )}
        </td>

        <td className="py-4 px-4">
          {a.is_verified ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 text-indigo-700 px-3 py-1.5 border border-indigo-100 text-xs font-semibold whitespace-nowrap">
              <BadgeCheck className="h-3.5 w-3.5" />
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 px-3 py-1.5 border border-amber-100 text-xs font-semibold whitespace-nowrap">
              <BadgeX className="h-3.5 w-3.5" />
              Unverified
            </span>
          )}
        </td>

        <td className="py-4 px-4">
          <button
            onClick={() => handleEditClick(a)}
            className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 text-indigo-700 px-3 py-1.5 border border-indigo-100 text-xs font-semibold whitespace-nowrap hover:bg-indigo-100 hover:border-indigo-200 transition-colors cursor-pointer"
            aria-label={`Edit ${a.name}`}
          >
            <PencilIcon className="h-3.5 w-3.5" />
            Edit
          </button>
        </td>

        <td className="py-4 px-4 whitespace-nowrap text-gray-700">
          <div className="inline-flex items-center gap-2 rounded-lg bg-slate-50 text-slate-700 px-3 py-1.5 border border-slate-200 text-xs whitespace-nowrap">
            <CalendarClock className="h-3.5 w-3.5" />
            {fmtDate(a.created_at)}
          </div>
        </td>

        {/* 🆕 Status Change Toggle column */}
        <td className="py-4 px-4 whitespace-nowrap">
          <StatusToggle agent={a} />
        </td>
      </tr>
    ));
  }

  let mobileContent;
  if (loading) {
    mobileContent = (
      <div className="grid grid-cols-1 gap-4">
        {SKELETON_CARD_KEYS.map((k) => (
          <SkeletonMobileCard key={k} />
        ))}
      </div>
    );
  } else if (isEmpty) {
    mobileContent = (
      <div className="flex flex-col items-center justify-center text-center py-10 rounded-2xl border border-gray-200 bg-white">
        <p className="text-gray-800 font-semibold">No users found</p>
        <p className="text-gray-500 text-sm mt-1">
          Try increasing limit or add a new user.
        </p>
      </div>
    );
  } else {
    mobileContent = (
      <div className="grid grid-cols-1 gap-4">
        {list.map((a) => (
          <div
            key={a.id}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-wide text-gray-500">
                User ID
              </div>
              <div className="text-sm font-semibold text-gray-800 break-all">
                {a.id}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                {(a.name || "U").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div
                  className="text-gray-900 font-semibold text-base truncate"
                  title={a.name}
                >
                  {a.name}
                </div>
                <div className="mt-1 flex items-center gap-2 text-[13px] text-blue-600">
                  <Mail className="h-3.5 w-3.5" />
                  <a
                    href={`mailto:${a.email}`}
                    className="hover:underline break-all truncate"
                    title={a.email}
                  >
                    {a.email}
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 text-gray-700 text-sm">
              <Phone className="h-4 w-4" />
              <span className="break-all truncate">{a.phone || "—"}</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {a.is_active ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1.5 border border-emerald-100 text-xs font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 text-gray-700 px-3 py-1.5 border border-gray-200 text-xs font-semibold">
                  <XCircle className="h-3.5 w-3.5" />
                  Inactive
                </span>
              )}

              {a.is_verified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 text-indigo-700 px-3 py-1.5 border border-indigo-100 text-xs font-semibold">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 px-3 py-1.5 border border-amber-100 text-xs font-semibold">
                  <BadgeX className="h-3.5 w-3.5" />
                  Unverified
                </span>
              )}
            </div>

            <div className="mt-3">
              <button
                onClick={() => handleEditClick(a)}
                className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 text-indigo-700 px-3 py-1.5 border border-indigo-100 text-xs font-semibold hover:bg-indigo-100 hover:border-indigo-200 transition-colors cursor-pointer"
                aria-label={`Edit ${a.name}`}
              >
                <PencilIcon className="h-3.5 w-3.5" />
                Edit Agent
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <CalendarClock className="h-3.5 w-3.5" />
              Created: {fmtDate(a.created_at)}
            </div>

            {/* 🆕 Mobile Status Toggle */}
            <div className="mt-3">
              <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
                Status Change
              </p>
              <StatusToggle agent={a} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const totalPages = Math.max(
    1,
    Math.ceil((totalItems || list.length) / (limit || 10))
  );

  const handlePrevPage = () => {
    if (page <= 1) return;
    onPageChange?.(page - 1);
  };

  const handleNextPage = () => {
    if (page >= totalPages) return;
    onPageChange?.(page + 1);
  };

  const handleSearchFieldSelect = (e) => {
    const field = e.target.value;
    onSearchFieldChange?.(field);
  };

  const handleSearchInputChange = (e) => {
    onSearchTermChange?.(e.target.value);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      onSearchTermChange?.(e.target.value);
    }
  };

  const handleClearSearch = () => {
    onSearchTermChange?.("");
  };

  return (
    <>
      <section className="mt-6 rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 via-white to-gray-50 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between p-5">
          <div>
            <h2 className="text-[18px] font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto md:items-end">
            <div className="flex flex-wrap gap-2 justify-start md:justify-end">
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 shadow-sm focus:outline-none_focus:ring-2 focus:ring-blue-500/30"
                aria-label="Refresh users"
                title="Refresh"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>

              <button
                type="button"
                onClick={onAddNew}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow
                       bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 transition
                       focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                aria-label="Add new Agent"
              >
                <UserPlus className="h-4 w-4" />
                Add New Agent
              </button>
            </div>

            {/* 🔍 Search controls */}
            <div className="flex flex-col gap-2 w-full max-w-xl md:flex-row md:items-center">
              <div className="relative w-full md:w-40">
                <select
                  value={searchField}
                  onChange={handleSearchFieldSelect}
                  className="w-full rounded-full border border-gray-200 bg-white px-3 py-2.5 pr-8 text-sm text-gray-800 shadow-sm
                             focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none appearance-none"
                >
                  <option value="name">By name</option>
                  <option value="email">By email</option>
                  <option value="phone">By phone</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400 text-xs">
                  ▼
                </span>
              </div>

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={
                    SEARCH_PLACEHOLDER[searchField] || "Search"
                  }
                  className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm text-gray-800 shadow-sm
                             focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs px-2 py-1 rounded-full hover:bg-gray-100"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200" />

        <div className="px-5 pt-4 pb-2">
          <div className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-6 py-2 text-sm text-gray-700 shadow-sm">
            Agent Profiles
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block px-5 pb-5">
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="max-h-[520px] overflow-y-auto overflow-x-auto">
              <table className="min-w-full text-left border-separate border-spacing-0">
                <thead className="bg-white text-xs text-gray-600 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.04)]">
                  <tr className="[&>th]:py-3.5 [&>th]:px-4 [&>th]:whitespace-nowrap">
                    <th className="w-36 font-semibold uppercase tracking-wide">
                      Agent ID
                    </th>
                    <th className="min-w-[240px] font-semibold uppercase tracking-wide">
                      Name
                    </th>
                    <th className="min-w-[280px] font-semibold uppercase tracking-wide">
                      Email
                    </th>
                    <th className="min-w-[200px] font-semibold uppercase tracking-wide">
                      Contact
                    </th>
                    <th className="w-36 font-semibold uppercase tracking-wide">
                      Status
                    </th>
                    <th className="w-36 font-semibold uppercase tracking-wide">
                      Verified
                    </th>
                    <th className="min-w-[120px] font-semibold uppercase tracking-wide">
                      Action
                    </th>
                    <th className="min-w-[220px] font-semibold uppercase tracking-wide">
                      Created At
                    </th>
                    <th className="min-w-[180px] font-semibold uppercase tracking-wide">
                      Status Change
                    </th>
                  </tr>
                </thead>

                <tbody className="text-sm">{tableBodyContent}</tbody>
              </table>
            </div>

            {/* Footer: rows + pagination */}
            <div className="border-t border-gray-200 bg-gradient-to-r from-white to-gray-50 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-600">
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    Loading…
                  </span>
                ) : (
                  <span>
                    Showing{" "}
                    <span className="font-semibold text-gray-900">
                      {list.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-gray-900">
                      {totalItems || list.length}
                    </span>{" "}
                    users{" "}
                    <span className="text-gray-400">(limit {limit})</span>
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
                <div className="flex flex-wrap items-center gap-2 justify-end">
                  <label className="text-sm text-gray-600">Rows:</label>

                  <select
                    value={
                      LIMIT_OPTIONS.includes(Number(limitInput))
                        ? Number(limitInput)
                        : ""
                    }
                    onChange={handleLimitSelect}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm
                               focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none"
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    {LIMIT_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>

                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={limitInput}
                      onChange={handleLimitInput}
                      onKeyDown={handleLimitKeyDown}
                      placeholder="Custom"
                      className="w-28 rounded-full border border-gray-200 bg-white py-1.5 pl-3 pr-9 text-sm text-gray-800 shadow-sm
                                 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none"
                    />
                    <span className="absolute inset-y-0 right-2 flex items-center text-[11px] text-gray-400">
                      Enter
                    </span>
                  </div>
                </div>

                {/* Pagination controls */}
                <div className="flex items-center justify-end gap-2 text-sm text-gray-700">
                  <button
                    type="button"
                    onClick={handlePrevPage}
                    disabled={page <= 1 || loading}
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm
                               disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </button>
                  <span className="text-xs sm:text-sm text-gray-600">
                    Page{" "}
                    <span className="font-semibold text-gray-900">
                      {page}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-gray-900">
                      {totalPages}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={handleNextPage}
                    disabled={page >= totalPages || loading}
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm
                               disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden px-5 pb-5">
          {mobileContent}

          {/* Mobile pagination summary */}
          {!loading && (
            <div className="mt-4 flex flex-col gap-2 items-center text-sm text-gray-700">
              <div>
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {list.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">
                  {totalItems || list.length}
                </span>{" "}
                users
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={page <= 1 || loading}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm
                             disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>
                <span className="text-xs text-gray-600">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={page >= totalPages || loading}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm
                             disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <EditAgentModal
        open={editModalOpen}
        agent={selectedAgent}
        onClose={handleEditClose}
        onSubmit={handleEditSubmit}
      />
    </>
  );
}

AgentProfiles.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  agents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      phone: PropTypes.string,
      is_active: PropTypes.bool,
      is_verified: PropTypes.bool,
      created_at: PropTypes.string,
      __raw: PropTypes.object,
    })
  ),
  onAddNew: PropTypes.func,
  onEdit: PropTypes.func,
  onRefresh: PropTypes.func,
  loading: PropTypes.bool,
  limit: PropTypes.number,
  onLimitChange: PropTypes.func,
  page: PropTypes.number,
  totalItems: PropTypes.number,
  onPageChange: PropTypes.func,
  searchField: PropTypes.oneOf(["name", "email", "phone"]),
  searchTerm: PropTypes.string,
  onSearchFieldChange: PropTypes.func,
  onSearchTermChange: PropTypes.func,
};
