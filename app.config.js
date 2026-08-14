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
                        "blockedPermissions": ["com.google.android.gms.permission.AD_ID"]
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
                    // Google's official test App IDs — safe defaults for dev builds.
                    // Set EXPO_PUBLIC_ADMOB_ANDROID_APP_ID / _IOS_APP_ID before a
                    // production release; Google prohibits shipping test IDs to prod.
                    "androidAppId": process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || "ca-app-pub-3940256099942544~3347511713",
                    "iosAppId": process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || "ca-app-pub-3940256099942544~1458002511"
                }
            ]
        ]
    };
};
