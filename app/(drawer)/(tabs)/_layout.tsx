import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { Tabs, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { TouchableOpacity } from 'react-native';

import { CustomTabBar } from '@/components/customTabBar';
import { ProfileUpdatePrompt } from '@/components/profile/ProfileUpdatePrompt';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { AppState, AppStateStatus } from 'react-native';

export default function TabLayout() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const hasShownPrompt = React.useRef(false);

  const checkProfile = React.useCallback(() => {
    if (user?.user && (!user.user.city || !user.user.phone) && !hasShownPrompt.current) {
      // Show prompt with 30 second delay as requested
      const timer = setTimeout(() => {
        if (!hasShownPrompt.current) {
          setModalVisible(true);
          hasShownPrompt.current = true;
        }
      }, 3000);
      return () => clearTimeout(timer);
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
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors[theme].background,
          },
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
          ),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerShown: false,
          }}
        />
        {/* <Tabs.Screen
          name="feed"
          options={{
            title: 'Feed',
            headerShown: false,
          }}
        /> */}
        <Tabs.Screen
          name="business"
          options={{
            title: 'Directory',
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="blood"
          options={{
            title: 'Blood',
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
          }}
        />
      </Tabs>

      {memoizedModal}
    </>


  );
}


