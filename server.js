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
  checkAuthInfos,
  checkToken,
  checkEmail,
  checkPassword,
  checkOauth2IdTokenInAuthorizationHeader,
  checkErrors
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
  allowedHeaders: ['Content-Type', 'Authorization']
};

// middlewares
router.use(cors(corsOptions));
router.use(bodyParser.json());
router.use(passport.initialize());

router.get('/health', (req, res) => res.send('authentication api is up !\n'));

router.post('/local/register', checkAuthInfos, checkErrors, register);
router.get('/local/account/validate', checkToken, checkErrors, validateAccount);
router.post('/local/login', checkAuthInfos, checkErrors, login);
router.post('/local/account/reset/get-reset-token', checkEmail, checkErrors, getResetToken);
router.get('/local/account/reset/check-reset-token', checkToken, checkErrors, checkResetToken);
router.post('/local/account/reset/change-password', checkToken, checkPassword, checkErrors, resetPassword);

router.post('/google/login', checkOauth2IdTokenInAuthorizationHeader, checkErrors, handleGoogleLogin);
router.delete('/logout', logout);

app.use(router);

server.listen(PORT, () => {
  console.log(`Node server listening on https://localhost:${PORT}`);
});
