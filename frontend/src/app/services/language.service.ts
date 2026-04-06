import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AppLanguage = 'fr' | 'ar';

const STORAGE_KEY = 'spa:app-language';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly document = inject(DOCUMENT);
  private readonly currentLanguageSubject = new BehaviorSubject<AppLanguage>(this.readInitialLanguage());

  readonly currentLanguage$ = this.currentLanguageSubject.asObservable();

  constructor() {
    this.applyDocumentLanguage(this.currentLanguageSubject.value);
  }

  get currentLanguage(): AppLanguage {
    return this.currentLanguageSubject.value;
  }

  get isArabic(): boolean {
    return this.currentLanguage === 'ar';
  }

  get direction(): 'ltr' | 'rtl' {
    return this.isArabic ? 'rtl' : 'ltr';
  }

  setLanguage(language: AppLanguage): void {
    if (language === this.currentLanguageSubject.value) {
      return;
    }

    this.currentLanguageSubject.next(language);
    this.writeLanguage(language);
    this.applyDocumentLanguage(language);
  }

  toggleLanguage(): void {
    this.setLanguage(this.isArabic ? 'fr' : 'ar');
  }

  private readInitialLanguage(): AppLanguage {
    if (typeof window === 'undefined') {
      return 'fr';
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored === 'ar' ? 'ar' : 'fr';
    } catch {
      return 'fr';
    }
  }

  private writeLanguage(language: AppLanguage): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // ignore storage failures
    }
  }

  private applyDocumentLanguage(language: AppLanguage): void {
    const html = this.document?.documentElement;
    const body = this.document?.body;
    if (!html || !body) {
      return;
    }

    html.lang = language;
    html.dir = language === 'ar' ? 'rtl' : 'ltr';
    body.dir = html.dir;
    body.classList.toggle('lang-ar', language === 'ar');
    body.classList.toggle('lang-fr', language === 'fr');
  }
}
