import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import HomeHeaderWeatherWidget from './HomeHeaderWeatherWidget';
import { ScreenHeader } from '../common/ScreenHeader';
import { SearchBar } from '../common/SearchBar';
import { ThemedText } from '../ThemedText';
import { useAuth } from '@/context/AuthContext';

interface HomeHeaderProps {
    setIsSearchActive: (active: boolean) => void;
}

/**
 * Home header — dairy-style greeting block (Hi {name} 👋 + location line)
 * above the search pill, all on the curved forest surface.
 */
export const HomeHeader = React.memo(({ setIsSearchActive }: HomeHeaderProps) => {
    const router = useRouter();
    const { user } = useAuth();

    const firstName = React.useMemo(() => {
        const name = user?.user?.name?.trim();
        if (!name) return '';
        const first = name.split(' ')[0];
        return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
    }, [user?.user?.name]);

    return (
        <View style={styles.headerWrapper}>
            <ScreenHeader>
                {/* Greeting */}
                <View style={styles.greeting}>
                    <ThemedText style={styles.greetingHi}>
                        Hi {firstName || 'there'} 👋
                    </ThemedText>
                    <View style={styles.locationRow}>
                        <Ionicons name="location" size={13} color="#FDEEB5" />
                        <ThemedText style={styles.greetingSub} numberOfLines={1}>
                            {user?.user?.city ? `${user.user.city}, Pakistan` : 'Your community companion'}
                        </ThemedText>
                    </View>
                </View>

                {/* Search pill */}
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
    greeting: {
        marginBottom: 14,
    },
    greetingHi: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.3,
        lineHeight: 26,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    greetingSub: {
        color: '#A9C4BC',
        fontSize: 12.5,
        fontWeight: '500',
        flexShrink: 1,
    },
    searchRow: {
        flexDirection: 'row',
        marginBottom: 14,
    },
    searchBar: {
        flex: 1,
    },
});
