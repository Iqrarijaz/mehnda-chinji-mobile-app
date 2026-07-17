import { Colors } from '@/constants/colors';
import { SocketProvider } from '@/context/SocketContext';
import * as Notifications from 'expo-notifications';
import Sentry from '@/lib/sentry';
import { useSocketNotifications } from '@/hooks/notificationHooks/useSocketNotifications';
import { usePushNotifications } from '@/hooks/notificationHooks/usePushNotifications';
import { useFcmNotifications } from '@/hooks/notificationHooks/useFcmNotifications';
import { useSystemPushNotifications } from '@/hooks/notificationHooks/useSystemPushNotifications';
import { useAppOpenAd } from '@/ads/hooks/useAppOpenAd';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import { View, Platform, InteractionManager } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
import { useWeatherCity } from '@/context/WeatherContext';
import * as Application from 'expo-application';
import { useNotificationStore } from '@/store/notificationStore';
import { getMessaging, subscribeToTopic, unsubscribeFromTopic } from '@react-native-firebase/messaging';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { RatingModal } from '@/components/common/RatingModal';
import { ReviewService } from '@/utils/review';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAppFonts } from '@/hooks/useFonts';
import { initConfig } from '@/lib/remoteConfig';
import { initializeDeviceInfo } from '@/lib/deviceInfo';
import AdManager from '@/ads/adManager.service';
import { Text, TextInput } from 'react-native';
import { ToastConfig } from '@/components/ToastConfig';
import CustomSplashScreen from '@/components/splashScreen';
import { AppUpdateModal } from '@/components/common/AppUpdateModal';


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Disable global font scaling to prevent UI breakage on devices with large accessibility fonts


if (!(Text as any).defaultProps) {
  (Text as any).defaultProps = {};
}
(Text as any).defaultProps.allowFontScaling = false;

if (!(TextInput as any).defaultProps) {
  (TextInput as any).defaultProps = {};
}
(TextInput as any).defaultProps.allowFontScaling = false;

function DrawerLayout() {
  const { theme } = useTheme();
  const { loading } = useAuth();



  return (
    <View style={{ flex: 1, backgroundColor: Colors[theme].background }}>
      {loading ? null : (
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 260,
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
            // Match scene background to the app background so transitions
            // never flash white between screens.
            contentStyle: { backgroundColor: Colors[theme].background },
          }}
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
          <Stack.Screen name="dataUsage" />
          <Stack.Screen name="manageNotifications" />
          <Stack.Screen name="terms" />
          <Stack.Screen name="privacy" />
          <Stack.Screen name="communityGuidelines" />
        </Stack>
      )}
    </View>
  );
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

        if (weatherEnabled) {
          await subscribeToTopic(messagingInstance, newTopic);
          lastWeatherTopicRef.current = newTopic;
          if (__DEV__) console.log(`📡 Subscribed to weather topic: ${newTopic}`);
        } else {
          // If disabled, ensure we are unsubscribed from the topic
          await unsubscribeFromTopic(messagingInstance, newTopic);
          if (__DEV__) console.log(`📡 Unsubscribed from weather topic: ${newTopic}`);
        }
      } catch (err) {
        console.warn('⚠️ Weather topic subscription sync failed:', err);
      }
    };

    updateWeatherSubscription();
  }, [selectedCity, weatherEnabled]);

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
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

function RootLayout() {
  const fontsLoaded = useAppFonts();
  const [configLoaded, setConfigLoaded] = useState(false);
  const [minimumTimeElapsed, setMinimumTimeElapsed] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

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


  useEffect(() => {
    if (isAppReady) {
      setShowSplash(false);
    }
  }, [isAppReady]);

  return (
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister }}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ThemeProvider>
            <BottomSheetModalProvider>
              <AuthProvider>
                <WeatherProvider>
                  <SocketProvider>
                    <MenuProvider>
                      <StatusBar style="dark" />

                      {showSplash ? (
                        <CustomSplashScreen />
                      ) : (
                        <>
                          <AppInitializer />
                          <DrawerLayout />
                          <NetworkMonitor />
                        </>
                      )}
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
