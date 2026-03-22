/** ISO yyyy-mm-dd week (Mon–Sun) */
export function weekIsoDates(anchorIso: string): string[] {
  const d = new Date(anchorIso + "T12:00:00");
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    return x.toISOString().slice(0, 10);
  });
}

export function dayColumnIndex(week: string[], eventDay: string): number {
  const i = week.indexOf(eventDay);
  return i >= 0 ? i : 0;
}
