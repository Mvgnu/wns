import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Add environment information to help differentiate issues
  environment: process.env.NODE_ENV,
  
  // Don't track personal data  
  beforeSend(event) {
    // Check if it is an exception, and if so, scrub personal data from the error
    if (event.exception) {
      // Remove user data (email, etc.)
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      
      // Scrub sensitive data from URLs
      if (event.request && event.request.url) {
        const url = new URL(event.request.url);
        // Remove query parameters that could contain tokens
        if (url.search.includes('token=') || url.search.includes('auth=')) {
          event.request.url = `${url.origin}${url.pathname}`;
        }
      }
    }
    return event;
  },
}); 