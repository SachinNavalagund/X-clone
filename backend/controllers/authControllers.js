export const signup = async (request, response) => {
  response.status(200).json({
    status: "success",
    data: "you hit the signup endpoint",
  });
};

export const login = async (request, response) => {
  response.status(200).json({
    status: "success",
    data: "you hit the login endpoint",
  });
};

export const logout = async (request, response) => {
  response.status(200).json({
    status: "success",
    data: "you hit the logoout endpoint",
  });
};
