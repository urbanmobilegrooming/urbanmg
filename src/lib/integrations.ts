// Estado central de integraciones externas. Cada una se activa sola
// cuando sus variables de entorno están presentes en .env.local.

export type IntegrationStatus = {
  key: string;
  name: string;
  purpose: string;
  configured: boolean;
  requiredEnv: string[];
};

const has = (...vars: string[]) => vars.every((v) => !!process.env[v]);

export function getIntegrations(): IntegrationStatus[] {
  return [
    {
      key: 'stripe',
      name: 'Stripe',
      purpose: 'Card payments, payment links and deposits',
      configured: has('STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'),
      requiredEnv: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET'],
    },
    {
      key: 'google_maps',
      name: 'Google Maps',
      purpose: 'Address autocomplete and precise geocoding (today: free OpenStreetMap)',
      configured: has('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'),
      requiredEnv: ['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'],
    },
    {
      key: 'twilio',
      name: 'Twilio SMS / WhatsApp',
      purpose: 'Automatic reminders, rebooking nudges and tracking links by SMS/WhatsApp',
      configured: has('TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM'),
      requiredEnv: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM'],
    },
    {
      key: 'anthropic',
      name: 'Claude API',
      purpose: 'AI assistant: smart replies, summaries and insights',
      configured: has('ANTHROPIC_API_KEY'),
      requiredEnv: ['ANTHROPIC_API_KEY'],
    },
    {
      key: 'sentry',
      name: 'Sentry',
      purpose: 'Error monitoring and alerts',
      configured: has('NEXT_PUBLIC_SENTRY_DSN'),
      requiredEnv: ['NEXT_PUBLIC_SENTRY_DSN'],
    },
    {
      key: 'posthog',
      name: 'PostHog',
      purpose: 'Product analytics: what clients and staff actually use',
      configured: has('NEXT_PUBLIC_POSTHOG_KEY'),
      requiredEnv: ['NEXT_PUBLIC_POSTHOG_KEY', 'NEXT_PUBLIC_POSTHOG_HOST'],
    },
    {
      key: 'helpdesk',
      name: 'Intercom / Help Scout',
      purpose: 'Client support chat widget',
      configured: has('NEXT_PUBLIC_INTERCOM_APP_ID'),
      requiredEnv: ['NEXT_PUBLIC_INTERCOM_APP_ID'],
    },
  ];
}
