import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import React, { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { UPDATE_PROFILE } from '@/apis/login';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export type ProfileBottomSheetRef = BottomSheet;

const ProfileBottomSheet = forwardRef<ProfileBottomSheetRef>((_, ref) => {
    const { user, updateUser } = useAuth();
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        city: '',
        village: '',
    });

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

    const snapPoints = useMemo(() => ['60%', '95%'], []);

    const getProfileSource = () => {
        if (user?.user?.profileImage) {
            return { uri: user.user.profileImage };
        }
        const gender = user?.user?.gender?.toUpperCase();
        if (gender === 'FEMALE') {
            return require('../assets/icons/user-female.png');
        }
        return require('../assets/icons/user-male.png');
    };

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
            />
        ),
        []
    );

    const handleUpdate = async () => {
        if (!formData.name || !formData.phone || !formData.city) {
            Toast.show({
                type: 'error',
                text1: 'Required Fields',
                text2: 'Please fill name, phone and city',
            });
            return;
        }

        setLoading(true);
        try {
            const response = await UPDATE_PROFILE(formData);

            if (response.user) {
                await updateUser(response.user);
            }

            Toast.show({
                type: 'success',
                text1: 'Success!',
                text2: 'Profile updated successfully',
            });

            // Optionally close the sheet
            (ref as any)?.current?.close();
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Update Failed',
                text2: error?.response?.data?.message || 'Something went wrong',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <BottomSheet
            ref={ref}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose
            backdropComponent={renderBackdrop}
            backgroundStyle={{ backgroundColor: '#0F172A' }}
            handleIndicatorStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
            keyboardBehavior="extend"
            keyboardBlurBehavior="restore"
        >
            <LinearGradient
                colors={['#1e293b', '#0F172A']}
                style={StyleSheet.absoluteFill}
            />
            {/* Specular Edge Highlight */}
            <LinearGradient
                colors={['rgba(255, 255, 255, 0.2)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.glassEdge}
            />

            <BottomSheetScrollView
                contentContainerStyle={[
                    styles.contentContainer,
                    { paddingBottom: 50 } // Extra padding for keyboard
                ]}
                keyboardShouldPersistTaps="handled"
            >
                {/* Profile Header */}
                <View style={styles.header}>
                    <View style={styles.imageContainer}>
                        <Image
                            source={getProfileSource()}
                            style={styles.profileImage}
                            resizeMode="cover"
                        />
                        <TouchableOpacity style={styles.editImageBtn}>
                            <Ionicons name="camera" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                    <ThemedText style={[styles.name, { color: '#FFFFFF' }]}>
                        {user?.user?.name || 'User Profile'}
                    </ThemedText>
                    <ThemedText style={[styles.email, { color: 'rgba(255, 255, 255, 0.7)' }]}>
                        {user?.user?.email || 'N/A'}
                    </ThemedText>
                </View>

                {/* Profile Details */}
                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.inputLabel}>Full Name</ThemedText>
                        <View style={styles.inputDisplay}>
                            <TextInput
                                value={formData.name}
                                onChangeText={(val: string) => setFormData(prev => ({ ...prev, name: val }))}
                                style={{ color: '#FFFFFF', fontSize: 15 }}
                                placeholder="Enter full name"
                                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                            <ThemedText style={styles.inputLabel}>Phone</ThemedText>
                            <View style={styles.inputDisplay}>
                                <TextInput
                                    value={formData.phone}
                                    onChangeText={(val: string) => setFormData(prev => ({ ...prev, phone: val.replace(/[^0-9]/g, '') }))}
                                    style={{ color: '#FFFFFF', fontSize: 15 }}
                                    keyboardType="phone-pad"
                                    maxLength={11}
                                    placeholder="03XXXXXXXXX"
                                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                />
                            </View>
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <ThemedText style={styles.inputLabel}>Gender</ThemedText>
                            <View style={[styles.inputDisplay, { opacity: 0.7 }]}>
                                <ThemedText style={{ textTransform: 'capitalize', color: 'rgba(255, 255, 255, 0.6)' }}>
                                    {user?.user?.gender?.toLowerCase() || 'N/A'}
                                </ThemedText>
                            </View>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                            <ThemedText style={styles.inputLabel}>City</ThemedText>
                            <View style={styles.inputDisplay}>
                                <TextInput
                                    value={formData.city}
                                    onChangeText={(val: string) => setFormData(prev => ({ ...prev, city: val }))}
                                    style={{ color: '#FFFFFF', fontSize: 15 }}
                                    placeholder="City"
                                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                />
                            </View>
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <ThemedText style={styles.inputLabel}>Village</ThemedText>
                            <View style={styles.inputDisplay}>
                                <TextInput
                                    value={formData.village}
                                    onChangeText={(val: string) => setFormData(prev => ({ ...prev, village: val }))}
                                    style={{ color: '#FFFFFF', fontSize: 15 }}
                                    placeholder="Village"
                                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Update Button */}
                <TouchableOpacity
                    style={[styles.saveBtn, loading && { opacity: 0.7 }]}
                    onPress={handleUpdate}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <ThemedText style={styles.saveBtnText}>Update Profile</ThemedText>
                    )}
                </TouchableOpacity>
            </BottomSheetScrollView>
        </BottomSheet>
    );
});


const styles = StyleSheet.create({
    contentContainer: {
        padding: 20,
    },
    glassEdge: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    imageContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#FF9B51', // Secondary color
    },
    editImageBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#FF9B51', // Secondary color
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    email: {
        fontSize: 14,
        marginTop: 2,
    },
    formContainer: {
        width: '100%',
    },
    row: {
        flexDirection: 'row',
        width: '100%',
    },
    inputGroup: {
        marginBottom: 14,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 6,
        color: 'rgba(255, 255, 255, 0.5)',
    },
    inputDisplay: {
        height: 48,
        borderRadius: 12,
        paddingHorizontal: 16,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    saveBtn: {
        height: 52,
        borderRadius: 16,
        backgroundColor: '#FF9B51', // Secondary color
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#FF9B51',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default ProfileBottomSheet;
