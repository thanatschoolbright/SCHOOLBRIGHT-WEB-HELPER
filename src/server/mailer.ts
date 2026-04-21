import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host:
    process.env.MAILER_HOST ||
    process.env.NEXT_PUBLIC_MAILER_HOST ||
    "smtp.gmail.com",
  port: Number(
    process.env.MAILER_PORT || process.env.NEXT_PUBLIC_MAILER_PORT || 587,
  ),
  secure:
    process.env.MAILER_SECURE === "true" ||
    process.env.NEXT_PUBLIC_MAILER_SECURE === "true" ||
    false,
  auth: {
    user: process.env.MAILER_USER || process.env.NEXT_PUBLIC_MAILER_USER,
    pass: process.env.MAILER_PASS || process.env.NEXT_PUBLIC_MAILER_PASS,
  },
});

export async function sendMail(
  to: string | string[],
  subject: string,
  text: string,
  html?: string,
) {
  const info = await transporter.sendMail({
    from: process.env.MAILER_USER || process.env.NEXT_PUBLIC_MAILER_USER,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    text,
    html,
  });
  return info;
}

export async function sendOvertimeEmail(
  to: string | string[],
  subject: string,
  text: string,
  html?: string,
) {
  return await sendMail(to, subject, text, html);
}

export async function sendMailWithAttachment(params: {
  to: string | string[];
  subject: string;
  html: string;
  attachments: {
    filename: string;
    content: Buffer | Uint8Array;
    contentType: string;
  }[];
}) {
  const info = await transporter.sendMail({
    from: process.env.MAILER_USER || process.env.NEXT_PUBLIC_MAILER_USER,
    to: Array.isArray(params.to) ? params.to.join(", ") : params.to,
    subject: params.subject,
    html: params.html,
    attachments: params.attachments.map((a) => ({
      filename: a.filename,
      content: Buffer.from(a.content),
      contentType: a.contentType,
    })),
  });
  return info;
}

export default transporter;
