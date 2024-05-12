import bcrypt from "bcryptjs";
import User from "../models/userModle.js";
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";

//===============SIGNUP(REGISTRATION)==============
export const signup = async (request, response) => {
  try {
    //getting input from user
    const { fullName, username, email, password } = request.body;

    //validating email with regular expression
    const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (!emailRegex.test(email)) {
      return response.status(400).json({
        error: "Invalid email format",
      });
    }

    //need to check user exist or not if exist don't allow to signup
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return response.status(400).json({
        error: "Username is already taken",
      });
    }

    //need to check email exist or not if exist don't allow to signup
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return response.status(400).json({
        error: "This Email is already registered",
      });
    }

    //checking password length
    if (password.length < 8) {
      return response.status(400).json({
        error: "Password must be at least of 8 characters long",
      });
    }

    //hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //now creating user and storing to DB
    const newUser = new User({
      fullName: fullName,
      username: username,
      email: email,
      password: hashedPassword,
    });

    //if newUser is created then we need to generate and set cookies
    if (newUser) {
      generateTokenAndSetCookie(newUser._id, response);
      await newUser.save();

      response.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        email: newUser.email,
        followers: newUser.followers,
        following: newUser.following,
        profileImg: newUser.profileImg,
        coverImg: newUser.coverImg,
      });
    } else {
      return response.status(400).json({
        error: "Invalid user data",
      });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    response.status(500).json({
      error: "Internal server error",
    });
  }
};

export const login = async (request, response) => {
  try {
    //taking input(username and password) from user
    const { username, password } = request.body;

    //finding the user
    const user = await User.findOne({ username });

    //checking password matches or not(comparing password with database password and user entered password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user?.password || ""
    ); //here we are taking empty string because if user will not enter the  password and if it is undefined then compare will not happen and we will get error

    //checking if user and password are not there
    if (!user || !isPasswordCorrect) {
      return response.status(400).json({
        error: "Invalid username or password",
      });
    }

    //if check passed then we need to send token to user
    generateTokenAndSetCookie(user._id, response);

    //send back the response to the user
    response.status(200).json({
      // data: {
      //   user,
      // },
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      followers: user.followers,
      following: user.following,
      profileImg: user.profileImg,
      coverImg: user.coverImg,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    response.status(500).json({
      error: "Internal server error",
    });
  }
};

export const logout = async (request, response) => {
  try {
    response.cookie("jwt", "", { maxAge: 0 });
    response.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    response.status(500).json({
      error: "Internal server error",
    });
  }
};

export const getMe = async (request, response) => {
  try {
    //finding the user by id, this id we are getting from the protectedRoute
    /**
     * in that protected Route we are using middle ware and we are checking the token and
     *  we are decoding  the token and in  that decoded token we are checking userid present
     *  in decoded token, if present then setting that userid to request object
     */
    const user = await User.findById(request.user._id).select("-password");
    response.status(200).json(user);
  } catch (error) {
    console.log("Error in getMe controller", error.message);
    response.status(500).json({
      error: "Internal server error",
    });
  }
};
