import React from 'react';
import { StyleSheet, View, TextInput } from 'react-native';
import { ThemedText } from '@/components/themedText';

interface ZakatInputFieldProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    colors: any;
}

export const ZakatInputField = React.memo(({
    label,
    value,
    onChangeText,
    placeholder = '0',
    colors
}: ZakatInputFieldProps) => (
    <View style={styles.inputWrapper}>
        <ThemedText style={styles.inputLabel}>{label}</ThemedText>
        <TextInput
            value={value}
            onChangeText={onChangeText}
            keyboardType="numeric"
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            style={[styles.fieldInput, { color: colors.text, borderColor: colors.border }]}
        />
    </View>
));

ZakatInputField.displayName = 'ZakatInputField';

const styles = StyleSheet.create({
    inputWrapper: {
        marginVertical: 8,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6,
        opacity: 0.8,
    },
    fieldInput: {
        height: 40,
        borderRadius: 10,
        borderWidth: 1,
        paddingHorizontal: 10,
        fontSize: 14,
        fontWeight: '600',
    },
});
