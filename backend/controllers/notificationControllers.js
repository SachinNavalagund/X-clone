import Notification from "../models/notificationModel.js";

//==========GET NOTIFICATION=========
export const getNotification = async (request, response) => {
  try {
    const userId = request.user._id;

    const notification = await Notification.find({ to: userId }).populate({
      path: "from",
      select: "username profileImg",
    });

    await Notification.updateMany({ to: userId }, { read: true });

    response.status(200).json(notification);
  } catch (error) {
    console.log("Error in getNotification controller", error.message);
    response.status(500).json({
      error: "Internal server error",
    });
  }
};

//===========DELETE NOTIFICATION===========
export const deleteNotification = async (request, response) => {
  try {
    const userId = request.user._id;

    await Notification.deleteMany({ to: userId });

    response
      .status(200)
      .json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.log("Error in deleteNotification controller", error.message);
    response.status(500).json({
      error: "Internal server error",
    });
  }
};
