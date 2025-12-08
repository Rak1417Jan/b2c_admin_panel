// src/components/Mapper/gender.js

export const genderList = [
  { id: 1, gender_name: "Male" },
  { id: 2, gender_name: "Female" },
  { id: 3, gender_name: "Transgender" },
  // ...add remaining if any
];

const genderMap = genderList.reduce((acc, item) => {
  if (item && item.id != null) {
    acc[String(item.id)] = item.gender_name;
  }
  return acc;
}, {});

export function getGenderName(id) {
  if (id === null || id === undefined) return "NA";
  return genderMap[String(id)] || "NA";
}
