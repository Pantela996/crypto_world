const HashUtil = require('../helpers/HashUtil');
const UserQueryProcessor = require('../db/query_processors/UserQueryProcessor');
const ResponseBuilder = require('../helpers/ResponseBuilder');
const ResponseCodes = require('../helpers/ResponseCodes');
const { all } = require('../routes/user_routes/userRoutes');
const { compare } = require('bcrypt');

class UserRepository {
  static async RegisterUser (req) {
    const userFoundByEMail = await UserQueryProcessor.GetOneByEmail(req.body);

    // 409 is conflict error
    if (userFoundByEMail !== false) {
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.EMAIL_ALREADY_EXISTS, 409, null);
    }

    // Succeded
    req.body.password = await HashUtil.Hash(req.body.password);
    const insertIntoUser = await UserQueryProcessor.Create(req.body);
    return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, insertIntoUser);
  }

  static async GetAllUsers () {
    const allUsers = await UserQueryProcessor.GetAll();
    return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, allUsers);
  }

  static async Login (req) {
    const user = await UserQueryProcessor.GetOneByEmail(req.body);

    // If user does not exists
    if (user === false) {
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INVALID_EMAIL_OR_PASSWORD, 400, null);
    }

    const isValidPassword = await HashUtil.Compare(req.body.password, user.rows[0].password);

    // Bad Request error
    if (isValidPassword === false) {
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INVALID_PASSWORD, 400, null);
    }

    return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, user);
  }
}

module.exports = UserRepository;
