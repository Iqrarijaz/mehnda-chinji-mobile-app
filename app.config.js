module.exports = ({ config }) => {
    // react-native-maps uses the Google Maps SDK as the map engine on Android
    // (even when we render free OpenStreetMap tiles via UrlTile). Supply the key
    // through an env var so the secret is never committed; without it the map
    // renders blank on Android. iOS uses Apple Maps and needs no key.
    const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

    return {
        ...config,
        android: {
            ...config.android,
            config: {
                ...(config.android?.config || {}),
                googleMaps: {
                    ...(config.android?.config?.googleMaps || {}),
                    apiKey: googleMapsApiKey,
                },
            },
        },
        plugins: [
            "expo-router",
            "expo-secure-store",
            "@react-native-firebase/app",
            [
                "expo-location",
                {
                    "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location to send accurate local weather notifications for your area."
                }
            ],
            [
                "expo-splash-screen",
                {
                    "backgroundColor": "#E6F4FE",
                    "image": "./public/logo.png",
                    "imageWidth": 128,
                    "dark": {
                        "image": "./public/logo.png",
                        "backgroundColor": "#0F172A"
                    }
                }
            ],
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
