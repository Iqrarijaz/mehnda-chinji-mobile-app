import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { PressableScale } from './PressableScale';

interface QuickActionsBarProps {
    /** Existing call handler from the page; hidden when absent. */
    onCall?: () => void;
    hasContact?: boolean;
    callLabel?: string;
    /** Existing directions handler from the page. */
    onDirections: () => void;
    hasDirections: boolean;
}

/**
 * The page's existing primary actions (call + directions) as a premium
 * button row. No new functionality — handlers pass through unchanged.
 */
export const QuickActionsBar = React.memo(({
    onCall,
    hasContact = false,
    callLabel = 'Call Now',
    onDirections,
    hasDirections,
}: QuickActionsBarProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.row}>
            {hasContact && onCall && (
                <PressableScale
                    onPress={onCall}
                    intensity={0.04}
                    containerStyle={styles.flex}
                    style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                >
                    <View style={[styles.primaryIcon, { backgroundColor: colors.lime }]}>
                        <Ionicons name="call" size={15} color="#FFFFFF" />
                    </View>
                    <ThemedText style={styles.primaryText}>{callLabel}</ThemedText>
                </PressableScale>
            )}
            <PressableScale
                onPress={onDirections}
                disabled={!hasDirections}
                intensity={0.04}
                containerStyle={styles.flex}
                style={[
                    styles.secondaryBtn,
                    { backgroundColor: `${colors.primary}10`, opacity: hasDirections ? 1 : 0.5 },
                ]}
            >
                <Ionicons
                    name={hasDirections ? 'navigate' : 'navigate-outline'}
                    size={16}
                    color={colors.primary}
                />
                <ThemedText style={[styles.secondaryText, { color: colors.primary }]}>
                    {hasDirections ? 'Directions' : 'No Directions'}
                </ThemedText>
            </PressableScale>
        </Animated.View>
    );
});

QuickActionsBar.displayName = 'QuickActionsBar';

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    flex: {
        flex: 1,
    },
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 52,
        borderRadius: 26,
    },
    primaryIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    secondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        height: 52,
        borderRadius: 26,
    },
    secondaryText: {
        fontSize: 14,
        fontWeight: '700',
    },
});
