# Integraciones externas — qué crear y dónde van las keys

Todas las keys van en `/root/urbanmg/.env.local` del VPS (y `systemctl restart urbanmg`).
El estado se ve en **Dashboard → Settings → Integrations**.

## Stripe (pagos con tarjeta)
1. Crear cuenta en https://dashboard.stripe.com (o usar la del negocio).
2. Developers → API keys → copiar ambas.
3. Webhooks → Add endpoint → `https://urbanmobilegrooming.com/api/webhooks/stripe` → copiar el signing secret.
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Google Maps (autocomplete de direcciones + geocoding preciso)
1. https://console.cloud.google.com → crear proyecto → habilitar "Places API" y "Geocoding API".
2. Credentials → API key (restringir a urbanmobilegrooming.com).
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
```
Mientras no exista, la app usa OpenStreetMap/Nominatim gratis (menos preciso).

## Twilio (SMS y WhatsApp automáticos)
1. https://console.twilio.com → cuenta → comprar número US con SMS.
2. Para WhatsApp: Messaging → WhatsApp sender (o el sandbox para pruebas).
```
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM=+1305...
```
El helper `src/lib/messaging.ts` (sendSms/sendWhatsApp) ya está listo; al poner las keys se pueden activar recordatorios automáticos de citas y de rebooking.

## Claude API (IA)
1. https://console.anthropic.com → API keys.
```
ANTHROPIC_API_KEY=sk-ant-...
```

## Sentry (monitoreo de errores)
1. https://sentry.io → crear proyecto Next.js → copiar DSN.
2. Falta además instalar el SDK cuando se active: `npx @sentry/wizard@latest -i nextjs`.
```
NEXT_PUBLIC_SENTRY_DSN=https://...ingest.sentry.io/...
```

## PostHog (analytics)
1. https://us.posthog.com → crear proyecto → copiar Project API key.
```
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## Intercom (chat de soporte)
1. https://www.intercom.com → workspace → Settings → Installation → copiar App ID.
```
NEXT_PUBLIC_INTERCOM_APP_ID=...
```

---

## Switch de base de datos al Supabase del cliente (pendiente del password)
El schema `urbanmg` ya existe en el proyecto `hayhnysprzgddckhsbkf` con los datos migrados.
Cuando esté el password de Postgres:
```
DATABASE_URL=postgres://postgres.hayhnysprzgddckhsbkf:<PASSWORD>@aws-0-us-west-2.pooler.supabase.com:5432/postgres?options=-csearch_path%3Durbanmg
```
y `systemctl restart urbanmg`. (El `search_path=urbanmg` hace que Drizzle use nuestro schema sin tocar las tablas de PetFlow en `public`.)
