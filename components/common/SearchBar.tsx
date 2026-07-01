import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

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
    style?: ViewStyle;
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
    inputRef,
}: SearchBarProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const inner = (
        <View
            style={[
                styles.container,
                { backgroundColor: colors.card, borderColor: colors.border },
                style,
            ]}
        >
            <Ionicons name="search" size={20} color="#94A3B8" style={styles.icon} />
            <TextInput
                ref={inputRef}
                style={[styles.input, { color: colors.text }]}
                placeholder={placeholder}
                placeholderTextColor="#94A3B8"
                value={value}
                onChangeText={onChangeText}
                returnKeyType={returnKeyType}
                clearButtonMode="while-editing"
                onFocus={onFocus}
                onBlur={onBlur}
            />
            {rightAction && (
                <View style={styles.rightAction}>
                    {rightAction}
                </View>
            )}
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity activeOpacity={1} onPress={onPress} style={style}>
                {/* Re-render inner without outer style to avoid double apply */}
                <View
                    style={[
                        styles.container,
                        { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                >
                    <Ionicons name="search" size={20} color="#94A3B8" style={styles.icon} />
                    <TextInput
                        ref={inputRef}
                        style={[styles.input, { color: colors.text }]}
                        placeholder={placeholder}
                        placeholderTextColor="#94A3B8"
                        value={value}
                        onChangeText={onChangeText}
                        returnKeyType={returnKeyType}
                        clearButtonMode="while-editing"
                        onFocus={onFocus}
                        onBlur={onBlur}
                    />
                    {rightAction && (
                        <View style={styles.rightAction}>
                            {rightAction}
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    }

    return inner;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 42,
        paddingHorizontal: Platform.OS === 'android' ? 14 : 16,
        borderRadius: Layout.borderRadius,
        borderWidth: 1,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: Platform.OS === 'android' ? 13 : 15,
        padding: 0,
        height: '100%',
    },
    rightAction: {
        marginLeft: 8,
        paddingLeft: 10,
        borderLeftWidth: 1,
        borderLeftColor: '#E2E8F0',
        justifyContent: 'center',
    },
});
