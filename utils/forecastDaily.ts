/**
 * Collapses OpenWeather's 3-hourly forecast into per-day summaries.
 *
 * The free 5-day endpoint returns ~40 entries at 3-hour spacing, so a "day" has
 * to be assembled rather than read off. Kept pure and separate from the widget
 * because the grouping has real edge cases -- the first and last days are
 * partial, and the run can straddle a month or year boundary.
 */

export interface ForecastEntry {
    dt: number;
    main?: { temp: number; temp_min?: number; temp_max?: number; humidity?: number };
    weather?: { icon?: string; main?: string }[];
    pop?: number;
}

export interface DailySummary {
    /** Local calendar date, YYYY-MM-DD. */
    date: string;
    /** "Today" for the current local date, else a short weekday. */
    label: string;
    high: number;
    low: number;
    /** Icon from the entry nearest local midday, which best represents the day. */
    icon?: string;
    /** Highest chance of precipitation across the day, as a percentage. */
    pop: number;
    /** False when the day is only partially covered, as the first and last usually are. */
    complete: boolean;
}

/** Local YYYY-MM-DD. Deliberately not toISOString(), which converts to UTC and
 *  would file late-evening entries under the following day. */
function localDateKey(d: Date): string {
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function buildDailyForecast(
    list: ForecastEntry[] | undefined | null,
    days = 5,
    now: Date = new Date(),
): DailySummary[] {
    if (!Array.isArray(list) || list.length === 0) return [];

    const buckets = new Map<string, { entries: ForecastEntry[]; date: Date }>();

    for (const entry of list) {
        if (!entry || typeof entry.dt !== 'number') continue;
        const temp = entry.main?.temp;
        if (typeof temp !== 'number' || !Number.isFinite(temp)) continue;

        const d = new Date(entry.dt * 1000);
        const key = localDateKey(d);
        const bucket = buckets.get(key);
        if (bucket) bucket.entries.push(entry);
        else buckets.set(key, { entries: [entry], date: d });
    }

    const todayKey = localDateKey(now);

    return Array.from(buckets.entries())
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .filter(([key]) => key >= todayKey)
        .slice(0, days)
        .map(([key, { entries, date }]) => {
            const temps = entries
                .map(e => e.main?.temp)
                .filter((t): t is number => typeof t === 'number' && Number.isFinite(t));

            // The entry closest to local noon reads as the day's weather; an
            // overnight icon would misrepresent a sunny afternoon.
            const midday = entries.reduce((best, e) => {
                const hours = (h: ForecastEntry) => Math.abs(new Date(h.dt * 1000).getHours() - 12);
                return best === null || hours(e) < hours(best) ? e : best;
            }, null as ForecastEntry | null);

            const pops = entries
                .map(e => e.pop)
                .filter((p): p is number => typeof p === 'number' && Number.isFinite(p));

            return {
                date: key,
                label: key === todayKey ? 'Today' : WEEKDAYS[date.getDay()],
                high: Math.round(Math.max(...temps)),
                low: Math.round(Math.min(...temps)),
                icon: midday?.weather?.[0]?.icon,
                pop: pops.length ? Math.round(Math.max(...pops) * 100) : 0,
                // 8 entries = a full 24h at 3-hour spacing.
                complete: entries.length >= 8,
            };
        });
}
