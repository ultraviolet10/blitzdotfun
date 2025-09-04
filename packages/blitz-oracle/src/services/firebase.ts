import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getDatabase, type Database } from 'firebase-admin/database';
import type { CloudflareBindings } from '../types/env';

let firebaseApp: App | null = null;
let database: Database | null = null;

/**
 * Initialize Firebase Admin SDK with service account credentials
 */
export async function initializeFirebase(env: CloudflareBindings): Promise<App> {
  if (firebaseApp) {
    return firebaseApp;
  }

  // Check if Firebase is already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseApp = existingApps[0];
    return firebaseApp;
  }

  try {
    // Import service account from local file
    const serviceAccountModule = await import('../../blitzdotfun-firebase-adminsdk-fbsvc-0414a787a7.json');
    const serviceAccount = serviceAccountModule.default || serviceAccountModule;
    
    // Initialize Firebase Admin SDK
    firebaseApp = initializeApp({
      credential: cert(serviceAccount as any),
      databaseURL: env.FIREBASE_DATABASE_URL || `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com/`,
      projectId: env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
    });

    return firebaseApp;
  } catch (error) {
    throw new Error(`Failed to initialize Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get Firebase Realtime Database instance
 */
export async function getFirebaseDatabase(env: CloudflareBindings): Promise<Database> {
  if (database) {
    return database;
  }

  const app = await initializeFirebase(env);
  database = getDatabase(app);
  return database;
}

/**
 * Firebase service class with standard Firebase Admin SDK methods
 */
export class FirebaseService {
  private env: CloudflareBindings;
  private databasePromise: Promise<Database>;

  constructor(env: CloudflareBindings) {
    this.env = env;
    this.databasePromise = getFirebaseDatabase(env);
  }

  private async getDatabase(): Promise<Database> {
    return await this.databasePromise;
  }

  /**
   * Write data to Firebase (replaces entire path)
   */
  async writeData(path: string, data: any): Promise<void> {
    const database = await this.getDatabase();
    const ref = database.ref(path);
    await ref.set(data);
  }

  /**
   * Read data from Firebase
   */
  async readData<T = any>(path: string): Promise<T | null> {
    const database = await this.getDatabase();
    const ref = database.ref(path);
    const snapshot = await ref.once('value');
    return snapshot.val() as T | null;
  }

  /**
   * Update data in Firebase (merges with existing data)
   */
  async updateData(path: string, data: any): Promise<void> {
    const database = await this.getDatabase();
    const ref = database.ref(path);
    await ref.update(data);
  }

  /**
   * Delete data from Firebase
   */
  async deleteData(path: string): Promise<void> {
    const database = await this.getDatabase();
    const ref = database.ref(path);
    await ref.remove();
  }

  /**
   * Push data to Firebase (creates new child with auto-generated key)
   */
  async pushData(path: string, data: any): Promise<string> {
    const database = await this.getDatabase();
    const ref = database.ref(path);
    const newRef = await ref.push(data);
    return newRef.key!;
  }

  /**
   * Listen for data changes (for real-time updates)
   */
  async onDataChange<T = any>(path: string, callback: (data: T | null) => void): Promise<() => void> {
    const database = await this.getDatabase();
    const ref = database.ref(path);
    const listener = (snapshot: any) => {
      callback(snapshot.val() as T | null);
    };
    
    ref.on('value', listener);
    
    // Return unsubscribe function
    return () => ref.off('value', listener);
  }

  /**
   * Test Firebase connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to read from root to test connection
      const database = await this.getDatabase();
      await database.ref('.info/connected').once('value');
      return true;
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      return false;
    }
  }
}

/**
 * Helper function to create a Firebase service instance
 */
export function createFirebaseService(env: CloudflareBindings): FirebaseService {
  return new FirebaseService(env);
}
