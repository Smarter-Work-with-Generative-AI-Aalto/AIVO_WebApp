const nodemailer = require('nodemailer');

async function testEmail() {
  const transporter = nodemailer.createTransport({
    host: '<your smtp host>',
    port: 587, // mostly 587 or 465
    secure: false, // false for port 587
    auth: {
      user: '<your email>',
      pass: '<your password>',
    },
  });

  const info = await transporter.sendMail({
    from: '<your email>',
    to: '<recipient email>', 
    subject: 'SMTP Test',
    text: 'Hello from Nodemailer!',
    html: '<p>Hello from Nodemailer!</p>',
  });

  console.log('Message sent:', info.messageId);
}

testEmail().catch(console.error);