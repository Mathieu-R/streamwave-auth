const http = require('http');
const express = require('express');
const dotenv = require('dotenv').config();
const passport = require('passport');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const bodyParser = require('body-parser');
const mongoose = require('./mongoose');
const validator = require('express-validator');
const url = require('url');
const path = require('path');
const cors = require('cors');

const {validateLogin, validateRegister, validateForgot, validateReset} = require('./middlewares/validator');
const {login, register} = require('./controllers/local');
const {handleGoogleLogin, handleGoogleCallback} = require('./controllers/google');
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
router.use('/static', express.static('./src'));
router.use(bodyParser.json());
router.use(validator());
router.use(passport.initialize());

router.get('/', (req, res) => res.sendFile(path.join(__dirname, '../src/index.html')));
router.get('/check', (req, res) => res.send('ok'));
router.get('/google/login', handleGoogleLogin);
router.get('/oauth2callback', handleGoogleCallback);
router.post('/local/register', validateRegister, register);
router.post('/local/login', validateLogin, login);
router.delete('/logout', logout);

app.use(router);

server.listen(PORT, () => {
  console.log(`Node server listening on https://localhost:${PORT}`);
});