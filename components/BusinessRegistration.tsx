import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';

import {
    BUSINESS_QUERY_KEYS,
    DELETE_BUSINESS,
    GET_BUSINESS_STATUS,
    REGISTER_BUSINESS
} from '@/apis/business';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ProfessionPicker } from './ProfessionPicker';
import { GlassCard } from './ui/GlassCard';
import { GlassConfirmationModal } from './ui/GlassConfirmationModal';
import { LiquidGlassLoader } from './ui/LiquidGlassLoader';

const BusinessRegistration = React.memo(() => {
    const { user } = useAuth();
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const queryClient = useQueryClient();

    const [loading, setLoading] = useState(false);
    const [businesses, setBusinesses] = useState<any[]>([]);

    // Form State
    const [data, setData] = useState({
        name: '',
        description: '',
        phone: user?.user?.phone || '',
        village: user?.user?.village || '',
        category: null as any,
    });

    const [professionModalVisible, setProfessionModalVisible] = useState(false);

    // UI State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [businessToDelete, setBusinessToDelete] = useState<string | null>(null);

    // Mutations
    const registerMutation = useMutation({
        mutationFn: REGISTER_BUSINESS,
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: BUSINESS_QUERY_KEYS.all });
                fetchInitialData();
                setData({
                    name: '',
                    description: '',
                    phone: user?.user?.phone || '',
                    village: user?.user?.village || '',
                    category: null as any,
                });
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Business registered successfully!',
                });
            }
        },
    });

    const deleteMutation = useMutation({
        mutationFn: DELETE_BUSINESS,
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: BUSINESS_QUERY_KEYS.all });
                fetchInitialData();
                setShowDeleteModal(false);
                setBusinessToDelete(null);
                Toast.show({
                    type: 'success',
                    text1: 'Deleted',
                    text2: 'Business removed successfully.',
                });
            }
        },
    });

    const isRegistering = registerMutation.isPending;
    const isDeleting = deleteMutation.isPending;

    const pendingCount = businesses.filter(b => b.status === 'PENDING').length;
    const canRegister = pendingCount < 3;

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const statusRes = await GET_BUSINESS_STATUS();

            if (statusRes.success) {
                setBusinesses(statusRes.data);
            }
        } catch (error) {
            console.error("Error fetching initial business data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (key: string, value: any) => {
        setData(prev => ({ ...prev, [key]: value }));
    };


    const handleRegister = async () => {
        const { name, category, phone, description, village } = data;
        if (!name || !category || !phone) {
            Toast.show({
                type: 'error',
                text1: 'Fields Required',
                text2: 'Please fill in all required fields.',
            });
            return;
        }

        if (name.length > 30) {
            Toast.show({
                type: 'error',
                text1: 'Name Too Long',
                text2: 'Business name cannot exceed 30 characters.',
            });
            return;
        }

        if (description.length > 100) {
            Toast.show({
                type: 'error',
                text1: 'Description Too Long',
                text2: 'Description cannot exceed 100 characters.',
            });
            return;
        }

        registerMutation.mutate({
            name,
            description,
            phone,
            village,
            category: {
                en: category.name_eng,
                ur: category.name_ur,
            },
        });
    };

    const confirmDelete = async () => {
        if (!businessToDelete) return;
        deleteMutation.mutate(businessToDelete);
    };

    if (loading && businesses.length === 0) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <LiquidGlassLoader />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.headerBox}>
                <ThemedText style={styles.headerTitle}>Business Directory</ThemedText>
                <ThemedText style={styles.headerSubtitle}>Register your skills and services</ThemedText>
            </View>

            {/* Registration Form */}
            <GlassCard>
                <View style={styles.formSection}>
                    <ThemedText style={styles.sectionTitle}>New Business Registration</ThemedText>

                    {/* Business Name */}
                    <View style={styles.inputField}>
                        <View style={styles.labelContainer}>
                            <ThemedText style={styles.label}>
                                BUSINESS NAME <ThemedText style={styles.required}>*</ThemedText>
                            </ThemedText>
                            <ThemedText style={[styles.charCount, data.name.length > 30 && { color: '#ef4444' }]}>
                                {data.name.length}/30
                            </ThemedText>
                        </View>
                        <View style={[styles.inputBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                            <Ionicons name="business" size={18} color="#3b82f6" style={{ marginRight: 10 }} />
                            <TextInput
                                placeholder="e.g. Chinji Auto Repair"
                                placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}
                                style={[styles.textInput, { color: colors.text }]}
                                value={data.name}
                                onChangeText={(val) => handleInputChange('name', val)}
                                maxLength={30}
                            />
                        </View>
                    </View>

                    {/* Profession Dropdown */}
                    <View style={styles.inputField}>
                        <ThemedText style={styles.label}>
                            PROFESSION <ThemedText style={styles.required}>*</ThemedText>
                        </ThemedText>
                        <TouchableOpacity
                            style={[styles.dropdownTrigger, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
                            onPress={() => setProfessionModalVisible(true)}
                        >
                            <View style={styles.triggerContent}>
                                <Ionicons name="construct" size={18} color="#3b82f6" style={{ marginRight: 10 }} />
                                <ThemedText style={[styles.triggerText, !data.category && { opacity: 0.5 }]}>
                                    {data.category ? `${data.category.name_eng} - ${data.category.name_ur} ` : 'Select Profession'}
                                </ThemedText>
                            </View>
                            <Ionicons name="chevron-down" size={16} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    {/* Village Input */}
                    <View style={styles.inputField}>
                        <ThemedText style={styles.label}>VILLAGE / LOCATION</ThemedText>
                        <View style={[styles.inputBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                            <Ionicons name="location" size={18} color="#3b82f6" style={{ marginRight: 10 }} />
                            <TextInput
                                placeholder="Enter village or area"
                                placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}
                                style={[styles.textInput, { color: colors.text }]}
                                value={data.village}
                                onChangeText={(val) => handleInputChange('village', val)}
                            />
                        </View>
                    </View>

                    {/* Phone Input */}
                    <View style={styles.inputField}>
                        <ThemedText style={styles.label}>
                            CONTACT PHONE <ThemedText style={styles.required}>*</ThemedText>
                        </ThemedText>
                        <View style={[styles.inputBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                            <Ionicons name="call" size={18} color="#3b82f6" style={{ marginRight: 10 }} />
                            <TextInput
                                placeholder="+92 300 1234567"
                                placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}
                                style={[styles.textInput, { color: colors.text }]}
                                value={data.phone}
                                onChangeText={(val) => handleInputChange('phone', val)}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.inputField}>
                        <View style={styles.labelContainer}>
                            <ThemedText style={styles.label}>DESCRIPTION / SERVICES</ThemedText>
                            <ThemedText style={[styles.charCount, data.description.length > 100 && { color: '#ef4444' }]}>
                                {data.description.length}/100
                            </ThemedText>
                        </View>
                        <View style={[styles.inputBox, styles.textArea, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                            <TextInput
                                placeholder="Describe your services..."
                                placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}
                                style={[styles.textInput, { color: colors.text, textAlignVertical: 'top' }]}
                                value={data.description}
                                onChangeText={(val) => handleInputChange('description', val)}
                                multiline
                                numberOfLines={4}
                                maxLength={100}
                            />
                        </View>
                    </View>

                    {/* Limit Warning Message */}
                    {!canRegister && (
                        <View style={styles.limitWarning}>
                            <Ionicons name="warning" size={16} color="#f59e0b" />
                            <ThemedText style={styles.warningText}>
                                Limit reached! You can have maximum 3 pending requests at a time.
                            </ThemedText>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.actionBtnWrapper, !canRegister && { opacity: 0.5 }]}
                        onPress={handleRegister}
                        disabled={isRegistering || !canRegister}
                    >
                        <LinearGradient
                            colors={canRegister ? ['#3b82f6', '#1d4ed8'] : ['#64748b', '#475569']}
                            style={styles.gradientBtn}
                        >
                            {isRegistering ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <ThemedText style={styles.btnText}>
                                    {canRegister ? 'SUBMIT REGISTRATION' : 'LIMIT REACHED'}
                                </ThemedText>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </GlassCard>

            {/* My Businesses Section */}
            {businesses.length > 0 && (
                <View style={styles.myBusinessesSection}>
                    <ThemedText style={styles.sectionTitle}>My Registrations</ThemedText>
                    {businesses.map((biz) => (
                        <GlassCard key={biz._id}>
                            <View style={styles.bizHeader}>
                                <View style={styles.bizTitleRow}>
                                    <ThemedText style={styles.bizName}>{biz.name.toUpperCase()}</ThemedText>
                                    <View style={[
                                        styles.statusBadge,
                                        { backgroundColor: biz.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.15)' : biz.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)' }
                                    ]}>
                                        <View style={[
                                            styles.statusDot,
                                            { backgroundColor: biz.status === 'APPROVED' ? '#10B981' : biz.status === 'REJECTED' ? '#ef4444' : '#f59e0b' }
                                        ]} />
                                        <ThemedText style={[
                                            styles.statusText,
                                            { color: biz.status === 'APPROVED' ? '#10B981' : biz.status === 'REJECTED' ? '#ef4444' : '#f59e0b' }
                                        ]}>
                                            {biz.status}
                                        </ThemedText>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={() => {
                                        setBusinessToDelete(biz._id);
                                        setShowDeleteModal(true);
                                    }}
                                    style={styles.deleteBtn}
                                >
                                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.categoryRow}>
                                <View style={styles.catItem}>
                                    <Ionicons name="construct" size={12} color="#3b82f6" />
                                    <ThemedText style={styles.bizCategory}>
                                        {biz.categoryName?.en || biz.categoryName}
                                    </ThemedText>
                                </View>
                                {biz.categoryName?.ur && (
                                    <ThemedText style={[styles.bizCategory, styles.urduCat]}>
                                        {biz.categoryName.ur}
                                    </ThemedText>
                                )}
                            </View>

                            <View style={styles.bizFooterRow}>
                                <View style={styles.addressContainer}>
                                    <Ionicons name="location" size={14} color="#64748b" />
                                    <ThemedText style={styles.bizInfoText} numberOfLines={2}>
                                        {biz.village}
                                    </ThemedText>
                                </View>
                                <View style={styles.dateContainer}>
                                    <Ionicons name="calendar-outline" size={12} color="#64748b" />
                                    <ThemedText style={styles.dateText}>
                                        {new Date(biz.createdAt).toLocaleDateString()}
                                    </ThemedText>
                                </View>
                            </View>
                        </GlassCard>
                    ))}
                </View>
            )}

            {/* Profession Modal */}
            <ProfessionPicker
                visible={professionModalVisible}
                onClose={() => setProfessionModalVisible(false)}
                onSelect={(prof) => handleInputChange('category', prof)}
                currentProfession={data.category?.name_eng}
            />

            <GlassConfirmationModal
                visible={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete Registration?"
                message="Are you sure you want to delete this business registration request? This action cannot be undone."
                confirmText={isDeleting ? "Deleting..." : "Delete Request"}
                type="danger"
            />

        </ScrollView>
    );
});

export default BusinessRegistration;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    headerBox: {
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    cardWrapper: {
        marginBottom: 20,
    },
    formSection: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 8,
    },
    inputField: {
        gap: 6,
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: 4,
    },
    label: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748b',
        letterSpacing: 0.8,
        marginLeft: 2,
    },
    required: {
        color: '#ef4444',
        fontWeight: '900',
    },
    charCount: {
        fontSize: 9,
        fontWeight: '700',
        color: '#94a3b8',
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 52,
        borderRadius: 14,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    textArea: {
        height: 100,
        alignItems: 'flex-start',
        paddingVertical: 12,
    },
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 52,
        borderRadius: 14,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    triggerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    triggerText: {
        fontSize: 14,
        fontWeight: '600',
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
    },
    actionBtnWrapper: {
        marginTop: 10,
        borderRadius: 14,
        overflow: 'hidden',
        elevation: 3,
    },
    gradientBtn: {
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    limitWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        padding: 12,
        borderRadius: 12,
        gap: 8,
        marginTop: 4,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.2)',
    },
    warningText: {
        fontSize: 12,
        color: '#f59e0b',
        fontWeight: '700',
        flex: 1,
    },
    myBusinessesSection: {
        marginTop: 35,
        gap: 15,
    },
    bizCardWrapper: {
        marginBottom: 4,
    },
    bizHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    searchToggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 20,
    },
    searchToggleText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#94a3b8',
    },
    bizTitleRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginRight: 8,
    },
    bizName: {
        fontSize: 15,
        fontWeight: '900',
        letterSpacing: 0.2,
        flex: 1,
        marginRight: 10,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 100,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
    },
    deleteBtn: {
        padding: 5,
        marginLeft: 4,
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderRadius: 8,
    },
    categoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
        paddingBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    catItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    bizCategory: {
        fontSize: 13,
        color: '#3b82f6',
        fontWeight: '700',
    },
    urduCat: {
        textAlign: 'right',
        fontSize: 14,
    },
    bizFooterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    addressContainer: {
        flex: 0.7,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
    },
    dateContainer: {
        flex: 0.25,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 4,
    },
    bizInfoText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
        lineHeight: 18,
        textTransform: 'capitalize',
    },
    dateText: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '700',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

