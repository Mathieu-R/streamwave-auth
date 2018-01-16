const mongoose = require('../mongoose');

async function cleanDB() {
  for (const collection in mongoose.connection.collections) {
    await mongoose.connection.collections[collection].remove({});
  }
}

cleanDB()
  .then(() => process.exit(0))
  .catch(err => console.error(err));