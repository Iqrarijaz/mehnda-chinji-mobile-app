/**
 * Lightweight, conservative Tajweed highlighter.
 *
 * It colours only the rules that can be identified unambiguously from the
 * diacritics present in the Uthmani text (which carries full tashkeel):
 *   - Ghunnah  — ن / م carrying a shadda.
 *   - Qalqalah — ق ط ب ج د carrying an explicit sukun.
 *   - Madd     — any letter carrying the maddah sign.
 *
 * Everything else keeps the default colour. This intentionally avoids the
 * context-dependent noon-sakin rules (ikhfa/idghaam/iqlab) that can't be derived
 * reliably from characters alone, so it never mis-colours a verse.
 *
 * Segments are meant to be rendered as nested <Text> runs inside one parent
 * <Text>, so Arabic contextual shaping/ligatures are preserved across colours.
 */

export interface TajweedSegment {
    text: string;
    color?: string;
}

export const TAJWEED_COLORS = {
    madd: '#E53935',
    ghunnah: '#1B9E4B',
    qalqalah: '#2E7DD1',
};

export const TAJWEED_LEGEND: { label: string; color: string }[] = [
    { label: 'Ghunnah', color: TAJWEED_COLORS.ghunnah },
    { label: 'Qalqalah', color: TAJWEED_COLORS.qalqalah },
    { label: 'Madd', color: TAJWEED_COLORS.madd },
];

const SHADDA = 'ّ';
const SUKUN = 'ْ';
const MADDAH = 'ٓ';

// Combining marks (harakat, tanween, shadda, sukun, maddah, superscript alef and
// Quranic annotation signs) that attach to the preceding base letter.
const isMark = (cp: number): boolean =>
    (cp >= 0x064b && cp <= 0x065f) ||
    cp === 0x0670 ||
    (cp >= 0x06d6 && cp <= 0x06ed);

const QALQALAH_LETTERS = new Set(['ق', 'ط', 'ب', 'ج', 'د']);
const GHUNNAH_LETTERS = new Set(['ن', 'م']);

/**
 * Split Arabic text into coloured segments by Tajweed rule.
 * @param text        Uthmani Arabic (with diacritics).
 * @param defaultColor Colour for non-highlighted text (e.g. the theme text colour).
 */
export function tokenizeTajweed(text: string, defaultColor?: string): TajweedSegment[] {
    if (!text) return [];

    const chars = Array.from(text);
    const clusters: { text: string; color?: string }[] = [];
    let i = 0;

    while (i < chars.length) {
        const base = chars[i];
        let cluster = base;
        i++;
        while (i < chars.length && isMark(chars[i].codePointAt(0) as number)) {
            cluster += chars[i];
            i++;
        }

        let color: string | undefined;
        if (cluster.includes(MADDAH)) {
            color = TAJWEED_COLORS.madd;
        } else if (GHUNNAH_LETTERS.has(base) && cluster.includes(SHADDA)) {
            color = TAJWEED_COLORS.ghunnah;
        } else if (QALQALAH_LETTERS.has(base) && cluster.includes(SUKUN)) {
            color = TAJWEED_COLORS.qalqalah;
        }

        clusters.push({ text: cluster, color });
    }

    // Merge consecutive clusters that share the same effective colour.
    const segments: TajweedSegment[] = [];
    for (const c of clusters) {
        const col = c.color || defaultColor;
        const last = segments[segments.length - 1];
        if (last && last.color === col) {
            last.text += c.text;
        } else {
            segments.push({ text: c.text, color: col });
        }
    }
    return segments;
}
