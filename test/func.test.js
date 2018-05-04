const dotenv = require('dotenv').config();
const guerrillamail = require('rr-guerrillamail');
const sendMail = require('../utils/sendMail');

describe('[UNIT TEST] send mail', () => {
  it('should send a mail to a user', done => {
    const mailbox = new guerrillamail();

    mailbox.getEmailAddress().then(email => {
      const options = {
        title: 'Activation de votre compte',
        content: `
          Bienvenue sur streamwave.
          Veuillez cliquer sur le lien ci-dessous afin d'activer votre compte.`,
        url: `http://api.streamwave.be/account/validate?token=111111111`,
        action: 'Activer mon compte'
      };

      return sendMail(email, options)
    }).then(_ => done())
    .catch(err => console.error(err));
  });
});
