import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

export const protectRoute = async (request, response, next) => {
  try {
    //try to get cookie from user
    const token = request.cookies.jwt;

    //if no cookie token then send error message
    if (!token) {
      return response.status(401).json({
        message: "you are not logged in, please Login",
      });
    }

    //if cookie present we need to decode the encoded jwt token first from verify method present in jwt
    //and that method takes two parameter 1.token 2.token secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //if no decoded token or expired token send error
    if (!decoded) {
      return response.status(401).json({
        message: "Unauthorized: Invalid token",
      });
    }

    //everything matched then finding userid preset in token(decoded) we have send userId by payload
    const user = await User.findById(decoded.userId).select("-password"); //don't want to show the password then (-passwrod)

    //checking user present or not
    if (!user) {
      return response.status(404).json({
        message: "User not found",
      });
    }

    //setting user into the request object
    request.user = user;
    next();
  } catch (error) {
    console.log("Error in protectRoute middleware", error.message);
    response.status(500).json({
      error: "Internal server error",
    });
  }
};
