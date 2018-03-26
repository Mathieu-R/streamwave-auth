const {promisify} = require('util');
const path = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');
const UserAccount = require('../models/UserAccount');
const sendMail = require('../utils/sendMail');
const production = process.env.NODE_ENV === 'production';

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: false,
    session: false
  }, (email, password, done) => {
    UserAccount.findOne({email}).then(user => {
      if (!user) return done(null, false); // no user
      if (!user.ensureEmailValidated()) { // email not validated
        throw new Error('E-mail non validé. Vérifiez vos e-mails.');
      };
      return user.verifyPassword(password)
        .then(response => {
          if (response) { // password ok
            return done(null, user); // user
          }
          return done(null, false); // password ko
        }).catch(error => done(error));
    }).catch(error => done(error));
  }
));

function register(req, res) {
  createAccount(req, res).then(user => {
    if (!user) return;
    sendVerificationEmail(req.hostname, res, user);
  }).catch(err => {
    res.status(500).json({error: 'Register failed !'});
    console.error(err);
  });
}

async function createAccount(req, res) {
  const {email, password} = req.body;

  const existingEmail = await UserAccount.findOne({email});
  if (existingEmail) {
    res.status(400).json({error: `L'email ${existingEmail.email} est déjà utilisé.`});
    return;
  }

  const user = new UserAccount({
    email
  });

  await user.hashPassword(password);
  return user.save();
}

function sendVerificationEmail (host, res, user) {
  const {email} = user;

  const token = crypto.randomBytes(20).toString('hex');
  user.email_verification_token.content = token;

  user.save().then(user => {
    const options = {
      title: 'Activation de votre compte',
      content: `
        Bienvenue sur streamwave.
        Veuillez cliquer sur le lien ci-dessous afin d'activer votre compte.`,
      url: production ?
        `https://auth.streamwave.be/local/account/validate?token=${token}`
        :
        `http://${host}:3000/local/account/validate?token=${token}`,
      action: 'Activer mon compte'
    };

    return sendMail(email, options);
  }).then(info => {
    res.status(200).json({
      message: ['Utilisateur créé avec succès !', 'Vérifier votre e-mail afin d\'activer votre compte']
    });
  }).catch(err => {
    // remove user account
    // if for some reason, api is not able
    // to send an account verification email
    User.findOneAndRemove({email})
      .then(_ => {})
      .catch(err => console.error(err));
    console.error(err);
  });
}

function validateAccount (req, res) {
  const {token} = req.query;
  UserAccount.findOne({'email_verification_token.content': token}).then(user => {
    if (!user) return;

    user.email_verification_token.content = null;
    user.email_verification_token.validated = true;
    return user.save();
  }).then(user => {
    console.log(user);
    if (!user) {
      res.status(401).send(`Ce token de vérification de compte n'existe pas.`);
      return;
    }
    const url = production ? 'https://www.steamwave.be/auth/login' : 'http://localhost:8080/auth/login';
    res.redirect(url);
  }).catch(err => {
    res.status(500).json({err: 'Erreur lors de la validation du compte.'});
    console.error(err);
  })
}

function login(req, res) {
  const {email, password} = req.body;
  // NOTE
  // passport.authenticate does not support promisify
  // you have to pass req, res to this method
  passport.authenticate('local', (error, user) => {
      if (error) {
        return res.status(500).json({error: error.message});
      }

      if (!user) {
        // le status 204 ne doit pas être accompagné d'un message !
        return res.status(204).end();
      }

      const token = user.generateToken();
      res.status(200).json({token});
  })(req, res);
}

function getResetToken (req, res) {
  const {email} = req.body;
  // récupération de l'utilisateur
  UserAccount.findOne({email}).then(user => {
    if (!user) {
      res.status(204).json({error: "Cet e-mail n'appartient à aucun compte utilisateur."});
      return;
    }

    // ajout du token + date d'expiration à son compte
    const token = crypto.randomBytes(20).toString('hex');
    user.reset_password_token.content = token;
    user.reset_password_token.expiration = Date.now() + 360000; // 1h
    user.save();
    return token;
  }).then(token => {
    const options = {
      title: 'Réinitialisation du mot de passe',
      content: `Vous recevez ce mail car vous avez perdu votre mot de passe,
        cliquez sur le lien ci-dessous pour changer de mot de passe.
        Dans 1h, ce lien expirera.`,
      url: production ?
        `https://auth.streamwave.be/local/account/reset/check-reset-token?token=${token}`
        :
        `http://${req.hostname}:3000/local/account/reset/check-reset-token?token=${token}`,
      action: 'Changer de mot de passe'
    };

    return sendMail(email, options);
  }).then(info => {
    res.status(200).json({message: `Email envoyé avec succès à ${email}.`});
  }).catch(error => {
    res.status(500).json({error: 'Reset account failed !'});
    console.error(error);
  });
}

function checkResetToken(req, res) {
  const {token} = req.query;
  UserAccount.findOne({'reset_password_token.content': token}).then(user => {
    if (!user) {
      res.status(400).send('Token invalide.');
      return;
    }

    if (user.reset_password_expiration < Date.now()) {
      res.status(400).json('Token de réinitialisation de mot de passe expiré.');
      return;
    }

    const url = production ? `https://www.streamwave.be/account/reset?token=${token}` : `http://localhost:8080/account/reset?token=${token}`
    res.redirect();
  }).catch(error => {
    res.status(500).json({error: 'Check token failed.'});
    console.error(error);
  });
}

function resetPassword(req, res) {
  const {token} = req.query;
  const {password} = req.body;

  UserAccount.findOne({'reset_password_token.content': token}).then(user => {
    if (!user) {
      res.status(400).json({error: 'Token invalide.'});
      return;
    }

    if (user.reset_password_expiration < Date.now()) {
      res.status(400).json({error: 'Token de réinitialisation de mot de passe expiré.'});
      return;
    }

    // invalidate token and expiration
    user.reset_password_token = null;
    user.reset_password_expiration = null;
    return user.hashPassword(password).then(_ => user.save());
  }).then(_ => {
    res.status(200).json({message: 'Mot de passe changé avec succès !'});
  }).catch(error => {
    res.status(500).json({error: 'Password reset failed.'});
    console.error(error);
  });
}

function me (req, res) {
  if (!req.user) {
    res.send(403).json({error: 'Not authenticated !'});
    return;
  }

  const user = userJSON(req.user);
  res.status(200).json(user);
}

function userJSON (user) {
  return {
    username: user.username,
    mail: user.email,
    avatar: user.avatar
  }
}

module.exports = {
  register,
  validateAccount,
  login,
  getResetToken,
  checkResetToken,
  resetPassword
}
