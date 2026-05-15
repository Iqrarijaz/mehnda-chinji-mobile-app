import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    BackHandler,
    Dimensions,
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
        return true; // Prevent default behavior
    };

    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                handleGoBack();
                return true;
            };

            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

            return () =>
                subscription.remove();
        }, [])
    );

    // Initial state setup
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
                    name_ur: editData.categoryUr
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
        };

        if (editData) {
            updateMutation.mutate({ ...payload, businessId: editData._id });
        } else {
            registerMutation.mutate(payload);
        }
    };

    const isPending = registerMutation.isPending || updateMutation.isPending;

    return (
        <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{
                headerShown: false,
                gestureEnabled: true,
                animation: 'slide_from_right'
            }} />

            {/* Header (Settings Style) */}
            <Animated.View entering={FadeInUp.duration(600)} style={[styles.headerWrap, { backgroundColor: colors.primary }]}>
                <View style={[styles.headerTopRow, { paddingTop: insets.top + 8 }]}>
                    <TouchableOpacity
                        onPress={handleGoBack}
                        style={styles.backBtn}
                    >
                        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.headerTitleWrap}>
                        <ThemedText style={styles.headerTitle}>
                            {editData ? 'Update Business' : 'Register Business'}
                        </ThemedText>
                    </Animated.View>
                    <View style={{ width: 42 }} />
                </View>
            </Animated.View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <View style={styles.content}>
                    {/* Form Component */}
                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={[styles.scrollContent, { paddingTop: 20, paddingBottom: insets.bottom + 40 }]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Name Input */}
                        <View style={styles.field}>
                            <ThemedText style={styles.label}>Business Name <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F1F5F9', color: colors.text, borderColor: colors.border }]}
                                placeholder="Your business name"
                                placeholderTextColor="#9CA3AF"
                                value={form.name}
                                onChangeText={(text) => setForm(prev => ({ ...prev, name: text }))}
                            />
                        </View>

                        {/* Category (Profession) Picker */}
                        <View style={styles.field}>
                            <ThemedText style={styles.label}>Category <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                            <TouchableOpacity
                                style={[styles.input, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F1F5F9', borderColor: colors.border, justifyContent: 'center' }]}
                                onPress={() => setProfessionModalVisible(true)}
                            >
                                <ThemedText style={{ color: form.category ? colors.text : '#9CA3AF', fontSize: 13, fontWeight: '600' }}>
                                    {form.category ? `${form.category.name_eng} - ${form.category.name_ur}` : 'Select Category'}
                                </ThemedText>
                            </TouchableOpacity>
                        </View>

                        {/* Address Input */}
                        <View style={styles.field}>
                            <ThemedText style={styles.label}>Address <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F1F5F9', color: colors.text, borderColor: colors.border }]}
                                placeholder="Shop #, Street, Area"
                                placeholderTextColor="#9CA3AF"
                                value={form.address}
                                onChangeText={(text) => setForm(prev => ({ ...prev, address: text }))}
                            />
                        </View>

                        {/* Phone 1 */}
                        <View style={styles.field}>
                            <ThemedText style={styles.label}>Primary Phone <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F1F5F9', color: colors.text, borderColor: colors.border }]}
                                placeholder="e.g. 03xx xxxxxxx"
                                placeholderTextColor="#9CA3AF"
                                value={form.phone}
                                onChangeText={(text) => setForm(prev => ({ ...prev, phone: text }))}
                                keyboardType="phone-pad"
                            />
                        </View>

                        {/* Description */}
                        <View style={styles.field}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <ThemedText style={styles.label}>Description</ThemedText>
                                <ThemedText style={{ fontSize: 12, color: (form.description.length > 0 && form.description.length < 100) ? '#EF4444' : colors.textSecondary, marginBottom: 6 }}>
                                    {form.description.length}/100 min
                                </ThemedText>
                            </View>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F1F5F9', color: colors.text, borderColor: descriptionError ? '#EF4444' : colors.border }]}
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
                                <ThemedText style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>
                                    {descriptionError}
                                </ThemedText>
                            )}
                        </View>

                        {/* Footer Actions */}
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={styles.submitBtn}
                                onPress={handleSubmit}
                                disabled={isPending}
                            >
                                <LinearGradient
                                    colors={[colors.primary, colors.primary]}
                                    style={styles.gradient}
                                >
                                    {isPending ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <ThemedText style={styles.submitText}>
                                            {editData ? 'UPDATE BUSINESS' : 'REGISTER BUSINESS'}
                                        </ThemedText>
                                    )}
                                </LinearGradient>
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
        paddingBottom: 16,
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
        overflow: 'hidden',
        zIndex: 2,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleWrap: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
    field: {
        marginBottom: 12,
    },
    label: {
        fontSize: 10,
        fontWeight: '800',
        marginBottom: 4,
        color: '#64748B',
        letterSpacing: 0.5,
    },
    input: {
        height: 44,
        borderRadius: Layout.borderRadius,
        borderWidth: 1,
        paddingHorizontal: 12,
        fontSize: 13,
        fontWeight: '600',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
        paddingTop: 10,
    },
    footer: {
        marginTop: 12,
        flexDirection: 'row',
        gap: 12,
    },
    submitBtn: {
        flex: 1.5,
        borderRadius: Layout.borderRadius,
        overflow: 'hidden',
    },
    cancelBtn: {
        flex: 1,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: Layout.borderRadius,
    },
    cancelText: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '600',
    },
    gradient: {
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitText: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 1,
    },
});
