import { Colors } from '@/constants/colors';
import { SocketProvider } from '@/context/SocketContext';
import * as Notifications from 'expo-notifications';
import { registerNotificationCategories } from '@/utils/notificationCategories';
import Sentry from '@/lib/sentry';
import { useSocketNotifications } from '@/hooks/notificationHooks/useSocketNotifications';
import { usePushNotifications } from '@/hooks/notificationHooks/usePushNotifications';
import { useFcmNotifications } from '@/hooks/notificationHooks/useFcmNotifications';
import { useSystemPushNotifications } from '@/hooks/notificationHooks/useSystemPushNotifications';
import { useAppOpenAd } from '@/ads/hooks/useAppOpenAd';
import { useIsRestoring } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { homePageConfigQueryOptions } from '@/hooks/useHomePageConfig';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { View, Platform, InteractionManager } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { MenuProvider } from 'react-native-popup-menu';
import { useState, useEffect, useRef } from 'react';
import { analyticsService, useScreenTracking, AnalyticsEvents } from '@/analytics';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { WeatherProvider } from '../context/WeatherContext';
import { asyncStoragePersister, queryClient } from '../lib/query-client';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import NetworkMonitor from '@/components/common/NetworkMonitor';
import { usePrayerCalendar } from '@/hooks/usePrayerTimes';
import { usePrayerNotifications } from '@/hooks/notificationHooks/usePrayerNotifications';
import { useWeatherNotifications } from '@/hooks/notificationHooks/useWeatherNotifications';
import { useLocationSync } from '@/hooks/useLocationSync';
import { useWeatherCity } from '@/context/WeatherContext';
import * as Application from 'expo-application';
import { useNotificationStore } from '@/store/notificationStore';
import { getMessaging, subscribeToTopic, unsubscribeFromTopic } from '@react-native-firebase/messaging';
import { useAppUpdate } from '@/hooks/useAppUpdate';

// Register background handler for FCM outside of the component tree
getMessaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background FCM message received!', remoteMessage);
});

import { RatingModal } from '@/components/common/RatingModal';
import { ReviewService } from '@/utils/review';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAppFonts } from '@/hooks/useFonts';
import { initConfig } from '@/lib/remoteConfig';
import { initializeDeviceInfo } from '@/lib/deviceInfo';
import AdManager from '@/ads/adManager.service';
import { ToastConfig } from '@/components/ToastConfig';
import CustomSplashScreen from '@/components/splashScreen';
import { AppUpdateModal } from '@/components/common/AppUpdateModal';


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
// Fade the native splash out instead of cutting, so the handoff to the
// custom splash reads as one continuous screen (fade flag is iOS-only;
// Android uses duration for its hide animation).
SplashScreen.setOptions({ duration: 350, fade: true });

// Font scaling is disabled per-component (ThemedText, FormInput, and every
// other Text/TextInput usage explicitly sets allowFontScaling={false}) so
// large system accessibility font settings can't break layouts. A global
// `Text.defaultProps.allowFontScaling = false` hack used to live here, but
// React 19 removed defaultProps support for function components entirely,
// so it was silently a no-op — RN's Text/TextInput are function components.

