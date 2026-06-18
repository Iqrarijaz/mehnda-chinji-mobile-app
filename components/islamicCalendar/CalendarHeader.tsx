import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themedText';

interface CalendarHeaderProps {
    insetsTop: number;
    colors: any;
    onBack: () => void;
}

export const CalendarHeader = React.memo(({ insetsTop, colors, onBack }: CalendarHeaderProps) => (
    <View style={[styles.header, { paddingTop: insetsTop + 14, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
            activeOpacity={0.7} 
            onPress={onBack} 
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        
        <View style={[styles.logoContainer, { backgroundColor: '#05966910' }]}>
            <Image 
                source={require('@/assets/icons/religious.webp')} 
                style={styles.logo} 
                resizeMode="contain" 
            />
        </View>

        <View style={styles.titleWrapper}>
            <ThemedText style={styles.screenTitle} type="defaultSemiBold">Islamic Calendar</ThemedText>
            <ThemedText style={[styles.screenSub, { color: colors.textSecondary }]}>Hijri & Gregorian System</ThemedText>
        </View>
    </View>
));

CalendarHeader.displayName = 'CalendarHeader';

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    logoContainer: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    logo: {
        width: 22,
        height: 22,
    },
    titleWrapper: {
        flex: 1,
        marginLeft: 12,
    },
    screenTitle: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.2,
    },
    screenSub: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 1,
    },
});
