export function truncate(name: string, max: number): string {
  if (name.length <= max) return name;

  return `${name.slice(0, max - 1)}…`;
}
