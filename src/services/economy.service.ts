
import { Injectable, signal, computed, effect } from '@angular/core';

export interface Product {
  id: string;
  name: string;
  price: string;
  credits: number;
  type: 'consumable' | 'subscription';
  duration?: 'month' | 'year';
}

@Injectable({
  providedIn: 'root'
})
export class EconomyService {
  // State
  private _credits = signal<number>(5); // Default 5 credits on "login"
  private _isSubscribed = signal<boolean>(false);
  private _subscriptionType = signal<'monthly' | 'yearly' | null>(null);

  // Computed
  readonly credits = computed(() => this._credits());
  readonly isSubscribed = computed(() => this._isSubscribed());
  readonly canSendMessage = computed(() => this._isSubscribed() || this._credits() >= 1);

  constructor() {
    this.loadState();
    
    // Auto-save state changes
    effect(() => {
      this.saveState();
    });
  }

  // Actions
  deductCredit(): boolean {
    if (this._isSubscribed()) return true; // Free for subscribers

    if (this._credits() >= 1) {
      this._credits.update(c => c - 1);
      return true;
    }
    return false;
  }

  purchaseCredits(amount: number) {
    this._credits.update(c => c + amount);
  }

  subscribe(type: 'monthly' | 'yearly') {
    this._isSubscribed.set(true);
    this._subscriptionType.set(type);
  }

  // Persistence
  private loadState() {
    try {
      const saved = localStorage.getItem('gemini_pay_economy');
      if (saved) {
        const data = JSON.parse(saved);
        this._credits.set(data.credits ?? 5);
        this._isSubscribed.set(data.isSubscribed ?? false);
        this._subscriptionType.set(data.subscriptionType ?? null);
      } else {
        // First time "login" logic
        this._credits.set(5); 
      }
    } catch (e) {
      console.warn('Failed to load economy state', e);
    }
  }

  private saveState() {
    try {
      localStorage.setItem('gemini_pay_economy', JSON.stringify({
        credits: this._credits(),
        isSubscribed: this._isSubscribed(),
        subscriptionType: this._subscriptionType()
      }));
    } catch (e) {
      console.warn('Failed to save economy state', e);
    }
  }
}
