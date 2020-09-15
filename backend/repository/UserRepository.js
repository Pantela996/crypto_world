const HashUtil = require('../helpers/HashUtil');
const UserQueryProcessor = require('../db/query_processors/UserQueryProcessor');
const PortfolioQueryProcessor = require('../db/query_processors/PortfolioQueryProcessor');
const TokenQueryProcessor = require('../db/query_processors/TokenQueryProcessor');
const ResponseBuilder = require('../helpers/ResponseBuilder');
const ResponseCodes = require('../helpers/ResponseCodes');
const jwt = require('jsonwebtoken');

class UserRepository {
  static async RegisterUser (registerUserModel) {
    try {
      const userFoundByEmail = await UserQueryProcessor.GetOneByEmail(registerUserModel);
      // 409 is conflict error
      if (userFoundByEmail) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.EMAIL_ALREADY_EXISTS, 409, null);
      }
      // Succedded
      registerUserModel.password = await HashUtil.Hash(registerUserModel.password);
      const insertIntoUser = await UserQueryProcessor.Create(registerUserModel);

      const baseToken = await TokenQueryProcessor.GetOneByName({ name: GLOBALS.BASE_TOKEN_NAME });
      if (!baseToken) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.TOKEN_DOESNT_EXIST, 404, null);
      }

      await PortfolioQueryProcessor.Create(baseToken.token_id, insertIntoUser.user_id, GLOBALS.INITIAL_BASE_TOKEN_AMOUNT);

      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, {});
    } catch (err) {
      console.log(err);
      console.log('Error in user repository, register.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async GetAllUsers () {
    try {
      const allUsers = await UserQueryProcessor.GetAll();
      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, allUsers);
    } catch {
      console.log('Error in user repository, get all users.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async Login (loginModel) {
    try {
      const user = await UserQueryProcessor.GetOneByEmail(loginModel);
      // If user does not exists
      if (!user) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INVALID_EMAIL_OR_PASSWORD, 400, null);
      }

      const isValidPassword = await HashUtil.Compare(loginModel.password, user.password);
      // Bad Request error
      if (!isValidPassword) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INVALID_PASSWORD, 400, null);
      }

      // Users banned?
      if (user.banned) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.USER_BANNED, 403, null);
      }

      // Get token, ovo u select
      delete user.password;
      delete user.banned;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);

      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, accessToken);
    } catch (err) {
      console.log(err);
      console.log('Error in user repository, login.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async BanUser (banUserModel) {
    try {
      const user = await UserQueryProcessor.GetOneByID({ user_id: banUserModel.id });
      if (!user) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.USER_DOES_NOT_EXIST, 400, null);
      }

      if (user.banned) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.USER_ALREADY_BANNED, 409, null);
      }

      await UserQueryProcessor.Ban(user.user_id);
      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, null);
    } catch (err) {
      console.log(err);
      console.log('Error in user repository, banUser.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }
}

module.exports = UserRepository;
