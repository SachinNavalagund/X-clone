import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

import Notification from "../models/notificationModel.js";
import User from "../models/userModel.js";

//=======GETTING USER PROFILE=======
export const getUserProfile = async (request, response) => {
  //getting user name from request params
  const { username } = request.params;
  try {
    //getting user by username
    const user = await User.findOne({ username }).select("-password");

    //checking user is present or not
    if (!user) {
      return response.status(400).json({
        error: "User not found",
      });
    }

    //if user found send response
    response.status(200).json(user);
  } catch (error) {
    console.log("Error in getUserProfile controller", error.message);
    response.status(500).json({
      error: "Internal server error",
    });
  }
};

//=========FOLLOW UN FOLLOWER USER==========
export const followUnfollowUser = async (request, response) => {
  try {
    //getting id from params
    const { id } = request.params;

    //here we have two users 1.user to be modified(to whome we need to follow or unfollow) and 2.current user(me who doing follow and unfollow)
    const userToBeModified = await User.findById(id);

    //this is the current user
    const currentUser = await User.findById(request.user._id);

    //myself cannot follow me or unfollowme
    if (id === request.user._id.toString()) {
      return response
        .status(400)
        .json({ error: "You cannot follow/unfollow userself" });
    }

    //checking if current user and user to be modified present or not
    if (!currentUser || !userToBeModified) {
      return response.status(400).json({ error: "User not found" });
    }

    //all check passed then we need to go for follow or unfollow
    //checking following user
    const isFollowing = currentUser.following.includes(id);

    //if isFolllowing is true then we need to unfollow
    /**
     * what we are doing actually here, if i am going to follow a user then count should be pushed to users
     * followers array and in we need to push count in my following array, if i want to unfollow then a count
     * will be pulled from users followers array and in my following array a count should be pulled
     */
    if (isFollowing) {
      //Unfolow the user
      await User.findByIdAndUpdate(request.user._id, {
        $pull: { following: id },
      });
      await User.findByIdAndUpdate(id, {
        $pull: { followers: request.user._id },
      });
      //after unfollowing no need to sending notification
      //just send response
      response.status(200).json({
        message: "User unfollowed successfully",
      });
    } else {
      //Follow the user
      await User.findByIdAndUpdate(id, {
        $push: { followers: request.user._id },
      });
      await User.findByIdAndUpdate(request.user._id, {
        $push: { following: id },
      });

      //send notification after following
      const newNotification = new Notification({
        type: "follow",
        from: request.user._id,
        to: userToBeModified._id,
      });

      //saving the notification
      await newNotification.save();

      response.status(200).json({
        message: "User followed successfully",
      });
    }
  } catch (error) {
    console.log("Error in followUnfollowUser controller", error.message);
    response.status(500).json({
      error: "Internal server error",
    });
  }
};

//==========GET SUGGESTED USERS============
export const getSuggestedUsers = async (request, response) => {
  try {
    //we don't want our self to be in suggested users list, so excluding it first
    const userId = request.user._id;

    const usersFollowedByMe = await User.findById(userId).select(
      "following"
    );

    //getting 10 users with mongoose aggregate function
    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId },
        },
      },
      {
        $sample: { size: 10 },
      },
    ]);

    //filtering out which i have followed before(these users should not be present in our suggested list)
    const filteredUsers = users.filter((user) =>
      usersFollowedByMe.following.includes(user._id)
    );

    const suggestedUsers = filteredUsers.slice(0, 4);

    //not showing the password of suggested user
    suggestedUsers.forEach((user) => (user.password = null));

    response.status(200).json(suggestedUsers);
  } catch (error) {
    console.log("Error in getSuggestedUsers controller", error.message);
    response.status(500).json({
      error: "Internal server error",
    });
  }
};

export const updateUser = async (request, response) => {
  //update user, a user can update all the fields related to him, let's take those fields
  const {
    fullName,
    username,
    email,
    currentPassword,
    newPassword,
    bio,
    link,
  } = request.body;

  //we wnat to resign the values of images so will take let variable
  let { profileImg, coverImg } = request.body;

  //taking userid from request body
  const userId = request.user._id;

  try {
    //checking user is present or not
    let user = await User.findById(userId);
    if (!user) {
      return response.status(400).json({ message: "User not found" });
    }

    //===========UPDATE PASSWORD===========
    //checking user is providing both current and new password
    if (
      (!newPassword && currentPassword) ||
      (!currentPassword && newPassword)
    ) {
      return response.status(400).json({
        error: "Please provide both the current password and new password",
      });
    }

    if (currentPassword && newPassword) {
      //comparing password using bcrypt
      const isMatch = await bcrypt.compare(currentPassword, user.password);

      //if no match send error response
      if (!isMatch) {
        return response.status(400).json({
          error: "current password is incorrect",
        });
      }

      //after match we need to validate the password
      if (newPassword.length < 8) {
        return response.status(400).json({
          error: "password should be atleast 8 character",
        });
      }

      //after every check again we need to hash the password before saving it to DB
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    //============UPDATING PROFILE IMAGE===========
    //uploading image to cloudinary
    //profileimage
    if (profileImg) {
      //deleting the old image
      if (user.profileImg) {
        await cloudinary.uploader.destroy(
          user.profileImg.split("/").pop().split(".")[0]
        );
      }
      //uploading new image to cloudinary
      const uploadedResponse = await cloudinary.uploader.upload(
        profileImg
      );
      profileImg = uploadedResponse.secure_url;
    }

    //coverimage
    if (coverImg) {
      //deleting the old image
      if (user.coverImg) {
        await cloudinary.uploader.destroy(
          user.coverImg.split("/").pop().split(".")[0]
        );
      }
      const uploadedResponse = await cloudinary.uploader.upload(coverImg);
      coverImg = uploadedResponse.secure_url;
    }

    //saving to database
    user.fullName = fullName || user.fullName;
    user.username = username || user.username;
    user.email = email || user.email;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;

    //saving
    user = await user.save();

    user.password = null;

    return response.status(200).json(user);
  } catch (error) {
    console.log("Error in updateUser controller", error.message);
    response.status(500).json({
      error: "Internal server error",
    });
  }
};
