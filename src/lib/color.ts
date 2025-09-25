function normalizeHex(hex: string) {
  const value = hex.startsWith("#") ? hex.slice(1) : hex;
  if (value.length === 3) {
    return `#${value.split("").map((char) => char + char).join("")}`;
  }
  if (value.length === 6) {
    return `#${value}`;
  }
  return "#2563eb";
}

function clampChannel(channel: number) {
  return Math.min(255, Math.max(0, channel));
}

function adjust(hex: string, percentage: number) {
  const normalized = normalizeHex(hex);
  const amount = Math.round((percentage / 100) * 255);
  const r = clampChannel(parseInt(normalized.slice(1, 3), 16) + amount);
  const g = clampChannel(parseInt(normalized.slice(3, 5), 16) + amount);
  const b = clampChannel(parseInt(normalized.slice(5, 7), 16) + amount);
  return `rgba(${r}, ${g}, ${b}, 0.96)`;
}

export function createGradientPair(color: string): [string, string] {
  const first = adjust(color, 16);
  const second = adjust(color, -12);
  return [first, second];
}

export function lighten(color: string, percentage: number) {
  return adjust(color, Math.abs(percentage));
}

export function darken(color: string, percentage: number) {
  return adjust(color, -Math.abs(percentage));
}
