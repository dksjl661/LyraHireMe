const FIELD_LABELS: Record<string, string> = {
  text: "Name",
  singleSelect: "Single select",
  longText: "Long text",
  checkbox: "Checkbox",
};

export function getFieldDisplayName(type: string) {
  return FIELD_LABELS[type] ?? "Field";
}
