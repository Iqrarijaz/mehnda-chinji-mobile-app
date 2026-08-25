import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AnimatedToggle } from './AnimatedToggle';


export interface SettingRowItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    subtitle?: string;
    onPress?: () => void;
    color?: string;
    iconColor?: string;
    iconBg?: string;
    showChevron?: boolean;
    isToggle?: boolean;
    toggleValue?: boolean;
    onToggleChange?: (v: boolean) => void;
    primaryColor?: string;
    isLast?: boolean;
}

export const SettingRowItem: React.FC<SettingRowItemProps> = React.memo(({
    icon,
    label,
    subtitle,
    onPress,
    color,
    iconColor,
    iconBg,
    showChevron = true,
    isToggle = false,
    toggleValue = false,
    onToggleChange,
    primaryColor,
    isLast = false }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const textColor = color || colors.text;
    const effectiveIconColor = iconColor || colors.primary;

    return (
        <TouchableOpacity
            style={[
                styles.settingRow,
                !isLast && styles.settingRowBorder,
            ]}
            activeOpacity={0.7}
            onPress={isToggle ? undefined : onPress}
            disabled={isToggle}
        >
            <View style={styles.settingRowLeft}>
                <View style={[styles.settingIconWrap, iconBg ? { backgroundColor: iconBg } : undefined]}>
                    <Ionicons name={icon} size={24} color={effectiveIconColor} />
                </View>
                <View style={styles.settingTextWrap}>
                    <ThemedText style={[styles.settingLabel, { color: textColor }]}>{label}</ThemedText>
                    {subtitle ? (
                        <ThemedText style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</ThemedText>
                    ) : null}
                </View>
            </View>
            {isToggle && onToggleChange ? (
                <AnimatedToggle value={toggleValue} onValueChange={onToggleChange} primaryColor={primaryColor || colors.primary} />
            ) : showChevron ? (
                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            ) : null}
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Platform.OS === 'android' ? 10 : 13,
        paddingHorizontal: 11,
        borderRadius: Layout.borderRadius },
    settingRowBorder: {
        marginHorizontal: 4 },
    settingRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1 },
    settingIconWrap: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12 },
    settingTextWrap: {
        flex: 1 },
    settingLabel: {
        fontSize: 12.5,
        fontWeight: '600',
        letterSpacing: -0.1 },
    settingSubtitle: {
        fontSize: 10.5,
        fontWeight: '400',
        marginTop: 1 } });
