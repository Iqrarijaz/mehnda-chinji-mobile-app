import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import { getAuthenticatedConfiguration } from '@/apis/configuration';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

interface Contact {
    name: string;
    number: string;
}

interface MosqueCardProps {
    data: {
        _id: string;
        name: string;
        category: {
            en: string;
            ur?: string;
        } | string;
        type?: string;
        description?: string;
        phone?: string;
        village?: string;
        address?: string;
        location?: {
            coordinates: [number, number];
        };
        contact?: Contact[];
        images?: string[];
    };
    color?: string;
}

const MosqueCard = React.memo(({ data, color }: MosqueCardProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const colors = Colors[theme];
    const router = useRouter();

    /**
     * Fetch Configuration
     */
    const { data: essentialsConfig } = useQuery({
        queryKey: ['configuration', 'ESSENTIALS_ICONS'],
        queryFn: () => getAuthenticatedConfiguration('ESSENTIALS_ICONS'),
        staleTime: 1000 * 60 * 60 * 24,
    });

    /**
     * Extract Config Array
     */
    const getConfigArray = (resp: any) => {
        let val =
            resp?.data?.data ||
            resp?.data?.value ||
            resp?.data ||
            resp;

        if (val && typeof val === 'object' && val.value) {
            val = val.value;
        }

        if (typeof val === 'string') {
            try {
                val = JSON.parse(val);
            } catch (e) {
                console.log('Config parse error:', e);
            }
        }

        return Array.isArray(val) ? val : [];
    };

    const configData = React.useMemo(() => {
        return getConfigArray(essentialsConfig);
    }, [essentialsConfig]);

    /**
     * Get Religious Config
     */
    const religiousConfig = React.useMemo(() => {
        return configData.find(
            (c: any) =>
                c.category?.toLowerCase() === 'religious'
        );
    }, [configData]);

    /**
     * Normalize strings for matching
     */
    const normalize = (value: string = '') =>
        value
            .toLowerCase()
            .trim()
            .replace(/[_\s-]+/g, '');

    /**
     * Match Type Config
     */
    const typeConfig = React.useMemo(() => {
        if (!data.type || !religiousConfig?.types) {
            return null;
        }

        const normalizedType = normalize(data.type);

        return religiousConfig.types.find((t: any) => {
            return (
                normalize(t.key) === normalizedType ||
                normalize(t.label) === normalizedType
            );
        });
    }, [data.type, religiousConfig]);

    /**
     * Theme Colors
     */
    const primaryColor = color || '#10B981';
    const primaryAlpha10 = primaryColor + '1A';

    /**
     * Capitalize Text
     */
    const capitalize = (str: string) => {
        if (!str || typeof str !== 'string') return '';

        return str
            .toLowerCase()
            .split(' ')
            .map(
                word =>
                    word.charAt(0).toUpperCase() +
                    word.slice(1)
            )
            .join(' ');
    };

    /**
     * Display Data
     */
    const mosqueName = capitalize(data.name);

    const address = capitalize(
        data.village ||
        data.address ||
        'Address not available'
    );

    const typeLabel =
        typeConfig?.label ||
        capitalize(data.type || '');

    /**
     * Image Logic
     * Priority:
     * 1. Uploaded image
     */
    const mosqueImage = data.images?.[0];

    /**
     * Debug Logs
     */
    console.log({
        dataType: data.type,
        matchedTypeConfig: typeConfig,
        mosqueImage,
    });

    return (
        <View style={styles.wrapper}>
            <TouchableOpacity
                activeOpacity={0.88}
                onPress={() =>
                    router.push({
                        pathname: '/place/[id]',
                        params: {
                            id: data._id,
                            placeData: JSON.stringify(data),
                            color: primaryColor,
                            category: 'Mosque',
                        },
                    })
                }
                style={[
                    styles.card,
                    {
                        backgroundColor: isDark
                            ? '#1A1F2E'
                            : '#FFFFFF',
                        borderColor: isDark
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(0,0,0,0.06)',
                        shadowColor: isDark
                            ? '#000'
                            : primaryColor,
                    },
                ]}
            >
                {/* Image Section */}
                <View
                    style={[
                        styles.imageCol,
                        {
                            backgroundColor:
                                primaryColor + '10',
                        },
                    ]}
                >
                    {mosqueImage ? (
                        <Image
                            source={{ uri: mosqueImage }}
                            style={styles.image}
                            contentFit="cover"
                            transition={250}
                        />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons
                                name={
                                    (religiousConfig?.icon as any) ||
                                    'book'
                                }
                                size={32}
                                color={primaryColor}
                                style={{ opacity: 0.85 }}
                            />
                        </View>
                    )}
                </View>

                {/* Content Section */}
                <View style={styles.contentCol}>
                    <ThemedText
                        style={[
                            styles.mosqueName,
                            {
                                color: isDark
                                    ? '#F1F5F9'
                                    : '#0F172A',
                            },
                        ]}
                        numberOfLines={2}
                    >
                        {mosqueName}
                    </ThemedText>

                    {/* Divider */}
                    <View style={styles.dividerRow}>
                        <View
                            style={[
                                styles.dividerAccent,
                                {
                                    backgroundColor:
                                        primaryColor,
                                },
                            ]}
                        />

                        <View
                            style={[
                                styles.dividerLine,
                                {
                                    backgroundColor: isDark
                                        ? 'rgba(255,255,255,0.06)'
                                        : 'rgba(0,0,0,0.06)',
                                },
                            ]}
                        />
                    </View>

                    {/* Address */}
                    <View style={styles.locationRow}>
                        <View
                            style={[
                                styles.locationIconWrap,
                                {
                                    backgroundColor:
                                        primaryAlpha10,
                                },
                            ]}
                        >
                            <Ionicons
                                name="location"
                                size={12}
                                color={primaryColor}
                            />
                        </View>

                        <ThemedText
                            style={[
                                styles.locationText,
                                {
                                    color: isDark
                                        ? '#94A3B8'
                                        : '#475569',
                                },
                            ]}
                            numberOfLines={2}
                        >
                            {address}
                        </ThemedText>
                    </View>
                </View>
            </TouchableOpacity>

            {/* Type Badge */}
            {typeLabel ? (
                <View
                    style={[
                        styles.typePill,
                        {
                            backgroundColor:
                                primaryColor,
                        },
                    ]}
                >
                    <ThemedText
                        style={styles.typePillText}
                    >
                        {typeLabel}
                    </ThemedText>
                </View>
            ) : null}
        </View>
    );
});

export default MosqueCard;

const styles = StyleSheet.create({
    wrapper: {
        position: 'relative',
        marginBottom: 14,
    },

    card: {
        flexDirection: 'row',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        height: 100,
    },

    /**
     * Image Column
     */
    imageCol: {
        width: '28%',
        height: '100%',
        padding: 4,
    },

    image: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },

    imagePlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    /**
     * Type Badge
     */
    typePill: {
        position: 'absolute',
        top: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 7,
        paddingVertical: 4,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 6,
    },

    typePillText: {
        color: '#FFFFFF',
        fontSize: 8,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },

    /**
     * Content Column
     */
    contentCol: {
        flex: 1,
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 12,
        justifyContent: 'center',
    },

    mosqueName: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: -0.2,
        lineHeight: 20,
        marginBottom: 8,
    },

    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 8,
    },

    dividerAccent: {
        width: 18,
        height: 2.5,
        borderRadius: 2,
    },

    dividerLine: {
        flex: 1,
        height: 1,
        borderRadius: 1,
    },

    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    locationIconWrap: {
        width: 20,
        height: 20,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },

    locationText: {
        flex: 1,
        fontSize: 11,
        fontWeight: '500',
        lineHeight: 15,
    },
});