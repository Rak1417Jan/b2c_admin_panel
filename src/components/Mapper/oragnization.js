// src/components/Mapper/gender.js

export const organizationlist = [
  { id: 1, organization_name: "Proprietory" },
  // ...add remaining if any
];

const organizationmap = organizationlist.reduce((acc, item) => {
  if (item && item.id != null) {
    acc[String(item.id)] = item.organization_name;
  }
  return acc;
}, {});

export function getorganizationname(id) {
  if (id === null || id === undefined) return "NA";
  return organizationmap[String(id)] || "NA";
}
