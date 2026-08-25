import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/essentials/shared/PressableScale';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { FUEL_TAB_KEYS, FUEL_TAB_SHORT_LABELS, getFuelTabMeta } from '@/constants/fuel';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

export interface FuelSegmentTabsProps {
    active: string;
    onSelect: (key: string) => void;
    /** Keys with no price today are dimmed and not selectable. */
    availableKeys?: string[];
}

interface TabProps {
    tabKey: string;
    isActive: boolean;
    isAvailable: boolean;
    onSelect: (key: string) => void;
}

const FuelSegmentTab = React.memo(function FuelSegmentTab({ tabKey, isActive, isAvailable, onSelect }: TabProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const meta = getFuelTabMeta(tabKey);

    const handlePress = useCallback(() => onSelect(tabKey), [onSelect, tabKey]);

    // The active tab borrows the product's own accent so switching fuels reads
    // as a change of subject, not just a change of selection.
    const accent = meta.gradient[0];

    return (
        <PressableScale
            intensity={0.04}
            onPress={handlePress}
            disabled={!isAvailable}
            containerStyle={styles.tabWrap}
            style={[
                styles.tab,
                { backgroundColor: isActive ? accent : colors.cardBg },
                !isAvailable && styles.tabUnavailable,
            ]}
        >
            <MaterialCommunityIcons
                name={meta.icon}
                size={15}
                color={isActive ? '#FFFFFF' : colors.textSecondary}
            />
            <ThemedText
                style={[
                    styles.tabText,
                    { color: isActive ? '#FFFFFF' : colors.textSecondary },
                    isActive && styles.tabTextActive,
                ]}
                numberOfLines={1}
            >
                {FUEL_TAB_SHORT_LABELS[tabKey] ?? meta.label}
            </ThemedText>
        </PressableScale>
    );
});

FuelSegmentTab.displayName = 'FuelSegmentTab';

/**
 * Segmented selector across the top of the Fuel screen.
 *
 * Horizontally scrollable rather than four equal thirds: the labels are not the
 * same width, and squeezing them would either truncate "Octane 95" or shrink the
 * touch targets below the 44pt minimum.
 */
export const FuelSegmentTabs = React.memo(function FuelSegmentTabs({
    active,
    onSelect,
    availableKeys,
}: FuelSegmentTabsProps) {
    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.list}
            >
                {FUEL_TAB_KEYS.map((key) => (
                    <FuelSegmentTab
                        key={key}
                        tabKey={key}
                        isActive={active === key}
                        isAvailable={!availableKeys || availableKeys.includes(key)}
                        onSelect={onSelect}
                    />
                ))}
            </ScrollView>
        </View>
    );
});

FuelSegmentTabs.displayName = 'FuelSegmentTabs';

const styles = StyleSheet.create({
    container: {
        paddingTop: 4,
        paddingBottom: 10,
    },
    list: {
        paddingHorizontal: 14,
    },
    tabWrap: {
        marginRight: 8,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 14,
        // 44pt minimum touch target.
        minHeight: 44,
        borderRadius: Layout.borderRadius,
    },
    tabUnavailable: {
        opacity: 0.4,
    },
    tabText: {
        fontSize: 12.5,
        fontWeight: '700',
    },
    tabTextActive: {
        fontWeight: '800',
        letterSpacing: 0.2,
    },
});
