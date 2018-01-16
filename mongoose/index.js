const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(process.env.DBURL)
  .catch(err => console.error(err));

module.exports = mongoose;