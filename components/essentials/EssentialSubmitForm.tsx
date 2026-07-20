import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState, useMemo } from 'react';
import { Platform, StyleSheet, TextInput, TouchableOpacity, View, ActivityIndicator, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { TimePicker } from '@/components/common/TimePicker';
import { EssentialsTypePills } from '@/components/common/EssentialsTypePills';
import { SubmitButton } from '@/components/common/SubmitButton';
import { CancelButton } from '@/components/common/CancelButton';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useEssentialsAPI } from '@/hooks/useEssentialsAPI';
import { LinearGradient } from 'expo-linear-gradient';

interface EssentialSubmitFormProps {
    category: string;
    editData?: any;
    typesToRender: any[];
    uploadedImage: string | null;
    isUploading: boolean;
    onSuccess: () => void;
    onCancel: () => void;
}

const EssentialSubmitForm = React.memo(({
    category,
    editData,
    typesToRender,
    uploadedImage,
    isUploading,
    onSuccess,
    onCancel
}: EssentialSubmitFormProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const isDark = theme === 'dark';
    const isEditing = !!editData;

    const activeColor = useMemo(() => {
        const cat = (category || '').toLowerCase();
        if (cat === 'emergency') return '#b91c1c';   // deep red
        if (cat === 'health') return colors.primary;  // theme primary (teal)
        if (cat === 'religious') return '#1a5c3a'; // Islamic green
        if (cat === 'banks') return '#1a2d4a'; // deep navy
        if (cat === 'govt') return '#1e2e4a'; // slate-blue
        if (cat === 'travel') return '#0f172a';        // dark slate
        if (cat === 'education') return '#312e81';     // deep indigo
        return colors.primary;
    }, [category, colors.primary]);

    const [form, setForm] = useState({
        name: editData?.name || '',
        address: editData?.address || '',
        googleAddress: editData?.googleAddress || '',
        timing: editData?.timing || '',
        type: editData?.type || '',
        tags: editData?.tags || [] as { eng: string; ur: string }[],
        contact: editData?.contact?.length ? editData.contact : [{ name: '', number: '' }] as { name: string; number: string }[],
        route: editData?.route?.length ? editData.route : [{ city: '', time: '' }] as { city: string; time: string }[],
        returnRoute: (editData?.returnRoute?.length ? editData.returnRoute : [{ city: '', time: '' }]) as { city: string; time: string }[],
        metadata: {
            principalName: editData?.metadata?.principalName || '',
            totalStudents: editData?.metadata?.totalStudents?.toString() || '',
            totalTeachers: editData?.metadata?.totalTeachers?.toString() || '',
        }
    });

    const selectedTypeInfo = typesToRender.find((t: any) => t.key?.toLowerCase() === form.type?.toLowerCase());
    const availableTags = selectedTypeInfo?.tags || [];

    const [fromTime, setFromTime] = useState(() => {
        if (editData?.timing && editData.timing.includes(' - ')) {
            return editData.timing.split(' - ')[0] || '';
        }
        return '';
    });
    const [toTime, setToTime] = useState(() => {
        if (editData?.timing && editData.timing.includes(' - ')) {
            return editData.timing.split(' - ')[1] || '';
        }
        return '';
    });

    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [routePickerIndex, setRoutePickerIndex] = useState<number | null>(null);
    const [returnRoutePickerIndex, setReturnRoutePickerIndex] = useState<number | null>(null);


    const { submitMutation } = useEssentialsAPI();
    const isPending = submitMutation.isPending;

    const isHealth = category === 'health';
    const isEducation = category === 'education';
    const isGovt = category?.toLowerCase() === 'govt';
    const isTravel = category?.toLowerCase() === 'travel';


    const handleChange = (key: string, value: any) => {
        setForm(prev => ({ ...prev, [key]: value }));
        setErrors(prev => ({ ...prev, [key]: '' }));
    };

    const handleMetadataChange = (key: string, value: string) => {
        setForm(prev => ({
            ...prev,
            metadata: { ...prev.metadata, [key]: value }
        }));
    };

    const handleContactChange = (index: number, key: 'name' | 'number', value: string) => {
        const newContacts = [...form.contact];
        newContacts[index][key] = value;
        setForm(prev => ({ ...prev, contact: newContacts }));
        if (key === 'number') {
            setErrors(prev => ({ ...prev, [`contact[${index}].number`]: '', contact_general: '' }));
        } else {
            setErrors(prev => ({ ...prev, contact_general: '' }));
        }
    };

    const addContact = () => {
        if (form.contact.length < 3) {
            setForm(prev => ({ ...prev, contact: [...prev.contact, { name: '', number: '' }] }));
        }
    };

    const removeContact = (index: number) => {
        const newContacts = form.contact.filter((_: any, i: number) => i !== index);
        setForm(prev => ({ ...prev, contact: newContacts }));
    };

    const handleRouteChange = (index: number, key: 'city' | 'time', value: string) => {
        const newRoute = [...form.route];
        newRoute[index] = { ...newRoute[index], [key]: value };
        setForm(prev => ({ ...prev, route: newRoute }));
    };

    const addRoute = () => {
        if (form.route.length < 10) {
            setForm(prev => ({ ...prev, route: [...prev.route, { city: '', time: '' }] }));
            setErrors(prev => ({ ...prev, route: '' }));
        }
    };

    const removeRoute = (index: number) => {
        const newRoute = form.route.filter((_: any, i: number) => i !== index);
        setForm(prev => ({ ...prev, route: newRoute }));
    };

    const handleReturnRouteChange = (index: number, key: 'city' | 'time', value: string) => {
        const newRoute = [...form.returnRoute];
        newRoute[index] = { ...newRoute[index], [key]: value };
        setForm(prev => ({ ...prev, returnRoute: newRoute }));
    };

    const addReturnRoute = () => {
        if (form.returnRoute.length < 10) {
            setForm(prev => ({ ...prev, returnRoute: [...prev.returnRoute, { city: '', time: '' }] }));
            setErrors(prev => ({ ...prev, returnRoute: '' }));
        }
    };

    const removeReturnRoute = (index: number) => {
        const newRoute = form.returnRoute.filter((_: any, i: number) => i !== index);
        setForm(prev => ({ ...prev, returnRoute: newRoute }));
    };

    const hasChanges = React.useMemo(() => {
        if (!isEditing) return true;

        const initialContacts = editData.contact?.length ? editData.contact : [{ name: '', number: '' }];
        const currentContacts = form.contact;

        const isMainChanged =
            form.name.trim() !== (editData.name || '').trim() ||
            form.address.trim() !== (editData.address || '').trim() ||
            form.googleAddress.trim() !== (editData.googleAddress || '').trim() ||
            form.timing.trim() !== (editData.timing || '').trim() ||
            form.type !== (editData.type || '') ||
            JSON.stringify(form.tags) !== JSON.stringify(editData.tags || []) ||
            JSON.stringify(form.route) !== JSON.stringify(editData.route || [{ city: '', time: '' }]) ||
            JSON.stringify(form.returnRoute) !== JSON.stringify(editData.returnRoute?.length ? editData.returnRoute : [{ city: '', time: '' }]) ||
            JSON.stringify(form.metadata) !== JSON.stringify(editData.metadata || { principalName: '', totalStudents: '', totalTeachers: '' });

        if (isMainChanged) return true;

        if (currentContacts.length !== initialContacts.length) return true;

        for (let i = 0; i < currentContacts.length; i++) {
            if (
                currentContacts[i].name.trim() !== (initialContacts[i].name || '').trim() ||
                currentContacts[i].number.trim() !== (initialContacts[i].number || '').trim()
            ) {
                return true;
            }
        }

        const initialImage = (editData.images && editData.images.length > 0) ? editData.images[0] : null;

        if (uploadedImage !== initialImage) return true;

        return false;
    }, [form, uploadedImage, editData, isEditing]);

    const handleSubmit = () => {
        if (isUploading) {
            Toast.show({
                type: 'info',
                text1: 'Upload in Progress',
                text2: 'Please wait for the photo to finish uploading.',
            });
            return;
        }

        const newErrors: { [key: string]: string } = {};

        if (!form.name.trim()) newErrors.name = 'Name is required.';
        if (!isTravel && !form.address.trim()) newErrors.address = 'Address is required.';
        if (!form.type.trim()) newErrors.type = 'Type is required.';

        if (isHealth || isGovt || isEducation) {
            if (!form.timing.trim()) {
                newErrors.timing = 'Timing is required.';
            }
        }

        if (isTravel && form.type?.toLowerCase() === 'bus') {
            const validRoutes = form.route.filter((r: any) => r.city.trim() !== '');
            if (validRoutes.length < 2) {
                newErrors.route = 'Bus route requires at least an origin and destination stop.';
            }

            const validReturnRoutes = form.returnRoute.filter((r: any) => r.city.trim() !== '');
            if (validReturnRoutes.length < 2) {
                newErrors.returnRoute = 'Bus return route requires at least an origin and destination stop.';
            }
        }

        if (!form.contact[0]?.number.trim()) {
            newErrors['contact_general'] = 'At least one contact number is required.';
        }

        const validContacts = form.contact.filter((c: any) => c.number.trim() !== '');
        const numbers = validContacts.map((c: any) => c.number.trim());
        const names = validContacts.map((c: any) => (c.name || '').trim().toLowerCase()).filter((n: string) => n !== '');

        if (new Set(numbers).size !== numbers.length) {
            newErrors['contact_general'] = 'Duplicate contact numbers are not allowed.';
        }

        if (names.length > 0 && new Set(names).size !== names.length) {
            newErrors['contact_general'] = 'Duplicate contact names are not allowed.';
        }

        for (let i = 0; i < validContacts.length; i++) {
            if (validContacts[i].number.trim().length !== 11) {
                const originalIndex = form.contact.findIndex((c: any) => c.number === validContacts[i].number);
                if (originalIndex !== -1) {
                    newErrors[`contact[${originalIndex}].number`] = 'Must be exactly 11 digits.';
                }
            }
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        const payload: any = {
            ...form,
            contact: validContacts.map((c: any) => ({ name: c.name, number: c.number })),
            category: category,
            images: uploadedImage ? [uploadedImage] : [],
            tags: (form.tags || []).map((t: any) => ({ eng: t.eng, ur: t.ur })),
            route: form.route.filter((r: any) => r.city.trim() !== ''),
            returnRoute: isTravel ? form.returnRoute.filter((r: any) => r.city.trim() !== '') : [],
            metadata: isEducation ? form.metadata : {},
        };


        submitMutation.mutate({ payload, isEditing, id: editData?._id }, {
            onSuccess: () => {
                onSuccess();
            }
        });
    };

    return (
        <View style={styles.container}>
            <Animated.View entering={FadeInDown.delay(200)} style={styles.field}>
                <View style={styles.labelRow}>
                    <ThemedText style={styles.label}>NAME <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                    <ThemedText style={[styles.charCount, form.name.length >= 100 && { color: '#EF4444' }]}>
                        {form.name.length}/100
                    </ThemedText>
                </View>
                <View style={[styles.inputBox, {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)',
                    height: Platform.OS === 'android' ? 48 : 52,
                }]}>
                    <Ionicons name="storefront-outline" size={18} color={colors.icon} style={{ marginRight: 10 }} />
                    <TextInput
                        style={[styles.inputText, { color: colors.text }]}
                        placeholder="Enter name"
                        placeholderTextColor={colors.icon}
                        value={form.name}
                        onChangeText={(text) => { handleChange('name', text.replace(/[^a-zA-Z\s]/g, '')); setErrors(prev => ({ ...prev, name: '' })); }}
                        maxLength={100}
                    />
                </View>
                {errors['name'] && <ThemedText style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors['name']}</ThemedText>}
            </Animated.View>

            <View style={styles.field}>
                <View style={styles.labelRow}>
                    <ThemedText style={styles.label}>Select Type <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
                    <EssentialsTypePills
                        availableTags={typesToRender.map((t: any) => ({ id: t.key, label: t.label, icon: t.icon }))}
                        selectedTags={form.type ? [{ id: form.type }] : []}
                        onToggleTag={(tag) => {
                            setForm(prev => ({
                                ...prev,
                                type: tag.id || '',
                                tags: []
                            }));
                        }}
                        isSingleSelect={true}
                        activeColor={activeColor}
                    />
                </ScrollView>
                {errors['type'] && <ThemedText style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors['type']}</ThemedText>}
            </View>

            {availableTags && availableTags.length > 0 && (
                <View style={styles.field}>
                    <ThemedText style={styles.label}>Select Services / Tags</ThemedText>
                    <EssentialsTypePills
                        availableTags={availableTags}
                        selectedTags={form.tags || []}
                        onToggleTag={(tag) => {
                            const isSelected = form.tags?.some((t: any) => t.eng?.toLowerCase() === tag.eng?.toLowerCase());
                            if (isSelected) {
                                setForm(prev => ({
                                    ...prev,
                                    tags: (prev.tags || []).filter((t: any) => t.eng?.toLowerCase() !== tag.eng?.toLowerCase())
                                }));
                            } else {
                                setForm(prev => ({
                                    ...prev,
                                    tags: [...(prev.tags || []), tag]
                                }));
                            }
                            setErrors(prev => ({ ...prev, tags: '' }));
                        }}
                        activeColor={activeColor}
                    />
                    {errors['tags'] && <ThemedText style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors['tags']}</ThemedText>}
                </View>
            )}

            {!isTravel && (
                <Animated.View entering={FadeInDown.delay(250)} style={styles.field}>
                    <View style={styles.labelRow}>
                        <ThemedText style={styles.label}>ADDRESS <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                        <ThemedText style={[styles.charCount, form.address.length >= 150 && { color: '#EF4444' }]}>
                            {form.address.length}/150
                        </ThemedText>
                    </View>
                    <View style={[styles.inputBox, {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)',
                        height: Platform.OS === 'android' ? 48 : 52,
                    }]}>
                        <Ionicons name="map-outline" size={18} color={colors.icon} style={{ marginRight: 10 }} />
                        <TextInput
                            style={[styles.inputText, { color: colors.text }]}
                            placeholder="Enter address"
                            placeholderTextColor={colors.icon}
                            value={form.address}
                            onChangeText={(text) => { handleChange('address', text); setErrors(prev => ({ ...prev, address: '' })); }}
                            maxLength={150}
                        />
                    </View>
                    {errors['address'] && <ThemedText style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors['address']}</ThemedText>}
                </Animated.View>
            )}

            {!isTravel && (
                <Animated.View entering={FadeInDown.delay(300)} style={styles.field}>
                    <View style={styles.labelRow}>
                        <ThemedText style={styles.label}>GOOGLE ADDRESS <ThemedText style={[styles.label, { color: colors.icon, fontWeight: '400' }]}>(Optional)</ThemedText></ThemedText>
                    </View>
                    <View style={[styles.inputBox, {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)',
                        height: Platform.OS === 'android' ? 48 : 52,
                    }]}>
                        <Ionicons name="navigate-outline" size={18} color={colors.icon} style={{ marginRight: 10 }} />
                        <TextInput
                            style={[styles.inputText, { color: colors.text }]}
                            placeholder="Enter Google Maps link or address"
                            placeholderTextColor={colors.icon}
                            value={form.googleAddress}
                            onChangeText={(text) => handleChange('googleAddress', text)}
                        />
                    </View>
                </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(350)} style={styles.field}>
                <View style={styles.labelRow}>
                    <ThemedText style={styles.label}>CONTACTS (MAX 3) <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                    {form.contact.length < 3 && (
                        <TouchableOpacity onPress={addContact}>
                            <ThemedText style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>+ Add</ThemedText>
                        </TouchableOpacity>
                    )}
                </View>
                {errors['contact_general'] && <ThemedText style={{ color: '#EF4444', fontSize: 12, marginBottom: 8 }}>{errors['contact_general']}</ThemedText>}

                {form.contact.map((contact: any, index: number) => (
                    <View key={index} style={{ marginBottom: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                            <View style={{ flex: 1, gap: 8 }}>
                                <View style={[styles.inputBox, {
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)',
                                    height: Platform.OS === 'android' ? 48 : 52,
                                }]}>
                                    <Ionicons name="person-outline" size={18} color={colors.icon} style={{ marginRight: 10 }} />
                                    <TextInput
                                        style={[styles.inputText, { color: colors.text }]}
                                        placeholder="Name"
                                        placeholderTextColor={colors.icon}
                                        value={contact.name}
                                        onChangeText={(text) => handleContactChange(index, 'name', text.replace(/[^a-zA-Z\s]/g, ''))}
                                    />
                                </View>
                                <View style={[styles.inputBox, {
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)',
                                    height: Platform.OS === 'android' ? 48 : 52,
                                    borderColor: errors[`contact[${index}].number`] ? '#EF4444' : 'transparent',
                                    borderWidth: errors[`contact[${index}].number`] ? 1 : 0
                                }]}>
                                    <Ionicons name="call-outline" size={18} color={colors.icon} style={{ marginRight: 10 }} />
                                    <TextInput
                                        style={[styles.inputText, { color: colors.text }]}
                                        placeholder="Phone Number"
                                        placeholderTextColor={colors.icon}
                                        value={contact.number}
                                        onChangeText={(text) => handleContactChange(index, 'number', text.replace(/[^0-9]/g, ''))}
                                        keyboardType="phone-pad"
                                        maxLength={11}
                                    />
                                </View>
                                {errors[`contact[${index}].number`] && <ThemedText style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors[`contact[${index}].number`]}</ThemedText>}
                            </View>
                            {index > 0 && (
                                <TouchableOpacity
                                    onPress={() => removeContact(index)}
                                    style={{ paddingTop: 16 }}
                                >
                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ))}
            </Animated.View>

            {isTravel && (
                <Animated.View entering={FadeInDown.delay(400)} style={[styles.field, { marginBottom: 20 }]}>
                    <View style={styles.labelRow}>
                        <ThemedText style={styles.label}>ROUTE / SCHEDULE <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                        {form.route.length < 10 && (
                            <TouchableOpacity onPress={addRoute}>
                                <ThemedText style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>+ Add Stop</ThemedText>
                            </TouchableOpacity>
                        )}
                    </View>
                    {errors['route'] && <ThemedText style={{ color: '#EF4444', fontSize: 12, marginBottom: 8 }}>{errors['route']}</ThemedText>}

                    {form.route.map((r: any, index: number) => (
                        <View key={index} style={{ marginBottom: 10 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={[styles.inputBox, { flex: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)', height: Platform.OS === 'android' ? 48 : 52 }]}>
                                    <Ionicons name="location-outline" size={16} color={colors.icon} style={{ marginRight: 8 }} />
                                    <TextInput
                                        style={[styles.inputText, { color: colors.text }]}
                                        placeholder="City (e.g. Chinji)"
                                        placeholderTextColor={colors.icon}
                                        value={r.city}
                                        onChangeText={(val) => handleRouteChange(index, 'city', val)}
                                    />
                                </View>
                                <TouchableOpacity
                                    onPress={() => setRoutePickerIndex(index)}
                                    style={[styles.inputBox, { flex: 1.2, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)', height: Platform.OS === 'android' ? 48 : 52 }]}
                                >
                                    <Ionicons name="time-outline" size={16} color={colors.icon} style={{ marginRight: 6 }} />
                                    <ThemedText style={{ color: r.time ? colors.text : colors.icon, fontSize: 13, fontWeight: '600' }}>
                                        {r.time || 'Time'}
                                    </ThemedText>
                                </TouchableOpacity>

                                {index > 0 && (
                                    <TouchableOpacity onPress={() => removeRoute(index)} style={{ padding: 4 }}>
                                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))}

                    <TimePicker
                        visible={routePickerIndex !== null}
                        onClose={() => setRoutePickerIndex(null)}
                        onSelect={(val) => {
                            if (routePickerIndex !== null) {
                                handleRouteChange(routePickerIndex, 'time', val);
                            }
                            setRoutePickerIndex(null);
                        }}
                        title="Departure Time"
                        currentValue={routePickerIndex !== null ? form.route[routePickerIndex].time : ''}
                    />
                </Animated.View>
            )}

            {isEducation && (
                <Animated.View entering={FadeInDown.delay(420)} style={[styles.field, { gap: 12 }]}>
                    <ThemedText style={styles.label}>SCHOOL / COLLEGE DETAILS</ThemedText>

                    <View style={[styles.inputBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)', height: Platform.OS === 'android' ? 48 : 52 }]}>
                        <Ionicons name="person-circle-outline" size={18} color={colors.icon} style={{ marginRight: 10 }} />
                        <TextInput
                            style={[styles.inputText, { color: colors.text }]}
                            placeholder="Principal Name"
                            placeholderTextColor={colors.icon}
                            value={form.metadata.principalName}
                            onChangeText={(text) => handleMetadataChange('principalName', text)}
                        />
                    </View>

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={[styles.inputBox, { flex: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)', height: Platform.OS === 'android' ? 48 : 52 }]}>
                            <Ionicons name="people-outline" size={18} color={colors.icon} style={{ marginRight: 8 }} />
                            <TextInput
                                style={[styles.inputText, { color: colors.text }]}
                                placeholder="Students"
                                placeholderTextColor={colors.icon}
                                value={form.metadata.totalStudents}
                                onChangeText={(text) => handleMetadataChange('totalStudents', text.replace(/[^0-9]/g, ''))}
                                keyboardType="number-pad"
                            />
                        </View>
                        <View style={[styles.inputBox, { flex: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)', height: Platform.OS === 'android' ? 48 : 52 }]}>
                            <Ionicons name="school-outline" size={18} color={colors.icon} style={{ marginRight: 8 }} />
                            <TextInput
                                style={[styles.inputText, { color: colors.text }]}
                                placeholder="Teachers"
                                placeholderTextColor={colors.icon}
                                value={form.metadata.totalTeachers}
                                onChangeText={(text) => handleMetadataChange('totalTeachers', text.replace(/[^0-9]/g, ''))}
                                keyboardType="number-pad"
                            />
                        </View>
                    </View>
                </Animated.View>
            )}

            {(isHealth || isEducation || isGovt) && (
                <Animated.View entering={FadeInDown.delay(440)} style={styles.field}>
                    <ThemedText style={[styles.label, { marginBottom: 6 }]}>TIMING <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={[styles.subLabel, { color: colors.icon }]}>OPENS AT</ThemedText>
                            <TouchableOpacity
                                onPress={() => setShowFromPicker(true)}
                                style={[styles.inputBox, {
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)',
                                    height: Platform.OS === 'android' ? 48 : 52,
                                    justifyContent: 'space-between',
                                }]}
                                activeOpacity={0.7}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Ionicons name="time-outline" size={18} color={colors.icon} />
                                    <ThemedText style={{ color: fromTime ? colors.text : colors.icon, fontSize: 14, fontWeight: '500' }}>
                                        {fromTime || 'From'}
                                    </ThemedText>
                                </View>
                                <Ionicons name="chevron-down" size={16} color={colors.icon} />
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={[styles.subLabel, { color: colors.icon }]}>CLOSES AT</ThemedText>
                            <TouchableOpacity
                                onPress={() => setShowToPicker(true)}
                                style={[styles.inputBox, {
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)',
                                    height: Platform.OS === 'android' ? 48 : 52,
                                    justifyContent: 'space-between',
                                }]}
                                activeOpacity={0.7}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Ionicons name="time-outline" size={18} color={colors.icon} />
                                    <ThemedText style={{ color: toTime ? colors.text : colors.icon, fontSize: 14, fontWeight: '500' }}>
                                        {toTime || 'To'}
                                    </ThemedText>
                                </View>
                                <Ionicons name="chevron-down" size={16} color={colors.icon} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    {errors['timing'] && <ThemedText style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors['timing']}</ThemedText>}

                    <TimePicker
                        visible={showFromPicker}
                        onClose={() => setShowFromPicker(false)}
                        onSelect={(val) => {
                            setFromTime(val);
                            if (toTime) {
                                handleChange('timing', `${val} - ${toTime}`);
                            } else {
                                handleChange('timing', val);
                            }
                            setErrors(prev => ({ ...prev, timing: '' }));
                        }}
                        title="Opening Time"
                        currentValue={fromTime}
                    />
                    <TimePicker
                        visible={showToPicker}
                        onClose={() => setShowToPicker(false)}
                        onSelect={(val) => {
                            setToTime(val);
                            if (fromTime) {
                                handleChange('timing', `${fromTime} - ${val}`);
                            } else {
                                handleChange('timing', val);
                            }
                            setErrors(prev => ({ ...prev, timing: '' }));
                        }}
                        title="Closing Time"
                        currentValue={toTime}
                    />
                </Animated.View>
            )}

            {/* ── Travel: Departure Route ────────────────────────────── */}
            {isTravel && (
                <Animated.View entering={FadeInDown.delay(450)} style={styles.field}>
                    <View style={styles.labelRow}>
                        <ThemedText style={styles.label}>
                            DEPARTURE ROUTE{' '}
                            {form.type?.toLowerCase() === 'bus'
                                ? <ThemedText style={{ color: '#EF4444' }}>*</ThemedText>
                                : <ThemedText style={{ color: '#94A3B8' }}>(OPTIONAL)</ThemedText>
                            }
                        </ThemedText>
                        {form.route.length < 10 && (
                            <TouchableOpacity onPress={() => {
                                if (form.route.length < 10) {
                                    setForm(prev => ({ ...prev, route: [...prev.route, { city: '', time: '' }] }));
                                    setErrors(prev => ({ ...prev, route: '' }));
                                }
                            }}>
                                <ThemedText style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>+ Add Stop</ThemedText>
                            </TouchableOpacity>
                        )}
                    </View>
                    {errors['route'] && <ThemedText style={{ color: '#EF4444', fontSize: 12, marginBottom: 8 }}>{errors['route']}</ThemedText>}

                    {form.route.map((r: any, index: number) => (
                        <View key={index} style={{ marginBottom: 10 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={[styles.inputBox, { flex: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)', height: Platform.OS === 'android' ? 48 : 52 }]}>
                                    <Ionicons name="location-outline" size={16} color={colors.icon} style={{ marginRight: 8 }} />
                                    <TextInput
                                        style={[styles.inputText, { color: colors.text }]}
                                        placeholder={index === 0 ? 'From' : index === form.route.length - 1 ? 'To' : `Stop ${index + 1}`}
                                        placeholderTextColor={colors.icon}
                                        value={r.city}
                                        onChangeText={(val) => {
                                            const newRoute = [...form.route];
                                            newRoute[index] = { ...newRoute[index], city: val };
                                            setForm(prev => ({ ...prev, route: newRoute }));
                                        }}
                                    />
                                </View>
                                <TouchableOpacity
                                    onPress={() => setRoutePickerIndex(index)}
                                    style={[styles.inputBox, { flex: 1.2, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)', height: Platform.OS === 'android' ? 48 : 52 }]}
                                >
                                    <Ionicons name="time-outline" size={16} color={colors.icon} style={{ marginRight: 6 }} />
                                    <ThemedText style={{ color: r.time ? colors.text : colors.icon, fontSize: 13, fontWeight: '600' }}>
                                        {r.time || 'Time'}
                                    </ThemedText>
                                </TouchableOpacity>

                                {index > 0 && (
                                    <TouchableOpacity onPress={() => {
                                        const newRoute = form.route.filter((_: any, i: number) => i !== index);
                                        setForm(prev => ({ ...prev, route: newRoute }));
                                    }} style={{ padding: 4 }}>
                                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))}

                    <TimePicker
                        visible={routePickerIndex !== null}
                        onClose={() => setRoutePickerIndex(null)}
                        onSelect={(val) => {
                            if (routePickerIndex !== null) {
                                const newRoute = [...form.route];
                                newRoute[routePickerIndex] = { ...newRoute[routePickerIndex], time: val };
                                setForm(prev => ({ ...prev, route: newRoute }));
                            }
                            setRoutePickerIndex(null);
                        }}
                        title="Departure Time"
                        currentValue={routePickerIndex !== null ? form.route[routePickerIndex]?.time : ''}
                    />

                    {/* Return Route Section */}
                    <View style={[styles.labelRow, { marginTop: 16 }]}>
                        <ThemedText style={styles.label}>
                            RETURN ROUTE{' '}
                            {form.type?.toLowerCase() === 'bus'
                                ? <ThemedText style={{ color: '#EF4444' }}>*</ThemedText>
                                : <ThemedText style={{ color: '#94A3B8' }}>(OPTIONAL)</ThemedText>
                            }
                        </ThemedText>
                        {form.returnRoute.length < 10 && (
                            <TouchableOpacity onPress={addReturnRoute}>
                                <ThemedText style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>+ Add Stop</ThemedText>
                            </TouchableOpacity>
                        )}
                    </View>
                    {errors['returnRoute'] && <ThemedText style={{ color: '#EF4444', fontSize: 12, marginBottom: 8 }}>{errors['returnRoute']}</ThemedText>}

                    {form.returnRoute.map((r: any, index: number) => (
                        <View key={index} style={{ marginBottom: 10 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={[styles.inputBox, { flex: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)', height: Platform.OS === 'android' ? 48 : 52 }]}>
                                    <Ionicons name="location-outline" size={16} color={colors.icon} style={{ marginRight: 8 }} />
                                    <TextInput
                                        style={[styles.inputText, { color: colors.text }]}
                                        placeholder={index === 0 ? 'Return origin' : index === form.returnRoute.length - 1 ? 'Final stop' : `Stop ${index + 1}`}
                                        placeholderTextColor={colors.icon}
                                        value={r.city}
                                        onChangeText={(val) => handleReturnRouteChange(index, 'city', val)}
                                    />
                                </View>
                                <TouchableOpacity
                                    onPress={() => setReturnRoutePickerIndex(index)}
                                    style={[styles.inputBox, { flex: 1.2, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)', height: Platform.OS === 'android' ? 48 : 52 }]}
                                >
                                    <Ionicons name="time-outline" size={16} color={colors.icon} style={{ marginRight: 6 }} />
                                    <ThemedText style={{ color: r.time ? colors.text : colors.icon, fontSize: 13, fontWeight: '600' }}>
                                        {r.time || 'Time'}
                                    </ThemedText>
                                </TouchableOpacity>

                                {index > 0 && (
                                    <TouchableOpacity onPress={() => removeReturnRoute(index)} style={{ padding: 4 }}>
                                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))}

                    <TimePicker
                        visible={returnRoutePickerIndex !== null}
                        onClose={() => setReturnRoutePickerIndex(null)}
                        onSelect={(val) => {
                            if (returnRoutePickerIndex !== null) {
                                handleReturnRouteChange(returnRoutePickerIndex, 'time', val);
                            }
                            setReturnRoutePickerIndex(null);
                        }}
                        title="Return Departure Time"
                        currentValue={returnRoutePickerIndex !== null ? form.returnRoute[returnRoutePickerIndex]?.time : ''}
                    />
                </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(500)} style={styles.footer}>

                <CancelButton
                    onPress={onCancel}
                />

                <SubmitButton
                    title={isEditing ? 'Update' : 'Submit'}
                    onPress={handleSubmit}
                    isLoading={isPending || isUploading}
                    disabled={isPending || isUploading || (isEditing && !hasChanges)}
                />
            </Animated.View>
        </View>
    );
});

EssentialSubmitForm.displayName = 'EssentialSubmitForm';

export default EssentialSubmitForm;

const styles = StyleSheet.create({
    container: {
        paddingTop: 16,
    },
    field: {
        marginBottom: 20,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
        color: '#64748B',
    },
    subLabel: {
        fontSize: 10,
        fontWeight: '700',
        marginBottom: 4,
        marginLeft: 4,
    },
    charCount: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        paddingHorizontal: 14,
    },
    inputText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    input: {
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
    },
    textArea: {
        minHeight: 120,
        textAlignVertical: 'top',
    },

    formatToolbar: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    formatBtn: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    formatBtnText: {
        fontSize: 11,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 10,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(150,150,150,0.1)',
    },
});
