import { clientStorage } from '@/utils/storage';

/**
 * Reading-progress tracking (completed Surahs + an optional "complete the
 * Quran in X days" goal), backed by MMKV via clientStorage. Kept separate
 * from quranPrefs.ts's per-surah scroll position — this is about marking
 * whole Surahs finished, not where you currently are within one.
 */

const KEY_COMPLETED_SURAHS = 'quran:completedSurahs';
const KEY_GOAL = 'quran:completionGoal';

export const TOTAL_SURAHS = 114;
export const TOTAL_JUZ = 30;
export const TOTAL_AYAHS = 6236;

// ── Completed Surahs ──────────────────────────────────────────────────────

export const getCompletedSurahs = async (): Promise<number[]> => {
    try {
        const raw = await clientStorage.getItem(KEY_COMPLETED_SURAHS);
        const list = raw ? JSON.parse(raw) : [];
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
};

/**
 * Marks a Surah as fully read. Call once the reader detects the user has
 * reached the last ayah. A no-op (returns the unchanged list) if already
 * marked, so it's safe to call every time the last ayah becomes visible.
 */
export const markSurahCompleted = async (surahNumber: number): Promise<number[]> => {
    const list = await getCompletedSurahs();
    if (list.includes(surahNumber)) return list;
    const next = [...list, surahNumber];
    try {
        await clientStorage.setItem(KEY_COMPLETED_SURAHS, JSON.stringify(next));
    } catch { }
    return next;
};

export const resetCompletedSurahs = async (): Promise<void> => {
    try {
        await clientStorage.removeItem(KEY_COMPLETED_SURAHS);
    } catch { }
};

// ── "Complete the Quran in X days" goal ──────────────────────────────────

export interface CompletionGoal {
    targetDays: number;
    startedAt: number; // epoch ms
}

export const getCompletionGoal = async (): Promise<CompletionGoal | null> => {
    try {
        const raw = await clientStorage.getItem(KEY_GOAL);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed.targetDays === 'number' ? parsed : null;
    } catch {
        return null;
    }
};

export const setCompletionGoal = async (targetDays: number): Promise<CompletionGoal> => {
    const goal: CompletionGoal = { targetDays, startedAt: Date.now() };
    try {
        await clientStorage.setItem(KEY_GOAL, JSON.stringify(goal));
    } catch { }
    return goal;
};

export const clearCompletionGoal = async (): Promise<void> => {
    try {
        await clientStorage.removeItem(KEY_GOAL);
    } catch { }
};
