const dotenv = require('dotenv').config();
const sendMail = require('../utils/sendMail');

describe('[UNIT TEST] send mail', () => {
  it('should send a mail to a user', done => {
    const email = "fake@fake.be";
    const options = {
      title: 'Activation de votre compte',
      content: `
        Bienvenue sur streamwave.
        Veuillez cliquer sur le lien ci-dessous afin d'activer votre compte.`,
      url: `http://api.streamwave.be/account/validate?token=111111111`,
      action: 'Activer mon compte'
    };

    sendMail(email, options)
      .then(_ => done())
      .catch(err => console.error(err));
  });
});
