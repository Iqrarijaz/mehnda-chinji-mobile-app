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
import { Radius } from '@/constants/layout';
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

/** Flat white pill search field — premium grocery look. */
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

    const inner = (withOuterStyle: boolean) => (
        <View
            style={[
                styles.container,
                { backgroundColor: colors.card },
                withOuterStyle ? style : undefined,
            ]}
        >
            <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.icon} />
            <TextInput
                ref={inputRef}
                style={[styles.input, { color: colors.text }]}
                placeholder={placeholder}
                placeholderTextColor={colors.textSecondary}
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
        height: 46,
        paddingHorizontal: Platform.OS === 'android' ? 16 : 18,
        borderRadius: Radius.pill,
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
        justifyContent: 'center',
    },
});
