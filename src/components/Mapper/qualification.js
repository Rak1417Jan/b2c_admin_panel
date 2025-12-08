// src/components/Mapper/qualification.js

export const qualificationList = [
  { id: 1, qualification_name: "illiterate" },
  { id: 2, qualification_name: "Upto 10" },
  // ...add remaining qualifications here
];

const qualificationMap = qualificationList.reduce((acc, item) => {
  if (item && item.id != null) {
    acc[String(item.id)] = item.qualification_name;
  }
  return acc;
}, {});

export function getQualificationName(id) {
  if (id === null || id === undefined) return "NA";
  return qualificationMap[String(id)] || "NA";
}
