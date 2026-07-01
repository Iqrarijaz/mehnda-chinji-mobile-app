import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Image } from 'expo-image';
import React, { memo } from 'react';
import { Text, View } from 'react-native';

interface AvatarProps {
    uri?: string;
    name?: string;
    size?: number;
    style?: any;
    primaryColor?: string;
    isDark?: boolean;
}

const Avatar: React.FC<AvatarProps> = memo(({ uri, name, size = 40, style, primaryColor, isDark }) => {
    const themeCtx = (!primaryColor || isDark === undefined) ? useTheme() : null;
    const resolvedIsDark = isDark !== undefined ? isDark : (themeCtx?.isDark ?? false);
    const resolvedPrimary = primaryColor ?? Colors[themeCtx?.theme ?? 'light'].primary;

    if (uri && typeof uri === 'string' && uri.trim().length > 0) {
        return (
            <Image
                source={{ uri }}
                style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
                contentFit="cover"
            />
        );
    }

    const firstLetter = name ? name.trim().charAt(0).toUpperCase() : '?';

    return (
        <View
            style={[
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: resolvedIsDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: resolvedIsDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
                },
                style,
            ]}
        >
            <Text
                style={{
                    color: resolvedIsDark ? '#F8FAFC' : resolvedPrimary,
                    fontSize: size * 0.45,
                    fontWeight: 'bold',
                }}
            >
                {firstLetter}
            </Text>
        </View>
    );
});

export default Avatar;
