// src/components/AgentMangament/AgentProfiles.jsx
import React, { useMemo, useState, useEffect } from "react";
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
  Search as SearchIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

/* ---------- Skeleton helpers ---------- */

// Use stable keys instead of array index for skeleton rows/cards
const SKELETON_ROW_KEYS = ["row-a", "row-b", "row-c", "row-d", "row-e", "row-f"];
const SKELETON_CARD_KEYS = ["card-a", "card-b", "card-c", "card-d"];

function SkeletonBar({ width = "w-24" }) {
  return (
    <div
      className={`h-3.5 rounded-full bg-gray-200/80 animate-pulse ${width}`}
    />
  );
}

SkeletonBar.propTypes = {
  width: PropTypes.string,
};

function SkeletonPill() {
  return (
    <div className="inline-flex items-center rounded-full px-3 py-1.5 border border-gray-200 bg-gray-100 animate-pulse">
      <div className="h-3.5 w-20 rounded-full bg-gray-200" />
    </div>
  );
}

function SkeletonTableRow() {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-4 px-4">
        <SkeletonBar width="w-20" />
      </td>
      <td className="py-4 px-4">
        <SkeletonBar width="w-40" />
      </td>
      <td className="py-4 px-4">
        <SkeletonBar width="w-32" />
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded-full bg-gray-200 animate-pulse" />
          <SkeletonBar width="w-48" />
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-gray-200 animate-pulse" />
          <SkeletonBar width="w-28" />
        </div>
      </td>
      <td className="py-4 px-4">
        <SkeletonPill />
      </td>
      <td className="py-4 px-4">
        <SkeletonPill />
      </td>
      <td className="py-4 px-4">
        <SkeletonPill />
      </td>
      <td className="py-4 px-4">
        <SkeletonPill />
      </td>
      <td className="py-4 px-4 text-right">
        <div className="inline-flex items-center rounded-md border border-gray-200 bg-gray-100 px-6 py-2 animate-pulse">
          <div className="h-3.5 w-16 rounded-full bg-gray-200" />
        </div>
      </td>
    </tr>
  );
}

function SkeletonMobileCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-2.5 w-16 rounded-full bg-gray-200" />
        <div className="h-3 w-28 rounded-full bg-gray-200" />
      </div>

      <div className="mt-3 space-y-2">
        <div className="h-3.5 w-32 rounded-full bg-gray-200" />
        <div className="h-2.5 w-40 rounded-full bg-gray-200" />
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded-full bg-gray-200" />
          <div className="h-2.5 w-40 rounded-full bg-gray-200" />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="h-4 w-4 rounded-full bg-gray-200" />
        <div className="h-2.5 w-32 rounded-full bg-gray-200" />
      </div>

      <div className="mt-3">
        <div className="inline-flex rounded-full border border-gray-200 bg-gray-100 px-6 py-2">
          <div className="h-2.5 w-16 rounded-full bg-gray-200" />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="h-8 rounded-lg bg-gray-100" />
        <div className="h-8 rounded-lg bg-gray-100" />
        <div className="h-8 rounded-lg bg-gray-100" />
      </div>

      <div className="mt-3 flex justify-end">
        <div className="inline-flex items-center rounded-md border border-gray-200 bg-gray-100 px-6 py-2">
          <div className="h-2.5 w-14 rounded-full bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

/* ---------- Pagination helper ---------- */

function buildPageList(current, total) {
  if (!total || total <= 1) return [1];
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("left-ellipsis");
  for (let p = start; p <= end; p += 1) {
    pages.push(p);
  }
  if (end < total - 1) pages.push("right-ellipsis");
  pages.push(total);

  return pages;
}

