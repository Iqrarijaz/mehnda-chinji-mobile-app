import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Image } from 'expo-image';

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

export const EssentialsTypePills: React.FC<EssentialsTypePillsProps> = ({
    availableTags,
    selectedTags,
    onToggleTag,
    isSingleSelect = false,
    activeColor,
}) => {
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

                const label = tag.label || tag.eng;
                const subLabel = tag.ur;
                const resolvedActiveColor = activeColor || colors.lime;

                return (
                    <TouchableOpacity
                        key={itemKey}
                        style={[
                            styles.tagChip,
                            {
                                backgroundColor: isSelected ? resolvedActiveColor : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)'),
                            }
                        ]}
                        onPress={() => onToggleTag(tag)}
                        activeOpacity={0.8}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            {tag.icon && (
                                <View style={styles.typeChipImageContainer}>
                                    <Image
                                        source={{ uri: tag.icon }}
                                        style={{ width: '100%', height: '100%' }}
                                        contentFit="cover"
                                    />
                                </View>
                            )}
                            {isSelected && !isSingleSelect && !tag.icon && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                            <ThemedText
                                style={[
                                    styles.tagChipText,
                                    { color: isSelected ? '#FFFFFF' : colors.text }
                                ]}
                            >
                                {label} {subLabel ? `| ${subLabel}` : ''}
                            </ThemedText>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 6,
    },
    tagChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    tagChipText: {
        fontSize: 13,
        fontWeight: '500',
    },
    typeChipImageContainer: {
        width: 24,
        height: 20,
        borderRadius: 9,
        overflow: 'hidden',
    },
});
