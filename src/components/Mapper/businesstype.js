// src/components/Mapper/gender.js

export const businesstypelist = [
  { id: 1,businesstype_name: "Manufacturing" },
  { id: 2,businesstype_name: "Services" },
  { id: 3,businesstype_name: "Services-Trading" },
  { id: 4,businesstype_name: "Other" },
];

const businesstypemap = businesstypelist.reduce((acc, item) => {
  if (item && item.id != null) {
    acc[String(item.id)] = item.businesstype_name;
  }
  return acc;
}, {});

export function getbusinesstypeName(id) {
  if (id === null || id === undefined) return "NA";
  return businesstypemap[String(id)] || "NA";
}
