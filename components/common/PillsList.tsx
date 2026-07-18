import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ThemedText } from '@/components/ThemedText';
import { PressableScale } from '@/components/essentials/shared/PressableScale';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';

export interface PillItem {
    id: string;
    label: string;
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
    containerStyle,
}: PillsListProps) {
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
                                { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)' },
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
        paddingVertical: 12,
    },
    tabsList: {
        paddingHorizontal: 12,
    },
    tabWrap: {
        marginRight: 8,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 18,
        paddingVertical: 7,
        borderRadius: 999,
        justifyContent: 'center',
    },
    activeDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '700',
    },
    tabTextActive: {
        fontWeight: '800',
        letterSpacing: 0.2,
    },
});
