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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

        if (!name || !category || !phone || !address || !description) {
            Toast.show({ type: 'error', text1: 'Fields Required', text2: 'Please fill all fields marked with *' });
            return;
        }

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
                                placeholderTextColor={colors.icon}
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
                                <ThemedText style={{ color: form.category ? colors.text : colors.icon, fontSize: 13, fontWeight: '600' }}>
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
                                placeholderTextColor={colors.icon}
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
                                placeholderTextColor={colors.icon}
                                value={form.phone}
                                onChangeText={(text) => setForm(prev => ({ ...prev, phone: text }))}
                                keyboardType="phone-pad"
                            />
                        </View>

                        {/* Description */}
                        <View style={styles.field}>
                            <ThemedText style={styles.label}>Description <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F1F5F9', color: colors.text, borderColor: colors.border }]}
                                placeholder="Tell us about your services..."
                                placeholderTextColor={colors.icon}
                                value={form.description}
                                onChangeText={(text) => setForm(prev => ({ ...prev, description: text }))}
                                multiline
                                numberOfLines={4}
                            />
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
