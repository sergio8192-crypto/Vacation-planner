import { getAppUrl } from './passwordReset.js'

function getEmailFrom(): string {
  return process.env.EMAIL_FROM?.trim() || 'Voyage <onboarding@resend.dev>'
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim()

  if (!apiKey) {
    if (process.env.VERCEL !== '1') {
      console.log(`[dev] Password reset link for ${to}: ${resetUrl}`)
      return
    }
    throw new Error('Email is not configured. Set RESEND_API_KEY in environment variables.')
  }

  const appUrl = getAppUrl()
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getEmailFrom(),
      to: [to],
      subject: 'Reset your Voyage password',
      html: `
        <p>You requested a password reset for your Voyage account.</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
        <p style="color:#666;font-size:12px;">If the button does not work, copy and paste this URL into your browser:<br>${resetUrl}</p>
      `,
      text: `Reset your Voyage password: ${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, ignore this email.\n\n${appUrl}`,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to send email (${response.status}): ${body}`)
  }
}
