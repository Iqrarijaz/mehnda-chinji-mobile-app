import * as FileSystem from 'expo-file-system/src/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_DIR = `${FileSystem.documentDirectory}quran_audio/`;
const MANIFEST_KEY = 'quran_audio_download_manifest';
const CACHE_EXPIRATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days (approx. 1 month)

interface CacheManifest {
    [surahNumber: string]: number; // surahNumber -> timestamp
}

// Ensure cache directory exists
const ensureCacheDir = async () => {
    try {
        const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
        }
    } catch (e) {
        console.error('Error ensuring cache directory exists:', e);
    }
};

// Get local file URI for an ayah
export const getLocalAyahUri = (surahNumber: number, ayahIndex: number): string => {
    return `${CACHE_DIR}surah_${surahNumber}_ayah_${ayahIndex}.mp3`;
};

// Check if a specific ayah is cached
export const isAyahCached = async (surahNumber: number, ayahIndex: number): Promise<boolean> => {
    try {
        const fileUri = getLocalAyahUri(surahNumber, ayahIndex);
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        return fileInfo.exists;
    } catch {
        return false;
    }
};

// Get the playable URI for an ayah (local if cached, remote otherwise)
export const getPlayableAyahUri = async (surahNumber: number, ayahIndex: number, remoteUrl: string): Promise<string> => {
    if (!remoteUrl) return '';
    const cached = await isAyahCached(surahNumber, ayahIndex);
    if (cached) {
        return getLocalAyahUri(surahNumber, ayahIndex);
    }
    return remoteUrl;
};

// Start background download for a Surah
export const startSurahDownload = async (
    surahNumber: number,
    ayahs: any[]
): Promise<void> => {
    try {
        await ensureCacheDir();

        // Run downloads sequentially in the background so it doesn't block the UI
        (async () => {
            console.log(`Starting background download for Surah ${surahNumber}...`);
            let downloadedCount = 0;

            for (let i = 0; i < ayahs.length; i++) {
                const ayah = ayahs[i];
                const audioUrl = ayah?.audio;
                if (!audioUrl) continue;

                const fileUri = getLocalAyahUri(surahNumber, i);
                try {
                    const fileInfo = await FileSystem.getInfoAsync(fileUri);
                    if (!fileInfo.exists) {
                        await FileSystem.downloadAsync(audioUrl, fileUri);
                        downloadedCount++;
                    }
                } catch (downloadError) {
                    console.error(`Error downloading Surah ${surahNumber} Ayah ${i}:`, downloadError);
                    // Continue downloading remaining ayahs even if one fails
                }
            }

            if (downloadedCount > 0) {
                console.log(`Finished background download for Surah ${surahNumber}. Downloaded ${downloadedCount} new verses.`);
            }

            // Save manifest entry with current timestamp
            const manifestStr = await AsyncStorage.getItem(MANIFEST_KEY);
            const manifest: CacheManifest = manifestStr ? JSON.parse(manifestStr) : {};
            manifest[surahNumber.toString()] = Date.now();
            await AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify(manifest));
        })();
    } catch (e) {
        console.error('Error initializing Surah download:', e);
    }
};

// Read the set of Surah numbers that have a completed download recorded in
// the manifest — used to auto-detect already-downloaded Surahs on the list.
export const getDownloadedSurahSet = async (): Promise<Set<number>> => {
    try {
        const manifestStr = await AsyncStorage.getItem(MANIFEST_KEY);
        if (!manifestStr) return new Set();
        const manifest: CacheManifest = JSON.parse(manifestStr);
        return new Set(Object.keys(manifest).map((k) => parseInt(k, 10)));
    } catch {
        return new Set();
    }
};

export const isSurahDownloaded = async (surahNumber: number): Promise<boolean> => {
    const set = await getDownloadedSurahSet();
    return set.has(surahNumber);
};

// Awaitable Surah download with progress reporting. Skips ayahs that are
// already cached, then records the manifest entry on completion so the
// Surah is detected as downloaded for offline playback.
export const downloadSurahAudio = async (
    surahNumber: number,
    ayahs: any[],
    onProgress?: (completed: number, total: number) => void
): Promise<void> => {
    await ensureCacheDir();
    const total = ayahs.length;

    for (let i = 0; i < total; i++) {
        const audioUrl = ayahs[i]?.audio;
        if (audioUrl) {
            const fileUri = getLocalAyahUri(surahNumber, i);
            try {
                const fileInfo = await FileSystem.getInfoAsync(fileUri);
                if (!fileInfo.exists) {
                    await FileSystem.downloadAsync(audioUrl, fileUri);
                }
            } catch (e) {
                console.error(`Error downloading Surah ${surahNumber} Ayah ${i}:`, e);
            }
        }
        onProgress?.(i + 1, total);
    }

    const manifestStr = await AsyncStorage.getItem(MANIFEST_KEY);
    const manifest: CacheManifest = manifestStr ? JSON.parse(manifestStr) : {};
    manifest[surahNumber.toString()] = Date.now();
    await AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify(manifest));
};

// Cleanup files older than 1 month
export const cleanupExpiredCache = async (): Promise<void> => {
    try {
        const manifestStr = await AsyncStorage.getItem(MANIFEST_KEY);
        if (!manifestStr) return;

        const manifest: CacheManifest = JSON.parse(manifestStr);
        const now = Date.now();
        const updatedManifest: CacheManifest = { ...manifest };
        let cleanedAny = false;

        for (const surahStr in manifest) {
            const timestamp = manifest[surahStr];
            if (now - timestamp > CACHE_EXPIRATION_MS) {
                console.log(`Cache expired for Surah ${surahStr}. Cleaning up...`);
                const surahNumber = parseInt(surahStr, 10);
                
                // Read cache directory files
                const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
                if (dirInfo.exists) {
                    const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
                    const prefix = `surah_${surahNumber}_`;
                    
                    for (const file of files) {
                        if (file.startsWith(prefix)) {
                            await FileSystem.deleteAsync(`${CACHE_DIR}${file}`, { idempotent: true });
                        }
                    }
                }

                delete updatedManifest[surahStr];
                cleanedAny = true;
            }
        }

        if (cleanedAny) {
            await AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify(updatedManifest));
        }
    } catch (e) {
        console.error('Error cleaning up expired cache:', e);
    }
};