function DrawerLayout() {
  const { theme, isDark } = useTheme();
  const { loading } = useAuth();

  // Root-level crossfade so switching themes never shows an instant/jarring
  // cut or a flash of the wrong background behind screen transitions — every
  // screen still swaps its own colors instantly, but the base layer they all
  // sit on eases between light/dark.
  const themeProgress = useSharedValue(isDark ? 1 : 0);

  useEffect(() => {
    themeProgress.value = withTiming(isDark ? 1 : 0, { duration: 280 });
  }, [isDark, themeProgress]);

  const animatedBg = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      themeProgress.value,
      [0, 1],
      [Colors.light.background, Colors.dark.background]
    ),
  }));

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(Colors[theme].background).catch(() => { });
  }, [theme]);

  return (
    <Animated.View style={[{ flex: 1 }, animatedBg]}>
      {loading ? null : (
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            gestureEnabled: true }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(drawer)" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="listing/[category]" />
          <Stack.Screen name="support/index" />
          <Stack.Screen name="support/create-ticket" />
          <Stack.Screen name="support/tickets" />
          <Stack.Screen name="weather" />
          <Stack.Screen name="currency" />
          <Stack.Screen name="metals" />
          <Stack.Screen name="fuel" />
          <Stack.Screen name="dataUsage" />
          <Stack.Screen name="manageNotifications" />
          <Stack.Screen name="terms" />
          <Stack.Screen name="privacy" />
          <Stack.Screen name="communityGuidelines" />
        </Stack>
      )}
    </Animated.View>
  );
}
function AppStatusBar() {
  const { isDark } = useTheme();
  // Light content (white icons) on dark backgrounds, dark content on light —
  // matches Colors[theme].statusBarStyle.
  return <StatusBar style={isDark ? 'light' : 'dark'} animated />;
}
function DeferredHooks() {
  usePushNotifications();
  useFcmNotifications();
  useSocketNotifications();
  useSystemPushNotifications();
  useScreenTracking();
  useAppOpenAd();

  const { selectedCity } = useWeatherCity();
  const { calendarData } = usePrayerCalendar(selectedCity);
  usePrayerNotifications(calendarData, selectedCity);
  useWeatherNotifications(selectedCity);

  const preferences = useNotificationStore(state => state.preferences);
  const weatherEnabled = preferences?.weather;
  const lastWeatherTopicRef = useRef<string | null>(null);

  // Coordinate-based weather sync. When active, the backend pushes weather
  // directly to this device based on live coordinates, so we unsubscribe from
  // the city weather topic to avoid duplicate notifications. When inactive
  // (permission denied / services off), we keep the topic-based flow below.
  const { locationActive } = useLocationSync();

  useEffect(() => {
    const updateWeatherSubscription = async () => {
      try {
        if (!selectedCity) return;
        const cleanCity = selectedCity.split(',')[0].trim().toLowerCase().replace(/\s+/g, '_');
        const newTopic = `weather_${cleanCity}`;

        // Unsubscribe from previous city if it changed
        const messagingInstance = getMessaging();
        if (lastWeatherTopicRef.current && lastWeatherTopicRef.current !== newTopic) {
          await unsubscribeFromTopic(messagingInstance, lastWeatherTopicRef.current);
          if (__DEV__) console.log(`📡 Unsubscribed from old weather topic: ${lastWeatherTopicRef.current}`);
          lastWeatherTopicRef.current = null;
        }

        if (weatherEnabled && !locationActive) {
          await subscribeToTopic(messagingInstance, newTopic);
          lastWeatherTopicRef.current = newTopic;
          if (__DEV__) console.log(`📡 Subscribed to weather topic: ${newTopic}`);
        } else {
          // Disabled, or location-based weather is active → rely on direct push.
          await unsubscribeFromTopic(messagingInstance, newTopic);
          if (lastWeatherTopicRef.current === newTopic) lastWeatherTopicRef.current = null;
          if (__DEV__) console.log(`📡 Unsubscribed from weather topic: ${newTopic}`);
        }
      } catch (err) {
        console.warn('⚠️ Weather topic subscription sync failed:', err);
      }
    };

    updateWeatherSubscription();
  }, [selectedCity, weatherEnabled, locationActive]);

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true }) });

    registerNotificationCategories();
  }, []);

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    analyticsService.trackEvent(AnalyticsEvents.APP_OPEN, {
      version: Application.nativeApplicationVersion,
      build: Application.nativeBuildVersion,
      platform: Platform.OS
    });

  }, [isAuthenticated]);

  return null;
}

