// src/components/Mapper/ownership.js

export const ownershipList = [
  { id: 1, ownership_name: "Owned" },
  { id: 2, ownership_name: "Rented" },
  { id: 3, ownership_name: "Leased" },
  // ...add remaining if any
];

const ownershipMap = ownershipList.reduce((acc, item) => {
  if (item && item.id != null) {
    acc[String(item.id)] = item.ownership_name;
  }
  return acc;
}, {});

export function getOwnershipName(id) {
  if (id === null || id === undefined) return "NA";
  return ownershipMap[String(id)] || "NA";
}
