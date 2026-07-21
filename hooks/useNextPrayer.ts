import { useEffect, useMemo, useState } from 'react';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';

const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

const parseToDate = (hhmm: string, base: Date): Date => {
    const cleaned = (hhmm || '').replace(/[^\d:]/g, '');
    const [h, m] = cleaned.split(':').map((n) => parseInt(n, 10));
    const d = new Date(base);
    d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
    return d;
};

const fmtTime = (d: Date): string => {
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
};

const fmtCountdown = (ms: number): string => {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
};

export interface NextPrayer {
    name: string;
    time: string;          // e.g. "5:12 AM"
    countdownMs: number;
    countdownLabel: string; // e.g. "2h 15m"
}

/**
 * Resolves the next prayer for a city and keeps a live 1s countdown.
 * Wraps around to the next day's Fajr after Isha.
 */
export function useNextPrayer(city: string): { nextPrayer: NextPrayer | null; isPrayerLoading: boolean } {
    const { prayerData, isPrayerLoading } = usePrayerTimes(city);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const nextPrayer = useMemo<NextPrayer | null>(() => {
        const timings = (prayerData as any)?.data?.timings;
        if (!timings) return null;

        const today = new Date(now);
        const list = PRAYER_ORDER.map((name) => ({ name, date: parseToDate(timings[name], today) }));

        let upcoming = list.find((p) => p.date.getTime() > now);
        if (!upcoming) {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            upcoming = { name: 'Fajr', date: parseToDate(timings.Fajr, tomorrow) };
        }

        const countdownMs = upcoming.date.getTime() - now;
        return {
            name: upcoming.name,
            time: fmtTime(upcoming.date),
            countdownMs,
            countdownLabel: fmtCountdown(countdownMs),
        };
    }, [prayerData, now]);

    return { nextPrayer, isPrayerLoading };
}