function AppInitializer() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
    return () => task.cancel();
  }, []);

  const [showRating, setShowRating] = useState(false);

  useEffect(() => {
    const checkRating = async () => {
      // Treat app open as a positive action
      const shouldShow = await ReviewService.recordPositiveAction();
      if (shouldShow) {
        setShowRating(true);
      }
    };

    // Slight delay so it doesn't interrupt the immediate startup flow
    const timer = setTimeout(() => {
      checkRating();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const { updateInfo, hideUpdateModal } = useAppUpdate();

  return (
    <>
      {isReady && <DeferredHooks />}
      <AppUpdateModal
        visible={updateInfo.visible}
        isMandatory={updateInfo.isMandatory}
        latestVersion={updateInfo.latestVersion}
        updateUrl={updateInfo.updateUrl}
        releaseNotes={updateInfo.releaseNotes}
        onClose={hideUpdateModal}
      />
      <RatingModal
        visible={showRating}
        onClose={() => setShowRating(false)}
      />
    </>
  );
}

/**
 * Holds the splash screen up until the persisted react-query cache has
 * finished rehydrating from AsyncStorage (`useIsRestoring`), not just until
 * fonts/config/minimum-time are ready. Without this, `isAppReady` could flip
 * true and reveal a screen before its cache-backed query has data, showing a
 * skeleton for a moment even though cached data existed on disk — the exact
 * flash "instant cache-first display" is meant to avoid. Must render inside
 * PersistQueryClientProvider (useIsRestoring reads its context), which is
 * why this isn't just inlined in RootLayout.
 */
function AppReadyGate({
  isAppReady,
  splashVisible,
  onSplashFinish,
}: {
  isAppReady: boolean;
  splashVisible: boolean;
  onSplashFinish: () => void;
}) {
  const isRestoringCache = useIsRestoring();
  const isReady = isAppReady && !isRestoringCache;

  return (
    <>
      {isReady && (
        <>
          <AppInitializer />
          <DrawerLayout />
          <NetworkMonitor />
        </>
      )}
      {splashVisible && (
        <CustomSplashScreen isAppReady={isReady} onFinish={onSplashFinish} />
      )}
    </>
  );
}

function RootLayout() {
  const fontsLoaded = useAppFonts();
  const [configLoaded, setConfigLoaded] = useState(false);
  const [minimumTimeElapsed, setMinimumTimeElapsed] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinimumTimeElapsed(true);
    }, 1500);

    initializeDeviceInfo().catch(err => console.error('Failed to initialize device info', err));

    initConfig()
      .finally(() => {
        setConfigLoaded(true);
      })
      .catch((err) => {
        console.error(err);
        setConfigLoaded(true);
      });

    AdManager.init().catch(console.error);

    return () => clearTimeout(timer);
  }, []);

  const isAppReady = fontsLoaded && configLoaded && minimumTimeElapsed;

  return (
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister }}
        // Warm the home layout as the app opens, after restoration so a fresh
        // cached copy short-circuits the request. Home then paints from cache
        // instead of mounting and waiting on the network. Fire-and-forget: a
        // failure here just leaves Home to fetch, and to show what we bundle.
        onSuccess={() => {
          queryClient.prefetchQuery(homePageConfigQueryOptions()).catch(() => { });
        }}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ThemeProvider>
            <BottomSheetModalProvider>
              <AuthProvider>
                <WeatherProvider>
                  <SocketProvider>
                    <MenuProvider>
                      <AppStatusBar />

                      <AppReadyGate
                        isAppReady={isAppReady}
                        splashVisible={splashVisible}
                        onSplashFinish={() => setSplashVisible(false)}
                      />
                    </MenuProvider>
                  </SocketProvider>
                </WeatherProvider>
              </AuthProvider>
              <Toast config={ToastConfig} topOffset={45} />
            </BottomSheetModalProvider>
          </ThemeProvider>
        </GestureHandlerRootView>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  );
}

const SentryRootLayout = Sentry.wrap(RootLayout);

export default function AppLayout() {
  return <SentryRootLayout />;
}
