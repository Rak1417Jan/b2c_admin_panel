// src/components/CaseManagement/CaseBoard.jsx
import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  Upload,
  UserRound,
  MapPin,
  Eye,
  RefreshCcw,
  PencilLine,
  FileText,
} from "lucide-react";

/* --- local UI helpers (scoped) --- */
const Chip = ({ children, tone = "gray" }) => {
  const tones = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
        tones[tone] || tones.gray
      }`}
    >
      {children}
    </span>
  );
};
Chip.propTypes = {
  children: PropTypes.node,
  tone: PropTypes.oneOf(["slate", "blue", "emerald", "amber", "red", "gray"]),
};

const SoftCard = ({ children }) => (
  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
    {children}
  </div>
);
SoftCard.propTypes = { children: PropTypes.node };

/* --- tiny skeletons for first load (opt-in via `loading`) --- */
const RowSkeleton = () => (
  <tr>
    <td className="px-5 py-4">
      <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
    </td>
    <td className="px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-gray-100 border border-gray-200" />
        <div className="space-y-1">
          <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    </td>
    <td className="px-5 py-4">
      <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
    </td>
    <td className="px-5 py-4">
      <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
    </td>
    <td className="px-5 py-4">
      <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
    </td>
    <td className="px-5 py-4">
      <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
    </td>
    <td className="px-5 py-4">
      <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
    </td>
    <td className="px-5 py-4">
      <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
    </td>
    <td className="px-5 py-4 text-right">
      <div className="flex justify-end gap-2">
        <div className="h-8 w-16 bg-gray-100 rounded-md animate-pulse" />
        <div className="h-8 w-16 bg-gray-100 rounded-md animate-pulse" />
        <div className="h-8 w-24 bg-gray-100 rounded-md animate-pulse" />
      </div>
    </td>
  </tr>
);

/** Safe unique key generator (stable for the session) */
function makeKey() {
  const cr = globalThis.crypto;
  if (cr && typeof cr.randomUUID === "function") return cr.randomUUID();
  return Math.random().toString(36).slice(2);
}

const priorityTone = (p) => {
  if (p === "HIGH") return "red";
  if (p === "MED") return "amber";
  if (p === "LOW") return "emerald";
  return "gray";
};

const statusTone = (s) => (s === "Completed" ? "emerald" : "amber");

function renderDesktopTbody({
  showSkeleton,
  showEmpty,
  rows,
  desktopSkeletonKeys,
  onView,
  onEdit,
  onViewReport,
}) {
  if (showSkeleton) {
    return desktopSkeletonKeys.map((k) => <RowSkeleton key={k} />);
  }

  if (showEmpty) {
    return (
      <tr>
        <td colSpan={9} className="px-5 py-10">
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-gray-700 font-medium">No cases to display</p>
            <p className="text-gray-500 text-sm mt-1">
              Try refreshing to load the latest data.
            </p>
          </div>
        </td>
      </tr>
    );
  }

  return rows.map((r) => {
    const isCompleted = r.status === "Completed";
    const editButtonStateClass = isCompleted
      ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500/30";

    const reportButtonStateClass = isCompleted
      ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500/30"
      : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400";

    return (
      <tr key={r.id} className="hover:bg-gray-50/60">
        <td className="px-5 py-4 text-gray-800 font-semibold whitespace-nowrap">
          {r.id}
        </td>

        <td className="px-5 py-4 whitespace-nowrap">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
              <UserRound className="h-4 w-4 text-gray-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-gray-900 font-medium whitespace-nowrap">
                {r.name}
              </span>
              <a
                href={`tel:${r.phone}`}
                className="text-blue-600 hover:underline whitespace-nowrap"
              >
                {r.phone}
              </a>
            </div>
          </div>
        </td>

        <td className="px-5 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2 text-gray-700">
            <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <span className="whitespace-nowrap">{r.address}</span>
          </div>
        </td>

        <td className="px-5 py-4 whitespace-nowrap">
          <Chip tone="slate">{r.type}</Chip>
        </td>

        <td className="px-5 py-4 whitespace-nowrap">
          ₹{Number(r.loan_amount || 0).toLocaleString("en-IN")}
        </td>

        <td className="px-5 py-4 whitespace-nowrap">
          <Chip tone={priorityTone(r.priority)}>{r.priority || "—"}</Chip>
        </td>

        <td className="px-5 py-4 whitespace-nowrap">
          <span className="whitespace-nowrap">{r.agent}</span>
        </td>

        <td className="px-5 py-4 whitespace-nowrap">
          <Chip tone={statusTone(r.status)}>{r.status}</Chip>
        </td>

        <td className="px-5 py-4 text-right whitespace-nowrap">
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => onView?.(r)}
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-gray-700 hover:bg-gray-50 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              aria-label={`View case ${r.id}`}
              title="View details"
            >
              <Eye className="h-4 w-4" />
              View
            </button>

            <button
              type="button"
              onClick={() => onEdit?.(r)}
              disabled={isCompleted}
              aria-disabled={isCompleted}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 transition shadow-sm focus:outline-none focus:ring-2 ${editButtonStateClass}`}
              aria-label={`Edit case ${r.id}`}
              title={
                isCompleted ? "Completed case cannot be edited" : "Edit / Assign"
              }
            >
              <PencilLine className="h-4 w-4" />
              Edit
            </button>

            <button
              type="button"
              onClick={() => isCompleted && onViewReport?.(r)}
              disabled={!isCompleted}
              aria-disabled={!isCompleted}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 transition shadow-sm focus:outline-none focus:ring-2 ${reportButtonStateClass}`}
              aria-label={`View report for case ${r.id}`}
              title={
                isCompleted
                  ? "View Report (PDF)"
                  : "Report available only after completion"
              }
            >
              <FileText className="h-4 w-4" />
              View Report
            </button>
          </div>
        </td>
      </tr>
    );
  });
}

function renderMobileContent({
  showSkeleton,
  rows,
  mobileSkeletonKeys,
  onView,
  onEdit,
  onViewReport,
}) {
  if (showSkeleton) {
    return (
      <div className="space-y-4">
        {mobileSkeletonKeys.map((k) => (
          <div
            key={k}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="mt-3 flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-gray-100 border border-gray-200" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
            <div className="mt-3 h-3 w-40 bg-gray-100 rounded animate-pulse" />
            <div className="mt-3 flex items-center justify-between">
              <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <div className="h-8 w-16 bg-gray-100 rounded-md animate-pulse" />
              <div className="h-8 w-16 bg-gray-100 rounded-md animate-pulse" />
              <div className="h-8 w-24 bg-gray-100 rounded-md animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10">
        <p className="text-gray-700 font-medium">No cases to display</p>
        <p className="text-gray-500 text-sm mt-1">
          Try refreshing to load the latest data.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {rows.map((r) => {
        const isCompleted = r.status === "Completed";
        const editBtnStateClass = isCompleted
          ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500/30";

        const reportBtnStateClass = isCompleted
          ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500/30"
          : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400";

        return (
          <div
            key={r.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">Case ID</div>
              <div className="text-sm font-semibold text-gray-900">{r.id}</div>
            </div>

            <div className="mt-3 flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                <UserRound className="h-4 w-4 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-gray-900 font-medium" title={r.name}>
                  {r.name}
                </div>
                <a
                  href={`tel:${r.phone}`}
                  className="text-blue-600 text-sm hover:underline"
                  title={r.phone}
                >
                  {r.phone}
                </a>
              </div>
            </div>

            <div className="mt-3 text-gray-700" title={r.address}>
              {r.address}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <Chip tone="slate">{r.type}</Chip>
              <Chip tone={priorityTone(r.priority)}>{r.priority || "—"}</Chip>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Agent:{" "}
                <span className="font-medium text-gray-800">{r.agent}</span>
              </span>
              <Chip tone={statusTone(r.status)}>{r.status}</Chip>
            </div>

            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => onView?.(r)}
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-gray-700 hover:bg-gray-50 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <Eye className="h-4 w-4" />
                View
              </button>
              <button
                type="button"
                onClick={() => onEdit?.(r)}
                disabled={isCompleted}
                aria-disabled={isCompleted}
                className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 transition shadow-sm focus:outline-none focus:ring-2 ${editBtnStateClass}`}
                title={
                  isCompleted ? "Completed case cannot be edited" : "Edit / Assign"
                }
              >
                <PencilLine className="h-4 w-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => isCompleted && onViewReport?.(r)}
                disabled={!isCompleted}
                aria-disabled={!isCompleted}
                className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 transition shadow-sm focus:outline-none focus:ring-2 ${reportBtnStateClass}`}
                title={
                  isCompleted
                    ? "View Report (PDF)"
                    : "Report available only after completion"
                }
              >
                <FileText className="h-4 w-4" />
                View Report
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * CaseBoard: header + filters (search + date range) + table/card + pagination
 */
export default function CaseBoard({
  rows = [],
  onUploadExcel,
  onChangeAgent,
  onChangeStatus,
  onView,
  onRefresh,
  onEdit,
  onViewReport, // NEW
  loading = false,
  listenAutoRefresh = true,
  // NEW: filters
  search = "",
  onSearch,
  startDate,
  endDate,
  onDateChange,
  // NEW: pagination
  pagination,
  page,
  onPageChange,
}) {
  useEffect(() => {
    if (!listenAutoRefresh) return;

    const handler = () => {
      onRefresh?.();
    };

    globalThis.addEventListener?.("cases:updated", handler);
    return () => {
      globalThis.removeEventListener?.("cases:updated", handler);
    };
  }, [listenAutoRefresh, onRefresh]);

  const desktopSkeletonKeysRef = useRef(Array.from({ length: 8 }, makeKey));
  const mobileSkeletonKeysRef = useRef(Array.from({ length: 4 }, makeKey));

  const [localSearch, setLocalSearch] = useState(search || "");
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    setLocalSearch(search || "");
  }, [search]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearch(value);
    if (!onSearch) return;
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = globalThis.setTimeout(() => {
      onSearch(value.trim());
    }, 500);
  };

  const handleStartDateChange = (e) => {
    onDateChange?.("from", e.target.value);
  };

  const handleEndDateChange = (e) => {
    onDateChange?.("to", e.target.value);
  };

  const showSkeleton = loading && rows.length === 0;
  const showEmpty = !loading && rows.length === 0;

  const TODAY_ISO = new Date().toISOString().slice(0, 10);

  const desktopTbodyContent = renderDesktopTbody({
    showSkeleton,
    showEmpty,
    rows,
    desktopSkeletonKeys: desktopSkeletonKeysRef.current,
    onView,
    onEdit,
    onViewReport,
  });

  const mobileContent = renderMobileContent({
    showSkeleton,
    rows,
    mobileSkeletonKeys: mobileSkeletonKeysRef.current,
    onView,
    onEdit,
    onViewReport,
  });

  const currentPage = page || pagination?.current_page || 1;
  const perPage =
    pagination?.items_per_page || (rows.length > 0 ? rows.length : 8);
  const totalItems =
    typeof pagination?.total_items === "number"
      ? pagination.total_items
      : rows.length;
  const totalPages =
    pagination?.total_pages ||
    (perPage > 0 ? Math.max(1, Math.ceil(totalItems / perPage)) : 1);
  const canPrev =
    currentPage > 1 && (pagination?.has_prev_page ?? currentPage > 1);
  const canNext =
    currentPage < totalPages &&
    (pagination?.has_next_page ?? currentPage < totalPages);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endItem =
    totalItems === 0 ? 0 : Math.min(startItem + rows.length - 1, totalItems);

  const showOverlay = loading && rows.length > 0;

  // ✅ ids for label association (Sonar)
  const searchId = "case-search";
  const startDateId = "case-start-date";
  const endDateId = "case-end-date";

  return (
    <SoftCard>
      <div className="p-5 border-b border-gray-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Case Management
            </h2>
            <p className="text-sm text-gray-500">Manage and track all cases</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              title="Refresh"
              aria-label="Refresh"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => onUploadExcel?.()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              title="Upload CSV"
              aria-label="Upload CSV"
            >
              <Upload className="h-4 w-4" />
              Upload Excel
            </button>
          </div>
        </div>
      </div>

      {/* Filters: search + date range */}
      <div className="px-5 pt-3 pb-4 border-b border-gray-100">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="w-full md:max-w-xs">
            <label
              htmlFor={searchId}
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              Search
            </label>
            <input
              id={searchId}
              type="text"
              value={localSearch}
              onChange={handleSearchChange}
              placeholder="Search Applicant Name or Contact…"
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-auto">
            <div>
              <label
                htmlFor={startDateId}
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                Start date
              </label>
              <input
                id={startDateId}
                type="date"
                value={startDate || ""}
                onChange={handleStartDateChange}
                max={TODAY_ISO}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor={endDateId}
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                End date
              </label>
              <input
                id={endDateId}
                type="date"
                value={endDate || ""}
                onChange={handleEndDateChange}
                min={TODAY_ISO}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop/Table view */}
      <div className="hidden sm:block rounded-b-2xl relative">
        <div
          className={`relative overflow-x-auto transition ${
            showOverlay ? "opacity-60" : "opacity-100"
          }`}
        >
          <div className="max-h-[520px] overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10">
                <tr className="text-left">
                  <th className="px-5 py-3 font-medium whitespace-nowrap">
                    Case ID
                  </th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">
                    Applicant
                  </th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">
                    Address
                  </th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">
                    Case Type
                  </th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">
                    Loan
                  </th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">
                    Priority
                  </th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">
                    Assigned Agent
                  </th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-5 py-3 font-medium whitespace-nowrap text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {desktopTbodyContent}
              </tbody>
            </table>
          </div>
        </div>

        {showOverlay && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-lg">
              <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <p className="text-xs font-medium text-gray-600">
                Updating cases…
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile/Card view */}
      <div className="sm:hidden p-4 relative">
        <div
          className={
            showOverlay ? "opacity-60 transition" : "opacity-100 transition"
          }
        >
          {mobileContent}
        </div>
        {showOverlay && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-lg">
              <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <p className="text-xs font-medium text-gray-600">
                Updating cases…
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-gray-200 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-gray-500">
            Showing{" "}
            <span className="font-medium">
              {startItem}-{endItem}
            </span>{" "}
            of <span className="font-medium">{totalItems}</span> cases
          </p>
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() =>
                !loading &&
                canPrev &&
                onPageChange?.(Math.max(1, currentPage - 1))
              }
              disabled={!canPrev || loading}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, idx) => {
              const pageNum = idx + 1;
              const isActive = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => !loading && onPageChange?.(pageNum)}
                  className={`inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-medium ${
                    isActive
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() =>
                !loading &&
                canNext &&
                onPageChange?.(Math.min(totalPages, currentPage + 1))
              }
              disabled={!canNext || loading}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </SoftCard>
  );
}

CaseBoard.propTypes = {
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      phone: PropTypes.string.isRequired,
      address: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      agent: PropTypes.string.isRequired,
      status: PropTypes.string,
      loan_amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      priority: PropTypes.string,
      __raw: PropTypes.object,
    })
  ),
  onUploadExcel: PropTypes.func,
  onChangeAgent: PropTypes.func,
  onChangeStatus: PropTypes.func,
  onView: PropTypes.func,
  onRefresh: PropTypes.func,
  onEdit: PropTypes.func,
  onViewReport: PropTypes.func,
  loading: PropTypes.bool,
  listenAutoRefresh: PropTypes.bool,
  search: PropTypes.string,
  onSearch: PropTypes.func,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  onDateChange: PropTypes.func,
  pagination: PropTypes.shape({
    current_page: PropTypes.number,
    total_pages: PropTypes.number,
    total_items: PropTypes.number,
    items_per_page: PropTypes.number,
    has_next_page: PropTypes.bool,
    has_prev_page: PropTypes.bool,
  }),
  page: PropTypes.number,
  onPageChange: PropTypes.func,
};
