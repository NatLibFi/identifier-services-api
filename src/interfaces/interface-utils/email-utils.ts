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

  // Establish email connection
  const transporter = nodemailer.createTransport(smtpConfig);

  // Verify server is ready to accept messages
  await transporter.verify();

  const nodemailerMessage = {
    from,
    to,
    subject,
    text,
  };

  // Send message, main try/catch should catch errors occurring here
  await transporter.sendMail(nodemailerMessage);
}
