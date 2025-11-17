import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { X, Loader2, Download } from "lucide-react";
import { generateCaseReport } from "../../services/CaseService";

export default function CaseReportModal({ open, onClose, caseId }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [filename, setFilename] = useState("");

  useEffect(() => {
    let revokeTimer;
    async function loadReport() {
      if (!open || !caseId) return;
      setLoading(true);
      setErr("");
      setPdfUrl("");
      setFilename("");

      try {
        const { blob, contentType, filename: suggested } = await generateCaseReport(caseId);
        // Ensure it's a PDF
        if (!String(contentType).toLowerCase().includes("pdf")) {
          throw new Error("Unexpected content type for report.");
        }
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setFilename(suggested || `Case_${caseId}_Report.pdf`);

        // best-effort cleanup (in case modal stays long)
        revokeTimer = setTimeout(() => {
          // no-op; we revoke on close/unmount below too
        }, 600000);
      } catch (e) {
        setErr(e?.message || "Failed to load the report.");
      } finally {
        setLoading(false);
      }
    }
    loadReport();

    return () => {
      if (revokeTimer) clearTimeout(revokeTimer);
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, caseId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Case Report Preview</h3>
            {caseId && <p className="text-sm text-gray-500 mt-0.5">Case ID: {caseId}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Close"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {loading && (
            <div className="flex items-center justify-center h-[70vh]">
              <div className="inline-flex items-center gap-2 text-gray-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Generating report…</span>
              </div>
            </div>
          )}

          {!loading && err && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {err}
            </div>
          )}

          {!loading && !err && pdfUrl && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <a
                  href={pdfUrl}
                  download={filename || "report.pdf"}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                  title="Download PDF"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
              </div>
              <div className="h-[75vh] rounded-lg border border-gray-200 overflow-hidden">
                {/* Use <iframe> for broad PDF viewer compatibility */}
                <iframe
                  title="Case Report"
                  src={pdfUrl}
                  className="w-full h-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

CaseReportModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  caseId: PropTypes.string,
};
