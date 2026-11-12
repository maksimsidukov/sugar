const paths = {
  drop: '<path d="M12 3.2s5.8 6.6 5.8 11a5.8 5.8 0 1 1-11.6 0c0-4.4 5.8-11 5.8-11Z"/><path d="M9.2 15.1c.4 1.4 1.4 2.1 3 2.2"/>',
  home: '<path d="m4 10 8-6 8 6"/><path d="M6.5 9.5V20h11V9.5M10 20v-6h4v6"/>',
  history: '<path d="M4.5 7.5A8.5 8.5 0 1 1 3.6 14"/><path d="M4 3v5h5M12 7v5l3 2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  shield: '<path d="M12 3 5 6v5c0 4.6 2.8 7.8 7 10 4.2-2.2 7-5.4 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  share: '<path d="M12 15V3m0 0L8 7m4-4 4 4M5 12v8h14v-8"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/>',
  download: '<path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14"/>',
  chart: '<path d="M4 20V5M4 20h16"/><path d="m7 15 4-5 3 2 5-6"/>',
  table: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 4v16"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
} as const;

export type IconName = keyof typeof paths;

export function icon(name: IconName, size = 24): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}
