import { AUTH_QUERY_KEYS } from '@/apis/login';
import { UPDATE_PROFILE } from '@/apis/profile';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import citiesData from '@/data/cities.json';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function ProfileScreen() {
    const { user, updateUser } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        city: '',
        village: '',
    });

    const [cityPickerVisible, setCityPickerVisible] = useState(false);

    useEffect(() => {
        if (user?.user) {
            setFormData({
                name: user.user.name || '',
                phone: user.user.phone || '',
                city: user.user.city || '',
                village: user.user.village || '',
            });
        }
    }, [user]);

    const profileMutation = useMutation({
        mutationFn: UPDATE_PROFILE,
        onSuccess: async (response) => {
            if (response.user) {
                await updateUser(response.user);
                queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.user });
            }
            Toast.show({
                type: 'success',
                text1: 'Success!',
                text2: 'Profile updated successfully',
            });
            router.back();
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Update Failed',
                text2: error?.response?.data?.message || 'Something went wrong',
            });
        }
    });

    const loading = profileMutation.isPending;

    const getProfileSource = () => {
        if (user?.user?.profileImage) {
            return { uri: user.user.profileImage };
        }
        const gender = user?.user?.gender?.toUpperCase();
        if (gender === 'FEMALE') {
            return require('@/assets/icons/user-female.png');
        }
        return require('@/assets/icons/user-male.png');
    };

    const handleUpdate = () => {
        if (!formData.name || !formData.phone || !formData.city) {
            Toast.show({
                type: 'error',
                text1: 'Required Fields',
                text2: 'Please fill name, phone and city',
            });
            return;
        }

        profileMutation.mutate(formData);
    };

    return (
        <View style={styles.container}>
            {/* Custom Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Edit Profile</ThemedText>
                    <View style={{ width: 24 }} />
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Profile Image Section */}
                    <View style={styles.avatarSection}>
                        <View style={styles.imageWrapper}>
                            <Image
                                source={getProfileSource()}
                                style={styles.profileImage}
                                resizeMode="cover"
                            />
                            <TouchableOpacity style={styles.cameraButton}>
                                <Ionicons name="camera" size={18} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                        <ThemedText style={styles.userName}>{user?.user?.name || 'User'}</ThemedText>
                        <ThemedText style={styles.userEmail}>{user?.user?.email || ''}</ThemedText>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.form}>
                        {/* Name */}
                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.label}>Full Name</ThemedText>
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIcon} />
                                <TextInput
                                    value={formData.name}
                                    onChangeText={(val) => setFormData(prev => ({ ...prev, name: val }))}
                                    style={styles.input}
                                    placeholder="Enter full name"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
                        </View>

                        {/* Phone & Gender Row */}
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                <ThemedText style={styles.label}>Phone</ThemedText>
                                <View style={[styles.inputContainer, { backgroundColor: '#F1F5F9' }]}>
                                    <Ionicons name="call-outline" size={20} color="#64748B" style={styles.inputIcon} />
                                    <TextInput
                                        value={formData.phone}
                                        editable={false}
                                        style={[styles.input, { color: '#64748B' }]}
                                    />
                                </View>
                            </View>

                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <ThemedText style={styles.label}>Gender</ThemedText>
                                <View style={[styles.inputContainer, { backgroundColor: '#F1F5F9' }]}>
                                    <Ionicons name="male-female-outline" size={20} color="#64748B" style={styles.inputIcon} />
                                    <TextInput
                                        value={user?.user?.gender || 'N/A'}
                                        editable={false}
                                        style={[styles.input, { textTransform: 'capitalize', color: '#64748B' }]}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* City */}
                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.label}>City</ThemedText>
                            <TouchableOpacity
                                onPress={() => setCityPickerVisible(true)}
                                style={styles.inputContainer}
                            >
                                <Ionicons name="location-outline" size={20} color="#64748B" style={styles.inputIcon} />
                                <ThemedText style={[styles.input, { height: undefined, verticalAlign: 'middle' }]}>
                                    {formData.city || "Select City"}
                                </ThemedText>
                                <Ionicons name="chevron-down" size={20} color="#64748B" style={{ marginRight: 10 }} />
                            </TouchableOpacity>
                        </View>

                        {/* Village */}
                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.label}>Village (Optional)</ThemedText>
                            <View style={styles.inputContainer}>
                                <Ionicons name="home-outline" size={20} color="#64748B" style={styles.inputIcon} />
                                <TextInput
                                    value={formData.village}
                                    onChangeText={(val) => setFormData(prev => ({ ...prev, village: val }))}
                                    style={styles.input}
                                    placeholder="Enter village name"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity
                            style={[styles.saveButton, loading && { opacity: 0.7 }]}
                            onPress={handleUpdate}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <ThemedText style={styles.saveButtonText}>Update Profile</ThemedText>
                            )}
                        </TouchableOpacity>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <SearchableDropdown
                visible={cityPickerVisible}
                onClose={() => setCityPickerVisible(false)}
                onSelect={(city) => setFormData(prev => ({ ...prev, city }))}
                currentValue={formData.city}
                options={citiesData}
                title="Select City"
                placeholder="Search city..."
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        backgroundColor: '#004030',
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 10,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    avatarSection: {
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 32,
    },
    imageWrapper: {
        position: 'relative',
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    profileImage: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 4,
        borderColor: '#004030',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#004030',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1E293B',
    },
    userEmail: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 2,
    },
    form: {
        paddingHorizontal: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        height: 52,
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#1E293B',
        height: '100%',
    },
    row: {
        flexDirection: 'row',
    },
    saveButton: {
        backgroundColor: '#004030', // Updated to primary
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        shadowColor: '#004030', // Updated shadow to match button
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 4,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    }
});
