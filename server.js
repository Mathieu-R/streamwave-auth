const http = require('http');
const express = require('express');
const dotenv = require('dotenv').config();
const passport = require('passport');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const bodyParser = require('body-parser');
const mongoose = require('./mongoose');
const url = require('url');
const path = require('path');
const cors = require('cors');

const {
  validateRegister, validateToken, validateLogin,
  validateAskingReset, validateResetPassword,
  validateOauth2IdTokenInAuthorizationHeader
} = require('./middlewares/validator');
const {
  register, validateAccount, login,
  getResetToken, checkResetToken, resetPassword
} = require('./controllers/local');
const {handleGoogleLogin} = require('./controllers/google');
const {logout} = require('./controllers/common');

const app = express();
const server = http.createServer(app);
const router = express.Router();

const production = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) {
      cb(null, false);
      return;
    }
    const u = url.parse(origin);
    cb(null, u.hostname == 'localhost' || u.hostname == '127.0.0.1');
  },
  allowedHeaders: ['Content-Type']
};

// middlewares
router.use(bodyParser.json());
router.use(passport.initialize());

router.get('/health', (req, res) => res.send('authentication api is up !\n'));

router.post('/local/register', validateRegister, register);
router.get('local/account/validate', validateToken, validateAccount);
router.post('/local/login', validateLogin, login);
router.post('/local/account/reset/get-reset-token', validateToken, getResetToken);
router.get('/local/account/reset/check-reset-token', validateToken, checkResetToken);
router.post('/local/account/reset/change-password', validateToken, validateResetPassword, resetPassword);

router.get('/google/login', validateOauth2IdTokenInAuthorizationHeader, handleGoogleLogin);
router.delete('/logout', logout);

app.use(router);

server.listen(PORT, () => {
  console.log(`Node server listening on https://localhost:${PORT}`);
});
