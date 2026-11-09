import nodemailer from 'nodemailer';

export interface MessageOptions {
  from: string;
  to: string;
  subject: string;
  text: string;
  smtpConfig: Record<string, unknown>;
}

export async function sendEmail(messageOptions: MessageOptions) {
  const { from, to, subject, text, smtpConfig } = messageOptions;

  const transporter = nodemailer.createTransport(smtpConfig);
  const nodemailerMessage = {
    from,
    to,
    subject,
    text,
  };

  await transporter.sendMail(nodemailerMessage);
}
