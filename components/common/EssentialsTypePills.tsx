import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Image } from 'expo-image';
import { Layout } from '@/constants/layout';

export interface Tag {
    eng?: string;
    ur?: string;
    id?: string;
    label?: string;
    icon?: string;
}

interface EssentialsTypePillsProps {
    availableTags: Tag[];
    selectedTags: Tag[];
    onToggleTag: (tag: Tag) => void;
    isSingleSelect?: boolean;
    activeColor?: string;
}

export const EssentialsTypePills: React.FC<EssentialsTypePillsProps> = React.memo(({
    availableTags,
    selectedTags,
    onToggleTag,
    isSingleSelect = false,
    activeColor }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const colors = Colors[theme];

    if (!availableTags || availableTags.length === 0) return null;

    return (
        <View style={styles.tagsContainer}>
            {availableTags.map((tag) => {
                const itemKey = tag.id || tag.eng;
                const isSelected = selectedTags?.some((t) => {
                    const tKey = t.id || t.eng;
                    return tKey?.toLowerCase() === itemKey?.toLowerCase();
                });

                const effectiveActiveColor = activeColor || colors.primary;

                return (
                    <TouchableOpacity
                        key={itemKey}
                        activeOpacity={0.7}
                        onPress={() => onToggleTag(tag)}
                        style={[
                            styles.tagChip,
                            {
                                backgroundColor: isSelected
                                    ? effectiveActiveColor
                                    : (isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9'),
                            },
                        ]}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            {tag.icon ? (
                                <View style={styles.typeChipImageContainer}>
                                    <Image
                                        source={{ uri: tag.icon }}
                                        style={{ width: '100%', height: '100%' }}
                                        contentFit="contain"
                                    />
                                </View>
                            ) : (
                                <Ionicons
                                    name={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
                                    size={14}
                                    color={
                                        isSelected
                                            ? '#FFFFFF'
                                            : (isDark ? 'rgba(255,255,255,0.45)' : colors.textSecondary)
                                    }
                                />
                            )}
                            <ThemedText
                                style={[
                                    styles.tagChipText,
                                    {
                                        color: isSelected
                                            ? '#FFFFFF'
                                            : (isDark ? 'rgba(255,255,255,0.7)' : colors.textSecondary),
                                        fontWeight: isSelected ? '700' : '500',
                                    },
                                ]}
                            >
                                {tag.label || tag.eng}
                            </ThemedText>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
});

EssentialsTypePills.displayName = 'EssentialsTypePills';

const styles = StyleSheet.create({
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 6 },
    tagChip: {
        paddingHorizontal: 13,
        paddingVertical: 8,
        borderRadius: Layout.borderRadius },
    tagChipText: {
        fontSize: 11.5,
        fontWeight: '500' },
    typeChipImageContainer: {
        width: 24,
        height: 20,
        borderRadius: Layout.borderRadius,
        overflow: 'hidden' } });
