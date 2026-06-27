import React from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';

type ProfileType = 'standard' | 'lahore' | 'kp' | 'custom';

interface ProfileSelectorProps {
    profile: ProfileType;
    setProfile: (profile: ProfileType) => void;
    customMarla: string;
    setCustomMarla: (val: string) => void;
    marlaSqFt: number;
    lang: 'en' | 'ur';
    colors: any;
}

const TRANSLATIONS = {
    en: {
        profileTitle: 'Marla Size Profile',
        govt: 'Govt',
        lahore: 'Lahore',
        kp: 'KP',
        custom: 'Custom',
        sqftPerMarla: 'Sq Ft per Marla:',
        currentBase: 'Current Base: 1 Marla =',
        sqft: 'Sq Ft',
    },
    ur: {
        profileTitle: 'مرلہ سائز پروفائل',
        govt: 'سرکاری',
        lahore: 'لاہور',
        kp: 'کے پی',
        custom: 'مخصوص',
        sqftPerMarla: 'فٹ فی مرلہ:',
        currentBase: 'موجودہ سائز: 1 مرلہ =',
        sqft: 'مربع فٹ',
    }
};

export const ProfileSelector = React.memo(function ProfileSelector({
    profile,
    setProfile,
    customMarla,
    setCustomMarla,
    marlaSqFt,
    lang,
    colors
}: ProfileSelectorProps) {
    const t = TRANSLATIONS[lang];
    const isUrdu = lang === 'ur';

    const urduStyle = {
        fontFamily: isUrdu ? 'NotoNastaliqUrdu-Regular' : undefined,
        lineHeight: isUrdu ? 24 : undefined,
        textAlign: isUrdu ? 'right' as const : 'left' as const,
    };

    const urduPillStyle = {
        fontFamily: isUrdu ? 'NotoNastaliqUrdu-Regular' : undefined,
        lineHeight: isUrdu ? 20 : undefined,
        paddingBottom: isUrdu ? 4 : 0,
    };

    return (
        <View style={[
            styles.profileCard,
            { backgroundColor: colors.primary + '0a', padding: isUrdu ? 16 : 14 }
        ]}>
            <View style={[styles.profileHeader, isUrdu && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="map-outline" size={18} color={colors.primary} />
                <ThemedText style={[styles.profileTitle, { color: colors.primary, marginLeft: isUrdu ? 0 : 6, marginRight: isUrdu ? 6 : 0 }, urduStyle]}>
                    {t.profileTitle}
                </ThemedText>
            </View>
            <View style={[styles.profileOptions, isUrdu && { flexDirection: 'row-reverse' }]}>
                {(['standard', 'lahore', 'kp', 'custom'] as ProfileType[]).map((p) => (
                    <TouchableOpacity
                        key={p}
                        onPress={() => setProfile(p)}
                        style={[
                            styles.profilePill,
                            {
                                backgroundColor: colors.card,
                                paddingVertical: isUrdu ? 8 : 6,
                                paddingHorizontal: isUrdu ? 14 : 12
                            },
                            profile === p && { backgroundColor: colors.primary }
                        ]}
                    >
                        <ThemedText style={[styles.profilePillText, { color: colors.textSecondary }, profile === p && { color: '#fff', fontWeight: 'bold' }, urduPillStyle]}>
                            {p === 'standard' ? t.govt : p === 'lahore' ? t.lahore : p === 'kp' ? t.kp : t.custom}
                        </ThemedText>
                    </TouchableOpacity>
                ))}
            </View>

            {profile === 'custom' && (
                <View style={[styles.customInputRow, isUrdu && { flexDirection: 'row-reverse' }]}>
                    <ThemedText style={[styles.customLabel, { color: colors.textSecondary, marginRight: isUrdu ? 0 : 8, marginLeft: isUrdu ? 8 : 0 }, urduStyle]}>
                        {t.sqftPerMarla}
                    </ThemedText>
                    <TextInput
                        value={customMarla}
                        onChangeText={setCustomMarla}
                        keyboardType="numeric"
                        style={[
                            styles.customInput,
                            { backgroundColor: colors.card, color: colors.text, height: isUrdu ? 36 : 34 },
                            urduStyle
                        ]}
                    />
                </View>
            )}
            <ThemedText style={[styles.profileSummaryText, { color: colors.textSecondary, textAlign: isUrdu ? 'right' : 'left' }, urduStyle]}>
                {t.currentBase} <ThemedText style={[{ color: colors.primary, fontWeight: '700' }, urduStyle]}>{marlaSqFt} {t.sqft}</ThemedText>
            </ThemedText>
        </View>
    );
});

const styles = StyleSheet.create({
    profileCard: {
        borderRadius: 16,
        marginBottom: 16,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    profileTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    profileOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 10,
    },
    profilePill: {
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profilePillText: {
        fontSize: 12,
    },
    customInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        marginBottom: 6,
    },
    customLabel: {
        fontSize: 13,
    },
    customInput: {
        width: 90,
        borderRadius: 8,
        paddingHorizontal: 8,
        fontSize: 13,
        textAlign: 'center',
    },
    profileSummaryText: {
        fontSize: 12,
        marginTop: 4,
    },
});
