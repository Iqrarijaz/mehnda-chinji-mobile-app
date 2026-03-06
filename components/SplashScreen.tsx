import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSpring,
    withTiming,
    type SharedValue,
} from 'react-native-reanimated';

const logoImg = require('../public/splash/logo.jpg');
const doctorImg = require('../public/splash/doctor.jpg');
const emergencyImg = require('../public/splash/emergency.jpg');
const helpingImg = require('../public/splash/helping.jpg');
const religiousImg = require('../public/splash/religious.jpg');
const schoolImg = require('../public/splash/school.jpg');

const { width, height } = Dimensions.get('window');

const ICON_COUNT = 5;
const RADIUS = 110;
const CENTER_SIZE = 110;
const ICON_SIZE = 70;

const CENTER_X = width / 2;
const CENTER_Y = height * 0.42;

export default function SplashScreen() {
    const centerScale = useSharedValue(0);
    const centerOpacity = useSharedValue(0);
    const floatY = useSharedValue(0);
    const lineProgress = useSharedValue(0);
    const iconsOpacity = useSharedValue(0);
    const textOpacity = useSharedValue(0);
    const textTranslateY = useSharedValue(20);
    const rotation = useSharedValue(0);

    useEffect(() => {
        // Logo entrance
        centerScale.value = withDelay(300, withSpring(1, { damping: 12 }));
        centerOpacity.value = withDelay(300, withTiming(1, { duration: 700 }));

        // Floating effect
        floatY.value = withRepeat(
            withTiming(-6, { duration: 2500 }),
            -1,
            true
        );

        // Lines
        lineProgress.value = withDelay(
            800,
            withTiming(1, { duration: 900, easing: Easing.ease })
        );

        // Icons
        iconsOpacity.value = withDelay(
            1200,
            withTiming(1, { duration: 800 })
        );

        // Text
        textOpacity.value = withDelay(
            1600,
            withTiming(1, { duration: 700 })
        );
        textTranslateY.value = withDelay(
            1600,
            withSpring(0, { damping: 15 })
        );

        // Orbit rotation
        rotation.value = withRepeat(
            withTiming(2 * Math.PI, {
                duration: 18000,
                easing: Easing.linear,
            }),
            -1,
            false
        );
    }, []);

    const centerAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: centerScale.value },
            { translateY: floatY.value },
        ],
        opacity: centerOpacity.value,
    }));

    const textAnimatedStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: textTranslateY.value }],
    }));

    const renderIconsAndLines = () => {
        const elements = [];

        for (let i = 0; i < ICON_COUNT; i++) {
            const baseAngle =
                (i * 2 * Math.PI) / ICON_COUNT - Math.PI / 2;

            const iconStyle = useAnimatedStyle(() => {
                const angle = baseAngle + rotation.value;
                const x = Math.cos(angle) * RADIUS;
                const y = Math.sin(angle) * RADIUS;

                return {
                    transform: [
                        { translateX: x },
                        { translateY: y },
                        { scale: iconsOpacity.value },
                    ],
                    opacity: iconsOpacity.value,
                };
            });

            elements.push(
                <AnimatedLine
                    key={`line-${i}`}
                    baseAngle={baseAngle}
                    progress={lineProgress}
                />
            );

            elements.push(
                <Animated.View
                    key={`icon-${i}`}
                    style={[
                        styles.iconWrapper,
                        {
                            left: CENTER_X - ICON_SIZE / 2,
                            top: CENTER_Y - ICON_SIZE / 2,
                        },
                        iconStyle,
                    ]}
                >
                    <LinearGradient
                        colors={['#FFFFFF', '#F1F5F9']}
                        style={styles.iconBadge}
                    >
                        <Image
                            source={getIconImage(i)}
                            style={styles.splashImage}
                            contentFit="cover"
                            transition={200}
                        />
                    </LinearGradient>
                </Animated.View>
            );
        }

        return elements;
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#F8FAFC', '#EEF2F7']}
                style={StyleSheet.absoluteFill}
            />

            {renderIconsAndLines()}

            <Animated.View
                style={[
                    styles.centerLogoWrapper,
                    { left: CENTER_X - CENTER_SIZE / 2, top: CENTER_Y - CENTER_SIZE / 2 },
                    centerAnimatedStyle,
                ]}
            >
                <LinearGradient
                    colors={['#FFFFFF', '#F8FAFC']}
                    style={styles.centerLogoCircle}
                >
                    <Image
                        source={logoImg}
                        style={styles.logoImage}
                        contentFit="contain"
                        transition={200}
                    />
                </LinearGradient>
            </Animated.View>

            <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
                <Text style={styles.appName}>Rehbar</Text>
            </Animated.View>
        </View>
    );
}

function AnimatedLine({
    baseAngle,
    progress,
}: {
    baseAngle: number;
    progress: SharedValue<number>;
}) {
    const lineStyle = useAnimatedStyle(() => {
        const length = RADIUS * progress.value;

        return {
            height: length,
            opacity: 0.15 + progress.value * 0.1,
            transform: [
                { rotate: `${baseAngle + Math.PI / 2}rad` },
            ],
        };
    });

    return (
        <Animated.View
            style={[
                styles.connector,
                {
                    left: CENTER_X,
                    top: CENTER_Y,
                },
                lineStyle,
            ]}
        />
    );
}

const getIconImage = (index: number) => {
    const images = [
        doctorImg,
        emergencyImg,
        helpingImg,
        religiousImg,
        schoolImg,
    ];
    return images[index] || doctorImg;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    centerLogoWrapper: {
        position: 'absolute',
        width: CENTER_SIZE,
        height: CENTER_SIZE,
        borderRadius: CENTER_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6366F1',
        shadowOpacity: 0.15,
        shadowRadius: 25,
        zIndex: 20,
    },
    centerLogoCircle: {
        width: '100%',
        height: '100%',
        borderRadius: CENTER_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    iconWrapper: {
        position: 'absolute',
        width: ICON_SIZE,
        height: ICON_SIZE,
        borderRadius: ICON_SIZE / 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        zIndex: 10,
    },
    iconBadge: {
        width: '100%',
        height: '100%',
        borderRadius: ICON_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
        overflow: 'hidden',
    },
    splashImage: {
        width: '100%',
        height: '100%',
    },
    logoImage: {
        width: '80%',
        height: '80%',
    },
    connector: {
        position: 'absolute',
        width: 1,
        backgroundColor: '#64748B',
        transformOrigin: 'top',
        zIndex: 5,
    },
    textContainer: {
        position: 'absolute',
        bottom: 100,
        width: '100%',
        alignItems: 'center',
    },
    appName: {
        fontSize: 30,
        fontWeight: '600',
        letterSpacing: 1,
        color: '#0F172A',
    },
});
