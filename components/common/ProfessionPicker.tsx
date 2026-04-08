import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    FlatList,
    Modal,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';
import professionsData from '../../data/professions.json';
import { ThemedText } from '../themedText';

interface Profession {
    name_eng: string;
    name_ur: string;
}

interface ProfessionPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (profession: Profession) => void;
    currentProfession?: string;
}

export function ProfessionPicker({ visible, onClose, onSelect, currentProfession }: ProfessionPickerProps) {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProfessions = professionsData.filter(prof =>
        prof.name_eng.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prof.name_ur.includes(searchQuery)
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Select Profession</ThemedText>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            {currentProfession && currentProfession !== 'All' && (
                                <TouchableOpacity
                                    onPress={() => {
                                        onSelect({ name_eng: 'All', name_ur: 'تمام' });
                                        onClose();
                                    }}
                                >
                                    <ThemedText style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>Clear</ThemedText>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.background }]}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={[styles.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border }]}>
                        <Ionicons name="search" size={20} color={colors.icon} />
                        <TextInput
                            placeholder="Search profession..."
                            placeholderTextColor={colors.icon}
                            style={[styles.searchInput, { color: colors.text }]}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus={false}
                        />
                    </View>

                    <FlatList
                        data={filteredProfessions}
                        keyExtractor={(item: Profession) => item.name_eng}
                        renderItem={({ item }: { item: Profession }) => (
                            <TouchableOpacity
                                style={[styles.item, { borderBottomColor: colors.border }]}
                                onPress={() => {
                                    onSelect(item);
                                    setSearchQuery('');
                                    onClose();
                                }}
                            >
                                <View style={styles.labelContainer}>
                                    <ThemedText style={[
                                        styles.itemTextEng,
                                        { color: colors.text },
                                        currentProfession === item.name_eng && { color: colors.primary, fontWeight: '700' }
                                    ]}>
                                        {item.name_eng}
                                    </ThemedText>
                                    <ThemedText style={[
                                        styles.itemTextUr,
                                        { color: colors.icon },
                                        currentProfession === item.name_eng && { color: colors.primary, fontWeight: '700' }
                                    ]}>
                                        {item.name_ur}
                                    </ThemedText>
                                </View>
                                {currentProfession === item.name_eng && (
                                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.listContent}
                    />
                </View>
            </View>
        </Modal >
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '80%',
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: Layout.borderRadius,
        borderTopRightRadius: Layout.borderRadius,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
modalHeader: {
    flexDirection: 'row',
        justifyContent: 'space-between',
            alignItems: 'center',
                marginBottom: 20,
    },
modalTitle: {
    fontSize: 22,
        fontWeight: '800',
            letterSpacing: -0.5,
    },
closeButton: {
    padding: 4,
        borderRadius: 20,
    },
searchBar: {
    flexDirection: 'row',
        alignItems: 'center',
            height: 52,
                borderRadius: Layout.borderRadius,
                    paddingHorizontal: 16,
                        marginBottom: 20,
                            borderWidth: 1,
    },
searchInput: {
    flex: 1,
        marginLeft: 12,
            fontSize: 16,
    },
listContent: {
    paddingBottom: 40,
    },
item: {
    flexDirection: 'row',
        justifyContent: 'space-between',
            alignItems: 'center',
                // paddingVertical: 8,
                borderBottomWidth: 1,
    },
labelContainer: {
    flexDirection: 'row',
        justifyContent: 'space-between',
            alignItems: 'center',
                flex: 1,
                    marginRight: 15,
    },
itemTextEng: {
    fontSize: 16,
        fontWeight: '600',
            paddingVertical: 16,
                textTransform: 'capitalize',
    },
itemTextUr: {
    fontSize: 14,
        paddingRight: 16,
            paddingVertical: 20,
                fontWeight: '500',
    },
selectedText: {
    fontWeight: '700',
    },
});
