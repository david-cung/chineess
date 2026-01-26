import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Platform,
    StatusBar,
    Image,
    ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

// Cập nhật theme theo yêu cầu
const LOGIN_COLORS = {
    primary: '#E53935',
    surface: '#FFFFFF',
    background: '#F8F9FA',
    textPrimary: '#212121',
    textSecondary: '#757575',
    logoBackground: '#FDECEA',
};

interface LoginScreenProps {
    navigation?: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const {
        signInWithGoogle,
        isLoading,
        error,
        user,
        accessToken,
        isReady
    } = useGoogleAuth();

    const handleGoogleLogin = async () => {
        const result = await signInWithGoogle();

        if (result.success) {
            console.log('Google Sign-In initiated successfully');
            // Navigation will happen after useEffect in hook processes the response
        } else if (result.error) {
            console.log('Google Sign-In error:', result.error);
        }
    };

    // Navigate to home when logged in successfully
    React.useEffect(() => {
        if (user && accessToken) {
            console.log('User logged in:', user);
            console.log('Access token:', accessToken);
            // Navigate to home screen
            navigation?.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
            });
        }
    }, [user, accessToken, navigation]);

    // Log error
    React.useEffect(() => {
        if (error) {
            console.error('Login error:', error);
        }
    }, [error]);

    const handleEmailLogin = () => {
        // TODO: Navigate to email login/signup screen
        console.log('Email login pressed');
    };

    const handleClose = () => {
        // TODO: Handle close action
        navigation?.goBack?.();
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={LOGIN_COLORS.background} />

            {/* Header with close button and logo */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                    <Feather name="x" size={24} color={LOGIN_COLORS.textPrimary} />
                </TouchableOpacity>

                <View style={styles.brandContainer}>
                    <View style={styles.brandLogo}>
                        <Text style={styles.brandLogoText}>S</Text>
                    </View>
                    <Text style={styles.brandName}>SinoLearn</Text>
                </View>

                <View style={styles.headerPlaceholder} />
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                {/* Welcome Title */}
                <View style={styles.titleSection}>
                    <Text style={styles.welcomeTitle}>Chào mừng bạn 👋</Text>
                    <Text style={styles.subtitle}>
                        Bắt đầu hành trình học tiếng{'\n'}Trung của bạn ngay hôm nay
                    </Text>
                </View>

                {/* Center Logo */}
                <View style={styles.centerLogoContainer}>
                    <View style={styles.centerLogo}>
                        <Text style={styles.centerLogoText}>文</Text>
                        <View style={styles.logoDecoration}>
                            <Text style={styles.logoDecorationText}>A</Text>
                        </View>
                    </View>
                </View>

                {/* Login Buttons */}
                <View style={styles.buttonsContainer}>
                    {/* Google Button */}
                    <TouchableOpacity
                        style={[
                            styles.googleButton,
                            (!isReady || isLoading) && styles.buttonDisabled
                        ]}
                        onPress={handleGoogleLogin}
                        activeOpacity={0.7}
                        disabled={!isReady || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color={LOGIN_COLORS.textPrimary} />
                        ) : (
                            <Image
                                source={{ uri: 'https://www.google.com/favicon.ico' }}
                                style={styles.googleIcon}
                            />
                        )}
                        <Text style={styles.googleButtonText}>
                            {isLoading ? 'Đang đăng nhập...' : 'Tiếp tục với Google'}
                        </Text>
                    </TouchableOpacity>

                    {/* Separator */}
                    <Text style={styles.separatorText}>HOẶC</Text>

                    {/* Email Button */}
                    <TouchableOpacity
                        style={styles.emailButton}
                        onPress={handleEmailLogin}
                        activeOpacity={0.7}
                    >
                        <Feather name="mail" size={20} color={LOGIN_COLORS.surface} />
                        <Text style={styles.emailButtonText}>Đăng nhập bằng Email</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Bằng việc tiếp tục, bạn đồng ý với{' '}
                    <Text style={styles.footerLink}>Điều khoản</Text>
                    {' & '}
                    <Text style={styles.footerLink}>Chính sách</Text>
                </Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: LOGIN_COLORS.background,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 16,
    },
    closeButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    brandLogo: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: LOGIN_COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandLogoText: {
        fontSize: 14,
        fontWeight: '700',
        color: LOGIN_COLORS.surface,
    },
    brandName: {
        fontSize: 18,
        fontWeight: '600',
        color: LOGIN_COLORS.primary,
    },
    headerPlaceholder: {
        width: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    titleSection: {
        alignItems: 'center',
        marginTop: 64,
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: LOGIN_COLORS.textPrimary,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '400',
        color: LOGIN_COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 24,
    },
    centerLogoContainer: {
        alignItems: 'center',
        marginTop: 48,
    },
    centerLogo: {
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: LOGIN_COLORS.logoBackground,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    centerLogoText: {
        fontSize: 80,
        fontWeight: '300',
        color: LOGIN_COLORS.primary,
    },
    logoDecoration: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: LOGIN_COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoDecorationText: {
        fontSize: 18,
        fontWeight: '600',
        color: LOGIN_COLORS.surface,
    },
    buttonsContainer: {
        marginTop: 48,
        alignItems: 'center',
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: LOGIN_COLORS.surface,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        width: '100%',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    googleIcon: {
        width: 20,
        height: 20,
    },
    googleButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: LOGIN_COLORS.textPrimary,
    },
    separatorText: {
        fontSize: 13,
        fontWeight: '400',
        color: LOGIN_COLORS.textSecondary,
        marginVertical: 16,
        letterSpacing: 1,
    },
    emailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: LOGIN_COLORS.primary,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        width: '100%',
        gap: 12,
        shadowColor: LOGIN_COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 4,
    },
    emailButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: LOGIN_COLORS.surface,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 32,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 13,
        fontWeight: '400',
        color: LOGIN_COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    footerLink: {
        color: LOGIN_COLORS.primary,
        textDecorationLine: 'underline',
    },
});

export default LoginScreen;
