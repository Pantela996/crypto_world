var express = require('express');
var router = express.Router();
const Auth = require('../../middleware/Authenticator');
const TokenRepository = require('../../repository/TokenRepository');
const ResponseModel = require('../../models/ResponseModel');

router.post('/issueRequest', [Auth.AuthenticateToken, Auth.ValidateIssueRequestData], async (req, res) => {
  const issueRequestModel = {
    user_id : req.user.user_id,
    name : req.body.name,
    initial_coin_offering : req.body.initial_coin_offering,
    price_per_unit : req.body.price_per_unit
  }
  const result = await TokenRepository.CreateToken(issueRequestModel);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

router.put('/issueRequest/:name', [Auth.AuthenticateToken, Auth.AuthenticateAdminToken], async (req, res) => {
  const approveIssueRequest = {
    name : req.params.name
  }
  const result = await TokenRepository.ApproveToken(approveIssueRequest);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

router.put('/issueRequest/reject/:name', [Auth.AuthenticateToken, Auth.AuthenticateAdminToken], async (req, res) => {
  const rejectIssueRequest = {
    name : req.params.name
  }
  const result = await TokenRepository.RejectToken(rejectIssueRequest);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

router.post('/:token_id/purchaseRequest/:seller_id', [Auth.AuthenticateToken, Auth.ValidatePurchaseRequestData], async (req, res) => {
  const purchaseRequestModel = {
    user : req.user,
    seller_id : req.params.seller_id,
    token_id : req.params.token_id,
    amount : req.body.amount
  }
  const result = await TokenRepository.CreatePurchase(purchaseRequestModel);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

router.put('/purchaseRequest/:id', [Auth.AuthenticateToken, Auth.AuthenticateAdminToken], async (req, res) => {
  const approvePurchaseRequestModel = {
    id : req.params.id
  }
  const result = await TokenRepository.ApproveRequest(approvePurchaseRequestModel);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

router.get('/top/:name', async (req, res) => {
  const topTokenHoldersModel = {
    name : req.params.name
  }
  const result = await TokenRepository.TopHolders(topTokenHoldersModel);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

router.get('/user/:user_id', async (req, res) => {
  const userTokensModel = {
    user_id : req.params.user_id
  }
  const result = await TokenRepository.UserTokens(userTokensModel);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

router.get('/active', async (req, res) => {
  const result = await TokenRepository.ActiveTokens();
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

router.get('/:id/holders', async (req, res) => {
  const tokenHoldersModel = {
    id : req.params.id
  } 
  const result = await TokenRepository.TokenHolders(tokenHoldersModel);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

router.post('/:token_id/sellingRequest', [Auth.AuthenticateToken, Auth.ValidatePurchaseRequestData], async (req, res) => {
  const sellingRequestModel = {
    token_id : req.params.token_id,
    user : req.user,
    amount : req.body.amount,
    coef : req.body.coef
  }
  const result = await TokenRepository.CreateSellingRequest(sellingRequestModel);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

router.get('/sellingRequest/all', async (req, res) => {
  const result = await TokenRepository.FetchSellingRequests();
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

router.put('/sellingRequest/:id', [Auth.AuthenticateToken], async (req, res) => {
  const closeSellingRequestModel = {
    user :  req.user,
    id : req.params.id
  }
  const result = await TokenRepository.CloseSellingRequest(closeSellingRequestModel);
  res.status(result.status_code);
  if (result.success) {
    res.json(new ResponseModel().Success(result.data));
  } else {
    res.json(new ResponseModel().Failed(result.message));
  }
});

module.exports = router;
