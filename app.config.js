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
            ]
        ]
    };
};
