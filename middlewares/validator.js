const {check, body, query, header, validationResult} = require('express-validator/check');

// Mot de passe => min. 1 majuscule, 1 minuscule, 1 chiffre
const checkAuthInfos = [
  body('email', `L'e-mail n'est pas valide (example@example.com).`).isEmail().trim(),
  body('password', 'Le mot de passe doit être compris entre 10 et 72 caractères').isLength({min: 10, max: 72}).trim(),
  body('password', 'Le mot de passe doit contenir au moins 1 majuscule').matches('[A-Z]'),
  body('password', 'Le mot de passe doit contenir au moins 1 minuscule').matches('[a-z]'),
  body('password', 'Le mot de passe doit contenir au moins 1 chiffre').matches('[0-9]')
]

const checkToken = [
  query('token', 'token manquant.').exists().trim().isLength({min: 1})
]

const checkEmail = [
  body('email', "L'e-mail n'est pas valide (example@example.com).").isEmail().trim().normalizeEmail(),
];

const checkPassword = [
  body('password', 'Le mot de passe doit être compris entre 10 et 72 caractères').isLength({min: 10, max:72}),
  body('password', 'Le mot de passe doit contenir au moins 1 majuscule').matches('[A-Z]'),
  body('password', 'Le mot de passe doit contenir au moins 1 minuscule').matches('[a-z]'),
  body('password', 'Le mot de passe doit contenir au moins 1 chiffre').matches('[0-9]')
];

const checkOauth2IdTokenInAuthorizationHeader = [
  header('authorization', `Le token est manquant dans l'en-tête authorization.`).exists().trim().isLength({min: 1})
];

function checkErrors (req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({error: errors.mapped()});
  }

  next();
}

module.exports = {
  checkAuthInfos,
  checkToken,
  checkEmail,
  checkPassword,
  checkOauth2IdTokenInAuthorizationHeader,
  checkErrors
}
