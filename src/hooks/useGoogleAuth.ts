import { useState, useEffect, useCallback } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

// Complete auth session for web
WebBrowser.maybeCompleteAuthSession();

// Get config from expo extra
const expoConfig = Constants.expoConfig?.extra;

// Google OAuth Client IDs from environment
const GOOGLE_CLIENT_ID = {
    web: expoConfig?.googleWebClientId || '',
    ios: expoConfig?.googleIosClientId || '',
    android: expoConfig?.googleAndroidClientId || '',
};

// API endpoint for Google auth
const GOOGLE_AUTH_API = `${expoConfig?.apiBaseUrl || 'http://localhost:8000'}/auth/google`;

export interface GoogleUser {
    id: string;
    email: string;
    name: string;
    picture?: string;
}

export interface AuthResult {
    success: boolean;
    user?: GoogleUser;
    accessToken?: string;
    error?: string;
}

export const useGoogleAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<GoogleUser | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);

    // Configure Google auth request
    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId: GOOGLE_CLIENT_ID.web,
        iosClientId: GOOGLE_CLIENT_ID.ios,
        androidClientId: GOOGLE_CLIENT_ID.android,
    });

    // Handle auth response
    useEffect(() => {
        const handleResponse = async () => {
            if (response?.type === 'success') {
                const { id_token } = response.params;
                if (id_token) {
                    await sendTokenToBackend(id_token);
                }
            } else if (response?.type === 'error') {
                setError(response.error?.message || 'Đã có lỗi xảy ra khi đăng nhập');
                setIsLoading(false);
            } else if (response?.type === 'dismiss') {
                setIsLoading(false);
            }
        };

        handleResponse();
    }, [response]);

    // Send ID token to backend API
    const sendTokenToBackend = async (idToken: string): Promise<void> => {
        try {
            const res = await fetch(GOOGLE_AUTH_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id_token: idToken }),
            });

            const data = await res.json();

            if (res.ok && data.access_token) {
                // Login successful
                setAccessToken(data.access_token);
                setUser(data.user || null);
                setError(null);
                console.log('Login successful:', data);
            } else {
                // Login failed
                setError(data.message || 'Đăng nhập thất bại');
                console.error('Login failed:', data);
            }
        } catch (err) {
            console.error('Error sending token to backend:', err);
            setError('Không thể kết nối đến server');
        } finally {
            setIsLoading(false);
        }
    };

    // Trigger Google Sign-In
    const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
        if (!request) {
            return {
                success: false,
                error: 'Google Sign-In chưa sẵn sàng. Vui lòng thử lại.',
            };
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await promptAsync();

            if (result.type === 'success') {
                // Response will be handled by useEffect
                return { success: true };
            } else if (result.type === 'cancel' || result.type === 'dismiss') {
                setIsLoading(false);
                return { success: false, error: 'Đăng nhập bị hủy' };
            } else {
                setIsLoading(false);
                return { success: false, error: 'Đăng nhập thất bại' };
            }
        } catch (err) {
            setIsLoading(false);
            const errorMessage = err instanceof Error ? err.message : 'Đã có lỗi xảy ra';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, [request, promptAsync]);

    // Sign out
    const signOut = useCallback(() => {
        setUser(null);
        setAccessToken(null);
        setError(null);
    }, []);

    return {
        signInWithGoogle,
        signOut,
        isLoading,
        error,
        user,
        accessToken,
        isReady: !!request,
    };
};

export default useGoogleAuth;
