import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    BackHandler,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { AnalyticsEvents, analyticsService } from '@/analytics';
import { BUSINESS_QUERY_KEYS, registerBusiness, updateBusiness } from '@/apis/business';
import { getAuthenticatedConfiguration, CONFIG_QUERY_KEYS } from '@/apis/configuration';
import { ProfessionPicker } from '@/components/common/ProfessionPicker';
import { TimePicker } from '@/components/common/TimePicker';
import { ThankYouModal } from '@/components/common/ThankYou';
import { ThemedText } from '@/components/ThemedText';
import { LoaderOverlay } from '@/components/common/LoaderOverlay';
import { FormInput } from '@/components/common/FormInput';
import { SubmitButton } from '@/components/common/SubmitButton';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const BusinessRegistrationScreen = () => {
    const router = useRouter();
    const { editData: editDataParam } = useLocalSearchParams<{ editData?: string }>();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const queryClient = useQueryClient();

    const editData = editDataParam ? JSON.parse(editDataParam) : null;

    const { data: configData } = useQuery({
        queryKey: CONFIG_QUERY_KEYS.professions,
        queryFn: () => getAuthenticatedConfiguration('PROFESSIONS'),
        staleTime: 1000 * 60 * 60 * 24,
    });

    const professionsList = configData?.data?.data || [];

    const [form, setForm] = useState({
        name: '',
        description: '',
        phone: '',
        address: '',
        category: null as any,
        tags: [] as { eng: string; ur: string }[],
        timing: '',
    });

    const [professionModalVisible, setProfessionModalVisible] = useState(false);
    const [showThankYou, setShowThankYou] = useState(false);

    const [openTime, setOpenTime] = useState('09:00 AM');
    const [closeTime, setCloseTime] = useState('09:00 PM');
    const [openTimePickerVisible, setOpenTimePickerVisible] = useState(false);
    const [closeTimePickerVisible, setCloseTimePickerVisible] = useState(false);

    const selectedProfessionInfo = professionsList.find(
        (p: any) => p && p.name_eng?.toLowerCase() === form.category?.name_eng?.toLowerCase()
    );
    const availableTags = selectedProfessionInfo?.tags || form.category?.tags || [];

    const handleGoBack = () => {
        router.replace('/(drawer)/(tabs)/business');
        return true;
    };

    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                handleGoBack();
                return true;
            };

            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [])
    );

    useEffect(() => {
        if (!editData && user?.user?.role !== 'APP_ADMIN') {
            import('@/ads/interstitial.service').then(({ default: InterstitialService }) => {
                InterstitialService.getInstance().load();
            });
        }
        if (editData) {
            let initialOpenTime = '09:00 AM';
            let initialCloseTime = '09:00 PM';
            if (editData.timing && editData.timing.includes(' - ')) {
                const parts = editData.timing.split(' - ');
                if (parts[0] && parts[1]) {
                    initialOpenTime = parts[0];
                    initialCloseTime = parts[1];
                }
            }
            setOpenTime(initialOpenTime);
            setCloseTime(initialCloseTime);

            setForm({
                name: editData.name || '',
                description: editData.description || '',
                phone: editData.phone || '',
                address: editData.address || '',
                category: {
                    name_eng: editData.categoryEn,
                    name_ur: editData.categoryUr,
                    icon: editData.logo || (editData.images && editData.images.length > 0 ? editData.images[0] : undefined)
                } as any,
                tags: editData.tags || [],
                timing: editData.timing || '',
            });
        } else {
            setOpenTime('09:00 AM');
            setCloseTime('09:00 PM');
            setForm({
                name: '',
                description: '',
                phone: user?.user?.phone || '',
                address: user?.user?.address || user?.user?.village || '',
                category: null,
                tags: [],
                timing: '',
            });
        }
    }, [editDataParam, user]);

    const registerMutation = useMutation({
        mutationFn: registerBusiness,
        onSuccess: (res: any) => {
            if (res.success) {
                analyticsService.trackEvent(AnalyticsEvents.BUSINESS_REGISTRATION_SUCCESS, { action: 'create' });
                queryClient.invalidateQueries({ queryKey: BUSINESS_QUERY_KEYS.myBusiness() });
                Toast.show({ type: 'success', text1: 'Success', text2: 'Business registered!' });
                setShowThankYou(true);
            }
        },
        onError: (err: any) => {
            Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Registration failed' });
        }
    });

    const updateMutation = useMutation({
        mutationFn: updateBusiness,
        onSuccess: (res: any) => {
            if (res.success) {
                analyticsService.trackEvent(AnalyticsEvents.BUSINESS_REGISTRATION_SUCCESS, { action: 'update' });
                queryClient.invalidateQueries({ queryKey: BUSINESS_QUERY_KEYS.myBusiness() });
                Toast.show({ type: 'success', text1: 'Success', text2: 'Business updated!' });
                handleGoBack();
            }
        },
        onError: (err: any) => {
            Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Update failed' });
        }
    });

    const handleSubmit = () => {
        const { name, category, phone, address } = form;

        if (!name || !category || !phone || !address) {
            Toast.show({ type: 'error', text1: 'Fields Required', text2: 'Please fill all fields marked with *' });
            return;
        }

        const payload = {
            name,
            categoryEn: category.name_eng,
            categoryUr: category.name_ur,
            description: form.description,
            phone,
            address,
            logo: category.icon || null,
            tags: form.tags.map((t: any) => ({ eng: t.eng, ur: t.ur })),
            timing: `${openTime} - ${closeTime}`,
        };

        if (editData) {
            updateMutation.mutate({ ...payload, businessId: editData._id });
        } else {
            registerMutation.mutate(payload);
        }
    };

    const isPending = registerMutation.isPending || updateMutation.isPending;

    const handleThankYouClose = () => {
        setShowThankYou(false);
        handleGoBack();
        if (user?.user?.role !== 'APP_ADMIN') {
            import('@/ads/interstitial.service').then(({ default: InterstitialService }) => {
                InterstitialService.getInstance().show(true);
            });
        }
    };

    return (
        <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{
                headerShown: false,
                gestureEnabled: true,
                animation: 'slide_from_right'
            }} />

            <ThankYouModal
                visible={showThankYou}
                onClose={handleThankYouClose}
                animationSource={require('@/public/json/onboarding3.json')}
                animationWidth={260}
                animationHeight={200}
            >
                <ThemedText style={{ fontSize: 14, textAlign: 'center', lineHeight: 22, color: colors.textSecondary }}>
                    Dear <ThemedText style={{ fontWeight: 'bold', color: colors.text }}>{user?.user?.name ? user.user.name.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : 'Entrepreneur'}</ThemedText>, thank you for registering! Our team will review and approve your business shortly.
                </ThemedText>
            </ThankYouModal>

            {/* ── Hero Header ─────────────────────────────────────────── */}
            <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary }]} />

                {/* Nav row */}
                <View style={[styles.headerTop, { paddingTop: insets.top + 8 }]}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Animated.View entering={FadeIn.delay(200).duration(400)} style={{ flex: 1, alignItems: 'center' }}>
                        <ThemedText style={styles.headerNavTitle}>
                            {editData ? 'Update Business' : 'Register Business'}
                        </ThemedText>
                    </Animated.View>
                    <View style={{ width: 42 }} />
                </View>

                {/* Hero icon + text */}
                <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.heroContent}>
                    <View style={styles.heroIconWrap}>
                        <Ionicons name="storefront" size={32} color="#0D9488" />
                    </View>
                    <ThemedText style={styles.heroTitle}>
                        {editData ? 'Update Your Listing' : 'Grow Your Business'}
                    </ThemedText>
                    <ThemedText style={styles.heroSubtitle}>
                        Fill in the details below to list your business in the community directory
                    </ThemedText>
                </Animated.View>
            </Animated.View>

            {/* ── Form ────────────────────────────────────────────────── */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: Platform.OS === 'android' ? 80 : 60 }
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.formSection}>

                        {/* Business Name */}
                        <FormInput
                            delay={200}
                            label="BUSINESS NAME"
                            required
                            icon="storefront-outline"
                            placeholder="Your business name"
                            value={form.name}
                            onChangeText={(text) => setForm(prev => ({ ...prev, name: text }))}
                        />

                        {/* Category */}
                        <Animated.View entering={FadeInDown.delay(250)} style={styles.inputField}>
                            <ThemedText style={[styles.label, { color: colors.text }]}>
                                CATEGORY <ThemedText style={styles.required}>*</ThemedText>
                            </ThemedText>
                            <TouchableOpacity
                                style={[styles.dropdownTrigger, {
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)',
                                    height: Platform.OS === 'android' ? 48 : 52,
                                }]}
                                onPress={() => setProfessionModalVisible(true)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.triggerContent}>
                                    <Ionicons
                                        name="apps-outline"
                                        size={18}
                                        color={form.category ? colors.primary : colors.icon}
                                        style={{ marginRight: 10 }}
                                    />
                                    <ThemedText style={[
                                        styles.triggerText,
                                        { color: form.category ? colors.text : colors.icon, fontSize: 14 }
                                    ]}>
                                        {form.category
                                            ? `${form.category.name_eng} - ${form.category.name_ur}`
                                            : 'Select category'}
                                    </ThemedText>
                                </View>
                                <Ionicons name="chevron-down" size={16} color={colors.icon} />
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Address */}
                        <FormInput
                            delay={300}
                            label="ADDRESS"
                            required
                            icon="map-outline"
                            placeholder="Shop #, Street, Area"
                            value={form.address}
                            onChangeText={(text) => setForm(prev => ({ ...prev, address: text }))}
                        />

                        {/* Phone */}
                        <FormInput
                            delay={350}
                            label="PRIMARY PHONE"
                            required
                            icon="call-outline"
                            placeholder="e.g. 03xx xxxxxxx"
                            value={form.phone}
                            onChangeText={(text) => setForm(prev => ({ ...prev, phone: text }))}
                            keyboardType="phone-pad"
                        />

                        {/* Timings */}
                        <Animated.View entering={FadeInDown.delay(400)} style={styles.inputField}>
                            <ThemedText style={[styles.label, { color: colors.text }]}>BUSINESS TIMINGS</ThemedText>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                {/* Open */}
                                <View style={{ flex: 1 }}>
                                    <ThemedText style={[styles.subLabel, { color: colors.icon }]}>OPENS AT</ThemedText>
                                    <TouchableOpacity
                                        style={[styles.dropdownTrigger, {
                                            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)',
                                            height: Platform.OS === 'android' ? 48 : 52,
                                        }]}
                                        onPress={() => setOpenTimePickerVisible(true)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.triggerContent}>
                                            <Ionicons name="time-outline" size={18} color={colors.icon} style={{ marginRight: 8 }} />
                                            <ThemedText style={[styles.triggerText, { color: colors.text, fontSize: 14 }]}>
                                                {openTime}
                                            </ThemedText>
                                        </View>
                                        <Ionicons name="chevron-down" size={16} color={colors.icon} />
                                    </TouchableOpacity>
                                </View>
                                {/* Close */}
                                <View style={{ flex: 1 }}>
                                    <ThemedText style={[styles.subLabel, { color: colors.icon }]}>CLOSES AT</ThemedText>
                                    <TouchableOpacity
                                        style={[styles.dropdownTrigger, {
                                            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)',
                                            height: Platform.OS === 'android' ? 48 : 52,
                                        }]}
                                        onPress={() => setCloseTimePickerVisible(true)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.triggerContent}>
                                            <Ionicons name="time-outline" size={18} color={colors.icon} style={{ marginRight: 8 }} />
                                            <ThemedText style={[styles.triggerText, { color: colors.text, fontSize: 14 }]}>
                                                {closeTime}
                                            </ThemedText>
                                        </View>
                                        <Ionicons name="chevron-down" size={16} color={colors.icon} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Animated.View>

                        {/* Tags */}
                        {availableTags && availableTags.length > 0 && (
                            <Animated.View entering={FadeInDown.delay(450)} style={styles.inputField}>
                                <ThemedText style={[styles.label, { color: colors.text }]}>SELECT SERVICES / TAGS</ThemedText>
                                <View style={styles.tagsContainer}>
                                    {availableTags.map((tag: any) => {
                                        const isSelected = form.tags.some((t: any) => t.eng?.toLowerCase() === tag.eng?.toLowerCase());
                                        return (
                                            <TouchableOpacity
                                                key={tag.eng}
                                                style={[
                                                    styles.tagChip,
                                                    {
                                                        backgroundColor: isSelected
                                                            ? colors.primary
                                                            : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)'),
                                                    }
                                                ]}
                                                onPress={() => {
                                                    if (isSelected) {
                                                        setForm(prev => ({
                                                            ...prev,
                                                            tags: prev.tags.filter((t: any) => t.eng?.toLowerCase() !== tag.eng?.toLowerCase())
                                                        }));
                                                    } else {
                                                        setForm(prev => ({
                                                            ...prev,
                                                            tags: [...prev.tags, tag]
                                                        }));
                                                    }
                                                }}
                                                activeOpacity={0.8}
                                            >
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                    {isSelected && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                                                    <ThemedText style={[
                                                        styles.tagChipText,
                                                        { color: isSelected ? '#FFFFFF' : colors.text, fontWeight: isSelected ? '700' : '600' }
                                                    ]}>
                                                        {tag.eng} | {tag.ur}
                                                    </ThemedText>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </Animated.View>
                        )}

                        {/* Buttons row — Cancel left | Register right */}
                        <Animated.View entering={FadeInDown.delay(500)} style={styles.buttonsRow}>
                            <TouchableOpacity
                                onPress={handleGoBack}
                                style={[styles.cancelButton, { borderColor: colors.border }]}
                                activeOpacity={0.7}
                            >
                                <ThemedText style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</ThemedText>
                            </TouchableOpacity>

                            <SubmitButton
                                title={editData ? 'Update' : 'Register'}
                                onPress={handleSubmit}
                                isLoading={isPending}
                                style={{ width: 160, height: 40, borderRadius: 20 }}
                            />
                        </Animated.View>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ── Modals ──────────────────────────────────────────────── */}
            <ProfessionPicker
                visible={professionModalVisible}
                onClose={() => setProfessionModalVisible(false)}
                onSelect={(cat: any) => {
                    setForm(prev => ({ ...prev, category: cat, tags: [] }));
                    setProfessionModalVisible(false);
                }}
            />

            <TimePicker
                visible={openTimePickerVisible}
                onClose={() => setOpenTimePickerVisible(false)}
                onSelect={(time) => setOpenTime(time)}
                title="Select Opening Time"
                currentValue={openTime}
            />

            <TimePicker
                visible={closeTimePickerVisible}
                onClose={() => setCloseTimePickerVisible(false)}
                onSelect={(time) => setCloseTime(time)}
                title="Select Closing Time"
                currentValue={closeTime}
            />

            <LoaderOverlay visible={isPending} />
        </View>
    );
};

export default BusinessRegistrationScreen;

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },

    // ── Hero Header ──────────────────────────────────────────────────────
    header: {
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
        overflow: 'hidden',
        paddingBottom: 24,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 4,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerNavTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.2,
    },
    heroContent: {
        alignItems: 'center',
        paddingHorizontal: 24,
        marginTop: 16,
    },
    heroIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    heroTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 0.2,
    },
    heroSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 18,
    },

    // ── Form ─────────────────────────────────────────────────────────────
    scrollContent: {
        paddingBottom: 40,
    },
    formSection: {
        paddingHorizontal: 20,
        marginTop: 24,
        gap: 16,
    },
    inputField: {
        gap: 6,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginLeft: 2,
    },
    required: {
        color: '#EF4444',
    },
    subLabel: {
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.6,
        marginBottom: 4,
        marginLeft: 2,
    },

    // ── Inputs (flat, borderless — mirrors profile.tsx) ──────────────────
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 14,
    },
    textInput: {
        flex: 1,
        fontWeight: '500',
        paddingVertical: 0,
    },
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 12,
        paddingHorizontal: 14,
    },
    triggerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    triggerText: {
        flex: 1,
        fontWeight: '500',
    },

    // ── Tags ─────────────────────────────────────────────────────────────
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    tagChip: {
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    tagChipText: {
        fontSize: 12,
    },

    // ── Buttons row ──────────────────────────────────────────────────────
    buttonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 20,
    },
    cancelButton: {
        width: 120,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '600',
    },
    submitButton: {
        width: 160,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
