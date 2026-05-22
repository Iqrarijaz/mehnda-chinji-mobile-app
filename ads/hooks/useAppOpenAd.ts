import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSegments } from 'expo-router';
import AppOpenService from '../appOpen.service';
import AdMobService from '../admob.service';
import { useAdsStore } from '../../store/ads.store';

/**
 * Hook to manage App Open ads lifecycle
 * Shows the ad when the app moves from background to foreground
 */
export const useAppOpenAd = () => {
  const appState = useRef(AppState.currentState);
  const segments = useSegments();

  // Policy: Disable App Open ads on sensitive or high-utility screens
  // 1. (auth) -> Login/Signup
  // 2. onboarding -> First time user experience
  // 3. terms/privacy -> Legal screens
  // 4. weather -> Utility-first screen (Quiet monetization policy)
  const isProtectedScreen = 
    segments[0] === '(auth)' || 
    segments[0] === 'onboarding' ||
    segments[0] === 'terms' ||
    segments[0] === 'privacy' ||
    segments[0] === 'weather';

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // 1. Fetch fresh Remote Config on every app resume (Foreground transition)
        AdMobService.refreshConfig(true).catch(err => {
          console.error('[useAppOpenAd] Failed to refresh Remote Config:', err);
        });

        // Additional safety: Don't show if app is loading something critical
        const { isLoading } = useAdsStore.getState();
        
        if (!isLoading) {
          console.log('[useAppOpenAd] App has come to the foreground, showing ad...');
          AppOpenService.getInstance().show(isProtectedScreen);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isProtectedScreen]);
};
