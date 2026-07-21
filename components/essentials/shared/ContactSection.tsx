import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Linking, TouchableOpacity, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { capitalizeString } from '@/utils/string';
import { toWhatsAppNumber } from '@/utils/phone';
import { PressableScale } from './PressableScale';
import { SectionHeading } from './SectionHeading';
import { Layout } from '@/constants/layout';

export interface ContactItem {
    name?: string;
    number: string;
    description?: string;
}

interface ContactSectionProps {
    contacts: ContactItem[];
    title?: string;
    /** Optional heading pill, e.g. "Tap to call". */
    hint?: string;
    /** "large" widens cards and numbers for urgent, glanceable use. */
    size?: 'regular' | 'large';
    /** Color family for the leading icon tile. */
    iconTint?: 'primary' | 'secondary';
    /** Fired before a call/whatsapp action opens (e.g. to track an inquiry). */
    onContactAction?: (method: 'call' | 'whatsapp', contact: ContactItem) => void;
}

type ContactIcon =
    | { set: 'ion'; name: keyof typeof Ionicons.glyphMap }
    | { set: 'mci'; name: keyof typeof MaterialCommunityIcons.glyphMap };

/** Maps a contact label to an icon; unknown labels fall back to a phone. */
const iconForContact = (name?: string): ContactIcon => {
    const n = (name || '').toLowerCase();
    if (n.includes('whatsapp')) return { set: 'ion', name: 'logo-whatsapp' };
    if (n.includes('ambulance')) return { set: 'mci', name: 'ambulance' };
    if (n.includes('rescue')) return { set: 'mci', name: 'lifebuoy' };
    if (n.includes('hospital') || n.includes('clinic')) return { set: 'mci', name: 'hospital-building' };
    if (n.includes('police')) return { set: 'mci', name: 'police-badge' };
    if (n.includes('fire')) return { set: 'ion', name: 'flame' };
    if (n.includes('doctor') || n.includes('dr ') || n.includes('dr.')) return { set: 'mci', name: 'stethoscope' };
    if (n.includes('pharmacy') || n.includes('medical store')) return { set: 'mci', name: 'pill' };
    if (n.includes('lab')) return { set: 'mci', name: 'test-tube' };
    if (n.includes('emergency') || n.includes('helpline')) return { set: 'ion', name: 'medkit' };
    if (n.includes('reception') || n.includes('appointment') || n.includes('desk')) return { set: 'ion', name: 'calendar' };
    if (n.includes('admission')) return { set: 'ion', name: 'school' };
    if (n.includes('principal') || n.includes('head')) return { set: 'mci', name: 'account-tie' };
    if (n.includes('admin')) return { set: 'ion', name: 'briefcase' };
    if (n.includes('office')) return { set: 'ion', name: 'business' };
    if (n.includes('mobile') || n.includes('cell')) return { set: 'ion', name: 'phone-portrait' };
    if (n.includes('email') || n.includes('mail')) return { set: 'ion', name: 'mail' };
    if (n.includes('landline') || n.includes('ptcl')) return { set: 'ion', name: 'call' };
    return { set: 'ion', name: 'call' };
};

