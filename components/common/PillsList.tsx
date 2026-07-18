import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ThemedText } from '@/components/ThemedText';
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
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const isActive = selectedId === item.id;
                    return (
                        <TouchableOpacity
                            style={[
                                styles.tab,
                                { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' },
                                isActive && { backgroundColor: resolvedActiveColor }
                            ]}
                            onPress={() => onSelect(item.id)}
                        >
                            <ThemedText style={[
                                styles.tabText,
                                { color: isActive ? '#FFF' : colors.textSecondary }
                            ]}>
                                {item.label}
                            </ThemedText>
                        </TouchableOpacity>
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
    tab: {
        paddingHorizontal: 24,
        paddingVertical: 6,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '700',
    },
});
