import { ThemedText } from '@/components/themedText';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

import { AnimatedToggle } from './animatedToggle';

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

export const SettingRowItem: React.FC<SettingRowItemProps> = ({
    icon,
    label,
    subtitle,
    onPress,
    color = '#1E293B',
    iconColor = '#006666',
    iconBg = 'rgba(0, 150, 136, 0.08)',
    showChevron = true,
    isToggle = false,
    toggleValue = false,
    onToggleChange,
    primaryColor = '#006666',
    isLast = false,
}) => {
    const scale = useSharedValue(1);

    const animatedContainer = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

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
                    <ThemedText style={[styles.settingLabel, { color }]}>{label}</ThemedText>
                    {subtitle ? (
                        <ThemedText style={styles.settingSubtitle}>{subtitle}</ThemedText>
                    ) : null}
                </View>
            </View>
            {isToggle && onToggleChange ? (
                <AnimatedToggle value={toggleValue} onValueChange={onToggleChange} primaryColor={primaryColor} />
            ) : showChevron ? (
                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            ) : null}
        </AnimatedTouchable>
    );
};

const styles = StyleSheet.create({
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 13,
        paddingHorizontal: 14,
        borderRadius: 14,
    },
    settingRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.04)',
        marginHorizontal: 4,
    },
    settingRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    settingTextWrap: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: -0.1,
    },
    settingSubtitle: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '400',
        marginTop: 1,
    },
});
