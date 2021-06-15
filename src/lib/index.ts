export function escapeForUrl(s: string): string {
  return s.replace(
    /[-_.!~*'()]/g,
    (char) => `%${char.charCodeAt(0).toString(16)}`
  );
}

export function escapeForHtml(s: string): string {
  return s.replace(
    /[!-/:-@¥[-`{-~]/g,
    (char) => `&#x${char.charCodeAt(0).toString(16)};`
  );
}
