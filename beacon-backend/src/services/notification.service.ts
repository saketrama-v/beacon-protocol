import prisma from '../db/prisma';
import nodemailer from 'nodemailer';

export const sendSlackNotification = async (webhookUrl: string, signal: any) => {
  const payload = {
    text: `🚨 *BEACON — ${signal.urgency} SOS*\n*Agent:* ${signal.agent?.name || signal.agentId}\n*Trigger:* ${signal.triggerType}\n*Question:* ${signal.decisionNeeded?.question}\n👉 Review & Respond in Dashboard`
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Slack API error: ${res.status}`);
  } catch (err) {
    console.error('Slack webhook failed:', err);
    throw err;
  }
};

export const sendEmailNotification = async (to: string, signal: any) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'beacon@example.com',
    to,
    subject: `[BEACON] ⚠️ ${signal.urgency} — Agent needs your decision`,
    html: `<h3>BEACON SOS Alert</h3><p>Agent: ${signal.agentId}</p><p>Urgency: ${signal.urgency}</p><p>Question: ${signal.decisionNeeded?.question}</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Email failed:', err);
    throw err;
  }
};

export const sendGenericWebhook = async (webhookUrl: string, signal: any) => {
  const payload = {
    event: 'SOS_RECEIVED',
    signal_id: signal.id,
    urgency: signal.urgency,
    full_signal: signal
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Generic webhook error: ${res.status}`);
  } catch (err) {
    console.error('Generic webhook failed:', err);
    throw err;
  }
};
