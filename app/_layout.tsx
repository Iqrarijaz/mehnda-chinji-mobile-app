import { Colors } from '@/constants/colors';
import { SocketProvider } from '@/context/SocketContext';
import * as Notifications from 'expo-notifications';
import Sentry from '@/lib/sentry';
import { useSocketNotifications } from '@/hooks/useSocketNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAppOpenAd } from '@/ads/hooks/useAppOpenAd';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import { View, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { MenuProvider } from 'react-native-popup-menu';
import React, { useState, useEffect } from 'react';
import CustomDrawerContent from '../components/CustomDrawerContent';
import { analyticsService, useScreenTracking, AnalyticsEvents } from '@/analytics';
import { toastConfig } from '../components/toastConfig';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { WeatherProvider } from '../context/WeatherContext';
import { asyncStoragePersister, queryClient } from '../lib/query-client';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import NetworkMonitor from '@/components/common/NetworkMonitor';
import { useDataUsageStore } from '@/store/dataUsageStore';
import { usePrayerCalendar } from '@/hooks/usePrayerTimes';
import { usePrayerNotifications } from '@/hooks/usePrayerNotifications';
import { useWeatherNotifications } from '@/hooks/useWeatherNotifications';
import { useWeatherCity } from '@/context/WeatherContext';
import * as Application from 'expo-application';
import { fetchAppVersionInfo, AppVersionInfo } from '@/apis/app-info';
import { checkUpdateStatus } from '@/utils/versioning';
import { UpdateModal } from '@/components/common/UpdateModal';
import { RatingModal } from '@/components/common/RatingModal';
import { ReviewService } from '@/utils/review';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAppFonts } from '@/hooks/useFonts';
import { initConfig } from '@/lib/remoteConfig';
import AdManager from '@/ads/adManager.service';



// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Disable global font scaling to prevent UI breakage on devices with large accessibility fonts
import { Text, TextInput } from 'react-native';

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
            gestureEnabled: true,
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
function AppInitializer() {
  usePushNotifications();
  useSocketNotifications();
  useScreenTracking();
  useAppOpenAd();

  const { selectedCity } = useWeatherCity();
  const { calendarData } = usePrayerCalendar(selectedCity);
  usePrayerNotifications(calendarData, selectedCity);
  useWeatherNotifications(selectedCity);

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

  const [updateInfo, setUpdateInfo] = useState<{
    visible: boolean;
    isMandatory: boolean;
    latestVersion: string;
    updateUrl: string;
    releaseNotes: string;
  }>({
    visible: false,
    isMandatory: false,
    latestVersion: '',
    updateUrl: '',
    releaseNotes: ''
  });

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    analyticsService.trackEvent(AnalyticsEvents.APP_OPEN, {
      version: Application.nativeApplicationVersion,
      build: Application.nativeBuildVersion,
      platform: Platform.OS
    });

    // const checkVersion = async () => {
    //   try {
    //     const info = await fetchAppVersionInfo();
    //     if (!info) {
    //       console.warn('Version info is null, skipping version check');
    //       return;
    //     }
    //     const currentVersion = Application.nativeApplicationVersion || '1.0.0';

    //     const { isMandatory, isOptional } = checkUpdateStatus(
    //       currentVersion,
    //       info.latestVersion,
    //       info.minRequiredVersion
    //     );

    //     if (isMandatory || isOptional) {
    //       setUpdateInfo({
    //         visible: true,
    //         isMandatory,
    //         latestVersion: info.latestVersion,
    //         updateUrl: Platform.OS === 'ios' ? info.updateUrl.ios : info.updateUrl.android,
    //         releaseNotes: info.releaseNotes
    //       });

    //       analyticsService.trackEvent(AnalyticsEvents.UPDATE_AVAILABLE, {
    //         currentVersion,
    //         latestVersion: info.latestVersion,
    //         isMandatory
    //       });
    //     }
    //   } catch (error) {
    //     console.error('Version check failed:', error);
    //   }
    // };

    // checkVersion();
    // checkVersion();
  }, [isAuthenticated]);

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

  return (
    <>
      <UpdateModal
        visible={updateInfo.visible}
        isMandatory={updateInfo.isMandatory}
        latestVersion={updateInfo.latestVersion}
        updateUrl={updateInfo.updateUrl}
        releaseNotes={updateInfo.releaseNotes}
        onClose={() => setUpdateInfo(prev => ({ ...prev, visible: false }))}
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

  useEffect(() => {
    const setupConfig = async () => {
      try {
        await initConfig();
        await AdManager.init();
      } finally {
        setConfigLoaded(true);
      }
    };
    setupConfig();
  }, []);

  useEffect(() => {
    if (fontsLoaded && configLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, configLoaded]);

  if (!fontsLoaded || !configLoaded) {
    return null;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ErrorBoundary>
          <ThemeProvider>
            <BottomSheetModalProvider>
              <AuthProvider>
                <WeatherProvider>
                  <SocketProvider>
                    <MenuProvider>
                      <AppInitializer />
                      <StatusBar style="dark" />
                      <DrawerLayout />
                      <NetworkMonitor />
                    </MenuProvider>
                  </SocketProvider>
                </WeatherProvider>
              </AuthProvider>
              <Toast config={toastConfig} topOffset={45} />
            </BottomSheetModalProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </GestureHandlerRootView>
    </PersistQueryClientProvider>
  );
}

const SentryRootLayout = Sentry.wrap(RootLayout);

export default function AppLayout() {
  return <SentryRootLayout />;
}
