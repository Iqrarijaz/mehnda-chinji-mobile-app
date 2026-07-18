import { ThemedText } from '@/components/ThemedText';
import { PressableScale } from '@/components/essentials/shared/PressableScale';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface EmptyListingStateProps {
    activeTab: 'all' | 'requests';
    categoryTitle: string;
    /** Existing add-place action from the page header, surfaced as a CTA. */
    onAdd?: () => void;
}

const EmptyListingState: React.FC<EmptyListingStateProps> = ({ activeTab, categoryTitle, onAdd }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.container}>
            {/* Soft concentric illustration */}
            <View style={styles.illustration}>
                <View style={[styles.ringOuter, { backgroundColor: `${colors.primary}08` }]} />
                <View style={[styles.ringInner, { backgroundColor: `${colors.primary}0E` }]} />
                <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}18` }]}>
                    <Ionicons
                        name={activeTab === 'all' ? 'search' : 'document-text'}
                        size={30}
                        color={colors.primary}
                    />
                </View>
                <View style={[styles.accentDot, styles.accentDotA, { backgroundColor: colors.secondary }]} />
                <View style={[styles.accentDot, styles.accentDotB, { backgroundColor: colors.lime }]} />
            </View>

            <ThemedText style={[styles.title, { color: colors.text }]}>
                {activeTab === 'all' ? 'Nothing here yet' : 'No requests yet'}
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                {activeTab === 'all'
                    ? `No ${categoryTitle.toLowerCase()} have been added in this category so far.`
                    : "You haven't submitted any requests for this category."}
            </ThemedText>

            {activeTab === 'all' && onAdd && (
                <PressableScale
                    onPress={onAdd}
                    style={[styles.addButton, { backgroundColor: colors.primary }]}
                >
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                    <ThemedText style={styles.addButtonText}>Add the first one</ThemedText>
                </PressableScale>
            )}
        </Animated.View>
    );
};

export default EmptyListingState;

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingTop: 64,
        paddingHorizontal: 32,
    },
    illustration: {
        width: 140,
        height: 140,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    ringOuter: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
    },
    ringInner: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    accentDot: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    accentDotA: {
        top: 24,
        right: 26,
    },
    accentDotB: {
        bottom: 30,
        left: 22,
    },
    title: {
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    subtitle: {
        marginTop: 6,
        fontSize: 13,
        lineHeight: 19,
        textAlign: 'center',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 20,
        paddingHorizontal: 20,
        height: 44,
        borderRadius: 22,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 13.5,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
});
