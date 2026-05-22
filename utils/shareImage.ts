import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export const shareImage = async (uri: string): Promise<boolean> => {
  try {
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      throw new Error('Sharing not available on this platform');
    }
    await Sharing.shareAsync(uri);
    return true;
  } catch (e) {
    console.error('shareImage error:', e);
    return false;
  }
};
