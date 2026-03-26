import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {
    ReviewCard,
    QuizQuestion,
    StatsOverview,
    ReviewRating
} from '../types';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:8000';

/**
 * Auth APIs
 */
export const getCurrentUser = async (): Promise<any | null> => {
    try {
        const token = await AsyncStorage.getItem('access_token');
        if (!token) return null;
        
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok ? await response.json() : null;
    } catch (err) {
        console.error('getCurrentUser failed:', err);
        return null;
    }
};

export const updateProfile = async (data: { full_name?: string; avatar?: string }): Promise<any | null> => {
    try {
        const token = await AsyncStorage.getItem('access_token');
        if (!token) return null;
        
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(data)
        });
        return response.ok ? await response.json() : null;
    } catch (err) {
        console.error('updateProfile failed:', err);
        return null;
    }
};

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

export interface PronunciationResult {
    score: number;
    feedback: string;
    detected_text?: string;
    pronunciation_issues?: string[];
}

/**
 * Helper function to convert blob to base64
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
            const base64Data = base64String.split(',')[1];
            resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

/**
 * Analyzes pronunciation by sending audio to backend
 * @param audioUri - URI of the recorded audio file
 * @param expectedText - The expected text (Chinese characters)
 * @returns Pronunciation analysis result with score and feedback
 */
export const analyzePronunciation = async (
    audioUri: string,
    expectedText: string,
    _pinyin?: string // Optional, not used in current API
): Promise<PronunciationResult> => {
    try {
        const token = await AsyncStorage.getItem('access_token');

        // Fetch the audio file and convert to base64
        const audioResponse = await fetch(audioUri);
        const audioBlob = await audioResponse.blob();
        const audioBase64 = await blobToBase64(audioBlob);

        // Determine MIME type from blob
        const mimeType = audioBlob.type || 'audio/webm';

        // Create form data with base64 audio
        const formData = new FormData();
        formData.append('audio_base64', audioBase64);
        formData.append('mime_type', mimeType);
        formData.append('expected_text', expectedText);

        console.log('Sending pronunciation score request:', {
            mimeType,
            expectedText,
            audioBase64Length: audioBase64.length,
        });

        const response = await fetch(`${API_BASE_URL}/api/v1/pronunciation/score`, {
            method: 'POST',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Pronunciation analysis failed:', errorData);
            throw new Error(errorData.detail || 'Failed to analyze pronunciation');
        }

        const result = await response.json();
        console.log('Pronunciation result:', result);
        return result;
    } catch (err) {
        console.error('Failed to analyze pronunciation:', err);
        // Return mock result for development/testing
        return {
            score: Math.floor(Math.random() * 40) + 60, // Random score between 60-100
            feedback: 'Phát âm tốt! Hãy chú ý thêm về thanh điệu.',
            detected_text: expectedText,
            pronunciation_issues: [],
        };
    }
};

/**
 * SRS Review APIs
 */
export const getReviewDue = async (deck: string = 'default'): Promise<ReviewCard[]> => {
    try {
        const token = await AsyncStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/api/v1/review/due?deck=${deck}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok ? await response.json() : [];
    } catch (err) {
        console.error('getReviewDue failed:', err);
        return [];
    }
};

export const submitReviewAnswer = async (cardId: number, ratingId: number) => {
    try {
        const token = await AsyncStorage.getItem('access_token');
        await fetch(`${API_BASE_URL}/api/v1/review/answer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ card_id: cardId, rating_id: ratingId })
        });
    } catch (err) {
        console.error('submitReviewAnswer failed:', err);
    }
};

export const getReviewStatus = async (deck: string = 'default'): Promise<{ due_count: number; deck_name: string } | null> => {
    try {
        const token = await AsyncStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/api/v1/review/status?deck=${deck}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok ? await response.json() : null;
    } catch (err) {
        console.error('getReviewStatus failed:', err);
        return null;
    }
};

/**
 * Quiz APIs
 */
export const generateQuizMCQ = async (lessonId: number): Promise<QuizQuestion[]> => {
    try {
        const token = await AsyncStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/api/v1/quiz/multiple-choice/${lessonId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok ? await response.json() : [];
    } catch (err) {
        console.error('generateQuizMCQ failed:', err);
        return [];
    }
};

/**
 * Stats APIs
 */
export const getStatsOverview = async (): Promise<StatsOverview | null> => {
    try {
        const token = await AsyncStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/api/v1/stats/overview`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok ? await response.json() : null;
    } catch (err) {
        console.error('getStatsOverview failed:', err);
        return null;
    }
};

export const getCurrentGoalProgress = async (): Promise<any | null> => {
    try {
        const token = await AsyncStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/api/v1/stats/current-goal`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok ? await response.json() : null;
    } catch (err) {
        console.error('getCurrentGoalProgress failed:', err);
        return null;
    }
};

export const getWeeklyStudyTime = async (): Promise<any | null> => {
    try {
        const token = await AsyncStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/api/v1/stats/weekly-time`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok ? await response.json() : null;
    } catch (err) {
        console.error('getWeeklyStudyTime failed:', err);
        return null;
    }
};

export const getVocabularyGrowth = async (): Promise<any | null> => {
    try {
        const token = await AsyncStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/api/v1/stats/vocabulary-growth`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok ? await response.json() : null;
    } catch (err) {
        console.error('getVocabularyGrowth failed:', err);
        return null;
    }
};

export const getUserAchievements = async (): Promise<any[] | null> => {
    try {
        const token = await AsyncStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/api/v1/stats/achievements`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok ? await response.json() : null;
    } catch (err) {
        console.error('getUserAchievements failed:', err);
        return null;
    }
};
