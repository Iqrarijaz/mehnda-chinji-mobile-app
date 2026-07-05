import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ListingCard } from './ListingCard';

interface EmptyListingStateProps {
    activeTab: 'all' | 'requests';
    categoryTitle: string;
}

const EmptyListingState: React.FC<EmptyListingStateProps> = ({ activeTab, categoryTitle }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <ListingCard style={{ marginTop: 60, marginHorizontal: 16, padding: 32, alignItems: 'center' }}>
            <View style={styles.emptyContainer}>
            <Ionicons
                name={activeTab === 'all' ? "search-outline" : "document-text-outline"}
                size={64}
                color={colors.icon}
            />
            <ThemedText style={[styles.emptyText, { color: colors.text }]}>
                No results found.
            </ThemedText>
            <ThemedText style={[styles.emptySubText, { color: colors.icon }]}>
                {activeTab === 'all'
                    ? `No ${categoryTitle.toLowerCase()} found in this category yet.`
                    : "You haven't submitted any requests for this category."}
            </ThemedText>
            </View>
        </ListingCard>
    );
};

export default EmptyListingState;

const styles = StyleSheet.create({
    emptyContainer: {
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '700',
    },
    emptySubText: {
        marginTop: 8,
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});
