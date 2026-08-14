import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { PressableScale } from '@/components/essentials/shared/PressableScale';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { currencyMatchesQuery, getCurrencyFlagUrl, getCurrencyMeta } from '@/constants/currencies';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

export interface CurrencyPickerSheetProps {
    /** Codes the user can currently pick from — respects the free/unlocked tier, same list the screen shows. */
    codes: string[];
    favorites: string[];
    /** Code to exclude from the list (e.g. whichever side of the converter is already PKR). */
    excludeCode?: string;
    onSelect: (code: string) => void;
}

const TILE_SIZE = 36;

export const CurrencyPickerSheet = forwardRef<BottomSheetModal, CurrencyPickerSheetProps>(
    ({ codes, favorites, excludeCode, onSelect }, ref) => {
        const { theme } = useTheme();
        const colors = Colors[theme];
        const [query, setQuery] = useState('');

        const orderedCodes = useMemo(() => {
            const pool = codes.filter((c) => c !== excludeCode);
            const q = query.trim();
            const filtered = q ? pool.filter((c) => currencyMatchesQuery(c, getCurrencyMeta(c), q)) : pool;
            // Favorites first (in pin order), then everything else alphabetically.
            const favSet = new Set(favorites);
            const favs = favorites.filter((c) => favSet.has(c) && filtered.includes(c));
            const rest = filtered.filter((c) => !favSet.has(c)).sort((a, b) => a.localeCompare(b));
            return [...favs, ...rest];
        }, [codes, excludeCode, favorites, query]);

        const handleSelect = useCallback((code: string) => {
            onSelect(code);
            setQuery('');
            (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();
        }, [onSelect, ref]);

        const renderBackdrop = useCallback(
            (props: any) => (
                <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.55} pressBehavior="close" />
            ),
            []
        );

        return (
            <BottomSheetModal
                ref={ref}
                index={0}
                snapPoints={['75%', '92%']}
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: colors.background }}
                handleIndicatorStyle={{ backgroundColor: colors.secondary, width: 40 }}
                enablePanDownToClose
                onDismiss={() => setQuery('')}
            >
                <View style={styles.header}>
                    <ThemedText style={styles.title}>Select Currency</ThemedText>
                    <View style={[styles.searchBar, { backgroundColor: colors.cardBg }]}>
                        <Ionicons name="search" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                        <TextInput
                            value={query}
                            onChangeText={setQuery}
                            placeholder="Search currency"
                            placeholderTextColor={colors.textSecondary}
                            style={[styles.searchInput, { color: colors.text }]}
                            allowFontScaling={false}
                        />
                    </View>
                </View>

                <BottomSheetFlatList
                    data={orderedCodes}
                    keyExtractor={(code: string) => code}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item: code }: { item: string }) => {
                        const meta = getCurrencyMeta(code);
                        const flagUrl = getCurrencyFlagUrl(code);
                        const isFav = favorites.includes(code);
                        return (
                            <PressableScale intensity={0.02} onPress={() => handleSelect(code)} containerStyle={styles.rowWrap}>
                                <View style={[styles.row, { backgroundColor: colors.cardBg }]}>
                                    <View style={[styles.flagTile, { backgroundColor: colors.primary + '12' }]}>
                                        {flagUrl ? (
                                            <Image source={{ uri: flagUrl }} style={styles.flagImage} contentFit="cover" />
                                        ) : (
                                            <ThemedText style={[styles.flagFallbackText, { color: colors.primary }]}>{code.slice(0, 2)}</ThemedText>
                                        )}
                                    </View>
                                    <View style={styles.textWrap}>
                                        <ThemedText style={styles.code}>{code}</ThemedText>
                                        <ThemedText style={[styles.name, { color: colors.textSecondary }]} numberOfLines={1}>
                                            {meta.name}
                                        </ThemedText>
                                    </View>
                                    {isFav && <Ionicons name="star" size={16} color={colors.secondary} />}
                                </View>
                            </PressableScale>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <ThemedText style={{ color: colors.textSecondary, fontSize: 13 }}>
                                No currencies match &ldquo;{query}&rdquo;
                            </ThemedText>
                        </View>
                    }
                />
            </BottomSheetModal>
        );
    }
);

CurrencyPickerSheet.displayName = 'CurrencyPickerSheet';

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 12,
    },
    title: {
        fontSize: 17,
        fontWeight: '800',
        marginBottom: 12,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 42,
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 14,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        padding: 0,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 28,
    },
    rowWrap: {
        marginBottom: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    flagTile: {
        width: TILE_SIZE,
        height: TILE_SIZE,
        borderRadius: 10,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    flagImage: {
        width: '100%',
        height: '100%',
    },
    flagFallbackText: {
        fontSize: 11,
        fontWeight: '800',
    },
    textWrap: {
        flex: 1,
    },
    code: {
        fontSize: 14,
        fontWeight: '700',
    },
    name: {
        fontSize: 11.5,
        marginTop: 1,
    },
    emptyWrap: {
        paddingTop: 40,
        alignItems: 'center',
    },
});
