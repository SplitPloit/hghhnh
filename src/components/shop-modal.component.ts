
import { Component, output, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EconomyService } from '../services/economy.service';
import { StripeService } from '../services/stripe.service';

interface PendingPurchase {
  type: 'credits' | 'subscription';
  title: string;
  price: number;
  priceId: string;
  description: string;
  // Specific fields
  creditsAmount?: number;
  subType?: 'monthly' | 'yearly';
}

@Component({
  selector: 'app-shop-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" (click)="close.emit()">
      <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative transform transition-all" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <div>
            <h2 class="text-2xl font-bold text-white">Credit Store</h2>
            <p class="text-slate-400 text-sm">Top up or Subscribe</p>
          </div>
          <button (click)="close.emit()" class="text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Scrollable Content -->
        <div class="p-6 overflow-y-auto space-y-8 relative min-h-[400px]">
          
          <!-- Success Overlay -->
          @if (showSuccess()) {
             <div class="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center text-center p-6 animate-in zoom-in-95 duration-300">
                <div class="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-4 border border-green-500/50 shadow-[0_0_30px_rgba(74,222,128,0.2)]">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                </div>
                <h3 class="text-2xl font-bold text-white mb-2">Purchase Successful!</h3>
                <p class="text-slate-400">{{ successMessage() }}</p>
                <div class="mt-8 text-sm text-slate-500">Closing automatically...</div>
             </div>
          }

          <!-- Processing Overlay -->
          @if (isProcessing()) {
            <div class="absolute inset-0 z-40 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl animate-in fade-in duration-300">
                <div class="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
                <p class="text-cyan-400 font-bold text-lg animate-pulse">Processing Payment...</p>
                <p class="text-slate-500 text-sm mt-2">Please do not close this window.</p>
            </div>
          }

          <!-- Confirmation Dialog Overlay -->
          @if (pendingPurchase(); as item) {
            <div class="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
               <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                  
                  <!-- Dialog Header -->
                  <div class="bg-slate-800/50 p-6 text-center border-b border-slate-700">
                    <h3 class="text-xl font-bold text-white">Confirm Purchase</h3>
                    <p class="text-slate-400 text-xs mt-1 uppercase tracking-wider">Review order details</p>
                  </div>
                  
                  <!-- Dialog Body -->
                  <div class="p-6 space-y-6">
                    <!-- Item Card -->
                    <div class="flex items-center gap-4 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                        <div class="w-12 h-12 rounded-full flex shrink-0 items-center justify-center bg-slate-700/50 border border-slate-600" 
                            [class.text-cyan-400]="item.type === 'credits'"
                            [class.text-purple-400]="item.type === 'subscription'">
                            
                            @if (item.type === 'credits') {
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                                </svg>
                            } @else {
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
                                </svg>
                            }
                        </div>
                        <div class="overflow-hidden">
                            <div class="font-bold text-white truncate text-lg">{{ item.title }}</div>
                            <div class="text-xs text-slate-400 truncate">{{ item.description }}</div>
                        </div>
                    </div>

                    <!-- Cost Breakdown -->
                    <div class="space-y-3 bg-slate-800/20 p-4 rounded-lg">
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-400">Price</span>
                            <span class="text-slate-300 font-mono">€{{ item.price | number:'1.2-2' }}</span>
                        </div>
                         <div class="flex justify-between text-sm">
                            <span class="text-slate-400">Tax</span>
                            <span class="text-slate-300 font-mono">€0.00</span>
                        </div>
                        <div class="border-t border-slate-700 pt-3 flex justify-between items-center mt-2">
                            <span class="text-white font-bold">Total Charge</span>
                            <span class="text-2xl font-bold text-cyan-400 font-mono">€{{ item.price | number:'1.2-2' }}</span>
                        </div>
                    </div>

                    <!-- Explicit Confirmation Checkbox -->
                    <div class="flex items-start gap-3 px-1">
                        <div class="flex items-center h-5">
                            <input id="confirm-terms" type="checkbox" [(ngModel)]="termsAccepted" 
                                class="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 cursor-pointer">
                        </div>
                        <label for="confirm-terms" class="text-xs text-slate-400 cursor-pointer select-none">
                            I confirm that I want to purchase <strong>{{item.title}}</strong> for <strong>€{{item.price | number:'1.2-2'}}</strong> and agree to the Terms of Service.
                        </label>
                    </div>
                  </div>
                 
                  <!-- Actions -->
                  <div class="grid grid-cols-2 gap-px bg-slate-700 border-t border-slate-700">
                    <button (click)="cancelPurchase()" class="bg-slate-900 py-4 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-medium">
                        Cancel
                    </button>
                    <button (click)="confirmPurchase()" 
                        [disabled]="!termsAccepted()"
                        [class.opacity-50]="!termsAccepted()"
                        [class.cursor-not-allowed]="!termsAccepted()"
                        class="bg-slate-900 py-4 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors font-bold disabled:hover:bg-slate-900">
                        Confirm Payment
                    </button>
                  </div>
               </div>
            </div>
          }

          <!-- Credits Section -->
          <section [class.opacity-20]="pendingPurchase() || isProcessing()" [class.pointer-events-none]="pendingPurchase() || isProcessing()" class="transition-opacity duration-300">
            <h3 class="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              Credit Packs
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <!-- Pack 1: 10 Credits @ 0.20 (2c/credit) -->
              <button (click)="selectCredits(10, 0.20, priceIds.credits10)" class="group relative bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500 rounded-xl p-4 transition-all text-left">
                <div class="absolute top-0 right-0 bg-slate-600 text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg">Starter</div>
                <div class="text-3xl font-bold text-white mb-1">10</div>
                <div class="text-slate-400 text-sm mb-3">Credits</div>
                <div class="flex flex-col gap-1">
                   <div class="text-xl font-semibold text-cyan-400">€0.20</div>
                   <div class="text-[10px] text-slate-500 font-medium">
                     €0.02 / credit
                   </div>
                </div>
                <div class="text-[10px] text-slate-600 mt-2 font-mono truncate opacity-0 group-hover:opacity-100 transition-opacity">ID: {{priceIds.credits10}}</div>
              </button>

              <!-- Pack 2: 100 Credits @ 1.50 (1.5c/credit) -->
              <button (click)="selectCredits(100, 1.50, priceIds.credits100)" class="group relative bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500 rounded-xl p-4 transition-all text-left">
                 <div class="absolute top-0 right-0 bg-cyan-600 text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg">Standard</div>
                <div class="text-3xl font-bold text-white mb-1">100</div>
                <div class="text-slate-400 text-sm mb-3">Credits</div>
                <div class="flex flex-col gap-1">
                    <div class="text-xl font-semibold text-cyan-400">€1.50</div>
                    <div class="text-[10px] text-slate-500 font-medium">
                       €0.015 / credit
                    </div>
                </div>
                <div class="text-[10px] text-slate-600 mt-2 font-mono truncate opacity-0 group-hover:opacity-100 transition-opacity">ID: {{priceIds.credits100}}</div>
              </button>

              <!-- Pack 3: 600 Credits @ 5.00 (~0.8c/credit) -->
              <button (click)="selectCredits(600, 5.00, priceIds.credits600)" class="group relative bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500 rounded-xl p-4 transition-all text-left">
                <div class="absolute top-0 right-0 bg-yellow-600 text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg">Best Value</div>
                <div class="text-3xl font-bold text-white mb-1">600</div>
                <div class="text-slate-400 text-sm mb-3">Credits</div>
                <div class="flex flex-col gap-1">
                    <div class="text-xl font-semibold text-cyan-400">€5.00</div>
                    <div class="text-[10px] text-green-500 font-medium">
                      ~€0.008 / credit <span class="text-[9px] bg-green-900/40 px-1 rounded ml-1">SAVE 60%</span>
                    </div>
                </div>
                <div class="text-[10px] text-slate-600 mt-2 font-mono truncate opacity-0 group-hover:opacity-100 transition-opacity">ID: {{priceIds.credits600}}</div>
              </button>
            </div>
          </section>

          <!-- Subscriptions Section -->
          <section [class.opacity-20]="pendingPurchase() || isProcessing()" [class.pointer-events-none]="pendingPurchase() || isProcessing()" class="transition-opacity duration-300">
            <h3 class="text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
              </svg>
              Unlimited Access
            </h3>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Monthly -->
              <button (click)="selectSubscription('monthly', 2.99, priceIds.subMonthly)" 
                [disabled]="(economy.isSubscribed() && economy['_subscriptionType']() === 'monthly')"
                [class.ring-2]="economy.isSubscribed() && economy['_subscriptionType']() === 'monthly'"
                class="flex flex-col justify-between bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-purple-500 rounded-xl p-5 transition-all text-left disabled:opacity-50">
                <div>
                  <h4 class="text-lg font-bold text-white">Monthly Pass</h4>
                  <p class="text-slate-400 text-sm mt-1">Unlimited messages for 30 days.</p>
                </div>
                <div class="mt-4 text-2xl font-bold text-purple-400">€2.99 <span class="text-sm text-slate-500 font-normal">/mo</span></div>
                <div class="text-[10px] text-slate-600 mt-2 font-mono truncate opacity-0 hover:opacity-100 transition-opacity">ID: {{priceIds.subMonthly}}</div>
              </button>

              <!-- Yearly -->
              <button (click)="selectSubscription('yearly', 30.00, priceIds.subYearly)"
                [disabled]="(economy.isSubscribed() && economy['_subscriptionType']() === 'yearly')"
                [class.ring-2]="economy.isSubscribed() && economy['_subscriptionType']() === 'yearly'" 
                class="flex flex-col justify-between bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-purple-500 rounded-xl p-5 transition-all text-left disabled:opacity-50">
                <div>
                  <div class="flex justify-between items-start">
                    <h4 class="text-lg font-bold text-white">Annual Pro</h4>
                    <span class="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">Save ~16%</span>
                  </div>
                  <p class="text-slate-400 text-sm mt-1">Unlimited messages for a whole year.</p>
                </div>
                <div class="mt-4 text-2xl font-bold text-purple-400">€30.00 <span class="text-sm text-slate-500 font-normal">/yr</span></div>
                <div class="text-[10px] text-slate-600 mt-2 font-mono truncate opacity-0 hover:opacity-100 transition-opacity">ID: {{priceIds.subYearly}}</div>
              </button>
            </div>
          </section>
        </div>

        <div class="p-4 bg-slate-800/50 border-t border-slate-700 text-center text-xs text-slate-500">
          Secure Payment Processing by Stripe.
        </div>
      </div>
    </div>
  `
})
export class ShopModalComponent {
  economy = inject(EconomyService);
  stripe = inject(StripeService);
  close = output<void>();

  isProcessing = signal(false);
  pendingPurchase = signal<PendingPurchase | null>(null);
  
  // New States for UI flow
  termsAccepted = signal(false);
  showSuccess = signal(false);
  successMessage = signal('');

  // Explicit IDs provided by user
  readonly priceIds = {
    credits10: 'price_1SmJZyK1hAS5fxA9OjJR89xG',
    credits100: 'price_1SmJaTK1hAS5fxA9IiUEeQGD',
    credits600: 'price_1SmJyKK1hAS5fxA9yUxzy3RZ',
    subMonthly: 'price_1SmJhkK1hAS5fxA9qV6tXATJ',
    subYearly: 'price_1SmJjOK1hAS5fxA9quLDdJ4e'
  };

  constructor() {
    // Reset terms when modal opens/changes
    effect(() => {
        if (this.pendingPurchase()) {
            this.termsAccepted.set(false);
        }
    });
  }

  selectCredits(amount: number, price: number, priceId: string) {
    this.pendingPurchase.set({
      type: 'credits',
      title: `${amount} Credits`,
      description: 'Instant balance top-up',
      price,
      priceId,
      creditsAmount: amount
    });
  }

  selectSubscription(type: 'monthly' | 'yearly', price: number, priceId: string) {
    if (this.economy.isSubscribed()) {
      alert("You are already subscribed!");
      return;
    }
    this.pendingPurchase.set({
      type: 'subscription',
      title: type === 'monthly' ? 'Monthly Pass' : 'Annual Pro',
      description: type === 'monthly' ? 'Unlimited access for 30 days' : 'Unlimited access for 1 year',
      price,
      priceId,
      subType: type
    });
  }

  cancelPurchase() {
    this.pendingPurchase.set(null);
    this.termsAccepted.set(false);
  }

  async confirmPurchase() {
    const purchase = this.pendingPurchase();
    if (!purchase || !this.termsAccepted()) return;

    this.isProcessing.set(true);
    
    // Process Payment
    const result = await this.stripe.processPayment(purchase.price, purchase.priceId);

    if (result.success) {
        if (purchase.type === 'credits' && purchase.creditsAmount) {
            this.economy.purchaseCredits(purchase.creditsAmount);
            this.successMessage.set(`${purchase.creditsAmount} credits have been added to your balance.`);
        } else if (purchase.type === 'subscription' && purchase.subType) {
            this.economy.subscribe(purchase.subType);
            this.successMessage.set(`You are now subscribed to the ${purchase.subType} plan.`);
        }
        
        // Show Success View instead of Alert
        this.pendingPurchase.set(null);
        this.isProcessing.set(false);
        this.showSuccess.set(true);

        // Auto-close after delay
        setTimeout(() => {
            this.close.emit();
        }, 2500);

    } else {
        this.isProcessing.set(false);
        // Error handling can still use alert or a separate error state
        alert("Payment processing failed. Please try again.");
    }
  }
}
