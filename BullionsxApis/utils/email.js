const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const nodemailer = require('nodemailer');

console.log('SMTP Configuration:', {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  user: process.env.EMAIL_USER,
});

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT || 587),
  secure: false, // false for port 587
  requireTLS: true,
  family: 4, // Force IPv4
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

transporter.verify(function (error, success) {
  if (error) {
    console.error('SMTP Verify Error:', error);
  } else {
    console.log('SMTP Server is ready to send emails.');
  }
});

function getEmailTemplate(otp, purpose) {
  const subjects = {
    register: `Your NiveshBay Registration OTP - ${otp}`,
    'reset-password': `Your NiveshBay Password Reset OTP - ${otp}`,
    login: `Your NiveshBay Login OTP - ${otp}`,
    withdraw: `Your NiveshBay Withdrawal Verification OTP - ${otp}`,
  };

  const subject = subjects[purpose] || `Your NiveshBay OTP - ${otp}`;

  const body = `
Hi,

Your OTP for NiveshBay is:

${otp}

This OTP is valid for 10 minutes only.

Do not share this OTP with anyone.

Thanks,
Team NiveshBay
`;

  return { subject, body };
}

async function sendOtpEmail(email, otp, purpose) {
  const { subject, body } = getEmailTemplate(otp, purpose);

  try {
    const info = await transporter.sendMail({
      from: `"NiveshBay" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject,
      text: body,
    });

    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (err) {
    console.error('Email send error:', err);
    throw err;
  }
}

module.exports = {
  sendOtpEmail,
};
