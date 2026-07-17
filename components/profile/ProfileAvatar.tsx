import { memo } from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '@/components/ui/avatar';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface ProfileAvatarProps {
    uri?: string | null;
    name?: string;
    isUploading: boolean;
    isDeleting: boolean;
    onPickImage: () => void;
    onDeleteImage: () => void;
    onPreviewOpen: () => void;
}

export const ProfileAvatar = memo(({
    uri,
    name,
    isUploading,
    isDeleting,
    onPickImage,
    onDeleteImage,
    onPreviewOpen
}: ProfileAvatarProps) => {
    return (
        <View style={styles.avatarContainer}>
            <View style={styles.imageWrapper}>
                {isUploading ? (
                    <View style={styles.loaderOverlay}>
                        <ActivityIndicator color="#FFFFFF" />
                    </View>
                ) : (
                    <TouchableOpacity activeOpacity={0.9} onPress={onPreviewOpen}>
                        <Avatar uri={uri || undefined} name={name} size={80} style={styles.avatar} />
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.cameraIcon} onPress={onPickImage}>
                    <Ionicons name="camera" size={16} color="#FFFFFF" />
                </TouchableOpacity>

                {uri && !isUploading && (
                    <TouchableOpacity
                        style={styles.deleteIcon}
                        onPress={onDeleteImage}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Ionicons name="trash" size={14} color="#FFFFFF" />
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    avatarContainer: {
        alignItems: 'center',
        marginTop: 4,
        marginBottom: 4,
    },
    imageWrapper: {
        position: 'relative',
        padding: 3,
        borderRadius: 45,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    avatar: {
        borderRadius: 40,
        borderColor: '#FFFFFF',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: '#0D9488',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: '#FFFFFF',
    },
    deleteIcon: {
        position: 'absolute',
        bottom: -2,
        left: -2,
        backgroundColor: '#FF5A5F',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: '#FFFFFF',
    },
    loaderOverlay: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
