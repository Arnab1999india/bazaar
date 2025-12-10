import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(), // Adding this now as we will need it for Auth API
    provideZoneChangeDetection({ eventCoalescing: true }),
    // provideRouter(routes),
  ],
};
