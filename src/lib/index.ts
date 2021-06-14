export function escape(s: string): string {
  return s.replace(
    /[!*'()] /g,
    (char) => `%${char.charCodeAt(0).toString(16)}`
  );
}
