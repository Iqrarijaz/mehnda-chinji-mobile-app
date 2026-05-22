import { useState, useCallback, RefObject } from 'react';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

export interface ShareBannerOptions {
  width?: number;
  height?: number;
  quality?: number; // 0-1 for jpeg
  format?: 'png' | 'jpg';
}

export const useShareBanner = (viewRef: RefObject<any>) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Media library permission denied');
    }
  };

  const capture = useCallback(
    async (
      options: ShareBannerOptions = { width: 1080, height: 1920, quality: 0.9, format: 'png' }
    ): Promise<string | null> => {
      try {
        setIsGenerating(true);
        setError(null);
        await requestPermission();
        if (!viewRef.current) {
          throw new Error('View ref is not set');
        }
        const uri = await captureRef(viewRef.current, {
          width: options.width,
          height: options.height,
          format: options.format,
          quality: options.quality,
        });
        setBannerUri(uri);
        return uri;
      } catch (e: any) {
        console.error('Error generating banner:', e);
        setError(e.message);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [viewRef]
  );

  const save = useCallback(async () => {
    if (!bannerUri) {
      console.warn('No banner URI available to save');
      return false;
    }
    try {
      await requestPermission();
      const asset = await MediaLibrary.createAssetAsync(bannerUri);

      const album = await MediaLibrary.getAlbumAsync('Rehbar');
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album.id, false);
      } else {
        await MediaLibrary.createAlbumAsync('Rehbar', asset, false);
      }
      return true;
    } catch (e) {
      console.error('Save to gallery failed:', e);
      setError((e as any).message);
      return false;
    }
  }, [bannerUri]);

  const share = useCallback(async () => {
    if (!bannerUri) {
      console.warn('No banner URI available to share');
      return;
    }
    try {
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Sharing not available on this platform');
      }
      await Sharing.shareAsync(bannerUri);
    } catch (e: any) {
      console.error('Share failed:', e);
      setError(e.message);
    }
  }, [bannerUri]);

  return { capture, save, share, isGenerating, bannerUri, error };
};
