const {body, query, header, validationResult} = require('express-validator/check');

// TODO: Mot de passe => min. 1 majuscule, 1 minuscule, 1 chiffre
function validateRegister (req, res, next) {
  body('email', "L'e-mail est vide ou n'est pas valide.").notEmpty();
  body('email', "L'e-mail n'est pas valide (example@example.com).").isEmail();
  body('password', 'Le mot de passe est vide / trop court / trop long.').notEmpty()
  body('password', 'Le mot de passe doit être compris entre 10 et 72 caractères').len(10, 72);
  //body('password', 'Le mot de passe doit contenir au moins 1 majuscule').matches('/[A-Z]/');
  //body('password', 'Le mot de passe doit contenir au moins 1 minuscule').matches('/[a-z]/');
  //body('password', 'Le mot de passe doit contenir au moins 1 chiffre').matches('/[0-9]/');

  checkErrors(req, res, next);
}

function validateToken (req, res, next) {
  query('token', 'token manquant.').notEmpty();
  checkErrors(req, res, next);
}

function validateLogin (req, res, next) {
  body('email', "L'e-mail est vide ou n'est pas valide.").notEmpty();
  body('email', "L'e-mail n'est pas valide (example@example.com).").isEmail();
  body('password', 'Le mot de passe est vide').notEmpty();

  checkErrors(req, res, next);
}

function validateAskingReset (req, res, next) {
  body('email', "L'e-mail est vide ou n'est pas valide.").notEmpty();
  body('email', "L'e-mail n'est pas valide (example@example.com).").isEmail();

  checkErrors(req, res, next);
}

function validateResetPassword (req, res, next) {
  body('password', 'Le mot de passe est vide / trop court / trop long.').notEmpty()
  body('password', 'Le mot de passe doit être compris entre 8 et 72 caractères').len(8, 72);

  checkErrors(req, res, next);
}

function validateOauth2IdTokenInAuthorizationHeader (req, res, next) {
  header('authorization', 'Le token est manquant dans l\'en-tête authorization.').notEmpty();

  checkErrors(req, res, next);
}

function checkErrors (req, res, next) {
  const errors = validationResult(req).array();
  if (errors) {
    return res.status(400).json({error: errors.map(err => err.msg)});
  }

  next();
}

module.exports = {
  validateRegister,
  validateToken,
  validateLogin,
  validateAskingReset,
  validateResetPassword,
  validateOauth2IdTokenInAuthorizationHeader
}
