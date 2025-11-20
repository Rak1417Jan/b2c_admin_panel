// src/components/CaseManagement/CaseFilters.jsx
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Search, Calendar } from "lucide-react";

export default function CaseFilters({
  search = "",
  createdFrom = "",
  createdTo = "",
  onSearch,
  onDateRangeChange,
}) {
  const [localSearch, setLocalSearch] = useState(search || "");

  useEffect(() => {
    setLocalSearch(search || "");
  }, [search]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.(localSearch.trim());
  };

  const handleFromChange = (e) => {
    const from = e.target.value;
    onDateRangeChange?.({ from, to: createdTo || "" });
  };

  const handleToChange = (e) => {
    const to = e.target.value;
    onDateRangeChange?.({ from: createdFrom || "", to });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
    >
      {/* Search */}
      <div className="w-full lg:max-w-md">
        <label className="block text-xs font-semibold text-gray-500 mb-1">
          Search (Applicant / Contact)
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </span>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Type name or mobile number"
            className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 shadow-sm"
          />
        </div>
      </div>

      {/* Date range + button */}
      <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
        <div className="w-full sm:w-40">
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Start Date
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-gray-400" />
            </span>
            <input
              type="date"
              value={createdFrom || ""}
              onChange={handleFromChange}
              className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 shadow-sm"
            />
          </div>
        </div>

        <div className="w-full sm:w-40">
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            End Date
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-gray-400" />
            </span>
            <input
              type="date"
              value={createdTo || ""}
              onChange={handleToChange}
              className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 shadow-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg border border-blue-500 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 hover:border-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-500/40 w-full sm:w-auto"
        >
          <Search className="h-4 w-4 mr-1.5" />
          Search
        </button>
      </div>
    </form>
  );
}

CaseFilters.propTypes = {
  search: PropTypes.string,
  createdFrom: PropTypes.string,
  createdTo: PropTypes.string,
  onSearch: PropTypes.func,
  onDateRangeChange: PropTypes.func,
};
