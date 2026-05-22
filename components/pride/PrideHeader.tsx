import React from 'react';
import { Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themedText';
import { Layout as LayoutConst } from '@/constants/layout';

interface PrideHeaderProps {
    title: string;
    searchVal: string;
    onChangeSearch: (value: string) => void;
    onClearSearch: () => void;
    onPressMenu: () => void;
    onPressAdd: () => void;
    showAddButton: boolean;
    colors: any;
    insets: { top: number };
}

export const PrideHeader = React.memo(({
    title,
    searchVal,
    onChangeSearch,
    onClearSearch,
    onPressMenu,
    onPressAdd,
    showAddButton,
    colors,
    insets,
}: PrideHeaderProps) => (
    <View style={[styles.headerWrap, { backgroundColor: colors.primary, paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={onPressMenu} style={styles.iconBtn}>
                <Ionicons name="grid-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <ThemedText style={styles.headerTitle} numberOfLines={1}>
                {title}
            </ThemedText>

            {showAddButton ? (
                <TouchableOpacity onPress={onPressAdd} style={styles.addBtn} activeOpacity={0.9}>
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            ) : (
                <View style={styles.rightSpacer} />
            )}
        </View>

        <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.85)" />
                <TextInput
                    value={searchVal}
                    onChangeText={onChangeSearch}
                    placeholder="Search achievers, legends, memorials..."
                    placeholderTextColor="rgba(255,255,255,0.64)"
                    style={styles.searchInput}
                />
                {searchVal.length > 0 && (
                    <TouchableOpacity onPress={onClearSearch} style={styles.clearBtn}>
                        <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.9)" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    </View>
));

const styles = StyleSheet.create({
    headerWrap: {
        paddingBottom: 14,
        borderBottomLeftRadius: LayoutConst.headerBorderRadius,
        borderBottomRightRadius: LayoutConst.headerBorderRadius,
        ...Platform.select({
            ios: {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.12,
                shadowRadius: 14,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        minHeight: 50,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.24)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.45)',
    },
    rightSpacer: {
        width: 40,
        height: 40,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        marginHorizontal: 10,
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginTop: 10,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 42,
        borderRadius: LayoutConst.borderRadius + 2,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(255,255,255,0.16)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.28)',
    },
    searchInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 13.5,
        fontWeight: '500',
        paddingVertical: 0,
        marginLeft: 8,
    },
    clearBtn: {
        padding: 2,
    },
});
