
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from './components/chat.component';
import { ShopModalComponent } from './components/shop-modal.component';
import { EconomyService } from './services/economy.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, ChatComponent, ShopModalComponent],
  template: `
    <div class="h-screen flex flex-col bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      
      <!-- Navbar -->
      <header class="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 z-10 relative">
        <!-- Left: Logo -->
        <div class="flex items-center gap-3 shrink-0">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 class="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
            <span class="hidden sm:inline">DeepSeek</span><span class="sm:hidden">DS</span>
            <span class="text-cyan-400">Builder</span>
          </h1>
        </div>

        <!-- Center: Builder Controls -->
        <div class="hidden md:flex items-center gap-1 bg-slate-950/50 p-1 rounded-lg border border-slate-800/50 absolute left-1/2 -translate-x-1/2">
             <button class="flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Code
            </button>
            <div class="w-px h-4 bg-slate-800"></div>
            <button class="flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium text-cyan-400 bg-slate-900 shadow-sm border border-slate-800 hover:border-cyan-500/30 hover:shadow-cyan-500/10 hover:text-cyan-300 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Preview App
            </button>
        </div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-3 shrink-0">
          
          <!-- Auth Section -->
           @if (auth.isLoading()) {
             <div class="w-8 h-8 rounded-full bg-slate-800 animate-pulse"></div>
           } @else if (auth.user(); as user) {
             <!-- User Profile -->
             <div class="flex items-center gap-3 bg-slate-800/50 pl-1 pr-3 py-1 rounded-full border border-slate-700/50">
               <img [src]="user.photoURL" class="w-7 h-7 rounded-full border border-slate-600" alt="Avatar">
               <div class="flex flex-col">
                  <span class="text-[10px] font-bold text-white leading-tight max-w-[80px] truncate">{{ user.displayName }}</span>
                  <button (click)="auth.logout()" class="text-[9px] text-slate-400 hover:text-red-400 text-left transition-colors">Sign Out</button>
               </div>
             </div>
           } @else {
             <!-- Login Button -->
             <button (click)="auth.loginWithGoogle()" class="text-sm text-slate-300 hover:text-white font-medium px-3 py-2 transition-colors">
               Log In
             </button>
           }

          <!-- Balance Pill -->
          <div class="hidden sm:flex items-center gap-2 bg-slate-800 rounded-full px-3 py-1.5 border border-slate-700">
             @if (economy.isSubscribed()) {
                <span class="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                <span class="text-xs font-semibold text-purple-300 uppercase tracking-wider">Premium</span>
             } @else {
                <span class="text-slate-400 text-xs font-medium">Balance</span>
                <span class="text-cyan-400 font-bold font-mono">{{ economy.credits() }} CR</span>
             }
          </div>

          <!-- Shop Button -->
          <button (click)="showShop.set(true)" class="relative group bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
            <span class="hidden sm:inline">Store</span>
            <span class="sm:hidden">Buy</span>
            @if (!economy.isSubscribed() && economy.credits() < 3) {
                <span class="absolute -top-1 -right-1 flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
            }
          </button>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 overflow-hidden relative">
        <app-chat (openShop)="showShop.set(true)"></app-chat>
      </main>

      <!-- Modals -->
      @if (showShop()) {
        <app-shop-modal (close)="showShop.set(false)"></app-shop-modal>
      }
    </div>
  `
})
export class AppComponent {
  economy = inject(EconomyService);
  auth = inject(AuthService);
  showShop = signal(false);
}
