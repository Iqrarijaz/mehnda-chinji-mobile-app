import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ThemedText } from '@/components/ThemedText';
import { PressableScale } from '@/components/essentials/shared/PressableScale';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

export interface PillItem {
    id: string;
    label: string;
    /** Small count badge shown on the pill (e.g. unread count) — omitted when falsy. */
    badgeCount?: number;
}

export interface PillsListProps {
    data: PillItem[];
    selectedId: string;
    onSelect: (id: string) => void;
    activeColor?: string;
    containerStyle?: ViewStyle;
}

export const PillsList = React.memo(function PillsList({
    data,
    selectedId,
    onSelect,
    activeColor,
    containerStyle }: PillsListProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const resolvedActiveColor = activeColor || colors.primary;

    return (
        <View style={[styles.tabsContainer, containerStyle]}>
            <FlashList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={data}
                extraData={selectedId}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const isActive = selectedId === item.id;
                    return (
                        <PressableScale
                            intensity={0.06}
                            onPress={() => onSelect(item.id)}
                            containerStyle={styles.tabWrap}
                            style={[
                                styles.tab,
                                { backgroundColor: colors.cardBg },
                                isActive && { backgroundColor: resolvedActiveColor },
                            ]}
                        >
                            {isActive && <View style={[styles.activeDot, { backgroundColor: colors.lime }]} />}
                            <ThemedText style={[
                                styles.tabText,
                                { color: isActive ? '#FFF' : colors.textSecondary },
                                isActive && styles.tabTextActive,
                            ]}>
                                {item.label}
                            </ThemedText>
                            {!!item.badgeCount && (
                                <View style={[
                                    styles.countBadge,
                                    { backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : resolvedActiveColor },
                                ]}>
                                    <ThemedText style={styles.countBadgeText}>
                                        {item.badgeCount > 99 ? '99+' : item.badgeCount}
                                    </ThemedText>
                                </View>
                            )}
                        </PressableScale>
                    );
                }}
                contentContainerStyle={styles.tabsList}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    tabsContainer: {
        paddingVertical: 10 },
    tabsList: {
        paddingHorizontal: 10 },
    tabWrap: {
        marginRight: 8 },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center' },
    activeDot: {
        width: 5,
        height: 5,
        borderRadius: Layout.borderRadius },
    tabText: {
        fontSize: 10.5,
        fontWeight: '700' },
    tabTextActive: {
        fontWeight: '800',
        letterSpacing: 0.2 },
    countBadge: {
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        paddingHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center' },
    countBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#FFFFFF' } });
