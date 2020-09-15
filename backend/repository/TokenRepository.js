const TokenQueryProcessor = require('../db/query_processors/TokenQueryProcessor');
const ResponseBuilder = require('../helpers/ResponseBuilder');
const ResponseCodes = require('../helpers/ResponseCodes');
const UserQueryProcessor = require('../db/query_processors/UserQueryProcessor');
const PortfolioQueryProcessor = require('../db/query_processors/PortfolioQueryProcessor');
const SellingRequestProcessor = require('../db/query_processors/SellingRequestQueryProcessor');
const TransactionRequestProcessor = require('../db/query_processors/TransactionRequestQueryProcessor');
const TokenStatusModel = require('../models/TokenStatusModel');
const TransactionRequestStatusModel = require('../models/TranscationRequestStatusModel');
const TokenRepositoryHelper = require('../helpers/TokenRepositoryHelper');
const GLOBALS = require('../globals/Globals');

class TokenRepository {
  static async CreateToken (issueRequestModel) {
    try {
      const userID = issueRequestModel.user_id;
      const tokenFoundByName = await TokenQueryProcessor.GetOneByName({name : issueRequestModel.name});
      const userTokenHolder = await UserQueryProcessor.GetOneByID({user_id : issueRequestModel.user_id});

      // 409 is conflict error
      if (tokenFoundByName) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.TOKEN_NAME_ALREADY_EXISTS, 409, null);
      }

