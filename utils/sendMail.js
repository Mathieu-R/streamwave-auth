const {promisify} = require('util');
const path = require('path');
const nodemail = require('nodemailer');
const handlebars = require('handlebars');
const production = process.env.NODE_ENV === 'production';

async function sendMail(email, options) {
  let transporterOptions;
  if (production) {
    transporterOptions = {
      host: process.env.MAIL_HOST_PROD,
      port: process.env.MAIL_PORT_PROD,
      secure: true,
      ignoreTLS: false,
      auth: {
        user: process.env.MAIL_USER_PROD,
        pass: process.env.MAIL_PASSWORD_PROD
      }
    }
  } else {
    transporterOptions = {
      host: process.env.MAIL_HOST_DEV,
      port: process.env.MAIL_PORT_DEV,
      secure: false,
      ignoreTLS: true,
      auth: false
    }
  }

  const transporter = nodemail.createTransport(transporterOptions);

  const template = await promisify(fs.readFile)(path.join(__dirname, '../templates/email.hbs'), 'utf-8');
  const emailHtml = handlebars.compile(template)(options);

  const mailOptions = {
    from: 'Streamwave <no-reply@streamwave.be>',
    to: email,
    subject: options.title,
    html: emailHtml
  };

  return transporter.sendMail(mailOptions);
}

module.exports = {
  sendMail
};
