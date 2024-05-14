import Notification from "../models/notificationModel.js";
import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";

//========CREATE POST=================
export const createPost = async (request, response) => {
  try {
    //taking input from request body
    const { text } = request.body;
    let { img } = request.body;

    //getting the user id
    const userId = request.user._id.toString();

    //checking user exist or not
    const user = await User.findById(userId);
    if (!user) {
      response.status(404).json({
        error: "User not found",
      });
    }

    //checking post includes text or image
    if (!text && !img) {
      response.status(400).json({
        error: "Post must have text or image",
      });
    }

    //if there is img then upload it to cloudinary
    if (img) {
      const uploadedResponse =
        await cloudinary.uploader.upload(img);
      img = uploadedResponse.secure_url;
    }

    //create post
    const newPost = new Post({
      user: userId,
      text,
      img,
    });

    await newPost.save();
    //send resposne
    response.status(201).json(newPost);
  } catch (error) {
    console.log(
      "Error in createPost controller",
      error.message
    );
    response.status(400).json({
      error: "Internal server error",
    });
  }
};

//=================DELETE POST=================
export const deletePost = async (request, response) => {
  try {
    //getting the post
    const post = await Post.findById(request.params.id);

    //if no post present send error response
    if (!post) {
      return response.status(404).json({
        error: "No post found",
      });
    }

    //checking the owner of the post
    if (
      post.user.toString() !== request.user._id.toString()
    ) {
      return response.status(401).json({
        error:
          "You are not the authorized person to delete the post",
      });
    }

    //if image present in that post need to delete that image from cloudinary
    if (post.img) {
      const imgId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }

    //delete post by id
    await Post.findByIdAndDelete(request.params.id);

    //sending the resposne
    response.status(200).json({
      message: "Post has been deleted successfully",
    });
  } catch (error) {
    console.log(
      "Error in deletePost controller",
      error.message
    );
    response.status(500).json({
      error: "Internal server error",
    });
  }
};

//=================COMMENT POST================
export const commentPost = async (request, response) => {
  try {
    //taking inputs
    //getting text from the user
    const { text } = request.body;
    //sending post id to param
    const postId = request.params.id;
    //getting the userid
    const userId = request.user._id;

    //if no text in comments send error response
    if (!text) {
      return response.status(400).json({
        error: "Please enter text to comment on the post",
      });
    }

    //checking that post is present in db
    const post = await Post.findById(postId);
    //if post didn't exist
    if (!post) {
      return response.status(404).json({
        error: "Post not found",
      });
    }

    const comment = { user: userId, text };

    //push comments to comment array
    post.comments.push(comment);
    //save to DB
    await post.save();

    response.status(200).json(post);
  } catch (error) {
    console.log(
      "Error in commentPost controller",
      error.message,
      error
    );
    response.status(500).json({
      error: "Internal server error",
    });
  }
};

//================LIKE POST====================
export const likeOrUnlikePost = async (
  request,
  response
) => {
  try {
    //sending post id to param
    const { id: postId } = request.params;
    //getting the userid
    const userId = request.user._id;

    //getting the post by post id
    const post = await Post.findById(postId);
    //checking post, no post send the error response
    if (!post) {
      return response.status(404).json({
        error: "No post found",
      });
    }

    //checking user already liked post, then do unlike or like
    const userLikedPost = post.likes.includes(userId);

    if (userLikedPost) {
      //unlike the post, pull like count from likes array
      await Post.updateOne(
        { _id: postId },
        { $pull: { likes: userId } }
      );

      //we need to pull the postid from the liked posts if user unlike
      await User.updateOne(
        { _id: userId },
        { $pull: { likedPosts: postId } }
      );

      response.status(200).json({
        message: "Post unliked successfully",
      });
    } else {
      //like the post, push like count to likes array adn also send notification
      post.likes.push(userId);

      //push the postid to the likedid when user likes a post
      await User.updateOne(
        { _id: userId },
        { $push: { likedPosts: postId } }
      );
      //save to db
      await post.save();

      //sending notification
      const notification = new Notification({
        from: userId,
        to: post.user,
        type: "like",
      });

      //saving notification to db
      await notification.save();

      response.status(200).json({
        message: "Post liked successfully",
      });
    }
  } catch (error) {
    console.log(
      "Error in likeOrUnlikePost controller",
      error.message
    );
    response.status(500).json({
      error: "Internal server error",
    });
  }
};

//================GET ALL POST====================
export const getAllPost = async (request, response) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      }); //populate helps us to show the inner data i mean entire user data who liked the post or commented

    if (posts.length === 0) {
      return response.status(200).json([]);
    }

    response.status(200).json({
      status: "success",
      postCount: posts.length,
      data: {
        posts,
      },
    });
  } catch (error) {
    console.log(
      "Error in getAllPost controller",
      error.message
    );
    response.status(500).json({
      error: "Internal server error",
    });
  }
};

//================GET LIKED POST====================
export const getLikedPost = async (request, response) => {
  //get userid from params
  const userId = request.params.id;
  try {
    //find user by id
    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ error: "User not found" });

    const likedPosts = await Post.find({
      _id: { $in: user.likedPosts },
    })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    response.status(200).json(likedPosts);
  } catch (error) {
    console.log(
      "Error in getLikedPost controller",
      error.message
    );
    response.status(500).json({
      error: "Internal server error",
    });
  }
};

//================GET FOLLOWING POST====================
export const getFollowingPost = async (
  request,
  response
) => {
  try {
    //getting user
    const userId = request.user._id;
    //finding user
    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ error: "User not found" });

    const following = user.following;

    const feedPosts = await Post.find({
      user: { $in: following },
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    response.status(200).json(feedPosts);
  } catch (error) {
    console.log(
      "Error in getFollowingPost controller",
      error.message
    );
    response.status(500).json({
      error: "Internal server error",
    });
  }
};

//================GET USER POST====================
export const getUserPost = async (request, response) => {
  try {
    //getting user from the parameter
    const { username } = request.params;

    //checking user
    const user = await User.findOne({ username });
    if (!user) {
      return response
        .status(404)
        .json({ error: "User not found" });
    }

    //getting posts which has been created by user
    const post = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    response.status(200).json(post);
  } catch (error) {
    console.log(
      "Error in getUserPost controller",
      error.message
    );
    response.status(500).json({
      error: "Internal server error",
    });
  }
};
