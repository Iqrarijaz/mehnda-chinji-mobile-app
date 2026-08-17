import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Platform,
    KeyboardAvoidingView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import Toast from 'react-native-toast-message';

import { ScreenHeader } from '@/components/common/ScreenHeader';
import { FormInput } from '@/components/common/FormInput';
import { SubmitButton } from '@/components/common/SubmitButton';
import { CancelButton } from '@/components/common/CancelButton';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import { ModalPickerTrigger } from '@/components/common/ModalPickerTrigger';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCricketAPI } from '@/hooks/useCricketAPI';
import citiesDataFallback from '@/data/cities.json';
import { Organizer, Guest } from '@/types/cricket';

export default function CreateTournamentScreen() {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const { user } = useAuth();
    const isCricketAdmin = !!user?.user?.isCricketAdmin;

    // Permission Guard: Redirect non-admins
    useEffect(() => {
        if (!isCricketAdmin) {
            Toast.show({
                type: 'error',
                text1: 'Access Denied',
                text2: 'Only Cricket Admins can create tournaments.'
            });
            router.replace('/cricket' as any);
        }
    }, [isCricketAdmin, router]);

    const { createTournamentMutation } = useCricketAPI();

    // Form State
    const [name, setName] = useState('');
    const [city, setCity] = useState('');
    const [venue, setVenue] = useState('');
    const [lat, setLat] = useState('31.5204'); // Default Lahore coords
    const [lng, setLng] = useState('74.3587');
    const [format, setFormat] = useState<'T10' | 'T15' | 'T20' | 'CUSTOM'>('T10');
    const [defaultMaxOvers, setDefaultMaxOvers] = useState('10');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

    // Prizes State
    const [winnerPrize, setWinnerPrize] = useState('');
    const [runnerUpPrize, setRunnerUpPrize] = useState('');
    const [manOfSeriesPrize, setManOfSeriesPrize] = useState('');

    // Dynamic Lists State
    const [bannerImage, setBannerImage] = useState<string | null>(null);
    const [organizers, setOrganizers] = useState<Organizer[]>([{ name: '', phone: '', role: 'Head Organizer' }]);
    const [guests, setGuests] = useState<Guest[]>([]);

    const [cityPickerVisible, setCityPickerVisible] = useState(false);

    // Pick & Compress Banner Image
    const handlePickBanner = useCallback(async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.7
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const manipResult = await ImageManipulator.manipulateAsync(
                result.assets[0].uri,
                [{ resize: { width: 1080 } }],
                { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
            );
            setBannerImage(manipResult.uri);
        }
    }, []);

    // Organizers Helpers
    const handleAddOrganizer = () => {
        setOrganizers(prev => [...prev, { name: '', phone: '', role: 'Organizer' }]);
    };
    const handleUpdateOrganizer = (idx: number, field: keyof Organizer, val: string) => {
        setOrganizers(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], [field]: val };
            return next;
        });
    };
    const handleRemoveOrganizer = (idx: number) => {
        setOrganizers(prev => prev.filter((_, i) => i !== idx));
    };

    // Guests Helpers
    const handleAddGuest = () => {
        setGuests(prev => [...prev, { name: '', title: 'Chief Guest' }]);
    };
    const handleUpdateGuest = (idx: number, field: keyof Guest, val: string) => {
        setGuests(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], [field]: val };
            return next;
        });
    };
    const handleRemoveGuest = (idx: number) => {
        setGuests(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = () => {
        if (!name.trim() || !city.trim() || !venue.trim() || !winnerPrize.trim() || !runnerUpPrize.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Required Fields',
                text2: 'Please fill name, city, venue, and prize details.'
            });
            return;
        }

        const payload = {
            name: name.trim(),
            city: city.trim(),
            venue: venue.trim(),
            lat: parseFloat(lat) || 31.5204,
            lng: parseFloat(lng) || 74.3587,
            format,
            defaultMaxOvers: parseInt(defaultMaxOvers) || 10,
            startDate,
            bannerImage,
            prizes: {
                winnerPrize: winnerPrize.trim(),
                runnerUpPrize: runnerUpPrize.trim(),
                manOfTheSeriesPrize: manOfSeriesPrize.trim() || undefined
            },
            organizers: organizers.filter(o => o.name.trim()),
            guests: guests.filter(g => g.name.trim())
        };

        createTournamentMutation.mutate(payload, {
            onSuccess: () => {
                router.replace('/cricket' as any);
            }
        });
    };

    if (!isCricketAdmin) return null;

    return (
        <ErrorBoundary>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ScreenHeader hero={{ title: "Create Tournament" }} showMenuIcon={false} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Banner Image Picker */}
                        <TouchableOpacity
                            style={[styles.bannerPicker, { backgroundColor: colors.cardBg }]}
                            onPress={handlePickBanner}
                            activeOpacity={0.8}
                        >
                            {bannerImage ? (
                                <Image source={{ uri: bannerImage }} style={styles.bannerImage} />
                            ) : (
                                <View style={styles.bannerPlaceholder}>
                                    <Ionicons name="camera-outline" size={32} color={colors.primary} />
                                    <ThemedText style={[styles.bannerText, { color: colors.textSecondary }]}>
                                        Upload Tournament Banner (Optional)
                                    </ThemedText>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Basic Details */}
                        <FormInput label="TOURNAMENT NAME" required icon="trophy-outline" placeholder="e.g. Lahore Premier League T10" value={name} onChangeText={setName} />
                        
                        <ModalPickerTrigger
                            label="CITY"
                            required
                            icon="location-outline"
                            value={city}
                            placeholder="Select City"
                            onPress={() => setCityPickerVisible(true)}
                        />

                        <FormInput label="VENUE / GROUND" required icon="business-outline" placeholder="e.g. Gaddafi Stadium Ground 2" value={venue} onChangeText={setVenue} />

                        {/* Format & Overs */}
                        <View style={styles.rowTwo}>
                            <View style={{ flex: 1 }}>
                                <FormInput label="DEFAULT OVERS" required icon="options-outline" keyboardType="numeric" placeholder="10" value={defaultMaxOvers} onChangeText={setDefaultMaxOvers} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <FormInput label="START DATE" required icon="calendar-outline" placeholder="YYYY-MM-DD" value={startDate} onChangeText={setStartDate} />
                            </View>
                        </View>

                        {/* Prizes Section */}
                        <View style={styles.sectionHeader}>
                            <Ionicons name="ribbon-outline" size={18} color={colors.secondary} />
                            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Prizes & Rewards</ThemedText>
                        </View>

                        <FormInput label="WINNER PRIZE" required icon="trophy" placeholder="e.g. ₨100,000 Cash + Winner Trophy" value={winnerPrize} onChangeText={setWinnerPrize} />
                        <FormInput label="RUNNER-UP PRIZE" required icon="medal-outline" placeholder="e.g. ₨50,000 Cash + Runner Trophy" value={runnerUpPrize} onChangeText={setRunnerUpPrize} />
                        <FormInput label="MAN OF THE SERIES (OPTIONAL)" icon="star-outline" placeholder="e.g. ₨10,000 + Trophy" value={manOfSeriesPrize} onChangeText={setManOfSeriesPrize} />

                        {/* Organizers Section */}
                        <View style={styles.sectionHeader}>
                            <Ionicons name="people-outline" size={18} color={colors.primary} />
                            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Organizers</ThemedText>
                        </View>

                        {organizers.map((org, idx) => (
                            <View key={idx} style={[styles.dynamicCard, { backgroundColor: colors.cardBg }]}>
                                <View style={styles.dynamicRow}>
                                    <View style={{ flex: 1 }}>
                                        <FormInput placeholder="Organizer Name" value={org.name} onChangeText={(val) => handleUpdateOrganizer(idx, 'name', val)} containerStyle={{ marginBottom: 0 }} />
                                    </View>
                                    <TouchableOpacity onPress={() => handleRemoveOrganizer(idx)}>
                                        <Ionicons name="trash-outline" size={18} color={colors.danger} />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.dynamicRow}>
                                    <View style={{ flex: 1 }}>
                                        <FormInput placeholder="Role (e.g. Head Organizer)" value={org.role} onChangeText={(val) => handleUpdateOrganizer(idx, 'role', val)} containerStyle={{ marginBottom: 0 }} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <FormInput placeholder="Phone (Optional)" keyboardType="phone-pad" value={org.phone || ''} onChangeText={(val) => handleUpdateOrganizer(idx, 'phone', val)} containerStyle={{ marginBottom: 0 }} />
                                    </View>
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity style={[styles.addBtn, { backgroundColor: `${colors.primary}15` }]} onPress={handleAddOrganizer}>
                            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                            <ThemedText style={[styles.addBtnText, { color: colors.primary }]}>+ Add Organizer</ThemedText>
                        </TouchableOpacity>

                        {/* Chief Guests Section */}
                        <View style={styles.sectionHeader}>
                            <Ionicons name="star-half-outline" size={18} color={colors.secondary} />
                            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Chief Guests</ThemedText>
                        </View>

                        {guests.map((g, idx) => (
                            <View key={idx} style={[styles.dynamicCard, { backgroundColor: colors.cardBg }]}>
                                <View style={styles.dynamicRow}>
                                    <View style={{ flex: 1 }}>
                                        <FormInput placeholder="Guest Name" value={g.name} onChangeText={(val) => handleUpdateGuest(idx, 'name', val)} containerStyle={{ marginBottom: 0 }} />
                                    </View>
                                    <TouchableOpacity onPress={() => handleRemoveGuest(idx)}>
                                        <Ionicons name="trash-outline" size={18} color={colors.danger} />
                                    </TouchableOpacity>
                                </View>
                                <FormInput placeholder="Title / Designation (e.g. Chief Guest - MPA)" value={g.title} onChangeText={(val) => handleUpdateGuest(idx, 'title', val)} containerStyle={{ marginBottom: 0 }} />
                            </View>
                        ))}

                        <TouchableOpacity style={[styles.addBtn, { backgroundColor: `${colors.secondary}15` }]} onPress={handleAddGuest}>
                            <Ionicons name="add-circle-outline" size={18} color={colors.secondary} />
                            <ThemedText style={[styles.addBtnText, { color: colors.secondary }]}>+ Add Chief Guest</ThemedText>
                        </TouchableOpacity>

                        {/* Actions Row (Cancel & Submit) */}
                        <View style={styles.actionRow}>
                            <CancelButton
                                title="Cancel"
                                onPress={() => router.back()}
                                style={{ backgroundColor: isDark ? '#334155' : '#F1F5F9', height: Platform.OS === 'android' ? 46 : 50 }}
                            />
                            <SubmitButton
                                title="Create Tournament"
                                onPress={handleSubmit}
                                isLoading={createTournamentMutation.isPending}
                                style={{ width: 180, height: Platform.OS === 'android' ? 46 : 50, borderRadius: 28 }}
                            />
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* City Picker */}
                <SearchableDropdown visible={cityPickerVisible} onClose={() => setCityPickerVisible(false)} onSelect={(selected) => { setCity(selected); setCityPickerVisible(false); }} currentValue={city} options={citiesDataFallback} title="Select City" placeholder="Search city..." />
            </View>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 14, gap: 10, paddingBottom: 40 },
    bannerPicker: { height: 120, borderRadius: Layout.borderRadius, borderWidth: 0, overflow: 'hidden', marginBottom: 4 },
    bannerImage: { width: '100%', height: '100%' },
    bannerPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6 },
    bannerText: { fontSize: 12, fontWeight: '600' },
    inputRow: { marginBottom: 6 },
    rowTwo: { flexDirection: 'row', gap: 10 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    sectionTitle: { fontSize: 13, fontWeight: '700' },
    dynamicCard: { padding: 10, borderRadius: Layout.borderRadius - 4, borderWidth: 0, gap: 8, marginBottom: 6 },
    dynamicRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: Platform.OS === 'android' ? 46 : 50, borderRadius: Layout.borderRadius - 6, gap: 6, marginBottom: 6, marginTop: 2 },
    addBtnText: { fontSize: 12, fontWeight: '700' },
    actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 12 }
});
