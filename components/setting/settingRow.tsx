import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring } from 'react-native-reanimated';
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

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const SettingRowItem: React.FC<SettingRowItemProps> = React.memo(({
    icon,
    label,
    subtitle,
    onPress,
    color,
    iconColor = '#006666',
    iconBg = 'rgba(0, 150, 136, 0.08)',
    showChevron = true,
    isToggle = false,
    toggleValue = false,
    onToggleChange,
    primaryColor,
    isLast = false }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const textColor = color || colors.text;
    const scale = useSharedValue(1);

    const animatedContainer = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }] }));

    const handlePressIn = () => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    };

    return (
        <AnimatedTouchable
            style={[
                styles.settingRow,
                !isLast && styles.settingRowBorder,
                animatedContainer,
            ]}
            activeOpacity={1}
            onPress={isToggle ? undefined : onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={isToggle}
        >
            <View style={styles.settingRowLeft}>
                <View style={[styles.settingIconWrap, { backgroundColor: iconBg }]}>
                    <Ionicons name={icon} size={20} color={iconColor} />
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
        </AnimatedTouchable>
    );
});

const styles = StyleSheet.create({
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Platform.OS === 'android' ? 10 : 13,
        paddingHorizontal: 14,
        borderRadius: Layout.borderRadius },
    settingRowBorder: {
        marginHorizontal: 4 },
    settingRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1 },
    settingIconWrap: {
        width: 38,
        height: 38,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14 },
    settingTextWrap: {
        flex: 1 },
    settingLabel: {
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: -0.1 },
    settingSubtitle: {
        fontSize: 12,
        fontWeight: '400',
        marginTop: 1 } });
