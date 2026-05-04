import React from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface PaginationDotsProps {
    data: any[];
    scrollX: Animated.Value;
    activeColor: string;
}

export const PaginationDots: React.FC<PaginationDotsProps> = ({ data, scrollX, activeColor }) => {
    return (
        <View style={styles.container}>
            {data.map((_, i) => {
                const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

                const dotWidth = scrollX.interpolate({
                    inputRange,
                    outputRange: [10, 24, 10],
                    extrapolate: 'clamp',
                });

                const opacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: 'clamp',
                });

                return (
                    <Animated.View
                        key={i.toString()}
                        style={[
                            styles.dot,
                            {
                                width: dotWidth,
                                opacity,
                                backgroundColor: activeColor,
                            },
                        ]}
                    />
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        height: 6,
        borderRadius: 3,
        marginHorizontal: 4,
    },
});
