import express from "express";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import connectMongoDB from "./dataBase/connectMongoDB.js";

dotenv.config();

const app = express();
// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 6000;

app.use(express.json());
app.use("/api/auth", authRoutes);

// eslint-disable-next-line no-undef
app.listen(PORT, () => {
  console.log(`Server is listining on ${PORT}`);
  connectMongoDB();
});
