import React from 'react';
import { StyleSheet, TouchableOpacity, View, Platform } from 'react-native';
import Animated, { Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { Layout as LayoutConst } from '@/constants/layout';

export type PrideTabType = 'LEGENDS' | 'MEMORIAM';

interface PrideTabMeta {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
}

interface PrideSegmentedTabsProps {
    activeTab: PrideTabType;
    onChangeTab: (tab: PrideTabType) => void;
    colors: any;
    theme: 'light' | 'dark';
}

const TAB_META: Record<PrideTabType, PrideTabMeta> = {
    LEGENDS: { label: 'Our Pride Legends', icon: 'sparkles-outline' },
    MEMORIAM: { label: 'In Memoriam', icon: 'rose-outline' },
};

export const PrideSegmentedTabs = React.memo(({
    activeTab,
    onChangeTab,
    colors,
    theme,
}: PrideSegmentedTabsProps) => {
    return (
        <View
            style={[
                styles.wrapper,
                {
                    backgroundColor: theme === 'dark' ? colors.card : '#FFFFFF',
                    borderColor: colors.border,
                },
            ]}
        >
            {(Object.keys(TAB_META) as PrideTabType[]).map((tab) => {
                const isActive = tab === activeTab;
                const tabMeta = TAB_META[tab];

                return (
                    <TouchableOpacity
                        key={tab}
                        activeOpacity={0.9}
                        onPress={() => onChangeTab(tab)}
                        style={styles.tabButton}
                    >
                        {isActive ? (
                            <Animated.View
                                layout={Layout.springify().damping(16)}
                                style={[styles.activePill, { backgroundColor: colors.primary }]}
                            >
                                <Ionicons name={tabMeta.icon} size={16} color="#FFFFFF" />
                                <ThemedText style={styles.activeText}>{tabMeta.label}</ThemedText>
                            </Animated.View>
                        ) : (
                            <View style={styles.inactivePill}>
                                <Ionicons name={tabMeta.icon} size={16} color={colors.textSecondary} />
                                <ThemedText style={[styles.inactiveText, { color: colors.textSecondary }]}>
                                    {tabMeta.label}
                                </ThemedText>
                            </View>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
});

const styles = StyleSheet.create({
    wrapper: {
        flexDirection: 'row',
        borderRadius: LayoutConst.borderRadius + 8,
        borderWidth: 0,
        padding: 4,
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 10,
    },
    tabButton: {
        flex: 1,
    },
    activePill: {
        minHeight: 42,
        borderRadius: LayoutConst.borderRadius + 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 10,
    },
    inactivePill: {
        minHeight: 42,
        borderRadius: LayoutConst.borderRadius + 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 10,
    },
    activeText: {
        color: '#FFFFFF',
        fontSize: 12.5,
        fontWeight: '700',
    },
    inactiveText: {
        fontSize: 12.5,
        fontWeight: '600',
    },
});
