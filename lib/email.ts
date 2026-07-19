/**
 * email.ts — Race Reminder
 *
 * One Resend-backed sender shared by the notify script and the subscribe
 * API. Without RESEND_API_KEY nothing is sent and the call reports a dry
 * run, so local dev needs no account.
 */

/** Returns true when actually sent, false on dry run (no API key). */
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      // || not ??: CI passes unset secrets through as empty strings
      from: process.env.EMAIL_FROM || "Race Reminder <onboarding@resend.dev>",
      to,
      subject,
      text,
    }),
  });
  if (!response.ok) {
    throw new Error(`Resend ${response.status}: ${await response.text()}`);
  }
  return true;
}
