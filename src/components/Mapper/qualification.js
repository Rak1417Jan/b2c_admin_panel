// src/components/Mapper/qualification.js

export const qualificationList = [
  { id: 1, qualification_name: "illiterate" },
  { id: 2, qualification_name: "Upto 10" },
  { id: 3, qualification_name: "11 to 12" },
  { id: 4, qualification_name: "Graduate and Above" },
  
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
