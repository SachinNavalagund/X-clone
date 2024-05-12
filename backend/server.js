import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";

import connectMongoDB from "./dataBase/connectMongoDB.js";

dotenv.config();

//CLOUDINARY CONFIG
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 6000;

app.use(express.json());
app.use(express.urlencoded({ extended: true })); //to pass form data using url encoded
app.use(cookieParser()); //to get cookies from request

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// eslint-disable-next-line no-undef
app.listen(PORT, () => {
  console.log(`Server is listining on ${PORT}`);
  connectMongoDB();
});
