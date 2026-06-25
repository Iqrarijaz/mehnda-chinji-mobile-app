import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';

export const saveToGallery = async (uri: string): Promise<boolean> => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync(Platform.OS === 'android');
    if (status !== 'granted') {
      throw new Error('Media library permission denied');
    }
    const asset = await MediaLibrary.createAssetAsync(uri);
    // Create or use existing album named 'Rehbar'
    const album = await MediaLibrary.getAlbumAsync('Rehbar');
    if (album) {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album.id, false);
    } else {
      await MediaLibrary.createAlbumAsync('Rehbar', asset, false);
    }
    return true;
  } catch (e) {
    console.error('saveToGallery error:', e);
    return false;
  }
};
