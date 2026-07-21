import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { Tabs, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { TouchableOpacity } from 'react-native';

import { CustomTabBar } from '@/components/CustomTabBar';
import { ProfileUpdatePrompt } from '@/components/profile/ProfileUpdatePrompt';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { AppState, AppStateStatus } from 'react-native';

let globalHasShownProfilePrompt = false;

export default function TabLayout() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  const checkProfile = React.useCallback(() => {
    if (user?.user && (!user.user.city || !user.user.phone) && !globalHasShownProfilePrompt) {
      if ((global as any).profilePromptTimer) {
        clearTimeout((global as any).profilePromptTimer);
      }
      (global as any).profilePromptTimer = setTimeout(() => {
        if (!globalHasShownProfilePrompt) {
          globalHasShownProfilePrompt = true;
          setModalVisible(true);
        }
      }, 3000);
      return () => {
        if ((global as any).profilePromptTimer) {
          clearTimeout((global as any).profilePromptTimer);
          (global as any).profilePromptTimer = null;
        }
      };
    }
    return () => { };
  }, [user]);

  useEffect(() => {
    const cleanup = checkProfile();
    return cleanup;
  }, [checkProfile]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkProfile();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [checkProfile]);

  const handleUpdate = React.useCallback(() => {
    setModalVisible(false);
    router.push('/profile' as any);
  }, [router]);

  const memoizedModal = React.useMemo(() => (
    <ProfileUpdatePrompt
      visible={modalVisible}
      onClose={() => setModalVisible(false)}
      onUpdate={handleUpdate}
    />
  ), [modalVisible, handleUpdate]);





  return (
    <>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          freezeOnBlur: true,
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors[theme].background },
          headerTintColor: Colors[theme].text,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                const parent = navigation.getParent();
                if (parent) {
                  parent.dispatch(DrawerActions.toggleDrawer());
                } else {
                  // Fallback if navigation hierarchy is different
                  navigation.dispatch(DrawerActions.toggleDrawer());
                }
              }}
              style={{ marginLeft: 15 }}
            >
              <Ionicons name="menu" size={28} color={Colors[theme].text} />
            </TouchableOpacity>
          ) }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerShown: false,
            tabBarLabel: 'Home',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
            ) }}
        />

        <Tabs.Screen
          name="business"
          options={{
            title: 'Business',
            headerShown: false,
            tabBarLabel: 'Business',
            tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
              <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={size} color={color} />
            ),
            unmountOnBlur: true } as any}
        />

        <Tabs.Screen
          name="marketplace"
          options={{
            title: 'Bazaar',
            headerShown: false,
            tabBarLabel: 'Bazaar',
            tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
              <Ionicons name={focused ? 'cart' : 'cart-outline'} size={size} color={color} />
            ),
            unmountOnBlur: true } as any}
        />
      </Tabs>

      {memoizedModal}
    </>

  );
}


