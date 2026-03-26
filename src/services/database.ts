import * as SQLite from 'expo-sqlite';

export interface DB_Lesson {
  id: number;
  title: string;
  description: string | null;
  hsk_level: number;
  order: number;
  estimated_time: number;
}

export interface DB_Vocabulary {
  id: number;
  word: string;
  pinyin: string;
  meaning: string;
  hsk_level: number;
}

export interface DB_GrammarPoint {
  id: number;
  lesson_id: number;
  title: string;
  explanation: string;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    if (this.db) return;

    this.db = await SQLite.openDatabaseAsync('hanyu_learn.db');

    // Enable foreign keys
    await this.db.execAsync('PRAGMA foreign_keys = ON;');

    // Create tables
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS lessons (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        hsk_level INTEGER NOT NULL,
        "order" INTEGER DEFAULT 0,
        estimated_time INTEGER DEFAULT 30
      );

      CREATE TABLE IF NOT EXISTS vocabularies (
        id INTEGER PRIMARY KEY,
        word TEXT NOT NULL,
        pinyin TEXT NOT NULL,
        meaning TEXT NOT NULL,
        hsk_level INTEGER
      );

      CREATE TABLE IF NOT EXISTS vocabulary_examples (
        id INTEGER PRIMARY KEY,
        vocabulary_id INTEGER NOT NULL,
        sentence TEXT NOT NULL,
        pinyin TEXT,
        translation TEXT,
        "order" INTEGER DEFAULT 0,
        FOREIGN KEY (vocabulary_id) REFERENCES vocabularies (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS lesson_vocabulary (
        lesson_id INTEGER NOT NULL,
        vocabulary_id INTEGER NOT NULL,
        PRIMARY KEY (lesson_id, vocabulary_id),
        FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE,
        FOREIGN KEY (vocabulary_id) REFERENCES vocabularies (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS grammar_points (
        id INTEGER PRIMARY KEY,
        lesson_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        explanation TEXT NOT NULL,
        "order" INTEGER DEFAULT 0,
        FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS grammar_examples (
        id INTEGER PRIMARY KEY,
        grammar_point_id INTEGER NOT NULL,
        example TEXT NOT NULL,
        translation TEXT,
        "order" INTEGER DEFAULT 0,
        FOREIGN KEY (grammar_point_id) REFERENCES grammar_points (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS characters (
        id INTEGER PRIMARY KEY,
        character TEXT NOT NULL UNIQUE,
        pinyin TEXT NOT NULL,
        meaning TEXT NOT NULL,
        stroke_count INTEGER,
        radical TEXT,
        hsk_level INTEGER
      );

      CREATE TABLE IF NOT EXISTS lesson_characters (
        lesson_id INTEGER NOT NULL,
        character_id INTEGER NOT NULL,
        PRIMARY KEY (lesson_id, character_id),
        FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE,
        FOREIGN KEY (character_id) REFERENCES characters (id) ON DELETE CASCADE
      );
    `);
  }

  async clearAll() {
    if (!this.db) await this.init();
    await this.db!.execAsync('DELETE FROM lesson_characters;');
    await this.db!.execAsync('DELETE FROM characters;');
    await this.db!.execAsync('DELETE FROM grammar_examples;');
    await this.db!.execAsync('DELETE FROM grammar_points;');
    await this.db!.execAsync('DELETE FROM lesson_vocabulary;');
    await this.db!.execAsync('DELETE FROM vocabulary_examples;');
    await this.db!.execAsync('DELETE FROM vocabularies;');
    await this.db!.execAsync('DELETE FROM lessons;');
  }

  // --- QUERY METHODS ---

  async getLessons(hskLevel: number): Promise<DB_Lesson[]> {
    if (!this.db) await this.init();
    return await this.db!.getAllAsync<DB_Lesson>(
      'SELECT * FROM lessons WHERE hsk_level = ? ORDER BY "order" ASC',
      [hskLevel]
    );
  }

  async getLessonDetail(lessonId: number) {
    if (!this.db) await this.init();
    
    const lesson = await this.db!.getFirstAsync<DB_Lesson>(
      'SELECT * FROM lessons WHERE id = ?',
      [lessonId]
    );

    if (!lesson) return null;

    const vocabulary = await this.db!.getAllAsync<any>(`
      SELECT v.* FROM vocabularies v
      JOIN lesson_vocabulary lv ON v.id = lv.vocabulary_id
      WHERE lv.lesson_id = ?
    `, [lessonId]);

    // Fetch examples for each vocab (simplified for now, ideally one query)
    for (let v of vocabulary) {
      v.examples = await this.db!.getAllAsync(
        'SELECT * FROM vocabulary_examples WHERE vocabulary_id = ? ORDER BY "order" ASC',
        [v.id]
      );
    }

    const grammar = await this.db!.getAllAsync<any>(
      'SELECT * FROM grammar_points WHERE lesson_id = ? ORDER BY "order" ASC',
      [lessonId]
    );

    for (let g of grammar) {
      g.examples = await this.db!.getAllAsync(
        'SELECT * FROM grammar_examples WHERE grammar_point_id = ? ORDER BY "order" ASC',
        [g.id]
      );
    }

    const characters = await this.db!.getAllAsync<any>(`
      SELECT c.* FROM characters c
      JOIN lesson_characters lc ON c.id = lc.character_id
      WHERE lc.lesson_id = ?
    `, [lessonId]);

    return {
      ...lesson,
      vocabulary,
      grammar,
      characters
    };
  }

  async getRandomVocabulary(limit: number = 10) {
    if (!this.db) await this.init();
    return await this.db!.getAllAsync<any>(
      'SELECT * FROM vocabularies ORDER BY RANDOM() LIMIT ?',
      [limit]
    );
  }

  async getFeaturedGrammar(limit: number = 3) {
    if (!this.db) await this.init();
    const grammarPoints = await this.db!.getAllAsync<any>(
      `SELECT g.*, l.title as lesson_title 
       FROM grammar_points g 
       JOIN lessons l ON g.lesson_id = l.id 
       ORDER BY RANDOM() LIMIT ?`,
      [limit]
    );

    for (let gp of grammarPoints) {
      gp.examples = await this.db!.getAllAsync(
        'SELECT * FROM grammar_examples WHERE grammar_point_id = ? ORDER BY "order" ASC',
        [gp.id]
      );
    }
    return grammarPoints;
  }

  // --- SYNC METHODS (INTERNAL) ---
  
  async upsertLessons(lessons: any[]) {
    if (!this.db) await this.init();
    for (const l of lessons) {
      await this.db!.runAsync(
        'INSERT OR REPLACE INTO lessons (id, title, description, hsk_level, "order", estimated_time) VALUES (?, ?, ?, ?, ?, ?)',
        [l.id, l.title, l.description, l.hsk_level, l.order, l.estimated_time]
      );
    }
  }

  async upsertVocabularies(vocabularies: any[]) {
    if (!this.db) await this.init();
    for (const v of vocabularies) {
      await this.db!.runAsync(
        'INSERT OR REPLACE INTO vocabularies (id, word, pinyin, meaning, hsk_level) VALUES (?, ?, ?, ?, ?)',
        [v.id, v.word, v.pinyin, v.meaning, v.hsk_level]
      );
      
      if (v.examples) {
        for (const ex of v.examples) {
          await this.db!.runAsync(
            'INSERT OR REPLACE INTO vocabulary_examples (id, vocabulary_id, sentence, pinyin, translation, "order") VALUES (?, ?, ?, ?, ?, ?)',
            [ex.id, v.id, ex.sentence, ex.pinyin, ex.translation, ex.order || 0]
          );
        }
      }
    }
  }

  async upsertGrammarPoints(grammarPoints: any[]) {
    if (!this.db) await this.init();
    for (const g of grammarPoints) {
      await this.db!.runAsync(
        'INSERT OR REPLACE INTO grammar_points (id, lesson_id, title, explanation, "order") VALUES (?, ?, ?, ?, ?)',
        [g.id, g.lesson_id, g.title, g.explanation, g.order || 0]
      );

      if (g.examples) {
        for (const ex of g.examples) {
          await this.db!.runAsync(
            'INSERT OR REPLACE INTO grammar_examples (id, grammar_point_id, example, translation, "order") VALUES (?, ?, ?, ?, ?)',
            [ex.id, g.id, ex.example, ex.translation, ex.order || 0]
          );
        }
      }
    }
  }

  async upsertCharacters(characters: any[]) {
    if (!this.db) await this.init();
    for (const c of characters) {
      await this.db!.runAsync(
        'INSERT OR REPLACE INTO characters (id, character, pinyin, meaning, stroke_count, radical, hsk_level) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [c.id, c.character, c.pinyin, c.meaning, c.stroke_count, c.radical, c.hsk_level]
      );
    }
  }

  async upsertAssociations(associations: any) {
    if (!this.db) await this.init();
    
    if (associations.lesson_vocabulary) {
      for (const r of associations.lesson_vocabulary) {
        await this.db!.runAsync(
          'INSERT OR REPLACE INTO lesson_vocabulary (lesson_id, vocabulary_id) VALUES (?, ?)',
          [r.lesson_id, r.vocabulary_id]
        );
      }
    }

    if (associations.lesson_characters) {
      for (const r of associations.lesson_characters) {
        await this.db!.runAsync(
          'INSERT OR REPLACE INTO lesson_characters (lesson_id, character_id) VALUES (?, ?)',
          [r.lesson_id, r.character_id]
        );
      }
    }
  }
}

export const dbService = new DatabaseService();
