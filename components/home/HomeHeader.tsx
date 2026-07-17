import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import HomeHeaderWeatherWidget from './HomeHeaderWeatherWidget';
import { ScreenHeader } from '../common/ScreenHeader';
import { SearchBar } from '../common/SearchBar';

interface HomeHeaderProps {
    setIsSearchActive: (active: boolean) => void;
}

export const HomeHeader = React.memo(({ setIsSearchActive }: HomeHeaderProps) => {
    const router = useRouter();

    return (
        <View style={styles.headerWrapper}>
            <ScreenHeader>
                {/* Search pill inside the header — reference design */}
                <View style={styles.searchRow}>
                    <SearchBar
                        placeholder='Search "Mehnda Chinji"'
                        onPress={() => setIsSearchActive(true)}
                        onFocus={() => setIsSearchActive(true)}
                        style={styles.searchBar}
                    />
                </View>
                <HomeHeaderWeatherWidget onPress={() => router.push('/weather')} />
            </ScreenHeader>
        </View>
    );
});

const styles = StyleSheet.create({
    headerWrapper: {
        zIndex: 10,
    },
    searchRow: {
        flexDirection: 'row',
        marginBottom: 14,
    },
    searchBar: {
        flex: 1,
    },
});
