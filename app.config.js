module.exports = ({ config }) => {
    return {
        ...config,
        plugins: [
            "expo-router",
            "expo-secure-store",
            "@react-native-firebase/app",
            "@react-native-community/datetimepicker",
            [
                "expo-notifications",
                {
                    "sounds": ["./assets/sounds/azaan.mp3"]
                }
            ],
            [
                "expo-build-properties",
                {
                    "android": {
                        // Removed blocked AD_ID permission as it's required for Google Mobile Ads
                    },
                    "ios": {
                        "useFrameworks": "static"
                    }
                }
            ],
            [
                "@sentry/react-native",
                {
                    "organization": process.env.EXPO_PUBLIC_SENTRY_ORG || "rehbar-5q",
                    "project": process.env.EXPO_PUBLIC_SENTRY_PROJECT || "rehbar-community"
                }
            ],
            [
                "react-native-google-mobile-ads",
                {
                    "androidAppId": "ca-app-pub-1707254546231644~1553611625",
                    "iosAppId": "ca-app-pub-3940256099942544~1458002511"
                }
            ]
        ]
    };
};
