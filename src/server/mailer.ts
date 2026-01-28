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
  to: string,
  subject: string,
  text: string,
  html?: string,
) {
  const info = await transporter.sendMail({
    from: process.env.MAILER_USER || process.env.NEXT_PUBLIC_MAILER_USER,
    to,
    subject,
    text,
    html,
  });
  return info;
}

export async function sendOvertimeEmail(
  to: string,
  subject: string,
  text: string,
  html?: string,
) {
  return await sendMail(to, subject, text, html);
}

export default transporter;
