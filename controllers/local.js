const {promisify} = require('util');
const fs = require('fs');
const path = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');
const nodemail = require('nodemailer');
const handlebars = require('handlebars');
const UserAccount = require('../models/UserAccount');
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
  const {username, email, password} = req.body;

  const existingUser = await UserAccount.findOne({username});
  if (existingUser) {
    res.status(400).json({message: `Le nom d'utilisateur ${existingUser.username} est déjà utilisé.`});
    return;
  }

  const existingEmail = await UserAccount.findOne({email});
  if (existingEmail) {
    res.status(400).json({message: `L'email ${existingEmail.email} est déjà utilisé.`});
    return;
  }

  const user = new UserAccount({
    username,
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
      url: `http://${host}/api/account/validate?token=${token}`,
      action: 'Activer mon compte'
    };

    return sendMail(email, options);
  }).then(info => {
    res.status(200).json({
      message: ['Utilisateur créé avec succès !', 'Vérifier votre e-mail afin d\'activer votre compte']
    });
  }).catch(err => console.error(err));
}

function validateAccount (req, res) {
  const {token} = req.query;

  UserAccount.findOne({email_verification_token: {content: token}}).then(user => {
    if (!user) res.status(401).send('token does not exist... WELL DONE.');

    user.email_verification_token.content = null;
    user.email_verification_token.validated = true;
    return user.save();
  }).then(user => {
    res.redirect('http://localhost:5000:/login');
  });
}

function login(req, res) {
  const {email, password} = req.body;

  // NOTE
  // passport.authenticate does not support promisify
  // you have to pass req, res to this method
  passport.authenticate('local',
    {successRedirect: '/', failureRedirect: '/login'}, (error, user) => {
      if (error) {
        return res.status(500).json({error: error.message});
      }

      if (!user) {
        return res.status(204).json({error: 'Utilisateur introuvable !'});
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
    return user.save();
  }).then(user => {
    const options = {
      title: 'Réinitialisation du mot de passe',
      content: `Vous recevez ce mail car vous avez perdu votre mot de passe,
        cliquez sur le lien ci-dessous pour changer de mot de passe.
        Dans 1h, ce lien expirera.`,
      url: `http://${req.hostname}/api/account/reset?token=${token}`,
      action: 'Changer de mot de passe'
    };

    return sendMail(email, options);
  }).then(info => {
    res.status(200).json({success: `Email envoyé avec succès à ${email}.`});
  }).catch(error => res.status(500).json({error: error.message}));
}

async function sendMail(email, options) {
  const transporter = nodemail.createTransport({
    host: production ? process.env.MAIL_HOST_DEV : process.env.MAIL_HOST_PROD,
    port: production ? process.env.MAIL_PORT_DEV : process.env.MAIL_PORT_PROD,
    secure: production ? true : false,
    ignoreTLS: production ? false : true,
    auth: !production ? {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD
    } : false
  });

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

function checkResetToken(req, res) {
  const {token} = req.query;
  UserAccount.findOne({reset_password_token: {content: token}}).then(user => {
    if (!user) {
      res.status(204).json({error: 'Token invalide.'});
      return;
    }

    if (user.reset_password_expiration < Date.now()) {
      res.status(400).json({error: 'Token de réinitialisation de mot de passe expiré.'});
      return;
    }

    res.status(200).json({valid: true});
  }).catch(error => {
    res.status(500).json({error: error.message});
  });
}

function resetPassword(req, res) {
  const {id, token, password} = req.body;

  UserAccount.findOne({reset_password_token: {content: token}}).then(user => {
    if (!user) {
      res.status(204).json({error: 'Token invalide.'});
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
    res.status(500).json({error: error.message});
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
  resetPassword,
  me
}
