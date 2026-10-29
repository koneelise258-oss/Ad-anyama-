/* ------------------------------------------------------------------
   Ajout à l’agenda du téléphone (fichier .ics, compatible Android,
   iPhone, Google Agenda et Outlook). Aucun serveur nécessaire.
   ------------------------------------------------------------------ */

const MONTHS: Record<string, number> = {
  janvier: 0, fevrier: 1, mars: 2, avril: 3, mai: 4, juin: 5,
  juillet: 6, aout: 7, septembre: 8, octobre: 9, novembre: 10, decembre: 11
};

const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const pad = (n: number) => String(n).padStart(2, '0');

/** « 18 h 30 », « 18h30 », « 07h30 », « 9h » → [18, 30] */
export const parseHour = (s: string): [number, number] | null => {
  const m = /(\d{1,2})\s*h\s*(\d{2})?/i.exec(s);
  if (!m) return null;
  return [Number(m[1]), m[2] ? Number(m[2]) : 0];
};

/** Date rédigée (« Vendredi 30 Octobre 2026 », « 14 - 16 Novembre 2026 ») ou ISO → Date (jour de début). */
export const parseFrenchDate = (s: string): Date | null => {
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const m = /(\d{1,2})(?:\s*-\s*\d{1,2})?\s+([a-zA-Zéèûôàç]+)\s+(\d{4})/.exec(s);
  if (!m) return null;
  const month = MONTHS[strip(m[2])];
  if (month === undefined) return null;
  return new Date(Number(m[3]), month, Number(m[1]));
};

const stamp = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');

interface IcsEvent {
  uid: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
  weekly?: boolean;
}

const buildIcs = (events: IcsEvent[]) => {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AD Anyama//Site//FR', 'CALSCALE:GREGORIAN'];
  const now = `${stamp(new Date())}Z`;
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}@ad-anyama`,
      `DTSTAMP:${now}`,
      // Abidjan = UTC+0 toute l’année : l’heure locale est écrite directement en UTC (Z).
      `DTSTART:${stamp(e.start)}Z`,
      `DTEND:${stamp(e.end)}Z`,
      `SUMMARY:${esc(e.title)}`
    );
    if (e.weekly) lines.push('RRULE:FREQ=WEEKLY');
    if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
    if (e.description) lines.push(`DESCRIPTION:${esc(e.description.slice(0, 500))}`);
    lines.push('BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', `DESCRIPTION:${esc(e.title)}`, 'END:VALARM', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};

const download = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

const DAY_TO_WEEKDAY: Record<string, number> = {
  dimanche: 0,
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6
};

/** Les rassemblements hebdomadaires officiels, répétés chaque semaine, avec rappel 1 h avant. */
export const downloadWeeklySchedule = (
  schedules: { weekday?: number; day: string; name: string; time: string }[],
  location: string
) => {
  const today = new Date();
  const events: IcsEvent[] = [];
  for (const s of schedules) {
    const weekday = s.weekday !== undefined ? s.weekday : (DAY_TO_WEEKDAY[strip(s.day)] ?? 0);
    const [startStr, endStr] = s.time.split(/[-–]/);
    const st = parseHour(startStr || '');
    const en = parseHour(endStr || '') || (st ? [st[0] + 2, st[1]] as [number, number] : null);
    if (!st || !en) continue;
    const first = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    first.setDate(first.getDate() + ((weekday - first.getDay() + 7) % 7));
    const start = new Date(first); start.setHours(st[0], st[1]);
    const end = new Date(first); end.setHours(en[0], en[1]);
    events.push({ uid: `culte-${weekday}`, title: `${s.name} — AD Anyama`, start, end, location, weekly: true });
  }
  download('cultes-ad-anyama.ics', buildIcs(events));
};

/** Un événement ponctuel. Retourne false si la date ou l’heure ne peut pas être lue. */
export const canAddEventToCalendar = (date: string, time: string) => !!parseFrenchDate(date) && !!parseHour(time);

export const downloadEvent = (ev: { id: string; title: string; date: string; time: string; location?: string; description?: string }) => {
  const day = parseFrenchDate(ev.date);
  const st = parseHour(ev.time);
  if (!day || !st) return false;
  const start = new Date(day); start.setHours(st[0], st[1]);
  const endPart = ev.time.split('-')[1] || '';
  const en = parseHour(endPart);
  const end = new Date(day);
  if (en) {
    end.setHours(en[0], en[1]);
    if (end <= start) end.setDate(end.getDate() + 1); // se termine le lendemain (nuit de prière)
  } else {
    end.setHours(st[0] + 2, st[1]);
  }
  download(`${ev.id}.ics`, buildIcs([{ uid: ev.id, title: ev.title, start, end, location: ev.location, description: ev.description }]));
  return true;
};
