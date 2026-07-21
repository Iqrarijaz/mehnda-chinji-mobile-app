import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, SafeAreaView, Platform, Dimensions, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '@/components/ui/avatar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../ThemedText';
import { Layout } from '@/constants/layout';

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

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                    <TouchableOpacity
                        style={[styles.closeButton, { top: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}
                        onPress={onClose}
                    >
                        <Ionicons name="close" size={28} color="#FFFFFF" />
                    </TouchableOpacity>

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
                </View>
            </View>
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
        zIndex: 10,
        padding: 8,
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
        padding: 20 },
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
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: Layout.borderRadius },
    paginationText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600' }
});
