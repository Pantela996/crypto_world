var express = require('express');
var router = express.Router();
const Auth = require('../../middleware/Authenticator');
const TokenRepository = require('../../repository/TokenRepository');
const ResponseModel = require('../../models/ResponseModel');

router.post('/issueRequest', [Auth.ValidateTokenRequest, Auth.AuthenticateToken], async (req, res) => {
  const result = await TokenRepository.CreateToken(req);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

router.put('/issueRequest/:name', [Auth.VerifyDataPresence, Auth.AuthenticateToken, Auth.AuthenticateAdminToken], async (req, res) => {
  const result = await TokenRepository.ApproveToken(req);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

router.put('/issueRequest/reject/:name', [Auth.VerifyDataPresence, Auth.AuthenticateToken,  Auth.AuthenticateAdminToken], async (req, res) => {
  const result = await TokenRepository.RejectToken(req);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

router.post('/:token_id/purchaseRequest/:seller_id', [Auth.VerifyDataPresence, Auth.AuthenticateToken], async (req, res) => {
  const result = await TokenRepository.CreatePurchase(req);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

router.put('/purchaseRequest/:id', [Auth.VerifyDataPresence, Auth.AuthenticateToken, Auth.AuthenticateAdminToken], async (req, res) => {
  const result = await TokenRepository.ApproveRequest(req);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

router.get('/top/:name', async(req,res) => {
  const result = await TokenRepository.TopHolders(req);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

router.get('/user/:user_id', async(req,res) => {
  const result = await TokenRepository.UserTokens(req);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
})

router.get('/active', async(req,res) => {
  const result = await TokenRepository.ActiveTokens();
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
})


router.get('/:id/holders', async(req,res) => {
  const result = await TokenRepository.TokenHolders(req);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
})

router.post('/:token_id/sellingRequest', [Auth.VerifyDataPresence, Auth.AuthenticateToken], async(req,res) => {
  const result = await TokenRepository.CreateSellingRequest(req);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
})

router.get('/sellingRequest/all', async(req,res) => {
  const result = await TokenRepository.FetchSellingRequests();
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
})

router.put('/sellingRequest/:id', [Auth.AuthenticateToken], async(req,res) => {
  const result = await TokenRepository.CloseSellingRequest(req);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
})

module.exports = router;
