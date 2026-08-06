import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Layout } from '@/constants/layout';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface SupportContactCardProps {
    type: 'whatsapp' | 'call' | 'email';
    title: string;
    subtitle: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    hideValue?: boolean;
}

const SupportContactCard: React.FC<SupportContactCardProps> = ({
    type,
    title,
    subtitle,
    value,
    icon,
    color,
    hideValue = false
}) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }] }));

    const handlePress = () => {
        scale.value = withSpring(0.97, {}, () => {
            scale.value = withSpring(1);
        });

        let url = '';
        if (type === 'whatsapp') {
            const message = 'Hello, I need support with Rehbar app.';
            const cleanNumber = value.replace(/[^0-9]/g, '');
            // Ensure number starts with country code for wa.me if not already present
            const formattedNumber = cleanNumber.startsWith('92') ? cleanNumber : `92${cleanNumber.startsWith('0') ? cleanNumber.slice(1) : cleanNumber}`;
            
            url = `whatsapp://send?phone=${formattedNumber}&text=${encodeURIComponent(message)}`;

            Linking.canOpenURL(url).then(supported => {
                if (supported) {
                    Linking.openURL(url);
                } else {
                    Linking.openURL(`https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`);
                }
            });
            return;
        } else if (type === 'call') {
            url = `tel:${value}`;
        } else if (type === 'email') {
            url = `mailto:${value}`;
        }

        if (url) Linking.openURL(url);
    };

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={handlePress}
            style={styles.touchable}
        >
            <Animated.View style={[styles.card, { backgroundColor: colors.card }, animatedStyle]}>
                <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
                    <Ionicons name={icon} size={26} color={color} />
                </View>
                <View style={styles.content}>
                    <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>{title}</Text>
                    <Text allowFontScaling={false} style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
                    {!hideValue && <Text allowFontScaling={false} style={[styles.value, { color }]}>{value}</Text>}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.placeholder} />
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    touchable: {
        marginBottom: 16 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
        padding: 13 },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16 },
    content: {
        flex: 1 },
    title: {
        fontSize: 13.5,
        fontWeight: '700',
        marginBottom: 2 },
    subtitle: {
        fontSize: 10.5,
        marginBottom: 4 },
    value: {
        fontSize: 12.5,
        fontWeight: '600' } });

export default SupportContactCard;
