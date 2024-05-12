import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  commentPost,
  createPost,
  deletePost,
  getAllPost,
  getFollowingPost,
  getLikedPost,
  getUserPost,
  likeOrUnlikePost,
} from "../controllers/postControllers.js";

const routes = express.Router();

routes.get("/allpost", protectRoute, getAllPost);
routes.get("/following", protectRoute, getFollowingPost);
routes.get("/likes/:id", protectRoute, getLikedPost);
routes.get("/user/:username", protectRoute, getUserPost);
routes.post("/createpost", protectRoute, createPost);
routes.post("/like/:id", protectRoute, likeOrUnlikePost);
routes.post("/comment/:id", protectRoute, commentPost);
routes.delete("/:id", protectRoute, deletePost);

export default routes;
