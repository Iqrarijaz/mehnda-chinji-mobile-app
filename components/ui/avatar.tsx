import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Image } from 'expo-image';
import React from 'react';
import { Text, View } from 'react-native';

interface AvatarProps {
    uri?: string;
    name?: string;
    size?: number;
    style?: any;
}

const Avatar: React.FC<AvatarProps> = ({ uri, name, size = 40, style }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const primaryColor = colors.primary;

    if (uri && typeof uri === 'string' && uri.trim().length > 0) {
        return (
            <Image
                source={{ uri }}
                style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
                contentFit="cover"
                transition={200}
            />
        );
    }

    const firstLetter = name ? name.trim().charAt(0).toUpperCase() : '?';

    return (
        <View style={[{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: '#FFFFFF',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#E2E8F0',
        }, style]}>
            <Text style={{
                color: primaryColor,
                fontSize: size * 0.45,
                fontWeight: 'bold',
            }}>
                {firstLetter}
            </Text>
        </View>
    );
};

export default Avatar;
