import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import HomeHeaderCurrencyWidget from './HomeHeaderCurrencyWidget';
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
                rightActions={
                    <HeaderIconBtn
                        name="search-outline"
                        onPress={() => setIsSearchActive(true)}
                    />
                }
            >
                <HomeHeaderWeatherWidget onPress={() => router.push('/weather')} />
                <HomeHeaderCurrencyWidget onPress={() => router.push('/currency')} />
            </ScreenHeader>
        </View>
    );
});

HomeHeader.displayName = 'HomeHeader';

const styles = StyleSheet.create({
    headerWrapper: {
        zIndex: 10
    }
});
