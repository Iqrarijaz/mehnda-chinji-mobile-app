import { useFonts } from 'expo-font';
import { useRef } from 'react';

console.time("fonts");

export const useAppFonts = () => {
  const [fontsLoaded] = useFonts({
    'NotoNastaliqUrdu-Regular': require('../assets/fonts/NotoNastaliqUrdu-Regular.ttf'),
  });

  const timerEnded = useRef(false);

  if (fontsLoaded && !timerEnded.current) {
    console.timeEnd("fonts");
    timerEnded.current = true;
  }

  return fontsLoaded;
};
