const { auth } = require('../helpers/ResponseCodes');
const  jwt  = require('jsonwebtoken');
const { body } = require('express-validator');

class Authenticaton {
  
  static ValidateRegisterData (req, res, next) {
    next();
  }

  static ValidateLoginData (req, res, next) {
        // username must be an email
    body('email').isEmail(),
    // password must be at least 5 chars long
    body('password').isLength({ min: 5 });
    next();
  }

  static AuthenticateToken(req,res,next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err,user) => {
      if(err) return res.sendStatus(403)
      req.user = user;
      next();
    });
  }
}

module.exports = Authenticaton;
