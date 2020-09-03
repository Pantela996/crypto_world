const HashUtil = require('../helpers/HashUtil');
const UserQueryProcessor = require('../db/query_processors/UserQueryProcessor');
const ResponseBuilder = require('../helpers/ResponseBuilder');
const ResponseCodes = require('../helpers/ResponseCodes');
const jwt = require('jsonwebtoken');


class UserRepository {

  static async RegisterUser (req) {
    try {
      const userFoundByEMail = await UserQueryProcessor.GetOneByEmail(req.body);
      // 409 is conflict error
      if (userFoundByEMail) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.EMAIL_ALREADY_EXISTS, 409, null);
      }
      // Succeded
      req.body.password = await HashUtil.Hash(req.body.password);
      console.log("came");
      const insertIntoUser = await UserQueryProcessor.Create(req.body);
      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, insertIntoUser);
    } catch(err) {
      console.log(err);
      console.log("Error in user repository, register.");
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }

  }

  static async GetAllUsers () {
    try{
      const allUsers = await UserQueryProcessor.GetAll();
      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, allUsers);
    } catch {
      console.log("Error in user repository, get all users.");
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }

  }

  static async Login (req) {
    try {
      const user = await UserQueryProcessor.GetOneByEmail(req.body);
      // If user does not exists
      if (!user) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INVALID_EMAIL_OR_PASSWORD, 400, null);
      }

      const isValidPassword = await HashUtil.Compare(req.body.password, user.rows[0].password);
      // Bad Request error
      if (!isValidPassword) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INVALID_PASSWORD, 400, null);
      }
      // Get token
      const accessToken = jwt.sign(user.rows[0], process.env.ACCESS_TOKEN_SECRET);

      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, accessToken);
    } catch(err) {
      console.log(err);
      console.log("Error in user repository, login.");
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  } 
}

module.exports = UserRepository;
