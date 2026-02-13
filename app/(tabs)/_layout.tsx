import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { Tabs, useNavigation } from 'expo-router';
import React, { useRef } from 'react';
import { Image, TouchableOpacity, View } from 'react-native';

import { CustomTabBar } from '@/components/CustomTabBar';
import ProfileBottomSheet, { ProfileBottomSheetRef } from '@/components/ProfileBottomSheet';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function TabLayout() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const profileSheetRef = useRef<ProfileBottomSheetRef>(null);

  const openProfileSheet = () => {
    profileSheetRef.current?.expand();
  };

  const getProfileSource = () => {
    if (user?.user?.profileImage) {
      return { uri: user.user.profileImage };
    }
    const gender = user?.user?.gender?.toUpperCase();
    if (gender === 'FEMALE') {
      return require('../../assets/icons/user-female.png');
    }
    return require('../../assets/icons/user-male.png');
  };

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
              onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
              style={{ marginLeft: 15 }}
            >
              <Ionicons name="menu" size={28} color={Colors[theme].text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={openProfileSheet}
              style={{ marginRight: 15 }}
            >
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                borderWidth: 2,
                borderColor: '#0F172A',
                padding: 2,
                backgroundColor: '#f8fafc',
                overflow: 'hidden',
              }}>
                <Image
                  source={getProfileSource()}
                  style={{ width: '100%', height: '100%', borderRadius: 16 }}
                  resizeMode="cover"
                />
              </View>
            </TouchableOpacity>
          ),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
          }}
        />
        <Tabs.Screen
          name="blood"
          options={{
            title: 'Blood',
          }}
        />
        <Tabs.Screen
          name="business"
          options={{
            title: 'Business',
          }}
        />
      </Tabs>

      <ProfileBottomSheet ref={profileSheetRef} />
    </>
  );
}


