import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

interface ProfileHeaderBackgroundProps {
    limeColor: string;
    secondaryColor: string;
}

/**
 * Decorative background behind the Profile screen's hero header — soft
 * circles, a shield outline, and two brand-accent dots. Purely decorative
 * (doesn't read any profile/form state), so it's split out of profile.tsx
 * and memoized: without this, it re-rendered on every keystroke in the
 * account-details form below it, despite never actually changing except
 * when the theme (light/dark) flips.
 */
function ProfileHeaderBackgroundComponent({ limeColor, secondaryColor }: ProfileHeaderBackgroundProps) {
    return (
        <Svg
            style={StyleSheet.absoluteFill}
            viewBox="0 0 375 220"
            preserveAspectRatio="xMinYMin slice"
        >
            <Circle cx={355} cy={0} r={95} fill="rgba(255,255,255,0.06)" />
            <Circle cx={5} cy={220} r={70} fill="rgba(255,255,255,0.05)" />
            <Path
                d="M300 140 l22 -9 l22 9 v16 c0 13 -10 23 -22 28 c-12 -5 -22 -15 -22 -28 z"
                stroke="rgba(255,255,255,0.10)"
                strokeWidth={2}
                fill="none"
            />
            <Circle cx={120} cy={50} r={3.5} fill={limeColor} opacity={0.5} />
            <Circle cx={250} cy={72} r={3.5} fill={secondaryColor} opacity={0.55} />
        </Svg>
    );
}

export const ProfileHeaderBackground = React.memo(ProfileHeaderBackgroundComponent);
ProfileHeaderBackground.displayName = 'ProfileHeaderBackground';
