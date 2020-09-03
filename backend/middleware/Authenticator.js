const jwt = require('jsonwebtoken');
const ResponseBuilder = require('../helpers/ResponseBuilder');
const ResponseCodes = require('../helpers/ResponseCodes');

class Authenticaton {
  static ValidateRegisterData (req, res, next) {
    var paramsValid = Authenticaton.CheckAllParamsExist(req.body);
    var emailFormatValid = Authenticaton.ValidateEmailFormat(req.body.email);
    // We can add customized errors, for every missed param, in this its one check for all
    var passwordLengthValid = Authenticaton.CheckPasswordLength(req.body.password);

    if (paramsValid && emailFormatValid && passwordLengthValid) {
      next();
    } else {
      res.json(ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INVALID_QUERY_PARAMS_FORMAT, 400, null));
    }
  }

  static ValidateLoginData (req, res, next) {
    console.log("came");
    var paramsValid = Authenticaton.CheckAllParamsExist(req.body);
    if (paramsValid && Authenticaton.ValidateEmailFormat(req.body.email)) {
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
    var paramsValid = Authenticaton.CheckAllParamsExist(req.body);
    var iocInitValueValid = Authenticaton.NumericValueCheck(req.body.initial_coin_offering);
    var pricePerUnitValid = Authenticaton.NumericValueCheck(req.body.price_per_unit);

    if (paramsValid && iocInitValueValid && pricePerUnitValid) {
      next();
    } else {
      res.json(ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INVALID_QUERY_PARAMS_FORMAT, 400, null));
    }
  }

  static ValidatePurchaseRequest(req,res,next) {
    next();
  }

  static CheckAllParamsExist (object) {
    for (const value in object) {
      if (!object[value] || object[value] === '') return false;
      else continue;
    }
    return true;
  }

  static ValidateEmailFormat (email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }

  static CheckPasswordLength (pass) {
    return pass.length >= 5;
  }

  static NumericValueCheck (number) {
    return number > 0;
  }
}

module.exports = Authenticaton;
