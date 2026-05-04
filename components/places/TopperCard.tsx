import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

const ACADEMIC_CLASSES = [
    { label: 'Playgroup / Nursery', value: 'playgroup_nursery' },
    { label: 'Prep / Kindergarten', value: 'prep_kindergarten' },
    { label: 'Grade 1', value: 'grade_1' },
    { label: 'Grade 2', value: 'grade_2' },
    { label: 'Grade 3', value: 'grade_3' },
    { label: 'Grade 4', value: 'grade_4' },
    { label: 'Grade 5', value: 'grade_5' },
    { label: 'Grade 6', value: 'grade_6' },
    { label: 'Grade 7', value: 'grade_7' },
    { label: 'Grade 8', value: 'grade_8' },
    { label: 'Grade 9 / Matric Part-I', value: 'grade_9_matric_1' },
    { label: 'Grade 10 / Matric Part-II', value: 'grade_10_matric_2' },
    { label: 'O-Levels', value: 'o_levels' },
    { label: 'A-Levels', value: 'a_levels' },
    { label: 'FSc Pre-Medical', value: 'fsc_pre_medical' },
    { label: 'FSc Pre-Engineering', value: 'fsc_pre_engineering' },
    { label: 'ICS', value: 'ics' },
    { label: 'I.Com', value: 'icom' },
    { label: 'FA', value: 'fa' },
    { label: 'Other', value: 'other' },
];

const getClassLabel = (value: string) =>
    ACADEMIC_CLASSES.find(c => c.value === value)?.label || value;

const capitalize = (str?: string) =>
    str
        ? str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : '';

interface TopperCardProps {
    topper: {
        _id?: string;
        name: string;
        fatherName?: string;
        className?: string;
        passingYear?: string;
        totalMarks?: number;
        obtainedMarks?: number;
        image?: string;
    };
    primaryColor?: string;
}

const TopperCard = React.memo(({ topper, primaryColor = '#3B82F6' }: TopperCardProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const colors = Colors[theme];

    const pct = (topper.totalMarks && topper.totalMarks > 0)
        ? ((topper.obtainedMarks || 0) / topper.totalMarks * 100).toFixed(1)
        : null;
    const pctColor = pct
        ? (parseFloat(pct) >= 80 ? '#10B981' : parseFloat(pct) >= 60 ? '#F59E0B' : '#EF4444')
        : '#94A3B8';

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                {/* Avatar */}
                <View style={styles.avatarWrap}>
                    {topper.image ? (
                        <Image source={{ uri: topper.image }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: primaryColor + '12' }]}>
                            <Ionicons name="person" size={18} color={primaryColor} />
                        </View>
                    )}
                </View>

                {/* Info */}
                <View style={styles.info}>
                    <ThemedText style={[styles.name, { color: colors.text }]}>
                        {capitalize(topper.name)}
                    </ThemedText>
                    
                    <View style={styles.metaRow}>
                        {topper.className ? (
                            <ThemedText style={[styles.metaText, { color: primaryColor }]}>
                                {getClassLabel(topper.className)}
                            </ThemedText>
                        ) : null}
                        {topper.className && topper.passingYear && (
                            <ThemedText style={[styles.metaDot, { color: colors.textSecondary }]}>•</ThemedText>
                        )}
                        {topper.passingYear ? (
                            <ThemedText style={[styles.metaText, { color: colors.textSecondary }]}>
                                {topper.passingYear}
                            </ThemedText>
                        ) : null}
                    </View>

                    {topper.fatherName ? (
                        <ThemedText style={[styles.sub, { color: colors.textSecondary }]}>
                            s/o {capitalize(topper.fatherName)}
                        </ThemedText>
                    ) : null}
                </View>

                {/* Percentage */}
                {pct && (
                    <View style={styles.pctWrap}>
                        <ThemedText style={[styles.pct, { color: pctColor }]}>
                            {pct}%
                        </ThemedText>
                        <ThemedText style={[styles.marks, { color: colors.textSecondary }]}>
                            {topper.obtainedMarks}/{topper.totalMarks}
                        </ThemedText>
                    </View>
                )}
            </View>
        </View>
    );
});

export default TopperCard;

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarWrap: {
        marginRight: 14,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    metaText: {
        fontSize: 11,
        fontWeight: '700',
    },
    metaDot: {
        fontSize: 10,
        marginHorizontal: 4,
    },
    sub: {
        fontSize: 11,
        opacity: 0.6,
    },
    pctWrap: {
        alignItems: 'flex-end',
        marginLeft: 12,
    },
    pct: {
        fontSize: 16,
        fontWeight: '800',
    },
    marks: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 1,
    },
});
