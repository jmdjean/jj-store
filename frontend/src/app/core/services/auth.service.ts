import { computed, inject, Injectable, signal } from '@angular/core';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import type { AuthUser, LoginResponse, UserRole } from '../models/auth.models';

type LoginPayload = {
  identificador: string;
  senha: string;
};

const SESSION_STORAGE_KEY = 'jj_store_auth_session';

type StoredSession = {
  token: string;
  usuario: AuthUser;
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiService = inject(ApiService);
  private readonly sessionSignal = signal<StoredSession | null>(this.readSession());

  readonly usuario = computed(() => this.sessionSignal()?.usuario ?? null);
  readonly token = computed(() => this.sessionSignal()?.token ?? null);
  readonly role = computed<UserRole | null>(() => this.usuario()?.role ?? null);
  readonly autenticado = computed(() => Boolean(this.token()));

  login(payload: LoginPayload) {
    return this.apiService.post<LoginResponse, LoginPayload>('/auth/login', payload).pipe(
      tap((session) => {
        this.writeSession(session);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    this.sessionSignal.set(null);
  }

  private readSession(): StoredSession | null {
    const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);

    if (!rawSession) {
      return null;
    }

    try {
      return JSON.parse(rawSession) as StoredSession;
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }

  private writeSession(session: StoredSession): void {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    this.sessionSignal.set(session);
  }
}
