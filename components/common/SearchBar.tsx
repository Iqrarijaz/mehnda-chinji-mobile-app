import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Platform,
    StyleProp,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring } from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

interface SearchBarProps {
    /** Controlled value */
    value?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    /** Makes the whole bar a pressable (useful when you want to forward focus to a ref) */
    onPress?: () => void;
    onFocus?: () => void;
    onBlur?: () => void;
    returnKeyType?: 'search' | 'done' | 'next' | 'go' | 'send';
    /** Renders inside the bar on the right, after the text input (e.g. a filter icon) */
    rightAction?: React.ReactNode;
    /** Outer container override */
    style?: StyleProp<ViewStyle>;
    /** Ref forwarded to the underlying TextInput */
    inputRef?: React.Ref<TextInput>;
}

export function SearchBar({
    value,
    onChangeText,
    placeholder = 'Search...',
    onPress,
    onFocus,
    onBlur,
    returnKeyType = 'search',
    rightAction,
    style,
    inputRef }: SearchBarProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    // Focus gives the bar a gentle lift: a small spring scale plus a
    // primary-tinted search icon.
    const [focused, setFocused] = useState(false);
    const focus = useSharedValue(0);

    const focusStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 + focus.value * 0.015 }] }));

    const handleFocus = () => {
        setFocused(true);
        focus.value = withSpring(1, { damping: 18, stiffness: 220 });
        onFocus?.();
    };
    const handleBlur = () => {
        setFocused(false);
        focus.value = withSpring(0, { damping: 18, stiffness: 220 });
        onBlur?.();
    };

    const inner = (applyOuterStyle: boolean) => (
        <Animated.View
            style={[
                styles.container,
                { backgroundColor: colors.card },
                applyOuterStyle ? style : null,
                focusStyle,
            ]}
        >
            <Ionicons
                name="search"
                size={20}
                color={focused ? colors.primary : '#94A3B8'}
                style={styles.icon}
            />
            <TextInput
                ref={inputRef}
                allowFontScaling={false}
                style={[styles.input, { color: colors.text }]}
                placeholder={placeholder}
                placeholderTextColor="#94A3B8"
                value={value}
                onChangeText={onChangeText}
                returnKeyType={returnKeyType}
                clearButtonMode="while-editing"
                onFocus={handleFocus}
                onBlur={handleBlur}
            />
            {rightAction && (
                <View style={styles.rightAction}>
                    {rightAction}
                </View>
            )}
        </Animated.View>
    );

    if (onPress) {
        return (
            <TouchableOpacity activeOpacity={1} onPress={onPress} style={style}>
                {inner(false)}
            </TouchableOpacity>
        );
    }

    return inner(true);
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 42,
        paddingHorizontal: Platform.OS === 'android' ? 14 : 16,
        borderRadius: Layout.borderRadius },
    icon: {
        marginRight: 10 },
    input: {
        flex: 1,
        fontSize: Platform.OS === 'android' ? 13 : 15,
        padding: 0,
        height: '100%' },
    rightAction: {
        marginLeft: 10,
        justifyContent: 'center' } });
