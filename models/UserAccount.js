const mongoose = require('../mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const KEY = process.env.JWT_SECRET;

const userAccountSchema = new mongoose.Schema({
  username: {type: String},
  email: {type: String, unique: true, required: true},
  avatar: {type: String, default: '/assets/svg/ic_face_white_24px.svg'},
  hash: {type: String, required: true},
  email_verification_token: {
    content: {type: String},
    expiration: {type: Date},
    validated: {type: Boolean, required: true, default: false}
  },
  reset_password_token: {
    content: {type: String},
    expiration: {type: Date}
  }
});

userAccountSchema.methods.hashPassword = function (password) {
  return bcrypt.genSalt(12)
    .then(salt => bcrypt.hash(password, salt))
    .then(hash => this.hash = hash)
}

userAccountSchema.methods.verifyPassword = function (password) {
  return bcrypt.compare(password, this.hash);
}

userAccountSchema.methods.ensureEmailValidated = function () {
  return this.email_verification_token.validated;
}

userAccountSchema.methods.generateToken = function () {
  return jwt.sign({
    id: this._id.toString(),
    username: this.username,
    email: this.email,
    avatar: this.avatar
  }, KEY, {
    expiresIn: '7days'
  });
}

const UserAccount = mongoose.model('UserAccount', userAccountSchema);
module.exports = UserAccount;
