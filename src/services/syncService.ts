import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { dbService } from './database';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:8000';
const LAST_SYNC_KEY = 'last_full_sync_timestamp';

export class SyncService {
  static async performFullSync(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Starting full sync...');
      
      const response = await fetch(`${API_BASE_URL}/api/v1/sync/full`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sync data');
      }

      const data = await response.json();

      // Clear existing data to ensure consistency (or use a more granular approach)
      // For simplicity and to avoid complex diffing, we'll use INSERT OR REPLACE
      
      await dbService.init();
      
      console.log('Syncing lessons...');
      await dbService.upsertLessons(data.lessons);
      
      console.log('Syncing vocabularies...');
      await dbService.upsertVocabularies(data.vocabularies);
      
      console.log('Syncing grammar points...');
      await dbService.upsertGrammarPoints(data.grammar_points);
      
      console.log('Syncing characters...');
      await dbService.upsertCharacters(data.characters);
      
      console.log('Syncing associations...');
      await dbService.upsertAssociations(data.associations);

      // Store sync timestamp
      await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
      
      console.log('Full sync completed successfully!');
      return { success: true };
    } catch (error: any) {
      console.error('Sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  static async shouldSync(): Promise<boolean> {
    const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
    if (!lastSync) return true;

    // Sync if last sync was more than 24 hours ago
    const lastSyncTime = parseInt(lastSync, 10);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    return now - lastSyncTime > twentyFourHours;
  }
}
