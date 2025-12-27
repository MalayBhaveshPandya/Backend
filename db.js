const mongoose = require("mongoose");

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function connectToMongo() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set in environment variables");
  }
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const start = Date.now();
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then((m) => {
      const ms = Date.now() - start;
      console.log(`✅ MongoDB connected in ${ms}ms`);
      return m;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectToMongo;
