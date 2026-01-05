
import { Component, inject, signal, ElementRef, ViewChild, AfterViewChecked, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EconomyService } from '../services/economy.service';
import { GeminiService } from '../services/gemini.service';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-full bg-slate-950">
      <!-- Messages Area -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6" #scrollContainer>
        @if (messages().length === 0) {
          <div class="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
            <div class="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 class="text-xl font-medium text-slate-300">Welcome to DeepSeek Builder</h3>
            <p class="text-slate-500 max-w-sm mt-2">Start chatting with AI. Each message costs 1 credit unless you are subscribed.</p>
          </div>
        }

        @for (msg of messages(); track msg.id) {
          <div class="flex w-full" [class.justify-end]="msg.role === 'user'">
            <div class="max-w-[80%] rounded-2xl p-4 shadow-sm" 
              [class.bg-cyan-700]="msg.role === 'user'" 
              [class.text-white]="msg.role === 'user'"
              [class.bg-slate-800]="msg.role === 'assistant'"
              [class.text-slate-200]="msg.role === 'assistant'"
              [class.rounded-tr-none]="msg.role === 'user'"
              [class.rounded-tl-none]="msg.role === 'assistant'">
              <p class="whitespace-pre-wrap leading-relaxed">{{ msg.text }}</p>
              <div class="text-[10px] opacity-50 mt-2 text-right">
                {{ msg.timestamp | date:'shortTime' }}
              </div>
            </div>
          </div>
        }

        @if (isLoading()) {
          <div class="flex w-full justify-start animate-pulse">
            <div class="max-w-[80%] bg-slate-800 rounded-2xl rounded-tl-none p-4 shadow-sm">
              <div class="flex space-x-2">
                <div class="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100"></div>
                <div class="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        }
        
        <!-- Error Message -->
        @if (errorMessage()) {
            <div class="flex justify-center my-2">
                <span class="bg-red-900/50 text-red-200 text-xs px-3 py-1 rounded-full border border-red-800">
                    {{ errorMessage() }}
                </span>
            </div>
        }
      </div>

      <!-- Input Area -->
      <div class="p-4 bg-slate-900 border-t border-slate-800">
        <div class="max-w-4xl mx-auto relative">
           <!-- Insufficient Credits Banner -->
           @if (!economy.canSendMessage()) {
             <div class="absolute -top-14 left-0 right-0 flex justify-center z-10">
                <button (click)="openShop.emit()" class="bg-gradient-to-r from-red-900/90 to-slate-900/90 backdrop-blur-md text-red-200 text-sm px-6 py-3 rounded-full shadow-lg border border-red-500/30 flex items-center gap-2 hover:scale-105 transition-transform cursor-pointer group">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-400 group-hover:animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                    </svg>
                    <span class="font-semibold">Insufficient credits. Tap here to recharge.</span>
                </button>
             </div>
           }

          <div class="flex gap-2 relative">
            
            <div class="relative flex-1 group">
              <input 
                #messageInput
                type="text" 
                [(ngModel)]="currentInput" 
                (keydown.enter)="sendMessage()"
                [maxlength]="maxLength"
                [disabled]="isLoading() || !economy.canSendMessage()"
                [placeholder]="economy.canSendMessage() ? 'Type your message...' : 'Recharge credits to continue chatting...'"
                class="w-full bg-slate-800 text-white placeholder-slate-500 border border-slate-700 rounded-xl pl-4 pr-24 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-900 transition-all"
              />
              
              <!-- Input Controls: Clear & Counter -->
              <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                 @if (currentInput().length > 0) {
                    <button (click)="currentInput.set(''); messageInput.focus()" class="p-1 rounded-full text-slate-500 hover:bg-slate-700 hover:text-slate-200 transition-colors" aria-label="Clear input">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                        </svg>
                    </button>
                    <div class="w-px h-4 bg-slate-700"></div>
                 }
                 <span class="text-[10px] font-mono font-medium text-slate-500 select-none mr-1" [class.text-cyan-500]="currentInput().length > 0">
                    {{ currentInput().length }}/{{ maxLength }}
                 </span>
              </div>
            </div>
            
             <!-- Lock Icon Overlay -->
            @if (!economy.canSendMessage()) {
                <div class="absolute inset-y-0 right-16 flex items-center pr-3 pointer-events-none z-20">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                    </svg>
                </div>
            }

            <button 
              (click)="sendMessage()" 
              [disabled]="!currentInput() || isLoading() || !economy.canSendMessage()"
              class="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white p-3 rounded-xl transition-colors flex items-center justify-center min-w-[3rem] shadow-lg shadow-cyan-900/20">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <div class="text-center mt-2 text-xs text-slate-500">
             @if (economy.isSubscribed()) {
                <span class="text-purple-400 font-semibold flex items-center justify-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    Premium Active
                </span>
             } @else {
                <span [class.text-red-400]="economy.credits() === 0">Cost: 1 Credit • Balance: {{ economy.credits() }}</span>
             }
          </div>
        </div>
      </div>
    </div>
  `
})
export class ChatComponent implements AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  
  economy = inject(EconomyService);
  gemini = inject(GeminiService);
  
  openShop = output<void>();

  messages = signal<Message[]>([]);
  currentInput = signal('');
  isLoading = signal(false);
  errorMessage = signal('');
  readonly maxLength = 1000;

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  async sendMessage() {
    const text = this.currentInput().trim();
    if (!text || this.isLoading()) return;

    if (!this.economy.deductCredit()) {
      this.errorMessage.set("Not enough credits!");
      setTimeout(() => this.errorMessage.set(''), 3000);
      return; // Stop if no credits
    }

    // Add user message
    this.messages.update(msgs => [...msgs, {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date()
    }]);

    this.currentInput.set('');
    this.isLoading.set(true);
    this.errorMessage.set('');

    // Prepare context (last 5 messages)
    const history = this.messages().slice(-5).map(m => ({
        role: m.role,
        content: m.text
    }));

    try {
      const responseText = await this.gemini.generateResponse(history, text);
      
      this.messages.update(msgs => [...msgs, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: responseText,
        timestamp: new Date()
      }]);
    } catch (error) {
      this.errorMessage.set("Failed to get response.");
    } finally {
      this.isLoading.set(false);
    }
  }
}
