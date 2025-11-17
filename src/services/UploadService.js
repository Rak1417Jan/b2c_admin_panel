// src/services/UploadService.js
import { encryptText } from "../utils/cryptoService";

const BASE_URL = import.meta.env.VITE_API_BASE;

/* ---------- helpers ---------- */
const isBlankish = (v) => v == null || String(v).trim() === "" || /^null$/i.test(String(v)) || /^nan$/i.test(String(v));
const s = (v) => (isBlankish(v) ? "" : String(v).trim());
const toNumOrBlank = (v) => {
  if (isBlankish(v)) return "";
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : "";
};
const enc = (v) => {
  const val = s(v);
  return val ? encryptText(val) : "";
};

/**
 * Build the EXACT payload expected by the API from one flat CSV row.
 * Ensures all keys are present; blanks => "" (no nulls).
 * Drops any unsupported keys like `aadhaar_photo_match`.
 */
function buildPayloadFromRow(row = {}) {
  return {
    // Root-level (with required encryption)
    case_applicant_name: enc(row.case_applicant_name),
    case_applicant_contact: enc(row.case_applicant_contact),
    address: enc(row.address),
    case_type: s(row.case_type),
    priority: s(row.priority),
    loan_amount: toNumOrBlank(row.loan_amount),

    demographic_details: {
      contact_information: {
        // ENCRYPT
        email_id: s(row["demographic_details.contact_information.email_id"]),
        mobile_number: s(row["demographic_details.contact_information.mobile_number"]),
      },
      personal_details: {
        gender: s(row["demographic_details.personal_details.gender"]),
        education: s(row["demographic_details.personal_details.education"]),
        number_of_family_members: toNumOrBlank(
          row["demographic_details.personal_details.number_of_family_members"]
        ),
      },
      address_details: {
        // nulls/empties -> ""
        residence_address_type: s(row["demographic_details.address_details.residence_address_type"]),
        residential_address: s(row["demographic_details.address_details.residential_address"]),
        city: s(row["demographic_details.address_details.city"]),
        state: s(row["demographic_details.address_details.state"]),
        district: s(row["demographic_details.address_details.district"]),
        pincode: s(row["demographic_details.address_details.pincode"]),
      },
      // ❌ aadhaar_photo_match: we intentionally DO NOT include this key
    },

    business_details: {
      enterprise_information: {
        enterprise_name: s(row["business_details.enterprise_information.enterprise_name"]),
        type_of_organization: s(
          row["business_details.enterprise_information.type_of_organization"]
        ),
      },
      business_location_details: {
        business_address_type: s(
          row["business_details.business_location_details.business_address_type"]
        ),
        business_location: s(row["business_details.business_location_details.business_location"]),
      },
      business_address: {
        address: s(row["business_details.business_address.address"]),
        city: s(row["business_details.business_address.city"]),
        district: s(row["business_details.business_address.district"]),
        state: s(row["business_details.business_address.state"]),
        pincode: s(row["business_details.business_address.pincode"]),
        landmark: s(row["business_details.business_address.landmark"]),
      },
      business_activity: {
        business_activity: s(row["business_details.business_activity.business_activity"]),
        activity_type: s(row["business_details.business_activity.activity_type"]),
      },
      business_info: {
        employee_count: toNumOrBlank(row["business_details.business_info.employee_count"]),
        years_of_running_business: toNumOrBlank(
          row["business_details.business_info.years_of_running_business"]
        ),
        additional_business: s(row["business_details.business_info.additional_business"]),
      },
    },

    financial_details: {
      business_financial_information: {
        monthly_income_from_business: toNumOrBlank(
          row["financial_details.business_financial_information.monthly_income_from_business"]
        ),
        monthly_expense_of_business: toNumOrBlank(
          row["financial_details.business_financial_information.monthly_expense_of_business"]
        ),
      },
      loans_and_emis: {
        current_loans_emis: s(row["financial_details.loans_and_emis.current_loans_emis"]),
      },
      family_financial_information: {
        monthly_family_income: toNumOrBlank(
          row["financial_details.family_financial_information.monthly_family_income"]
        ),
        number_of_working_members: toNumOrBlank(
          row["financial_details.family_financial_information.number_of_working_members"]
        ),
        monthly_family_expense: toNumOrBlank(
          row["financial_details.family_financial_information.monthly_family_expense"]
        ),
      },
    },
  };
}

/**
 * Upload a single case (expects a flat CSV row with the full header set).
 */
export async function uploadSingleCase(row) {
  try {
    const token = (() => {
      try {
        return globalThis.localStorage?.getItem("authToken") || "";
      } catch {
        return "";
      }
    })();
    if (!token) throw new Error("Missing authentication token.");

    const payload = buildPayloadFromRow(row);

    const response = await fetch(`${BASE_URL}/cases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`Upload failed: ${response.status} ${response.statusText} ${errText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

/**
 * Upload multiple cases from parsed CSV rows.
 * Returns: [{ index, status: "success"|"error", res?, message? }]
 */
export async function uploadCasesFromCSV(rows = []) {
  const results = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i] || {};
    try {
      // Defensive: ignore any accidental aadhaar_photo_match coming from CSV
      if ("aadhaar_photo_match" in row) delete row.aadhaar_photo_match;

      const res = await uploadSingleCase(row);
      results.push({ index: i, status: "success", res });
    } catch (e) {
      results.push({ index: i, status: "error", message: e?.message || "Unknown error" });
    }
  }

  // Notify listeners (CaseBoard auto-refresh hook)
  try {
    globalThis.dispatchEvent?.(new Event("cases:updated"));
  } catch {}

  return results;
}
