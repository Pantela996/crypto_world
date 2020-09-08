const TokenQueryProcessor = require('../db/query_processors/TokenQueryProcessor');
const ResponseBuilder = require('../helpers/ResponseBuilder');
const ResponseCodes = require('../helpers/ResponseCodes');
const UserQueryProcessor = require('../db/query_processors/UserQueryProcessor');
const PortfolioQueryProcessor = require('../db/query_processors/PortfolioQueryProcessor');
const SellingRequestProcessor = require('../db/query_processors/SellingRequestProcessor');
const TransactionRequestProcessor = require('../db/query_processors/TransactionRequestProcessor');
const TokenStatusModel = require('../models/TokenStatusModel');
const TransactionRequestStatusModel = require('../models/TranscationRequestStatusModel');
const TokenRepositoryHelper = require('../helpers/TokenRepositoryHelper');

class TokenRepository {
  static async CreateToken (req) {
    try {
      const userID = req.user.user_id;
      const tokenFoundByName = await TokenQueryProcessor.GetOneByName(req.body);
      const userTokenHolder = await UserQueryProcessor.GetOneByID(req.user);

      // 409 is conflict error
      if (tokenFoundByName) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.NAME_ALREADY_EXISTS, 409, null);
      }

      if (!userTokenHolder) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);
      }

      if (userTokenHolder.banned) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.USER_BANNED, 403, null);
      }

      const baseToken = await TokenQueryProcessor.GetOneByName({ name: 'Dinar' });
      if (!baseToken) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);
      }

      const userBaseToken = await PortfolioQueryProcessor.GetPortfolioBaseTokenAmount({ user_id: userID });

      if (!userBaseToken) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);
      }

      if (userBaseToken.amount < 1000) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.INSUFFICIENT_FUNDS, 404, null);
      }

      userBaseToken.amount = parseFloat(userBaseToken.amount) - 1000;

      await PortfolioQueryProcessor.UpdateTokenAmount(userBaseToken.amount, userID, baseToken.token_id);
      await TokenQueryProcessor.Create(req.body, userID);
      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, null);
    } catch (err) {
      console.log(err);
      console.log('Error in token repository, createToken.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async ApproveToken (req) {
    try {
      const tokenFoundByName = await TokenQueryProcessor.GetOneByName({ name: req.params.name });

      if (!tokenFoundByName) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);
      }

      if (tokenFoundByName.status === TokenStatusModel.status.REJECTED) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.TOKEN_REJECTED, 403, null);
      }

      const userTokenHolder = await UserQueryProcessor.GetOneByID({ user_id: tokenFoundByName.user_id });
      if (!userTokenHolder) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);
      }

      if (userTokenHolder.banned) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.USER_BANNED, 403, null);
      }

      // enum
      if (tokenFoundByName.status === TokenStatusModel.status.APPROVED) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.ALREADY_APPROVED, 400, null);
      }

      const approvedToken = await TokenQueryProcessor.ApproveToken({ name: req.params.name }, tokenFoundByName.user_id);
      await PortfolioQueryProcessor.Create(approvedToken.token_id, approvedToken.user_id, approvedToken.initial_coin_offering);

      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, null);
    } catch (err) {
      console.log(err);
      console.log('Error in token repository, approveToken.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async RejectToken (req) {
    try {
      const tokenFoundByName = await TokenQueryProcessor.GetOneByName({ name: req.params.name });

      console.log(tokenFoundByName);

      if (!tokenFoundByName) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);
      }

      if (tokenFoundByName.status === TokenStatusModel.status.REJECTED) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.ALREADY_REJECTED, 400, null);
      }

      const baseToken = await TokenQueryProcessor.GetOneByName({ name: 'Dinar' });
      if (!baseToken) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);
      }

      const userBaseToken = await PortfolioQueryProcessor.GetPortfolioBaseTokenAmount({ user_id: tokenFoundByName.user_id });
      if (!userBaseToken) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);
      }
      userBaseToken.amount = parseFloat(userBaseToken.amount) + 1000;
      await PortfolioQueryProcessor.UpdateTokenAmount(userBaseToken.amount, tokenFoundByName.user_id, baseToken.token_id);
      await TokenQueryProcessor.Reject(tokenFoundByName, tokenFoundByName.user_id);

      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, null);
    } catch (err) {
      console.log(err);
      console.log('Error in token repository, rejectToken.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async CreatePurchase (req) {
    try {
      const buyerUser = await UserQueryProcessor.GetOneByID(req.user);
      const sellerUser = await UserQueryProcessor.GetOneByID({ user_id: req.params.seller_id });

      var participantsExist = await TokenRepositoryHelper.CheckIfTransactionParticipantsExist(buyerUser, sellerUser);
      if (participantsExist === false) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 400, null);
      }

      // Users banned?
      if (buyerUser.banned) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.BUYER_USER_BANNED, 403, null);
      }

      if (sellerUser.banned) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.SELLER_USER_BANNED, 400, null);
      }

      var tradeToken = await TokenQueryProcessor.GetOneByID({ token_id: req.params.token_id });


      if (!tradeToken || tradeToken.status !== TokenStatusModel.status.APPROVED) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);
      }

      // Get buyers and seller portfolio, base and trade token.
      const buyerUserPortfolio = await PortfolioQueryProcessor.GetPortfolioBaseTokenAmount(buyerUser);
      const sellerUserPortfolio = await PortfolioQueryProcessor.GetOneByID(req.params.token_id, sellerUser);

      console.log(buyerUser);

      if (!sellerUserPortfolio || !buyerUserPortfolio) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);
      }

      console.log(buyerUserPortfolio, sellerUserPortfolio);

      // Seller has enough amount of desired token?
      if (sellerUserPortfolio.amount < req.body.amount) {
        console.log('More tokens then available');
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.NOT_ENOUGH_TOKENS, 400, null);
      }

      const { available, needed } = await TokenRepositoryHelper.CompareTokenValues(buyerUserPortfolio, sellerUserPortfolio, req.body.amount);
      // When converted, compare values in terms of base token
      if (available < needed) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.INSUFFICIENT_FUNDS, 400, null);
      }

      await TransactionRequestProcessor.Create(req.user.user_id, req.params.seller_id, req.body.amount, req.params.token_id);
      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, null);
    } catch (err) {
      console.log(err);
      console.log('Error in token repository, createPurchase.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async ApproveRequest (req) {
    try {
      const transactionRequest = await TransactionRequestProcessor.GetOneById(req.params.id);

      console.log(transactionRequest);

      if (!transactionRequest) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);
      }

      const buyerUser = await UserQueryProcessor.GetOneByID({ user_id: transactionRequest.buyer_id });
      const sellerUser = await UserQueryProcessor.GetOneByID({ user_id: transactionRequest.seller_id });

      // Check if Participants and exist
      var participantsExist = await TokenRepositoryHelper.CheckIfTransactionParticipantsExist(buyerUser, sellerUser);
      if (participantsExist === false) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);
      }

      // Users banned?
      if (buyerUser.banned) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.BUYER_USER_BANNED, 403, null);
      }

      if (sellerUser.banned) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.SELLER_USER_BANNED, 400, null);
      }

      // Token exists?
      var tradeToken = await TokenQueryProcessor.GetOneByID({ token_id: transactionRequest.token_id });
      if (!tradeToken || tradeToken.status !== TokenStatusModel.status.APPROVED) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);
      }

      // Seller has desired token?
      const sellerUserToken = await PortfolioQueryProcessor.GetOneByID(transactionRequest.token_id, sellerUser);
      var buyerUserToken = await PortfolioQueryProcessor.GetOneByID(transactionRequest.token_id, buyerUser);
      const sellerUserBaseToken = await PortfolioQueryProcessor.GetPortfolioBaseTokenAmount(sellerUser);
      const buyerUserBaseToken = await PortfolioQueryProcessor.GetPortfolioBaseTokenAmount(buyerUser);

      if (!sellerUserToken) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);
      }

      // Seller has enough amount of desired token?
      if (sellerUserToken.amount < transactionRequest.amount) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 403, null);
      }

      // Check Funds
      var { available, needed } = await TokenRepositoryHelper.CompareTokenValues(buyerUserBaseToken, sellerUserToken, transactionRequest.amount);
      available = parseFloat(available);
      needed = parseFloat(needed);
      if (available < needed) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.INSUFFICIENT_FUNDS, 403, null);
      }

      // Is it already approved?
      if (transactionRequest.status === TransactionRequestStatusModel.status.APPROVED) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.ALREADY_APPROVED, 400, null);
      }

      // Do transfer logic
      buyerUserBaseToken.amount = parseFloat(buyerUserBaseToken.amount) - needed;
      sellerUserBaseToken.amount = parseFloat(sellerUserBaseToken.amount) + needed;

      // Create buyers portfolio for token
      if (!buyerUserToken) {
        buyerUserToken = await PortfolioQueryProcessor.Create(transactionRequest.token_id, buyerUser.user_id, parseFloat(transactionRequest.amount));
      } else {
        buyerUserToken.amount = parseFloat(buyerUserToken.amount) + parseFloat(transactionRequest.amount);
      }

      sellerUserToken.amount = parseFloat(sellerUserToken.amount) - transactionRequest.amount;

      console.log(buyerUserBaseToken, sellerUserBaseToken, buyerUserToken, sellerUserToken);

      // Get Dinar from db
      // 409 fixes

      const baseToken = await TokenQueryProcessor.GetOneByName({ name: 'Dinar' });
      if (!baseToken) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);
      }

      // Update buyer, seller portoflios, and transaction status
      await PortfolioQueryProcessor.UpdateTokenAmount(buyerUserBaseToken.amount, buyerUser.user_id, baseToken.token_id);
      await PortfolioQueryProcessor.UpdateTokenAmount(buyerUserToken.amount, buyerUser.user_id, transactionRequest.token_id);

      //
      await PortfolioQueryProcessor.UpdateTokenAmount(sellerUserBaseToken.amount, sellerUser.user_id, baseToken.token_id);
      await PortfolioQueryProcessor.UpdateTokenAmount(sellerUserToken.amount, sellerUser.user_id, transactionRequest.token_id);
      await TransactionRequestProcessor.ApproveTransactionRequest(transactionRequest.transaction_request_id);

      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, null);
    } catch (err) {
      console.log(err);
      console.log('Error in token repository, approveRequest.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async TopHolders (req) {
    try {
      const tokenName = req.params.name;
      const token = await TokenQueryProcessor.GetOneByName({ name: tokenName });
      if (!token) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);
      }
      const topHolders = await PortfolioQueryProcessor.TopHolders(token.token_id);
      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, topHolders);
    } catch (err) {
      console.log(err);
      console.log('Error in token repository, topHolders.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async UserTokens (req) {
    try {
      const userID = req.params.user_id;
      const user = await UserQueryProcessor.GetOneByID({ user_id: userID });

      console.log(user);
      if (!user) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);
      }

      if (user.banned) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.USER_BANNED, 403, null);
      }
      const userTokens = await TokenQueryProcessor.UserTokens(userID);
      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, userTokens);
    } catch (err) {
      console.log(err);
      console.log('Error in token repository, userTokens.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async ActiveTokens () {
    try {
      const activeTokens = await TokenQueryProcessor.Active();
      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, activeTokens);
    } catch (err) {
      console.log(err);
      console.log('Error in token repository, activeTokens.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async TokenHolders (req) {
    try {
      const tokenID = req.params.id;
      const token = await TokenQueryProcessor.GetOneByID({ token_id: tokenID });

      if (!token) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);

      const tokenHolders = await PortfolioQueryProcessor.Holders(tokenID);
      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, tokenHolders);
    } catch (err) {
      console.log(err);
      console.log('Error in token repository, TopHolders.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async CreateSellingRequest (req) {
    try {
      const tokenID = req.params.token_id;
      const token = await TokenQueryProcessor.GetOneByID({ token_id: tokenID });

      if (!token) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);

      const user = await UserQueryProcessor.GetOneByID({ user_id: req.user.user_id });

      if (!user) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);

      if (user.banned) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.USER_BANNED, 403, null);

      const sellerUserToken = await PortfolioQueryProcessor.GetOneByID(token.token_id, { user_id: req.user.user_id });

      if (!sellerUserToken) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);

      if (sellerUserToken.amount < req.body.amount) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.INSUFFICIENT_FUNDS, 403, null);

      if (req.body.coef > 1) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.FORBIDDEN_COEFFICIENT_VALUE, 403, null);

      await SellingRequestProcessor.Create(req);
      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, null);
    } catch (err) {
      console.log(err);
      console.log('Error in token repository, TopHolders.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async FetchSellingRequests () {
    try {
      const activeSellingRequests = await SellingRequestProcessor.All();
      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, activeSellingRequests);
    } catch (err) {
      console.log(err);
      console.log('Error in token repository, activeTokens.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async CloseSellingRequest (req) {
    try {
      const sellRequestID = req.params.id;
      const buyerID = req.user.user_id;

      const sellRequest = await SellingRequestProcessor.GetOneByID(sellRequestID);

      if (!sellRequest) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);

      const buyerUser = await UserQueryProcessor.GetOneByID({ user_id: buyerID });
      if (!buyerUser) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);

      const sellerUser = await UserQueryProcessor.GetOneByID({ user_id: sellRequest.seller_id });
      if (!sellerUser) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);

      if (sellerUser.user_id === buyerUser.user_id) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.FORBIDDEN_ACCESS, 403, null);

      // Users banned?
      if (buyerUser.banned) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.BUYER_USER_BANNED, 403, null);

      if (sellerUser.banned) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.SELLER_USER_BANNED, 400, null);

      // Token exists?
      var tradeToken = await TokenQueryProcessor.GetOneByID({ token_id: sellRequest.token_id });
      if (!tradeToken || tradeToken.status !== TokenStatusModel.status.APPROVED) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);

      // Get buyers and seller portfolio
      const buyerUserToken = await PortfolioQueryProcessor.GetPortfolioBaseTokenAmount(buyerUser);
      const sellerUserToken = await PortfolioQueryProcessor.GetOneByID(sellRequest.token_id, sellerUser);

      if (!sellerUserToken || !buyerUserToken) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);
      console.log(parseFloat(sellerUserToken.amount) < parseFloat(sellRequest.amount));
      // Seller has enough amount of desired token?
      if (parseFloat(sellerUserToken.amount) < parseFloat(sellRequest.amount)) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.NOT_ENOUGH_TOKENS, 400, null);
      
      // Check Funds
      var { available, needed } = await TokenRepositoryHelper.CompareTokenValues(buyerUserToken, sellerUserToken, sellRequest.amount);
      available = parseFloat(available);
      needed = parseFloat(needed);
      if (available < needed) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.INSUFFICIENT_FUNDS, 403, null);

      await TransactionRequestProcessor.Create(buyerUser.user_id, sellerUser.user_id, sellRequest.amount, sellRequest.token_id);
      await SellingRequestProcessor.Remove(sellRequest.sell_request_id);

      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, null);
    } catch (err) {
      console.log(err);
      console.log('Error in token repository, activeTokens.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }
}

module.exports = TokenRepository;
