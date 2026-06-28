import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';

interface ZakatHeaderProps {
    insetsTop: number;
    colors: any;
    onBack: () => void;
    onReset: () => void;
    isUrdu?: boolean;
    onToggleLanguage?: () => void;
}

export const ZakatHeader = React.memo(({ insetsTop, colors, onBack, onReset, isUrdu, onToggleLanguage }: ZakatHeaderProps) => (
    <View style={[styles.header, { paddingTop: insetsTop + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={[styles.iconBtn, { backgroundColor: colors.card }]}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Image
            source={require('@/assets/icons/bank.webp')}
            style={styles.logo}
            resizeMode="contain"
        />
        <View style={styles.titleWrapper}>
            <ThemedText style={styles.screenTitle}>
                {isUrdu ? 'زکوٰۃ کیلکولیٹر' : 'Zakat Calculator'}
            </ThemedText>
            <ThemedText style={[isUrdu ? styles.screenSubUrdu : styles.screenSub, { color: colors.textSecondary }]}>
                {isUrdu ? 'Zakat Calculator' : 'زکوٰۃ کیلکولیٹر'}
            </ThemedText>
        </View>
        {onToggleLanguage && (
            <TouchableOpacity onPress={onToggleLanguage} style={[styles.langBtn, { backgroundColor: colors.card }]}>
                <ThemedText style={[styles.langText, { color: colors.text }]}>
                    {isUrdu ? 'EN' : 'اردو'}
                </ThemedText>
            </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onReset} style={[styles.iconBtn, { backgroundColor: colors.card, marginLeft: 8 }]}>
            <Ionicons name="refresh" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
    </View>
));

ZakatHeader.displayName = 'ZakatHeader';

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 26,
        height: 26,
        marginLeft: 10,
    },
    titleWrapper: {
        flex: 1,
        marginLeft: 10,
    },
    screenTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    screenSub: {
        fontSize: 11,
        marginTop: 1,
    },
    screenSubUrdu: {
        fontSize: 11,
        marginTop: 1,
        fontFamily: 'NotoNastaliqUrdu-Regular',
        lineHeight: 20,
    },
    langBtn: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    langText: {
        fontSize: 12,
        fontWeight: '700',
    },
});
