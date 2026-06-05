import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { ProfessionPicker } from '@/components/common/ProfessionPicker';
import { ThemedText } from '@/components/themedText';
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

    const [form, setForm] = useState({
        name: '',
        description: '',
        phone: '',
        address: '',
        category: null as any,
    });

    const [professionModalVisible, setProfessionModalVisible] = useState(false);
    const [descriptionError, setDescriptionError] = useState('');

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
            setForm({
                name: editData.name || '',
                description: editData.description || '',
                phone: editData.phone || '',
                address: editData.address || '',
                category: {
                    name_eng: editData.categoryEn,
                    name_ur: editData.categoryUr,
                    icon: editData.logo || (editData.images && editData.images.length > 0 ? editData.images[0] : undefined)
                } as any
            });
        } else {
            setForm({
                name: '',
                description: '',
                phone: user?.user?.phone || '',
                address: user?.user?.address || user?.user?.village || '',
                category: null,
            });
        }
    }, [editDataParam, user]);

    const handleInputChange = (key: string, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const registerMutation = useMutation({
        mutationFn: registerBusiness,
        onSuccess: (res: any) => {
            if (res.success) {
                analyticsService.trackEvent(AnalyticsEvents.BUSINESS_REGISTRATION_SUCCESS, { action: 'create' });
                queryClient.invalidateQueries({ queryKey: BUSINESS_QUERY_KEYS.myBusiness() });
                Toast.show({ type: 'success', text1: 'Success', text2: 'Business registered!' });
                handleGoBack();
                if (user?.user?.role !== 'APP_ADMIN') {
                    setTimeout(() => {
                        import('@/ads/interstitial.service').then(({ default: InterstitialService }) => {
                            InterstitialService.getInstance().show(true);
                        });
                    }, 2000);
                }
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
        const { name, category, phone, address, description } = form;

        let hasError = false;

        if (!name || !category || !phone || !address) {
            Toast.show({ type: 'error', text1: 'Fields Required', text2: 'Please fill all fields marked with *' });
            hasError = true;
        }

        if (description && description.length > 0 && description.length < 100) {
            setDescriptionError('Description must be at least 100 characters long if provided.');
            hasError = true;
        } else {
            setDescriptionError('');
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
        };

        if (editData) {
            updateMutation.mutate({ ...payload, businessId: editData._id });
        } else {
            registerMutation.mutate(payload);
        }
    };

    const isPending = registerMutation.isPending || updateMutation.isPending;

    return (
        <View style={[styles.mainContainer, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
            <Stack.Screen options={{
                headerShown: false,
                gestureEnabled: true,
                animation: 'slide_from_right'
            }} />

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

                            {/* Description Input */}
                            <View style={styles.field}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <ThemedText style={styles.label}>Description</ThemedText>
                                    <ThemedText style={{ fontSize: 10, color: (form.description.length > 0 && form.description.length < 100) ? '#EF4444' : colors.textSecondary, marginBottom: 4 }}>
                                        {form.description.length}/100 min
                                    </ThemedText>
                                </View>
                                <TextInput
                                    style={[styles.input, styles.textArea, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', color: colors.text, borderColor: descriptionError ? '#EF4444' : colors.border }]}
                                    placeholder="Tell us about your services..."
                                    placeholderTextColor="#9CA3AF"
                                    value={form.description}
                                    onChangeText={(text) => {
                                        setForm(prev => ({ ...prev, description: text }));
                                        if (text.length === 0 || text.length >= 100) setDescriptionError('');
                                    }}
                                    multiline
                                    numberOfLines={4}
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
                                {isPending ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <ThemedText style={styles.submitText}>
                                        {editData ? 'UPDATE' : 'REGISTER'}
                                    </ThemedText>
                                )}
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
                    handleInputChange('category', cat);
                    setProfessionModalVisible(false);
                }}
            />
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
        height: 70,
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
});
