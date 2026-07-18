import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

export const ListingCard = ({ children, style, ...rest }: ViewProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border
                },
                style
            ]}
            {...rest}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: Layout.cardBorderRadius,
        marginBottom: 16,
        overflow: 'hidden',
    }
});
