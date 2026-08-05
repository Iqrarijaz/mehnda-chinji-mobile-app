import React, { useEffect } from 'react';
import { Modal, StyleSheet, View, SafeAreaView, Platform, Dimensions, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withTiming } from 'react-native-reanimated';
import Avatar from '@/components/ui/avatar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../ThemedText';
import { Layout } from '@/constants/layout';
import { PressableScale } from '@/components/essentials/shared/PressableScale';

interface ImageViewerModalProps {
    visible: boolean;
    onClose: () => void;
    images?: string[];
    uri?: string | null; // For single image backwards compatibility
    initialIndex?: number;
    name?: string;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
    visible,
    onClose,
    images: propImages,
    uri,
    initialIndex = 0,
    name
}) => {
    const insets = useSafeAreaInsets();
    const images = propImages || (uri ? [uri] : []);
    const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

    React.useEffect(() => {
        if (visible) {
            setCurrentIndex(initialIndex);
        }
    }, [visible, initialIndex]);

    const onViewableItemsChanged = React.useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index || 0);
        }
    }).current;

    const viewabilityConfig = React.useRef({
        itemVisiblePercentThreshold: 50
    }).current;

    // Slight scale-up to accompany the content's fade-in, driven the same way
    // PremiumModal drives its blur intensity, so it re-triggers on every open.
    const contentScale = useSharedValue(0.96);
    useEffect(() => {
        contentScale.value = visible
            ? withTiming(1, { duration: 260 })
            : 0.96;
    }, [visible]);
    const contentAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: contentScale.value }]
    }));

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            onRequestClose={onClose}
        >
            <Animated.View entering={FadeIn.duration(220)} style={styles.container}>
                <Animated.View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom }, contentAnimatedStyle]}>
                    <PressableScale
                        containerStyle={[styles.closeButton, { top: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}
                        style={styles.closeButtonSurface}
                        onPress={onClose}
                    >
                        <Ionicons name="close" size={28} color="#FFFFFF" />
                    </PressableScale>

                    {images.length > 0 ? (
                        <View style={{ flex: 1 }}>
                            <FlatList
                                data={images}
                                horizontal
                                pagingEnabled
                                initialScrollIndex={initialIndex}
                                showsHorizontalScrollIndicator={false}
                                onViewableItemsChanged={onViewableItemsChanged}
                                viewabilityConfig={viewabilityConfig}
                                keyExtractor={(_, index) => `viewer-${index}`}
                                getItemLayout={(_, index) => ({
                                    length: Dimensions.get('window').width,
                                    offset: Dimensions.get('window').width * index,
                                    index })}
                                renderItem={({ item }) => (
                                    <View style={styles.listImageWrapper}>
                                        <Image
                                            source={{ uri: item }}
                                            style={styles.image}
                                            contentFit="contain"
                                            transition={200}
                                        />
                                    </View>
                                )}
                            />
                            {images.length > 1 && (
                                <View style={[styles.pagination, { bottom: insets.bottom + 40 }]}>
                                    <View style={styles.paginationBadge}>
                                        <ThemedText style={styles.paginationText}>
                                            {currentIndex + 1} / {images.length}
                                        </ThemedText>
                                    </View>
                                </View>
                            )}
                        </View>
                    ) : (
                        <View style={styles.imageContainer}>
                            <Avatar uri={undefined} name={name} size={300} style={styles.placeholderAvatar} />
                        </View>
                    )}
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)' },
    content: {
        flex: 1 },
    closeButton: {
        position: 'absolute',
        right: 20,
        zIndex: 10 },
    closeButtonSurface: {
        padding: 7,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: Layout.borderRadius,
        width: 42,
        height: 42,
        justifyContent: 'center',
        alignItems: 'center' },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16 },
    listImageWrapper: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
        justifyContent: 'center',
        alignItems: 'center' },
    image: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height },
    placeholderAvatar: {
    },
    pagination: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center' },
    paginationBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Layout.borderRadius },
    paginationText: {
        color: '#FFFFFF',
        fontSize: 12.5,
        fontWeight: '600' }
});
