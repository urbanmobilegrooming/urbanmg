import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/lib/db';
import { account, session, user, verification } from '@/lib/db/schema/auth';

const TRUSTED_ORIGINS =
  process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];

// Public sign-up is DISABLED by default in production. Set
// ALLOW_PUBLIC_SIGNUP=true to temporarily allow it (e.g. for seeding).
const ALLOW_PUBLIC_SIGNUP = process.env.ALLOW_PUBLIC_SIGNUP === 'true';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    disableSignUp: !ALLOW_PUBLIC_SIGNUP,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days (was 30)
    updateAge: 60 * 60 * 24, // refresh daily
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  advanced: {
    cookiePrefix: 'urbanmg',
    useSecureCookies: process.env.NODE_ENV === 'production',
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
  },
  trustedOrigins: TRUSTED_ORIGINS.length > 0 ? TRUSTED_ORIGINS : undefined,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});

export type Session = typeof auth.$Infer.Session;
