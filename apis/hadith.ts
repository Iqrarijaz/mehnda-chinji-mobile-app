// https://hadithapi.com – API key is stored here for convenience.
// Replace with an environment variable if you move to a backend proxy.
const API_KEY = '$2y$10$6F8Wp5crpSvjv8rn6JtpYexZkEQUv4WBIqodXei9rCPKcrUp8Am';
const BASE_URL = 'https://hadithapi.com/api/hadiths';

/** Total hadiths available on hadithapi.com (from last_page × per_page) */
export const HADITH_TOTAL = 40465;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface HadithBook {
    id: number;
    bookName: string;
    writerName: string;
    bookSlug: string;
}

export interface HadithChapter {
    id: number;
    chapterNumber: string;
    chapterEnglish: string;
    chapterUrdu: string;
    chapterArabic: string;
    bookSlug: string;
}

export interface Hadith {
    id: number;
    hadithNumber: string;
    englishNarrator: string;
    hadithEnglish: string;
    hadithUrdu: string;
    urduNarrator: string;
    hadithArabic: string;
    headingArabic: string | null;
    headingUrdu: string | null;
    headingEnglish: string | null;
    chapterId: string;
    bookSlug: string;
    volume: string;
    status: string;
    book: HadithBook;
    chapter: HadithChapter;
}

/**
 * Fetch a single hadith by its `id` (1 – 40 465) from hadithapi.com.
 * The API wraps results in `hadiths.data`, so we unwrap and return the first item.
 */
export async function getHadithById(id: number): Promise<Hadith> {
    const url = `${BASE_URL}?apiKey=${API_KEY}&paginate=1&page=${id}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`hadithapi.com responded with HTTP ${response.status}`);
    }

    const json = await response.json();
    const item: Hadith | undefined = json?.hadiths?.data?.[0];

    if (!item) {
        throw new Error('No hadith returned from hadithapi.com');
    }

    return item;
}
