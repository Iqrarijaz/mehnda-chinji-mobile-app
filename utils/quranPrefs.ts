import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persistent Quran preferences & state (reading position, font size, bookmarks,
 * tajweed toggle), backed by AsyncStorage. All helpers are best-effort and never
 * throw — a storage failure simply falls back to defaults.
 */

const KEY_LAST_POS = (surah: number) => `quran:lastPos:${surah}`;
const KEY_FONT_SIZE = 'quran:fontSize';
const KEY_TAJWEED = 'quran:tajweed';
const KEY_BOOKMARKS = 'quran:bookmarks';

// ── Font size ────────────────────────────────────────────────────────────────

export const FONT_SIZE_MIN = 18;
export const FONT_SIZE_MAX = 44;
export const FONT_SIZE_DEFAULT = 24;

export const getFontSize = async (): Promise<number> => {
    try {
        const raw = await AsyncStorage.getItem(KEY_FONT_SIZE);
        const n = raw ? parseInt(raw, 10) : NaN;
        if (Number.isFinite(n)) return Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, n));
    } catch { }
    return FONT_SIZE_DEFAULT;
};

export const setFontSize = async (size: number): Promise<void> => {
    try {
        await AsyncStorage.setItem(KEY_FONT_SIZE, String(Math.round(size)));
    } catch { }
};

// ── Tajweed toggle ───────────────────────────────────────────────────────────

export const getTajweedEnabled = async (): Promise<boolean> => {
    try {
        return (await AsyncStorage.getItem(KEY_TAJWEED)) === '1';
    } catch {
        return false;
    }
};

export const setTajweedEnabled = async (enabled: boolean): Promise<void> => {
    try {
        await AsyncStorage.setItem(KEY_TAJWEED, enabled ? '1' : '0');
    } catch { }
};

// ── Reading progress (last ayah index per surah) ─────────────────────────────

export const getLastPosition = async (surah: number): Promise<number> => {
    try {
        const raw = await AsyncStorage.getItem(KEY_LAST_POS(surah));
        const n = raw ? parseInt(raw, 10) : NaN;
        if (Number.isFinite(n) && n >= 0) return n;
    } catch { }
    return 0;
};

export const setLastPosition = async (surah: number, ayahIndex: number): Promise<void> => {
    try {
        await AsyncStorage.setItem(KEY_LAST_POS(surah), String(ayahIndex));
    } catch { }
};

// ── Bookmarks (specific ayahs across surahs) ─────────────────────────────────

export interface Bookmark {
    surah: number;
    surahName: string;      // Arabic name
    surahEnglishName: string;
    ayahIndex: number;      // 0-based index within the surah
    ayahNumberInSurah: number;
    text: string;           // Arabic snippet
    createdAt: number;
}

const bookmarkId = (surah: number, ayahIndex: number) => `${surah}:${ayahIndex}`;

export const getBookmarks = async (): Promise<Bookmark[]> => {
    try {
        const raw = await AsyncStorage.getItem(KEY_BOOKMARKS);
        const list = raw ? JSON.parse(raw) : [];
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
};

const saveBookmarks = async (list: Bookmark[]): Promise<void> => {
    try {
        await AsyncStorage.setItem(KEY_BOOKMARKS, JSON.stringify(list));
    } catch { }
};

export const isBookmarked = (list: Bookmark[], surah: number, ayahIndex: number): boolean =>
    list.some((b) => bookmarkId(b.surah, b.ayahIndex) === bookmarkId(surah, ayahIndex));

/**
 * Toggle a bookmark. Returns the updated list.
 */
export const toggleBookmark = async (bookmark: Bookmark): Promise<Bookmark[]> => {
    const list = await getBookmarks();
    const id = bookmarkId(bookmark.surah, bookmark.ayahIndex);
    const exists = list.some((b) => bookmarkId(b.surah, b.ayahIndex) === id);
    const next = exists
        ? list.filter((b) => bookmarkId(b.surah, b.ayahIndex) !== id)
        : [{ ...bookmark, createdAt: Date.now() }, ...list];
    await saveBookmarks(next);
    return next;
};

export const removeBookmark = async (surah: number, ayahIndex: number): Promise<Bookmark[]> => {
    const list = await getBookmarks();
    const next = list.filter((b) => bookmarkId(b.surah, b.ayahIndex) !== bookmarkId(surah, ayahIndex));
    await saveBookmarks(next);
    return next;
};
