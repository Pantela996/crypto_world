var express = require('express');
var router = express.Router();
const Auth = require('../../middleware/Authenticator');
const UserRepo = require('../../repository/UserRepository');
const ResponseModel = require('../../models/ResponseModel');
const { validationResult } = require('express-validator');

router.get('/all', Auth.AuthenticateToken, async (req, res) => {
    const result = await UserRepo.GetAllUsers();
    if (result.success) {
      res.json(new ResponseModel().Success(result.data));
    } else {
      res.json(new ResponseModel().Failed(result.message));
    }
});


module.exports = router;
