const jwt = require('jsonwebtoken');
const ResponseBuilder = require('../helpers/ResponseBuilder');
const ResponseCodes = require('../helpers/ResponseCodes');
const ValidationHelper = require('../helpers/ValidationHelper');

class Authentication {
  static ValidateRegisterData (req, res, next) {
    var paramsValid = ValidationHelper.CheckAllParamsExist(req.body);
    var emailFormatValid = ValidationHelper.ValidateEmailFormat(req.body.email);
    // We can add customized errors, for every missed param, in this its one check for all
    var passwordLengthValid = ValidationHelper.CheckPasswordLength(req.body.password);

    if (paramsValid && emailFormatValid && passwordLengthValid) {
      next();
    } else {
      res.json(ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INVALID_QUERY_PARAMS_FORMAT, 400, null));
    }
  }

  static ValidateLoginData (req, res, next) {
    var paramsValid = ValidationHelper.CheckAllParamsExist(req.body);
    if (paramsValid && ValidationHelper.ValidateEmailFormat(req.body.email)) {
      next();
    } else {
      res.json(ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INVALID_QUERY_PARAMS_FORMAT, 400, null));
    }
  }

  static AuthenticateToken (req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  }

  static ValidateTokenRequest (req, res, next) {
    var paramsValid = ValidationHelper.CheckAllParamsExist(req.body);
    var iocInitValueValid = ValidationHelper.NumericValueCheck(req.body.initial_coin_offering);
    var pricePerUnitValid = ValidationHelper.NumericValueCheck(req.body.price_per_unit);

    if (paramsValid && iocInitValueValid && pricePerUnitValid) {
      next();
    } else {
      res.json(ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INVALID_QUERY_PARAMS_FORMAT, 400, null));
    }
  }

  static VerifyDataPresence (req, res, next) {
    var paramsValid = ValidationHelper.CheckAllParamsExist(req.body);

    if (paramsValid) {
      next();
    } else {
      res.json(ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INVALID_QUERY_PARAMS_FORMAT, 400, null));
    }
  }
}

module.exports = Authentication;
