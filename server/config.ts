const dotenv = require('dotenv');


dotenv.config();

module.exports = {
  DATABASE_PASSWORD : process.env.DATABASE_PASSWORD,
  DATABASE_USERNAME : process.env.DATABASE_USERNAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET

}