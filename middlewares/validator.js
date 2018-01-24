const {check, body, query, header, validationResult} = require('express-validator/check');

// Mot de passe => min. 1 majuscule, 1 minuscule, 1 chiffre
function validateRegister (req, res, next) {
  body('email', `L'e-mail n'est pas valide (example@example.com).`).isEmail().trim();
  body('password', 'Le mot de passe doit être compris entre 10 et 72 caractères').isLength({min: 10, max: 72}).trim();
  body('password', 'Le mot de passe doit contenir au moins 1 majuscule').matches('/[A-Z]/');
  body('password', 'Le mot de passe doit contenir au moins 1 minuscule').matches('/[a-z]/');
  body('password', 'Le mot de passe doit contenir au moins 1 chiffre').matches('/[0-9]/');
  checkErrors(req, res, next);
}

function validateToken (req, res, next) {
  query('token', 'token manquant.').notEmpty();
  checkErrors(req, res, next);
}

function validateLogin (req, res, next) {
  body('email', `L'e-mail n'est pas valide (example@example.com).`).isEmail().trim().normalizeEmail();
  body('password', 'Le mot de passe est vide').exists().trim();
  checkErrors(req, res, next);
}

function validateAskingReset (req, res, next) {
  body('email', "L'e-mail n'est pas valide (example@example.com).").isEmail().trim().normalizeEmail();;
  checkErrors(req, res, next);
}

function validateResetPassword (req, res, next) {
  body('password', 'Le mot de passe est vide / trop court / trop long.').exists()
  body('password', 'Le mot de passe doit être compris entre 10 et 72 caractères').isLength({min: 10, max:72});
  checkErrors(req, res, next);
}

function validateOauth2IdTokenInAuthorizationHeader (req, res, next) {
  header('authorization', `Le token est manquant dans l'en-tête authorization.`).notEmpty().trim();
  checkErrors(req, res, next);
}

function checkErrors (req, res, next) {
  const errors = validationResult(req).array();
  if (errors.length > 0) {
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
