'use server';

import nodemailer from 'nodemailer';

const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_APP_PASSWORD;

if (!gmailUser || !gmailPass) {
  console.warn("Email notifications are disabled. Please set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.");
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailUser,
    pass: gmailPass,
  },
});

interface RedeemCodeNotification {
  gamingId: string;
  productName: string;
  redeemCode: string;
}

export async function sendRedeemCodeNotification(details: RedeemCodeNotification) {
  if (!gmailUser || !gmailPass) {
    return; // Silently fail if email is not configured
  }

  const mailOptions = {
    from: `"Garena Gears" <${gmailUser}>`,
    to: gmailUser, // Send to your own email
    subject: `New Redeem Code Order: ${details.productName}`,
    html: `
      <h1>New Redeem Code Order Received</h1>
      <p>A new order has been placed using a redeem code.</p>
      <ul>
        <li><strong>Product:</strong> ${details.productName}</li>
        <li><strong>Gaming ID:</strong> ${details.gamingId}</li>
        <li><strong>Redeem Code:</strong> <code>${details.redeemCode}</code></li>
      </ul>
      <p>Please process this order in the admin panel.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Redeem code notification email sent successfully.');
  } catch (error) {
    console.error('Error sending redeem code notification email:', error);
    // Do not throw error to prevent failing the user-facing action
  }
}
