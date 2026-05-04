import { useFonts } from 'expo-font';

export const useAppFonts = () => {
  const [fontsLoaded] = useFonts({
    'NotoNastaliq': require('../assets/fonts/NotoNastaliqUrdu-Regular.ttf'),
    'NotoNastaliqUrdu-Regular': require('../assets/fonts/NotoNastaliqUrdu-Regular.ttf'),
  });
  return fontsLoaded;
};
