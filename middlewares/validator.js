function validateRegister(req, res, next) {
  req.checkBody('username', "Le nom d'utilisateur est vide").notEmpty();
  req.checkBody('username', "Le nom d'utilisateur doit être compris entre 7 et 32 caractères").len(7, 32);
  req.checkBody('email', "L'e-mail est vide ou n'est pas valide.").notEmpty();
  req.checkBody('email', "L'e-mail n'est pas valide (example@example.com).").isEmail();
  req.checkBody('password', 'Le mot de passe est vide / trop court / trop long.').notEmpty()
  req.checkBody('password', 'Le mot de passe doit être compris entre 10 et 72 caractères').len(10, 72);
  //req.checkBody('password', 'Le mot de passe doit contenir au moins 1 majuscule').matches('/[A-Z]/');
  //req.checkBody('password', 'Le mot de passe doit contenir au moins 1 minuscule').matches('/[a-z]/');
  //req.checkBody('password', 'Le mot de passe doit contenir au moins 1 chiffre').matches('/[0-9]/');

  const errors = req.validationErrors();
  if (errors) {
    return res.status(500).json({error: errors.map(err => err.msg)});
  }

  next();
}

function validateLogin(req, res, next) {
  req.checkBody('email', "L'e-mail est vide ou n'est pas valide.").notEmpty();
  req.checkBody('email', "L'e-mail n'est pas valide (example@example.com).").isEmail();
  req.checkBody('password', 'Le mot de passe est vide').notEmpty();

  const errors = req.validationErrors();
  if (errors) {
    return res.status(500).json({error: errors.map(err => err.msg)});
  }

  next();
}

function validateForgot(req, res, next) {
  req.checkBody('email', "L'e-mail est vide ou n'est pas valide.").notEmpty();
  req.checkBody('email', "L'e-mail n'est pas valide (example@example.com).").isEmail();

  const errors = req.validationErrors();
  if (errors) {
    return res.status(500).json({error: errors.map(err => err.msg)});
  }

  next();
}

function validateReset(req, res, next) {
  req.checkBody('password', 'Le mot de passe est vide / trop court / trop long.').notEmpty()
  req.checkBody('password', 'Le mot de passe doit être compris entre 8 et 72 caractères').len(8, 72);

  const errors = req.validationErrors();
  if (errors) {
    return res.status(500).json({error: errors.map(err => err.msg)});
  }

  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateForgot,
  validateReset
}