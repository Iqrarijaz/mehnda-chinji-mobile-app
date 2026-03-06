module.exports = ({ config }) => {
    return {
        ...config,
        plugins: [
            "expo-router",
            "expo-secure-store",
            [
                "expo-build-properties",
                {
                    "ios": {
                        "useFrameworks": "static"
                    }
                }
            ],
            [
                "@sentry/react-native",
                {
                    "organization": process.env.EXPO_PUBLIC_SENTRY_ORG || "rehbar-5q",
                    "project": process.env.EXPO_PUBLIC_SENTRY_PROJECT || "mehnda-chinji-mobile-app"
                }
            ]
        ]
    };
};
