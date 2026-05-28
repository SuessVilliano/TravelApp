export const COVERS = [
  { key: "ocean", label: "Ocean", className: "cover-ocean" },
  { key: "sunset", label: "Sunset", className: "cover-sunset" },
  { key: "tropic", label: "Tropic", className: "cover-tropic" },
  { key: "sand", label: "Sand", className: "cover-sand" },
  { key: "night", label: "Night", className: "cover-night" },
] as const;

export function coverClass(key: string): string {
  return COVERS.find((c) => c.key === key)?.className ?? "cover-ocean";
}
