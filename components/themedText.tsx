import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { StyleSheet, Text, type TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'urdu';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const { theme } = useTheme();
  const color = theme === 'light' ? lightColor || Colors.light.text : darkColor || Colors.dark.text;

  return (
    <Text
      allowFontScaling={false}
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'urdu' ? styles.urdu : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 13.5,
    lineHeight: 24 },
  defaultSemiBold: {
    fontSize: 13.5,
    lineHeight: 24,
    fontWeight: '600' },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 32 },
  subtitle: {
    fontSize: 16.5,
    fontWeight: 'bold' },
  link: {
    lineHeight: 30,
    fontSize: 13.5,
    color: '#0a7ea4' },
  urdu: {
    fontFamily: 'NotoNastaliqUrdu-Regular',
    textAlign: 'right' } });
