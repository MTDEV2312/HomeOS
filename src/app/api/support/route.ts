import { NextResponse } from 'next/server';

interface SupportPayload {
  name?: string;
  email?: string;
  household?: string;
  category?: string;
  priority?: string;
  message?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SupportPayload;
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const supportEmail = process.env.SUPPORT_EMAIL || process.env.NEXT_PUBLIC_SUPPORT_EMAIL || '';
    const supportFromEmail = process.env.SUPPORT_FROM_EMAIL || '';
    const resendApiKey = process.env.RESEND_API_KEY;
    const category = typeof body.category === 'string' ? body.category.toUpperCase() : 'QUESTION';
    const priority = typeof body.priority === 'string' ? body.priority.toUpperCase() : 'MEDIUM';
    const subject = `[HomeOS Soporte] ${category} - Prioridad: ${priority}`;

    const escapeHtml = (value: string) =>
      value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; margin-top: 0;">Nueva Consulta de Soporte de HomeOS</h2>
        <p><strong>Usuario:</strong> ${escapeHtml(body.name || 'Usuario')} (${escapeHtml(body.email || 'sin email')})</p>
        <p><strong>Hogar Activo:</strong> ${escapeHtml(body.household || 'Ninguno')}</p>
        <p><strong>Categoría:</strong> ${escapeHtml(category)}</p>
        <p><strong>Prioridad:</strong> ${escapeHtml(priority)}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-weight: bold; margin-bottom: 5px;">Mensaje:</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #334155;">
          ${escapeHtml(message)}
        </div>
      </div>
    `;

    if (resendApiKey && supportEmail && supportFromEmail) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: supportFromEmail,
          to: [supportEmail],
          reply_to: body.email || undefined,
          subject,
          html: htmlContent,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('Resend API error:', errText);
        return NextResponse.json({ error: 'Failed to send support email' }, { status: 502 });
      }
    } else {
      console.info('[HomeOS Support]', {
        to: supportEmail || 'unconfigured',
        subject,
        user: body.email,
        household: body.household,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Support route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
