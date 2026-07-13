// Envío de SMS/WhatsApp vía Twilio. Se activa solo cuando TWILIO_* está en .env.local;
// mientras tanto todas las llamadas devuelven { sent: false } sin romper nada.

type SendResult = { sent: boolean; sid?: string; error?: string };

function twilioConfigured() {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);
}

function normalizeUs(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return phone.startsWith('+') ? phone : `+${digits}`;
}

async function twilioSend(to: string, body: string, channel: 'sms' | 'whatsapp'): Promise<SendResult> {
  if (!twilioConfigured()) return { sent: false, error: 'twilio_not_configured' };
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const from = process.env.TWILIO_FROM!;
  const prefix = channel === 'whatsapp' ? 'whatsapp:' : '';
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: `${prefix}${normalizeUs(to)}`,
        From: `${prefix}${from}`,
        Body: body,
      }),
      signal: AbortSignal.timeout(10000),
    });
    const data = (await res.json()) as { sid?: string; message?: string };
    if (!res.ok) return { sent: false, error: data.message ?? `HTTP ${res.status}` };
    return { sent: true, sid: data.sid };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : 'network_error' };
  }
}

export async function sendSms(to: string, body: string): Promise<SendResult> {
  return twilioSend(to, body, 'sms');
}

export async function sendWhatsApp(to: string, body: string): Promise<SendResult> {
  return twilioSend(to, body, 'whatsapp');
}