const ContactCard = React.memo(({
    contact,
    index,
    size,
    iconTint,
    onContactAction }: {
    contact: ContactItem;
    index: number;
    size: 'regular' | 'large';
    iconTint: 'primary' | 'secondary';
    onContactAction?: (method: 'call' | 'whatsapp', contact: ContactItem) => void;
}) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const large = size === 'large';
    const tint = iconTint === 'secondary' ? colors.secondary : colors.primary;

    const handleCall = () => {
        if (contact.number) {
            onContactAction?.('call', contact);
            Linking.openURL(`tel:${contact.number}`);
        } else {
            Toast.show({
                type: 'error',
                text1: 'No Phone',
                text2: 'Phone number not available.' });
        }
    };

    const waNumber = toWhatsAppNumber(contact.number);
    const handleWhatsApp = () => {
        if (!waNumber) return;
        onContactAction?.('whatsapp', contact);
        Linking.openURL(`https://wa.me/${waNumber}`).catch(() => {
            Toast.show({
                type: 'error',
                text1: 'WhatsApp unavailable',
                text2: 'Could not open WhatsApp for this number.' });
        });
    };

    const icon = iconForContact(contact.name);
    const iconSize = large ? 20 : 18;

    return (
        <Animated.View entering={FadeInDown.delay(80 + index * 60).duration(400)}>
            <PressableScale
                onPress={handleCall}
                intensity={0.025}
                style={[
                    styles.card,
                    large && styles.cardLarge,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.background },
                ]}
            >
                <View
                    style={[
                        styles.iconTile,
                        large && styles.iconTileLarge,
                        { backgroundColor: `${tint}14` },
                    ]}
                >
                    {icon.set === 'ion' ? (
                        <Ionicons name={icon.name} size={iconSize} color={tint} />
                    ) : (
                        <MaterialCommunityIcons name={icon.name} size={iconSize} color={tint} />
                    )}
                </View>
                <View style={styles.info}>
                    {contact.name ? (
                        <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                            {capitalizeString(contact.name)}
                        </ThemedText>
                    ) : null}
                    <ThemedText
                        style={[
                            large ? styles.numberLarge : styles.number,
                            { color: colors.text },
                        ]}
                    >
                        {contact.number}
                    </ThemedText>
                    {contact.description ? (
                        <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
                            {contact.description}
                        </ThemedText>
                    ) : null}
                </View>
                <View style={styles.actions}>
                    {waNumber ? (
                        <TouchableOpacity
                            onPress={handleWhatsApp}
                            activeOpacity={0.85}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            style={[
                                styles.actionBtn,
                                large && styles.actionBtnLarge,
                                { backgroundColor: colors.lime },
                            ]}
                        >
                            <Ionicons name="logo-whatsapp" size={large ? 18 : 17} color="#FFFFFF" />
                        </TouchableOpacity>
                    ) : null}
                    <View
                        style={[
                            styles.actionBtn,
                            large && styles.actionBtnLarge,
                            { backgroundColor: colors.primary },
                        ]}
                    >
                        <Ionicons name="call" size={large ? 17 : 16} color="#FFFFFF" />
                    </View>
                </View>
            </PressableScale>
        </Animated.View>
    );
});

ContactCard.displayName = 'ContactCard';

/**
 * Reusable contact list shared by every category detail page. Rows are
 * whole-card call targets; calling behavior (tel: link + toast) is identical
 * to the original implementation.
 */
export const ContactSection = React.memo(({
    contacts,
    title = 'Contact Details',
    hint,
    size = 'regular',
    iconTint = 'primary',
    onContactAction }: ContactSectionProps) => {
    if (!contacts || contacts.length === 0) return null;

    return (
        <View style={styles.section}>
            <SectionHeading icon="call" label={title} pill={hint} />
            <View style={styles.list}>
                {contacts.map((contact, idx) => (
                    <ContactCard
                        key={idx}
                        contact={contact}
                        index={idx}
                        size={size}
                        iconTint={iconTint}
                        onContactAction={onContactAction}
                    />
                ))}
            </View>
        </View>
    );
});

ContactSection.displayName = 'ContactSection';

const styles = StyleSheet.create({
    section: {
        gap: 8 },
    list: {
        gap: 8 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: Layout.borderRadius,
        gap: 12 },
    cardLarge: {
        padding: 12,
        borderRadius: Layout.borderRadius,
        minHeight: 64 },
    iconTile: {
        width: 40,
        height: 40,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    iconTileLarge: {
        width: 44,
        height: 44,
        borderRadius: Layout.borderRadius },
    info: {
        flex: 1 },
    label: {
        fontSize: 10.5,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        marginBottom: 2 },
    number: {
        fontSize: 14.5,
        fontWeight: '700',
        letterSpacing: 0.3 },
    numberLarge: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.4 },
    description: {
        fontSize: 11,
        marginTop: 1 },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8 },
    actionBtn: {
        width: 38,
        height: 38,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    actionBtnLarge: {
        width: 42,
        height: 42,
        borderRadius: Layout.borderRadius } });
