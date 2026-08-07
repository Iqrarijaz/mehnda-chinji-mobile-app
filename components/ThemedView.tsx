import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { View, type ViewProps } from 'react-native';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const { theme } = useTheme();
  const backgroundColor = theme === 'light' ? lightColor || Colors.light.background : darkColor || Colors.dark.background;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
