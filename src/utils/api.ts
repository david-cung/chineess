import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:8000';

export interface TrackProgressPayload {
    item_type: 'vocabulary' | 'grammar_example' | 'listening' | 'speaking';
    item_id: number;
    completed: boolean;
}

/**
 * Tracks learning progress for a specific item (vocabulary, grammar_example, etc.)
 */
export const trackLearningProgress = async (payload: TrackProgressPayload) => {
    try {
        const token = await AsyncStorage.getItem('access_token');
        if (!token) return;

        console.log('Tracking progress:', payload);

        const response = await fetch(`${API_BASE_URL}/api/v1/learning/track`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error tracking progress:', errorData);
        } else {
            console.log('Progress tracked successfully');
        }
    } catch (err) {
        console.error('Failed to track learning progress:', err);
    }
};

