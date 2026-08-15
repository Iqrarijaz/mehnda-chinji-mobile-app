import React, { useEffect } from 'react';
import { Modal, StyleSheet, View, SafeAreaView, Platform, Dimensions, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withTiming } from 'react-native-reanimated';
import Avatar from '@/components/ui/Avatar';
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

export const ImageViewerModal: React.FC<ImageViewerModalProps> = React.memo(({
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

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent={false}
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <Animated.View entering={FadeIn.duration(200)} style={styles.container}>
                <Animated.View style={styles.content}>
                    <PressableScale onPress={onClose} style={[styles.closeButton, { top: insets.top + 10 }]}>
                        <View style={styles.closeButtonSurface}>
                            <Ionicons name="close" size={24} color="#FFFFFF" />
                        </View>
                    </PressableScale>

                    {images.length > 0 ? (
                        <View style={{ flex: 1 }}>
                            <FlatList
                                data={images}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                initialScrollIndex={initialIndex}
                                getItemLayout={(_, index) => ({
                                    length: Dimensions.get('window').width,
                                    offset: Dimensions.get('window').width * index,
                                    index,
                                })}
                                onViewableItemsChanged={onViewableItemsChanged}
                                viewabilityConfig={viewabilityConfig}
                                keyExtractor={(item, index) => `${item}-${index}`}
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
                                <View style={[styles.pagination, { bottom: insets.bottom + 20 }]}>
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
});

ImageViewerModal.displayName = 'ImageViewerModal';

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
