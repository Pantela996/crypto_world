const jwt = require('jsonwebtoken');
const ResponseBuilder = require('../helpers/ResponseBuilder');
const ResponseCodes = require('../helpers/ResponseCodes');
const ValidationHelper = require('../helpers/ValidationHelper');
const UserRoleModel = require('../models/UserRoleModel');

class Authentication {
  static ValidateRegisterData (req, res, next) {
    var paramsValid = ValidationHelper.CheckAllParamsExist(req.body);
    var emailFormatValid = ValidationHelper.ValidateEmailFormat(req.body.email);
    // We can add customized errors, for every missed param, in this its one check for all
    var passwordLengthValid = ValidationHelper.CheckPasswordLength(req.body.password);

    if (paramsValid && emailFormatValid && passwordLengthValid) {
      next();
    } else {
      return res.json(ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INVALID_QUERY_PARAMS_FORMAT, 400, null));
    }
  }

  static ValidateLoginData (req, res, next) {
    var paramsValid = ValidationHelper.CheckAllParamsExist(req.body);
    if (paramsValid && ValidationHelper.ValidateEmailFormat(req.body.email)) {
      next();
    } else {
      return res.json(ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INVALID_QUERY_PARAMS_FORMAT, 400, null));
    }
  }

  static AuthenticateToken (req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (token === null) return res.json(ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.LOGIN_FAILED, 401, null));

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) res.json(ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.NOT_AUTHORIZED, 403, null));
      req.user = user;
      next();
    });
  }

  static AuthenticateAdminToken (req, res, next) {
    if (req.user.role !== UserRoleModel.role.ADMIN) {
      console.log("here");
      return res.json(ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.NOT_AUTHORIZED, 403, null));
    }
    next();
  }

  static ValidateTokenRequest (req, res, next) {
    var paramsValid = ValidationHelper.CheckAllParamsExist(req.body);
    var iocInitValueValid = ValidationHelper.NumericValueCheck(req.body.initial_coin_offering);
    var pricePerUnitValid = ValidationHelper.NumericValueCheck(req.body.price_per_unit);

    if (paramsValid && iocInitValueValid && pricePerUnitValid) {
      next();
    } else {
      return res.json(ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INVALID_QUERY_PARAMS_FORMAT, 400, null));
    }
  }

  static VerifyDataPresence (req, res, next) {
    var paramsValid = ValidationHelper.CheckAllParamsExist(req.body);

    if (paramsValid) {
      next();
    } else {
      return res.json(ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INVALID_QUERY_PARAMS_FORMAT, 400, null));
    }
  }
}

module.exports = Authentication;
