import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themedText';
import { Layout } from '@/constants/layout';

interface QuranHeaderProps {
    title: string;
    subtitle?: string;
    paddingTop: number;
    borderColor: string;
    cardColor: string;
    textColor: string;
    textSecondaryColor: string;
    onBack: () => void;
    /** Optional slot rendered at the far right of the header row */
    rightSlot?: React.ReactNode;
}

export const QuranHeader = React.memo(({
    title,
    subtitle,
    paddingTop,
    borderColor,
    cardColor,
    textColor,
    textSecondaryColor,
    onBack,
    rightSlot,
}: QuranHeaderProps) => (
    <View style={[styles.header, { paddingTop, borderBottomColor: borderColor }]}>
        <TouchableOpacity
            onPress={onBack}
            style={[styles.backButton, { backgroundColor: cardColor }]}
        >
            <Ionicons name="arrow-back" size={22} color={textColor} />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
            <ThemedText style={[styles.title, { color: textColor }]}>
                {title}
            </ThemedText>
            {subtitle ? (
                <ThemedText style={[styles.subtitle, { color: textSecondaryColor }]}>
                    {subtitle}
                </ThemedText>
            ) : null}
        </View>

        {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
    </View>
));

QuranHeader.displayName = 'QuranHeader';

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        flex: 1,
        marginLeft: 14,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 9,
        marginTop: 1,
    },
    rightSlot: {
        marginLeft: 12,
    },
});
