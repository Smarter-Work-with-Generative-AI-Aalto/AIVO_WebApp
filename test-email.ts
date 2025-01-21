const nodemailer = require('nodemailer');

async function testEmail() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true, // important for port 465
    auth: {
      user: 'donotreply@flowbay.org',
      pass: 'Aoa.uni123',
    },
  });

  const info = await transporter.sendMail({
    from: 'donotreply@flowbay.org',
    to: 'alixchaudhry@gmail.com',
    subject: 'SMTP Test',
    text: 'Hello from Nodemailer!',
    html: '<p>Hello from Nodemailer!</p>',
  });

  console.log('Message sent:', info.messageId);
}

testEmail().catch(console.error); 