const mongoose = require('../mongoose');
const jwt = require('jsonwebtoken');
const KEY = process.env.JWT_SECRET;

const googleAccountSchema = new mongoose.Schema({
  googleId: {type: String, unique: true},
  username: {type: String, unique: true, required: true},
  email: {type: String, unique: true, required: true},
  avatar: {type: String}
});

googleAccountSchema.methods.generateToken = function () {
  return jwt.sign({
    id: this.googleId,
    username: this.username,
    email: this.email,
    avatar: user.avatar   
  }, KEY, {
    expiresIn: '7days'
  });
}

const GoogleAccount = mongoose.model('GoogleAccount', googleAccountSchema);
module.exports = GoogleAccount;