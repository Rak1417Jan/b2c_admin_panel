// src/components/Mapper/businesslocation.js

export const businessLocationList = [
  { id: 1, location_name: "Fixed" },
  { id: 2, location_name: "Mobile" },
  // ...add remaining if any
];

const businessLocationMap = businessLocationList.reduce((acc, item) => {
  if (item && item.id != null) {
    acc[String(item.id)] = item.location_name;
  }
  return acc;
}, {});

export function getBusinessLocationName(id) {
  if (id === null || id === undefined) return "NA";
  return businessLocationMap[String(id)] || "NA";
}
