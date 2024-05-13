import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";

import authRoute from "./routes/authRoute.js";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

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

app.use("/api/auth", authRoute);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notification", notificationRoutes);

// eslint-disable-next-line no-undef
app.listen(PORT, () => {
  console.log(`Server is listining on ${PORT}`);
  connectMongoDB();
});
