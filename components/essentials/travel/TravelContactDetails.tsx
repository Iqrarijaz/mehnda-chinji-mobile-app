import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { capitalizeString } from '@/utils/string';

interface Contact {
    name?: string;
    number: string;
}

interface TravelContactDetailsProps {
    contacts: Contact[];
}

type IoniconName = keyof typeof Ionicons.glyphMap;

const iconForContact = (name?: string): IoniconName => {
    const n = (name || '').toLowerCase();
    if (n.includes('whatsapp')) return 'logo-whatsapp';
    if (n.includes('office')) return 'business';
    if (n.includes('mobile') || n.includes('cell')) return 'phone-portrait';
    if (n.includes('email') || n.includes('mail')) return 'mail';
    return 'call';
};

function ContactRow({ contact, index }: { contact: Contact; index: number }) {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const pressed = useSharedValue(0);

    const handleCall = () => {
        if (contact.number) {
            Linking.openURL(`tel:${contact.number}`);
        } else {
            Toast.show({
                type: 'error',
                text1: 'No Phone',
                text2: 'Phone number not available.',
            });
        }
    };

    const pressStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1 - pressed.value * 0.03 }],
    }));

    return (
        <Animated.View entering={FadeInDown.delay(80 + index * 60).duration(400)}>
            <Animated.View style={pressStyle}>
                <Pressable
                    onPress={handleCall}
                    onPressIn={() => (pressed.value = withTiming(1, { duration: 110 }))}
                    onPressOut={() => (pressed.value = withTiming(0, { duration: 160 }))}
                    style={[
                        styles.row,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.background },
                    ]}
                >
                    <View style={[styles.iconTile, { backgroundColor: `${colors.primary}12` }]}>
                        <Ionicons
                            name={iconForContact(contact.name)}
                            size={18}
                            color={colors.primary}
                        />
                    </View>
                    <View style={styles.info}>
                        {contact.name ? (
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                                {capitalizeString(contact.name)}
                            </ThemedText>
                        ) : null}
                        <ThemedText style={[styles.number, { color: colors.text }]}>
                            {contact.number}
                        </ThemedText>
                    </View>
                    <View style={[styles.callButton, { backgroundColor: colors.lime }]}>
                        <Ionicons name="call" size={16} color="#FFFFFF" />
                    </View>
                </Pressable>
            </Animated.View>
        </Animated.View>
    );
}

export function TravelContactDetails({ contacts }: TravelContactDetailsProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    if (!contacts || contacts.length === 0) return null;

    return (
        <View style={styles.section}>
            <View style={styles.headingRow}>
                <Ionicons name="call" size={12} color={colors.secondary} />
                <ThemedText style={[styles.heading, { color: colors.textSecondary }]}>
                    Contact Details
                </ThemedText>
            </View>
            <View style={styles.list}>
                {contacts.map((contact, idx) => (
                    <ContactRow key={idx} contact={contact} index={idx} />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        gap: 8,
    },
    headingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    heading: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    list: {
        gap: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 16,
        gap: 12,
    },
    iconTile: {
        width: 40,
        height: 40,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
    },
    label: {
        fontSize: 10.5,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        marginBottom: 2,
    },
    number: {
        fontSize: 14.5,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    callButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