      if (!userTokenHolder) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.USER_DONT_EXIST, 404, null);
      }

      if (userTokenHolder.banned) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.USER_BANNED, 403, null);
      }

      const baseToken = await TokenQueryProcessor.GetOneByName({ name: GLOBALS.BASE_TOKEN_NAME });
      if (!baseToken) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.TOKEN_DOESNT_EXIST, 404, null);
      }

      const userBaseToken = await PortfolioQueryProcessor.GetOneByID(baseToken.token_id, { user_id: userID });

      if (!userBaseToken) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.TOKEN_DOESNT_EXIST, 404, null);
      }

      if (userBaseToken.amount < GLOBALS.INITIAL_FEE) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.INSUFFICIENT_FUNDS, 404, null);
      }

      userBaseToken.amount = parseFloat(userBaseToken.amount) - GLOBALS.INITIAL_FEE;

      await PortfolioQueryProcessor.UpdateTokenAmount(userBaseToken.amount, userID, baseToken.token_id);
      await TokenQueryProcessor.Create(issueRequestModel, userID);
      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, null);
    } catch (err) {
      console.log(err);
      console.log('Error in token repository, createToken.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async ApproveToken (approveIssueRequest) {
    try {
   
      const tokenFoundByName = await TokenQueryProcessor.GetOneByName({ name: approveIssueRequest.name });

      if (!tokenFoundByName) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.TOKEN_DOESNT_EXIST, 404, null);
      }

      if (tokenFoundByName.status === TokenStatusModel.status.REJECTED) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.TOKEN_REJECTED, 403, null);
      }

      const userTokenHolder = await UserQueryProcessor.GetOneByID({ user_id: tokenFoundByName.user_id });
      if (!userTokenHolder) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.USER_DONT_EXIST, 404, null);
      }

      if (userTokenHolder.banned) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.USER_BANNED, 403, null);
      }

      // enum
      if (tokenFoundByName.status === TokenStatusModel.status.APPROVED) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.ALREADY_APPROVED, 400, null);
      }

      const approvedToken = await TokenQueryProcessor.ApproveToken({ name: approveIssueRequest.name }, tokenFoundByName.user_id);
      await PortfolioQueryProcessor.Create(approvedToken.token_id, approvedToken.user_id, approvedToken.initial_coin_offering);

      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, null);
    } catch (err) {
      console.log(err);
      console.log('Error in token repository, approveToken.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async RejectToken (rejectIssueRequest) {
    try {
      const tokenFoundByName = await TokenQueryProcessor.GetOneByName({ name: rejectIssueRequest.name });

      if (!tokenFoundByName) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.TOKEN_DOESNT_EXIST, 404, null);
      }

      if (tokenFoundByName.status === TokenStatusModel.status.REJECTED) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.ALREADY_REJECTED, 400, null);
      }

      const baseToken = await TokenQueryProcessor.GetOneByName({ name: GLOBALS.BASE_TOKEN_NAME });
      if (!baseToken) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.TOKEN_DOESNT_EXIST, 404, null);
      }

      const userBaseToken = await PortfolioQueryProcessor.GetOneByID(baseToken.token_id, { user_id: tokenFoundByName.user_id });
      if (!userBaseToken) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.USER_DONT_EXIST, 404, null);
      }
      userBaseToken.amount = parseFloat(userBaseToken.amount) + GLOBALS.INITIAL_FEE;
      await PortfolioQueryProcessor.UpdateTokenAmount(userBaseToken.amount, tokenFoundByName.user_id, baseToken.token_id);
      await TokenQueryProcessor.Reject(tokenFoundByName, tokenFoundByName.user_id);

      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, null);
    } catch (err) {
      console.log(err);
      console.log('Error in token repository, rejectToken.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async CreatePurchase (purchaseRequestModel) {
    try {
      const buyerUser = await UserQueryProcessor.GetOneByID(purchaseRequestModel.user);
      const sellerUser = await UserQueryProcessor.GetOneByID({ user_id: purchaseRequestModel.seller_id });

      var participantsExist = await TokenRepositoryHelper.CheckIfTransactionParticipantsExist(buyerUser, sellerUser);
      if (participantsExist === false) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.USER_DONT_EXIST, 400, null);
      }

      // Users banned?
      if (buyerUser.banned) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.BUYER_USER_BANNED, 403, null);
      }

      if (sellerUser.banned) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.SELLER_USER_BANNED, 400, null);
      }

      var tradeToken = await TokenQueryProcessor.GetOneByID({ token_id: purchaseRequestModel.token_id });


      if (!tradeToken || tradeToken.status !== TokenStatusModel.status.APPROVED) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.TOKEN_DOESNT_EXIST, 404, null);
      }
      const baseToken = await TokenQueryProcessor.GetOneByName({ name: GLOBALS.BASE_TOKEN_NAME });
      if (!baseToken) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.TOKEN_DOESNT_EXIST, 404, null);
      }

      // Get buyers and seller portfolio, base and trade token.
      const buyerUserPortfolio = await PortfolioQueryProcessor.GetOneByID(baseToken.token_id, buyerUser);
      const sellerUserPortfolio = await PortfolioQueryProcessor.GetOneByID(purchaseRequestModel.token_id, sellerUser);

      if (!sellerUserPortfolio || !buyerUserPortfolio) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.PORTFOLIO_DOESNT_EXIST, 404, null);
      }

      // Seller has enough amount of desired token?
      if (sellerUserPortfolio.amount < purchaseRequestModel.amount) {
        console.log('More tokens then available');
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.NOT_ENOUGH_TOKENS, 400, null);
      }

      const { available, needed } = await TokenRepositoryHelper.CompareTokenValues(buyerUserPortfolio, sellerUserPortfolio, purchaseRequestModel.amount);
      // When converted, compare values in terms of base token
      if (available < needed) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.INSUFFICIENT_FUNDS, 400, null);
      }

      await TransactionRequestProcessor.Create(purchaseRequestModel.user.user_id, purchaseRequestModel.seller_id, purchaseRequestModel.amount, purchaseRequestModel.token_id);
      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, null);
    } catch (err) {
      console.log(err);
      console.log('Error in token repository, createPurchase.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async ApproveRequest (approvePurchaseRequestModel) {
    try {
      const transactionRequest = await TransactionRequestProcessor.GetOneById(approvePurchaseRequestModel.id);

      if (!transactionRequest) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.TRANSACTION_DOESNT_EXIST, 404, null);
      }

      const buyerUser = await UserQueryProcessor.GetOneByID({ user_id: transactionRequest.buyer_id });
      const sellerUser = await UserQueryProcessor.GetOneByID({ user_id: transactionRequest.seller_id });

      // Check if Participants and exist
      var participantsExist = await TokenRepositoryHelper.CheckIfTransactionParticipantsExist(buyerUser, sellerUser);
      if (participantsExist === false) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.USER_DONT_EXIST, 404, null);
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
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.TOKEN_DOESNT_EXIST, 404, null);
      }

      const baseToken = await TokenQueryProcessor.GetOneByName({ name: GLOBALS.BASE_TOKEN_NAME });
      if (!baseToken) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.TOKEN_DOESNT_EXIST, 404, null);
      }

      // Seller has desired token?
      const sellerUserToken = await PortfolioQueryProcessor.GetOneByID(transactionRequest.token_id, sellerUser);

      if (!sellerUserToken) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.TOKEN_DOESNT_EXIST, 404, null);
      }

      var buyerUserToken = await PortfolioQueryProcessor.GetOneByID(transactionRequest.token_id, buyerUser);

      if (!buyerUserToken) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.TOKEN_DOESNT_EXIST, 404, null);
      }
  
      // Seller has enough amount of desired token?
      if (sellerUserToken.amount < transactionRequest.amount) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.NOT_ENOUGH_TOKENS, 403, null);
      }

      const sellerUserBaseToken = await PortfolioQueryProcessor.GetOneByID(baseToken.token_id, sellerUser);
      const buyerUserBaseToken = await PortfolioQueryProcessor.GetOneByID(baseToken.token_id, buyerUser);

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

  static async TopHolders (topTokenHoldersModel) {
    try {
      const tokenName = topTokenHoldersModel.name;
      const token = await TokenQueryProcessor.GetOneByName({ name: tokenName });
      if (!token) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.TOKEN_DOESNT_EXIST, 404, null);
      }
      const topHolders = await PortfolioQueryProcessor.TopHolders(token.token_id);
      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, topHolders);
    } catch (err) {
      console.log(err);
      console.log('Error in token repository, topHolders.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async UserTokens (topTokenHoldersModel) {
    try {
      const userID = topTokenHoldersModel.user_id;
      const user = await UserQueryProcessor.GetOneByID({ user_id: userID });

      if (!user) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.USER_DONT_EXIST, 404, null);
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

  static async TokenHolders (tokenHoldersModel) {
    try {
      const tokenID = tokenHoldersModel.id;
      const token = await TokenQueryProcessor.GetOneByID({ token_id: tokenID });

      if (!token) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.TOKEN_DOESNT_EXIST, 404, null);

      const tokenHolders = await PortfolioQueryProcessor.Holders(tokenID);
      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, tokenHolders);
    } catch (err) {
      console.log(err);
      console.log('Error in token repository, TopHolders.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async CreateSellingRequest (sellingRequestModel) {
    try {
      const tokenID = sellingRequestModel.token_id;
      const token = await TokenQueryProcessor.GetOneByID({ token_id: tokenID });

      if (!token) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.TOKEN_DOESNT_EXIST, 404, null);

      const user = await UserQueryProcessor.GetOneByID({ user_id: sellingRequestModel.user.user_id });

      if (!user) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.USER_DONT_EXIST, 404, null);

      if (user.banned) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.USER_BANNED, 403, null);

      const sellerUserToken = await PortfolioQueryProcessor.GetOneByID(token.token_id, { user_id: sellingRequestModel.user.user_id });

      if (!sellerUserToken) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.TOKEN_DOESNT_EXIST, 404, null);

      if (sellerUserToken.amount < sellingRequestModel.amount) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.INSUFFICIENT_FUNDS, 403, null);

      if (sellingRequestModel.coef > 1) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.FORBIDDEN_COEFFICIENT_VALUE, 403, null);

      await SellingRequestProcessor.Create(sellingRequestModel);
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

  static async CloseSellingRequest (closeSellingRequestModel) {
    try {
      const sellRequestID = closeSellingRequestModel.id;
      const buyerID = closeSellingRequestModel.user.user_id;
      
      const sellRequest = await SellingRequestProcessor.GetOneByID(sellRequestID);

      if (!sellRequest) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.SELL_REQUEST_DOESNT_EXIST, 404, null);

      const buyerUser = await UserQueryProcessor.GetOneByID({ user_id: buyerID });
      if (!buyerUser) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.USER_DONT_EXIST, 404, null);

      const sellerUser = await UserQueryProcessor.GetOneByID({ user_id: sellRequest.seller_id });
      if (!sellerUser) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.USER_DONT_EXIST, 404, null);


      if (sellerUser.user_id === buyerUser.user_id) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.FORBIDDEN_ACCESS, 403, null);

      // Users banned?
      if (buyerUser.banned) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.BUYER_USER_BANNED, 403, null);

      if (sellerUser.banned) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.SELLER_USER_BANNED, 400, null);

      // Token exists?
      var tradeToken = await TokenQueryProcessor.GetOneByID({ token_id: sellRequest.token_id });
      if (!tradeToken || tradeToken.status !== TokenStatusModel.status.APPROVED) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.TOKEN_DOESNT_EXIST, 404, null);

      const baseToken = await TokenQueryProcessor.GetOneByName({ name: GLOBALS.BASE_TOKEN_NAME });
      if (!baseToken) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.TOKEN_DOESNT_EXIST, 404, null);
      }
      // Get buyers and seller portfolio
      const buyerUserToken = await PortfolioQueryProcessor.GetOneByID(baseToken.token_id, buyerUser);
      const sellerUserToken = await PortfolioQueryProcessor.GetOneByID(sellRequest.token_id, sellerUser);

      if (!sellerUserToken || !buyerUserToken) return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.PORTFOLIO_DOESNT_EXIST, 404, null);
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
