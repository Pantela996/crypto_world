var express = require('express');
var router = express.Router();
const Auth = require('../../middleware/Authenticator');
const UserRepo = require('../../repository/UserRepository');
const ResponseModel = require('../../models/ResponseModel');

router.get('/all', Auth.AuthenticateToken, async (req, res) => {
  const result = await UserRepo.GetAllUsers();
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

router.put('/ban/:id', [Auth.AuthenticateToken, Auth.AuthenticateAdminToken], async (req, res) => {
  const banUserModel = {
    id : req.params.id
  }
  const result = await UserRepo.BanUser(banUserModel);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

module.exports = router;
