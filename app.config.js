import 'dotenv/config';

export default {
    expo: {
        name: "hanyu-learn",
        slug: "hanyu-learn",
        scheme: "hanyu-learn",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        newArchEnabled: true,
        splash: {
            image: "./assets/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.dc.hanyulearn"
        },
        android: {
            package: "com.dc.hanyulearn",
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#ffffff"
            },
            edgeToEdgeEnabled: true,
            predictiveBackGestureEnabled: false
        },
        web: {
            favicon: "./assets/favicon.png"
        },
        extra: {
            googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
            googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
            googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
            apiBaseUrl: process.env.API_BASE_URL || "http://localhost:8000",
            eas: {
                projectId: "03d06603-fea0-4b3c-968c-4ad789fcf8ab"
            }
        }
    }
};
