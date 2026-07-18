import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

interface EmergencyContactDetailsProps {
    contacts: Contact[];
}

type ContactIcon =
    | { set: 'ion'; name: keyof typeof Ionicons.glyphMap }
    | { set: 'mci'; name: keyof typeof MaterialCommunityIcons.glyphMap };

const iconForContact = (name?: string): ContactIcon => {
    const n = (name || '').toLowerCase();
    if (n.includes('ambulance')) return { set: 'mci', name: 'ambulance' };
    if (n.includes('rescue')) return { set: 'mci', name: 'lifebuoy' };
    if (n.includes('hospital') || n.includes('clinic')) return { set: 'mci', name: 'hospital-building' };
    if (n.includes('police')) return { set: 'mci', name: 'police-badge' };
    if (n.includes('fire')) return { set: 'ion', name: 'flame' };
    if (n.includes('whatsapp')) return { set: 'ion', name: 'logo-whatsapp' };
    if (n.includes('office')) return { set: 'ion', name: 'business' };
    if (n.includes('emergency') || n.includes('helpline')) return { set: 'ion', name: 'medkit' };
    return { set: 'ion', name: 'call' };
};

function ContactCard({ contact, index }: { contact: Contact; index: number }) {
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
        transform: [{ scale: 1 - pressed.value * 0.025 }],
    }));

    const icon = iconForContact(contact.name);

    return (
        <Animated.View entering={FadeInDown.delay(80 + index * 60).duration(400)}>
            <Animated.View style={pressStyle}>
                <Pressable
                    onPress={handleCall}
                    onPressIn={() => (pressed.value = withTiming(1, { duration: 100 }))}
                    onPressOut={() => (pressed.value = withTiming(0, { duration: 160 }))}
                    style={[
                        styles.card,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.background },
                    ]}
                >
                    <View style={[styles.iconTile, { backgroundColor: `${colors.secondary}16` }]}>
                        {icon.set === 'ion' ? (
                            <Ionicons name={icon.name} size={20} color={colors.secondary} />
                        ) : (
                            <MaterialCommunityIcons name={icon.name} size={20} color={colors.secondary} />
                        )}
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
                        <Ionicons name="call" size={17} color="#FFFFFF" />
                    </View>
                </Pressable>
            </Animated.View>
        </Animated.View>
    );
}

export function EmergencyContactDetails({ contacts }: EmergencyContactDetailsProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    if (!contacts || contacts.length === 0) return null;

    return (
        <View style={styles.section}>
            <View style={styles.headingRow}>
                <Ionicons name="call" size={12} color={colors.secondary} />
                <ThemedText style={[styles.heading, { color: colors.textSecondary }]}>
                    Emergency Contacts
                </ThemedText>
                <View style={[styles.countPill, { backgroundColor: `${colors.lime}22` }]}>
                    <ThemedText style={[styles.countText, { color: colors.primary }]}>
                        Tap to call
                    </ThemedText>
                </View>
            </View>
            <View style={styles.list}>
                {contacts.map((contact, idx) => (
                    <ContactCard key={idx} contact={contact} index={idx} />
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
    countPill: {
        marginLeft: 'auto',
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: 999,
    },
    countText: {
        fontSize: 9.5,
        fontWeight: '800',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    list: {
        gap: 8,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 18,
        gap: 12,
        minHeight: 64,
    },
    iconTile: {
        width: 44,
        height: 44,
        borderRadius: 15,
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
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.4,
    },
    callButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
