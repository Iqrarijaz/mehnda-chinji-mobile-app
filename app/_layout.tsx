import messaging from '@react-native-firebase/messaging';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import CustomDrawerContent from '../components/CustomDrawerContent';
import { toastConfig } from '../components/ToastConfig';
import { Colors } from '../constants/colors';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { asyncStoragePersister, queryClient } from '../lib/query-client';

function DrawerLayout() {
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();

  return (
    <Drawer
      drawerContent={(props: any) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        swipeEnabled: isAuthenticated, // Secure swipe access
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerItemStyle: { display: 'none' },
          swipeEnabled: false, // Disable on splash
        }}
      />
      <Drawer.Screen
        name="(auth)"
        options={{
          drawerItemStyle: { display: 'none' },
          swipeEnabled: false, // Disable on auth Screens
        }}
      />
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerLabel: 'Main App',
          title: 'Main App',
          drawerItemStyle: isAuthenticated ? {} : { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: 'Settings',
          title: 'Settings',
          drawerItemStyle: { display: 'none' },
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors[theme].background,
          },
          headerTintColor: Colors[theme].text,
        }}
      />
    </Drawer>
  );
}

export default function RootLayout() {

  useEffect(() => {
    // Register and get token (handled in AuthContext, but we can double check here or just let AuthContext do it)
    // Actually, AuthContext calls registerForPushNotificationsAsync which uses messaging().getToken() now.
    // So we just need to set up listeners here.

    // Foreground state messages
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
      Toast.show({
        type: 'success',
        text1: remoteMessage.notification?.title || 'New Notification',
        text2: remoteMessage.notification?.body || '',
      });
    });

    // Background & Quit state messages are handled by the OS/Headless task, 
    // but we can listen for when the user taps them:

    // App opened from background state
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification caused app to open from background state:', remoteMessage.notification);
    });

    // App opened from quit state
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Notification caused app to open from quit state:', remoteMessage.notification);
        }
      });

    return unsubscribe;
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <AuthProvider>
            <StatusBar style="auto" />
            <DrawerLayout />
            <Toast config={toastConfig} />
          </AuthProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </PersistQueryClientProvider>
  );
}