export default function AgentProfiles({
  title = "Agent Management",
  subtitle = "Manage and monitor all agents",
  agents = [],
  onAddNew,
  onEdit,
  onRefresh,
  loading = false,
  // New props
  search = "",
  onSearch,
  pagination,
  page,
  onPageChange,
}) {
  const list = useMemo(() => agents, [agents]);
  const isEmpty = !loading && list.length === 0;

  const currentPage = pagination?.current_page || page || 1;
  const totalPages = pagination?.total_pages || 1;
  const totalItems = pagination?.total_items ?? list.length;
  const itemsPerPage = pagination?.items_per_page || 8;

  // Local search input state (keeps UX smooth)
  const [searchInput, setSearchInput] = useState(search || "");

  useEffect(() => {
    setSearchInput(search || "");
  }, [search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch?.(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    onSearch?.("");
  };

  const pageList = buildPageList(currentPage, totalPages);

  const startIndex =
    totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex =
    totalItems === 0
      ? 0
      : Math.min(currentPage * itemsPerPage, totalItems);

  // ---------- Desktop/Table content (beautiful loading table) ----------
  let tableBodyContent;
  if (loading) {
    // Skeleton rows while API is loading – use stable keys
    tableBodyContent = SKELETON_ROW_KEYS.map((key) => (
      <SkeletonTableRow key={key} />
    ));
  } else if (isEmpty) {
    tableBodyContent = (
      <tr>
        <td colSpan={10} className="py-10 px-4">
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-gray-700 font-medium">No agents to display</p>
            <p className="text-gray-500 text-sm mt-1">
              Add a new agent to get started.
            </p>
          </div>
        </td>
      </tr>
    );
  } else {
    tableBodyContent = list.map((a) => (
      <tr
        key={a.id}
        className="hover:bg-blue-50/60 transition-colors duration-150 odd:bg-white even:bg-gray-50/60"
      >
        {/* Agent ID: full, no wrap */}
        <td
          className="py-4 px-4 font-semibold text-gray-800 whitespace-nowrap"
          title={a.id}
        >
          {a.id}
        </td>

        {/* Name: full, no wrap */}
        <td
          className="py-4 px-4 whitespace-nowrap text-gray-800"
          title={a.name}
        >
          {a.name}
        </td>

        {/* Agency: full, no wrap */}
        <td
          className="py-4 px-4 whitespace-nowrap text-gray-700"
          title={a.agency || "-"}
        >
          {a.agency || "-"}
        </td>

        {/* Email: full, no wrap */}
        <td className="py-4 px-4">
          <div className="flex items-center gap-2 text-[13px] text-blue-600 whitespace-nowrap">
            <Mail className="h-3.5 w-3.5 min-w-3.5" />
            <a
              href={`mailto:${a.email}`}
              className="hover:underline"
              title={a.email}
            >
              {a.email}
            </a>
          </div>
        </td>

        {/* Phone: full, no wrap */}
        <td
          className="py-4 px-4 whitespace-nowrap text-gray-600"
          title={a.phone}
        >
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 min-w-4" />
            <span>{a.phone}</span>
          </div>
        </td>

        <td className="py-4 px-4">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium border whitespace-nowrap ${
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

        <td className="py-4 px-4 text-right whitespace-nowrap">
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
    ));
  }

  // ---------- Mobile content (beautiful loading cards) ----------
  let mobileContent;
  if (loading) {
    mobileContent = (
      <div className="grid grid-cols-1 gap-4">
        {SKELETON_CARD_KEYS.map((key) => (
          <SkeletonMobileCard key={key} />
        ))}
      </div>
    );
  } else if (isEmpty) {
    mobileContent = (
      <div className="flex flex-col items-center justify-center text-center py-10 rounded-xl border border-gray-200 bg-white">
        <p className="text-gray-700 font-medium">No agents to display</p>
        <p className="text-gray-500 text-sm mt-1">
          Add a new agent to get started.
        </p>
      </div>
    );
  } else {
    mobileContent = (
      <div className="grid grid-cols-1 gap-4">
        {list.map((a) => (
          <div
            key={a.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">Agent ID</div>
              <div
                className="text-sm font-semibold text-gray-800 break-all"
                title={a.id}
              >
                {a.id}
              </div>
            </div>

            <div className="mt-3">
              <div className="text-gray-900 font-medium truncate" title={a.name}>
                {a.name}
              </div>

              {/* Agency on mobile */}
              <div
                className="mt-0.5 text-xs text-gray-600 truncate"
                title={a.agency || "-"}
              >
                Agency:{" "}
                <span className="font-medium text-gray-700">
                  {a.agency || "-"}
                </span>
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

            <div className="mt-3 flex items-center gap-2 text-gray-600">
              <Phone className="h-4 w-4" />
              <span className="break-all truncate" title={a.phone}>
                {a.phone}
              </span>
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
    );
  }

  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 via-white to-gray-50 shadow-sm">
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

      {/* Chip + Search bar */}
      <div className="px-5 pt-4 pb-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-6 py-2 text-sm text-gray-700 shadow-sm">
            Agent Profiles
          </div>
        </div>

        {/* Search bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="w-full md:w-auto"
          autoComplete="off"
        >
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-72">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                <SearchIcon className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, email, contact or agency…"
                className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-3 flex items-center text-xs text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <SearchIcon className="h-3.5 w-3.5" />
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Desktop / Tablet (Table) */}
      <div className="hidden md:block px-5 pb-5">
        <div className="relative overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="min-w-full text-left border-separate border-spacing-0">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100/80 text-xs text-gray-600 sticky top-0 z-10">
                <tr className="[&>th]:py-3 [&>th]:px-4 [&>th]:whitespace-nowrap">
                  <th className="w-28 font-semibold uppercase tracking-wide">
                    Agent ID
                  </th>
                  <th className="min-w-[220px] font-semibold uppercase tracking-wide">
                    Name
                  </th>
                  <th className="min-w-[180px] font-semibold uppercase tracking-wide">
                    Agency
                  </th>
                  <th className="min-w-[260px] font-semibold uppercase tracking-wide">
                    Email
                  </th>
                  <th className="min-w-[200px] font-semibold uppercase tracking-wide">
                    Contact
                  </th>
                  <th className="w-32 font-semibold uppercase tracking-wide">
                    Status
                  </th>
                  <th className="w-40 font-semibold uppercase tracking-wide">
                    Completed
                  </th>
                  <th className="w-32 font-semibold uppercase tracking-wide">
                    Pending
                  </th>
                  <th className="w-40 font-semibold uppercase tracking-wide">
                    Total Cases
                  </th>
                  <th className="w-32 text-right pr-4 font-semibold uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="text-sm">{tableBodyContent}</tbody>
            </table>
          </div>
        </div>

        {/* Pagination (desktop) */}
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm text-gray-600">
          <div>
            {totalItems > 0 ? (
              <span>
                Showing{" "}
                <span className="font-semibold">
                  {startIndex}–{endIndex}
                </span>{" "}
                of <span className="font-semibold">{fmt(totalItems)}</span> agents
              </span>
            ) : (
              <span>No agents found</span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() =>
                onPageChange?.(currentPage > 1 ? currentPage - 1 : 1)
              }
              disabled={currentPage <= 1 || pagination?.has_prev_page === false}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>

            {pageList.map((p, idx) =>
              typeof p === "string" ? (
                <span
                  key={`${p}-${idx}`}
                  className="px-2 text-xs text-gray-400 select-none"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange?.(p)}
                  className={`inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-medium ${
                    p === currentPage
                      ? "bg-blue-600 text-white shadow"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              type="button"
              onClick={() =>
                onPageChange?.(
                  currentPage < totalPages ? currentPage + 1 : totalPages
                )
              }
              disabled={
                currentPage >= totalPages ||
                pagination?.has_next_page === false
              }
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile (Cards + pagination) */}
      <div className="md:hidden px-5 pb-5">
        {mobileContent}

        {/* Pagination (mobile) */}
        <div className="mt-4 flex flex-col gap-2 text-xs text-gray-600">
          <div className="text-center">
            {totalItems > 0 ? (
              <span>
                Showing{" "}
                <span className="font-semibold">
                  {startIndex}–{endIndex}
                </span>{" "}
                of <span className="font-semibold">{fmt(totalItems)}</span> agents
              </span>
            ) : (
              <span>No agents found</span>
            )}
          </div>

          <div className="flex items-center justify-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={() =>
                onPageChange?.(currentPage > 1 ? currentPage - 1 : 1)
              }
              disabled={currentPage <= 1 || pagination?.has_prev_page === false}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>

            {pageList.map((p, idx) =>
              typeof p === "string" ? (
                <span
                  key={`${p}-${idx}`}
                  className="px-1 text-xs text-gray-400 select-none"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange?.(p)}
                  className={`inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-medium ${
                    p === currentPage
                      ? "bg-blue-600 text-white shadow"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              type="button"
              onClick={() =>
                onPageChange?.(
                  currentPage < totalPages ? currentPage + 1 : totalPages
                )
              }
              disabled={
                currentPage >= totalPages ||
                pagination?.has_next_page === false
              }
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
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
      agency: PropTypes.string,
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
  loading: PropTypes.bool,
  search: PropTypes.string,
  onSearch: PropTypes.func,
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
