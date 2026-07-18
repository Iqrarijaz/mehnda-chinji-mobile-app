import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import HomeHeaderWeatherWidget from './HomeHeaderWeatherWidget';
import { ScreenHeader, HeaderIconBtn } from '../common/ScreenHeader';

interface HomeHeaderProps {
    setIsSearchActive: (active: boolean) => void;
}

export const HomeHeader = React.memo(({ setIsSearchActive }: HomeHeaderProps) => {
    const router = useRouter();

    return (
        <View style={styles.headerWrapper}>
            <ScreenHeader
                decor="community"
                rightActions={
                    <HeaderIconBtn
                        name="search-outline"
                        onPress={() => setIsSearchActive(true)}
                    />
                }
            >
                <HomeHeaderWeatherWidget onPress={() => router.push('/weather')} />
            </ScreenHeader>
        </View>
    );
});

const styles = StyleSheet.create({
    headerWrapper: {
        zIndex: 10,
    },
});
