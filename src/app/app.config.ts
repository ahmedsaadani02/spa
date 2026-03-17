import { APP_INITIALIZER, ApplicationConfig, inject } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { waitForSpaApiReady } from './bridge/spa-bridge';
import { routes } from './app.routes';
import { REPOSITORY_PROVIDERS } from './repositories/repository.providers';
import { AuthService } from './services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => () => waitForSpaApiReady()
    },
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => {
        const auth = inject(AuthService);
        return () => auth.ensureInitialized();
      }
    },
    ...REPOSITORY_PROVIDERS
  ]
};
