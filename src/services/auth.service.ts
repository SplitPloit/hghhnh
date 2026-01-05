
import { Injectable, signal, computed } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // --------------------------------------------------------------------------
  // TODO: REPLACE THIS WITH YOUR FIREBASE CONFIGURATION
  // Get this from: Firebase Console -> Project Settings -> General -> Your Apps
  // --------------------------------------------------------------------------
  private readonly firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "00000000000",
    appId: "1:00000000000:web:00000000000000"
  };

  private auth;
  
  // State
  private _user = signal<User | null>(null);
  private _isLoading = signal<boolean>(true);

  // Computed
  readonly user = computed(() => this._user());
  readonly isLoading = computed(() => this._isLoading());
  readonly isLoggedIn = computed(() => !!this._user());

  constructor() {
    try {
      const app = initializeApp(this.firebaseConfig);
      this.auth = getAuth(app);

      // Listen to auth state changes
      onAuthStateChanged(this.auth, (user) => {
        this._user.set(user);
        this._isLoading.set(false);
      });
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      this._isLoading.set(false);
    }
  }

  async loginWithGoogle() {
    if (!this.auth) return;
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(this.auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async logout() {
    if (!this.auth) return;
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
}
