import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    BackHandler,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
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
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
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
    const [descriptionError, setDescriptionError] = useState('');
    const [descriptionHeight, setDescriptionHeight] = useState(120);

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

    const [isOptimizing, setIsOptimizing] = useState(false);

    const handleOptimizeText = async () => {
        if (!form.category) {
            Toast.show({ type: 'info', text1: 'Category Required', text2: 'Please select a category first.' });
            return;
        }

        const textToOptimize = form.description.trim() || form.name.trim();
        const tagsToOptimize = form.tags;

        setIsOptimizing(true);
        try {
            const { optimizeText } = await import('@/apis/ai');
            const res = await optimizeText({
                module: 'business',
                category: form.category.name_eng,
                type: 'description',
                text: textToOptimize,
                tags: tagsToOptimize,
            });

            if (res.success && res.optimizedText) {
                setForm(prev => ({ ...prev, description: res.optimizedText }));
                setDescriptionError('');
                Toast.show({ type: 'success', text1: 'AI Optimized!', text2: 'Description optimized successfully.' });
            } else {
                Toast.show({ type: 'error', text1: 'Optimization Failed', text2: 'Could not optimize the description.' });
            }
        } catch (error) {
            console.error('AI Optimize error:', error);
            Toast.show({ type: 'error', text1: 'Optimization Error', text2: 'Failed to connect to AI service.' });
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleSubmit = () => {
        const { name, category, phone, address, description, timing } = form;

        let hasError = false;

        if (!name || !category || !phone || !address) {
            Toast.show({ type: 'error', text1: 'Fields Required', text2: 'Please fill all fields marked with *' });
            hasError = true;
        }

        setDescriptionError('');

        if (!description || description.trim().length < 100) {
            setDescriptionError('Description must be at least 100 characters.');
            hasError = true;
        }

        if (hasError) return;

        const payload = {
            name,
            categoryEn: category.name_eng,
            categoryUr: category.name_ur,
            description,
            phone,
            address,
            logo: category.icon || null,
            tags: form.tags.map((t: any) => ({ eng: t.eng, ur: t.ur })),
            timing,
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
        <View style={[styles.mainContainer, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
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

            {/* Header (Dynamic details-like header) */}
            <Animated.View entering={FadeInUp.duration(600)} style={[styles.headerWrap, { backgroundColor: colors.primary }]}>
                <View style={[styles.headerTopRow, { paddingTop: insets.top + 6 }]}>
                    <TouchableOpacity
                        onPress={handleGoBack}
                        style={styles.backBtn}
                    >
                        <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.headerTitleWrap}>
                        <ThemedText style={styles.headerTitle}>
                            {editData ? 'Update Business' : 'Register Business'}
                        </ThemedText>
                    </Animated.View>
                    <View style={{ width: 36 }} />
                </View>
            </Animated.View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <View style={styles.content}>
                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={[styles.scrollContent, { paddingTop: 10, paddingBottom: insets.bottom + 40 }]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Unified Form Card Wrapper */}
                        <View style={[styles.formCard, { backgroundColor: isDark ? '#1e293b' : '#FFFFFF' }]}>

                            {/* Name Input */}
                            <View style={styles.field}>
                                <ThemedText style={styles.label}>Business Name <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                                <TextInput
                                    style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
                                    placeholder="Your business name"
                                    placeholderTextColor="#9CA3AF"
                                    value={form.name}
                                    onChangeText={(text) => setForm(prev => ({ ...prev, name: text }))}
                                />
                            </View>

                            {/* Category Picker */}
                            <View style={styles.field}>
                                <ThemedText style={styles.label}>Category <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                                <TouchableOpacity
                                    style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: colors.border, justifyContent: 'center' }]}
                                    onPress={() => setProfessionModalVisible(true)}
                                >
                                    <ThemedText style={{ color: form.category ? colors.text : '#9CA3AF', fontSize: 12, fontWeight: '600' }}>
                                        {form.category ? `${form.category.name_eng} - ${form.category.name_ur}` : 'Select Category'}
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>

                            {/* Address Input */}
                            <View style={styles.field}>
                                <ThemedText style={styles.label}>Address <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                                <TextInput
                                    style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
                                    placeholder="Shop #, Street, Area"
                                    placeholderTextColor="#9CA3AF"
                                    value={form.address}
                                    onChangeText={(text) => setForm(prev => ({ ...prev, address: text }))}
                                />
                            </View>

                            {/* Phone Input */}
                            <View style={styles.field}>
                                <ThemedText style={styles.label}>Primary Phone <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                                <TextInput
                                    style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
                                    placeholder="e.g. 03xx xxxxxxx"
                                    placeholderTextColor="#9CA3AF"
                                    value={form.phone}
                                    onChangeText={(text) => setForm(prev => ({ ...prev, phone: text }))}
                                    keyboardType="phone-pad"
                                />
                            </View>

                            {/* Timing Selection (Side by Side) */}
                            <View style={styles.field}>
                                <ThemedText style={styles.label}>Business Timing</ThemedText>
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <View style={{ flex: 1 }}>
                                        <ThemedText style={[styles.label, { fontSize: 9, color: colors.textSecondary, marginBottom: 2 }]}>OPENS AT</ThemedText>
                                        <TouchableOpacity
                                            style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: colors.border, justifyContent: 'center' }]}
                                            onPress={() => setOpenTimePickerVisible(true)}
                                            activeOpacity={0.7}
                                        >
                                            <ThemedText style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>
                                                {openTime}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <ThemedText style={[styles.label, { fontSize: 9, color: colors.textSecondary, marginBottom: 2 }]}>CLOSES AT</ThemedText>
                                        <TouchableOpacity
                                            style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: colors.border, justifyContent: 'center' }]}
                                            onPress={() => setCloseTimePickerVisible(true)}
                                            activeOpacity={0.7}
                                        >
                                            <ThemedText style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>
                                                {closeTime}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            {/* Tags Selection */}
                            {availableTags && availableTags.length > 0 && (
                                <View style={styles.field}>
                                    <ThemedText style={styles.label}>Select Services / Tags</ThemedText>
                                    <View style={styles.tagsContainer}>
                                        {availableTags.map((tag: any) => {
                                            const isSelected = form.tags.some((t: any) => t.eng?.toLowerCase() === tag.eng?.toLowerCase());
                                            return (
                                                <TouchableOpacity
                                                    key={tag.eng}
                                                    style={[
                                                        styles.tagChip,
                                                        {
                                                            backgroundColor: isSelected ? colors.primary : (isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC'),
                                                            borderColor: isSelected ? colors.primary : colors.border,
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
                                                        <ThemedText
                                                            style={[
                                                                styles.tagChipText,
                                                                {
                                                                    color: isSelected ? '#FFFFFF' : colors.text,
                                                                    fontWeight: isSelected ? '700' : '600',
                                                                }
                                                            ]}
                                                        >
                                                            {tag.eng} | {tag.ur}
                                                        </ThemedText>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}

                            {/* Description Input */}
                            <View style={styles.field}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <ThemedText style={styles.label}>Description <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                                        <TouchableOpacity
                                            onPress={handleOptimizeText}
                                            disabled={isOptimizing || !form.category || !form.name.trim()}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 4,
                                                paddingHorizontal: 8,
                                                paddingVertical: 3,
                                                borderRadius: 12,
                                                backgroundColor: (isOptimizing || !form.category || !form.name.trim()) ? (isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0') : (colors.primary + '12'),
                                                marginLeft: 4,
                                                opacity: (isOptimizing || !form.category || !form.name.trim()) ? 0.6 : 1
                                            }}
                                        >
                                            {isOptimizing ? (
                                                <ActivityIndicator size="small" color={colors.primary} style={{ transform: [{ scale: 0.7 }] }} />
                                            ) : (
                                                <Ionicons name="sparkles" size={12} color={(isOptimizing || !form.category || !form.name.trim()) ? colors.textSecondary : colors.primary} />
                                            )}
                                            <ThemedText style={{ fontSize: 9, fontWeight: '700', color: (isOptimizing || !form.category || !form.name.trim()) ? colors.textSecondary : colors.primary }}>Write Description with AI</ThemedText>
                                        </TouchableOpacity>
                                    </View>
                                    <ThemedText style={{ fontSize: 10, color: form.description.length < 100 ? '#EF4444' : colors.textSecondary }}>
                                        {form.description.length} chars (Min 100)
                                    </ThemedText>
                                </View>
                                <TextInput
                                    style={[
                                        styles.input,
                                        styles.textArea,
                                        {
                                            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                                            color: colors.text,
                                            borderColor: descriptionError ? '#EF4444' : colors.border,
                                            height: Math.max(120, descriptionHeight),
                                        }
                                    ]}
                                    placeholder='Click "Write Description with AI" to generate a description for your business.'
                                    placeholderTextColor="#9CA3AF"
                                    value={form.description}
                                    onChangeText={(text) => {
                                        setForm(prev => ({ ...prev, description: text }));
                                    }}
                                    multiline
                                    scrollEnabled={false}
                                    onContentSizeChange={(e) => {
                                        setDescriptionHeight(e.nativeEvent.contentSize.height);
                                    }}
                                    editable={false}
                                />
                                {!!descriptionError && (
                                    <ThemedText style={{ color: '#EF4444', fontSize: 11, marginTop: 4 }}>
                                        {descriptionError}
                                    </ThemedText>
                                )}
                            </View>
                        </View>

                        {/* Footer Buttons */}
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                                onPress={handleSubmit}
                                disabled={isPending}
                                activeOpacity={0.8}
                            >
                                <ThemedText style={styles.submitText}>
                                    {editData ? 'UPDATE' : 'REGISTER'}
                                </ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleGoBack}
                                style={[styles.cancelBtn, { borderColor: colors.border }]}
                                activeOpacity={0.7}
                            >
                                <ThemedText style={styles.cancelText}>Cancel</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>

            <ProfessionPicker
                visible={professionModalVisible}
                onClose={() => setProfessionModalVisible(false)}
                onSelect={(cat: any) => {
                    setForm(prev => ({
                        ...prev,
                        category: cat,
                        tags: []
                    }));
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
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    headerWrap: {
        paddingBottom: 10,
        borderBottomLeftRadius: Layout.borderRadius,
        borderBottomRightRadius: Layout.borderRadius,
        zIndex: 2,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleWrap: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 12,
    },
    formCard: {
        borderRadius: 12,
        padding: 12,
        marginTop: 12,
    },
    field: {
        marginBottom: 10,
    },
    label: {
        fontSize: 10,
        fontWeight: '800',
        marginBottom: 4,
        color: '#64748B',
        letterSpacing: 0.5,
    },
    input: {
        height: 40,
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 10,
        fontSize: 12,
        fontWeight: '600',
    },
    textArea: {
        height: 270,
        textAlignVertical: 'top',
        paddingTop: 8,
    },
    footer: {
        marginTop: 12,
        flexDirection: 'row',
        gap: 10,
    },
    submitBtn: {
        flex: 1.5,
        height: 38,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtn: {
        flex: 1,
        height: 38,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
    },
    cancelText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
    },
    submitText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 12,
        letterSpacing: 0.5,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 4,
        marginBottom: 8,
    },
    tagChip: {
        borderRadius: 20,
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    tagChipText: {
        fontSize: 11,
    },
});
