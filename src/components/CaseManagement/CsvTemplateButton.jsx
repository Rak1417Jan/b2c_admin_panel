// src/components/CaseManagement/CsvTemplateButton.jsx
import React from "react";
import PropTypes from "prop-types";
import { Download } from "lucide-react";

/** Escape a value for safe CSV output */
function csvEscape(val) {
  if (val === null || val === undefined) return "";
  const s = String(val);
  // If value has quotes, commas, or newlines, wrap in quotes and escape quotes
  if (/[",\n\r]/.test(s)) {
    // Sonar: prefer replaceAll over replace(/"/g, '""')
    return `"${s.replaceAll('"', '""')}"`;
  }
  return s;
}

/** Convert headers + rows to CSV text with BOM for Excel */
function toCsv(headers, rows) {
  const headerLine = headers.map(csvEscape).join(",");
  const lines = rows.map((row) =>
    headers.map((h) => csvEscape(row[h])).join(",")
  );
  // BOM + CRLF endings for better Excel compatibility
  return "\uFEFF" + [headerLine, ...lines].join("\r\n");
}

export default function CsvTemplateButton({
  headers,
  rows,
  filename = "cases_template.csv",
  className = "",
  children,
}) {
  const handleDownload = () => {
    const csv = toCsv(headers, rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className={
        className ||
        "inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50 transition-colors shadow-sm"
      }
      aria-label="Download CSV template"
      title="Download CSV template"
    >
      <Download className="h-4 w-4" />
      {children || "Download template"}
    </button>
  );
}

CsvTemplateButton.propTypes = {
  headers: PropTypes.arrayOf(PropTypes.string).isRequired,
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  filename: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
};
