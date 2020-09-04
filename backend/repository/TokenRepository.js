const TokenQueryProcessor = require('../db/query_processors/TokenQueryProcessor');
const ResponseBuilder = require('../helpers/ResponseBuilder');
const ResponseCodes = require('../helpers/ResponseCodes');
const UserQueryProcessor = require('../db/query_processors/UserQueryProcessor');
const PortfolioQueryProcessor = require('../db/query_processors/PortfolioQueryProcessor');
const TransactionRequestProcessor = require('../db/query_processors/TransactionRequestProcessor');
const UserRoleModel = require('../models/UserRoleModel');
const TokenStatusModel = require('../models/TokenStatusModel');
const TransactionRequestStatusModel = require('../models/TranscationRequestStatusModel');
const { updateTransactionRequestQuery } = require('../db/query_processors/TransactionRequestProcessor');

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

      if(!userTokenHolder){
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);
      }

      if(userTokenHolder.banned === true){
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.USER_BANNED, 409, null);
      }

      const insertIntoToken = await TokenQueryProcessor.Create(req.body, userID);
      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, null);
    } catch (err) {
      console.log(err);
      console.log('Error in token repository, createToken.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async ApproveToken (req) {
    try {
      // It can be represented as enum in model
      if (req.user.role !== UserRoleModel.role.ADMIN) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.FORBIDDEN_ACCESS, 403, null);
      }

      const tokenFoundByName = await TokenQueryProcessor.GetOneByName(req.body);

      if (!tokenFoundByName) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);
      }

      if (!tokenFoundByName.user_id) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);
      }

      if(tokenFoundByName.status === TokenStatusModel.status.REJECTED){
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.TOKEN_REJECTED, 409, null);
      }

      const userTokenHolder = await UserQueryProcessor.GetOneByID({user_id : tokenFoundByName.user_id});
      if(!userTokenHolder){
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);
      }

      if(userTokenHolder.banned === true){
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.USER_BANNED, 409, null);
      }

      // enum
      if (tokenFoundByName.status === TokenStatusModel.status.APPROVED) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.ALREADY_APPROVED, 409, null);
      }

      const approvedToken = await TokenQueryProcessor.ApproveToken(req.body, tokenFoundByName.user_id);
      const addedTokenToPortfolio = await PortfolioQueryProcessor.Create(approvedToken.token_id, approvedToken.user_id, approvedToken.initial_coin_offering);

      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, null);
    } catch (err) {
      console.log(err);
      console.log('Error in token repository, approveToken.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async RejectToken(req) {
    try {
      if (req.user.role !== UserRoleModel.role.ADMIN) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.FORBIDDEN_ACCESS, 403, null);
      }

      const tokenFoundByName = await TokenQueryProcessor.GetOneByName(req.body);

      console.log(tokenFoundByName);

      if (!tokenFoundByName) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);
      }

      if (!tokenFoundByName.user_id) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);
      }

      if (tokenFoundByName.status === TokenStatusModel.status.REJECTED) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.ALREADY_REJECTED, 409, null);
      }

      const rejectedToken = await TokenQueryProcessor.Reject(tokenFoundByName, tokenFoundByName.user_id);
      console.log(rejectedToken);

      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, null);
    } catch(err) {
      console.log(err);
      console.log('Error in token repository, rejectToken.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async CreatePurchase (req) {
    try {
      const buyerUser = await UserQueryProcessor.GetOneByID(req.user);
      const sellerUser = await UserQueryProcessor.GetOneByID({ user_id: req.params.seller_id });

      var participantsExist = await this.CheckIfTransactionParticipantsExist(buyerUser, sellerUser);
      if (participantsExist === false) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 409, null);
      }

      if(buyerUser.banned === true || sellerUser.banned === true){
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.USER_BANNED, 409, null);
      }

      var tradeToken = await TokenQueryProcessor.GetOneByID({ token_id: req.params.token_id });

      if (!tradeToken || tradeToken.status !== TokenStatusModel.status.APPROVED) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 409, null);
      }

      // Get buyers and seller portfolio, base and trade token.
      const buyerUserPortfolio = await PortfolioQueryProcessor.GetPortfolioBaseTokenAmount(buyerUser);
      const sellerUserPortfolio = await PortfolioQueryProcessor.GetOneByID(req.params.token_id, sellerUser);

      if(!sellerUserPortfolio || !buyerUserPortfolio) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 409, null);
      }

      console.log(buyerUserPortfolio, sellerUserPortfolio);

      // Seller has enough amount of desired token?
      if (sellerUserPortfolio.amount < req.body.amount) {
        console.log('More tokens then available');
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.NOT_ENOUGH_TOKENS, 409, null);
      }

      const { available, needed } = await this.CompareTokenValues(buyerUserPortfolio, sellerUserPortfolio, req.body.amount);
      // When converted, compare values in terms of base token
      if (available < needed) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.INSUFFICIENT_FUNDS, 409, null);
      }

      const insertIntoTransactionRequest = await TransactionRequestProcessor.Create(req.user.user_id, req.params.seller_id, req.body.amount, req.params.token_id);
      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, null);
    } catch (err) {
      console.log(err);
      console.log('Error in token repository, createPurchase.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async ApproveRequest (req) {
    try {
      if (req.user.role !== UserRoleModel.role.ADMIN) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.FORBIDDEN_ACCESS, 403, null);
      }

      const transactionRequest = await TransactionRequestProcessor.GetOneById(req.body.transaction_request_id);

      if (!transactionRequest) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 409, null);
      }

      const buyerUser = await UserQueryProcessor.GetOneByID({ user_id: transactionRequest.buyer_id });
      const sellerUser = await UserQueryProcessor.GetOneByID({ user_id: transactionRequest.seller_id });
      

      // Check if Participants and exist
      var participantsExist = await this.CheckIfTransactionParticipantsExist(buyerUser, sellerUser);
      if (participantsExist === false) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 409, null);
      }

      // Users banned?
      if(buyerUser.banned === true || sellerUser.banned === true){
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.USER_BANNED, 409, null);
      }

      // Token exists?
      var tradeToken = await TokenQueryProcessor.GetOneByID({ token_id: transactionRequest.token_id });
      if (!tradeToken || tradeToken.status !== TokenStatusModel.status.APPROVED) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 409, null);
      }

      // Seller has desired token?
      const sellerUserTokenPortfolio = await PortfolioQueryProcessor.GetOneByID(transactionRequest.token_id, sellerUser);
      var buyerUserTokenPortfolio = await PortfolioQueryProcessor.GetOneByID(transactionRequest.token_id, buyerUser);
      const sellerUserBasePortfolio = await PortfolioQueryProcessor.GetPortfolioBaseTokenAmount(sellerUser);
      const buyerUserBasePortfolio = await PortfolioQueryProcessor.GetPortfolioBaseTokenAmount(buyerUser);

      if (!sellerUserTokenPortfolio) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 409, null);
      }

      // Seller has enough amount of desired token?
      if (sellerUserTokenPortfolio.amount < transactionRequest.amount) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 409, null);
      }

      // Check Funds
      var { available, needed } = await this.CompareTokenValues(buyerUserBasePortfolio, sellerUserTokenPortfolio, transactionRequest.amount);
      available = parseFloat(available);
      needed = parseFloat(needed);
      if (available < needed) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.INSUFFICIENT_FUNDS, 409, null);
      }

      // Is it already approved?
      if (transactionRequest.status === TransactionRequestStatusModel.status.APPROVED) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.ALREADY_APPROVED, 409, null);
      }

      // Do transfer logic
      buyerUserBasePortfolio.amount = parseFloat(buyerUserBasePortfolio.amount) - needed;
      sellerUserBasePortfolio.amount = parseFloat(sellerUserBasePortfolio.amount) + needed;

      // Create buyers portfolio for token
      if (buyerUserTokenPortfolio === undefined) {
        buyerUserTokenPortfolio = await PortfolioQueryProcessor.Create(transactionRequest.token_id, buyerUser.user_id, parseFloat(transactionRequest.amount));
      } else {
        buyerUserTokenPortfolio.amount = parseFloat(buyerUserTokenPortfolio.amount) + parseFloat(transactionRequest.amount);
      }

      sellerUserTokenPortfolio.amount = parseFloat(sellerUserTokenPortfolio.amount) - transactionRequest.amount;

      console.log(buyerUserBasePortfolio, sellerUserBasePortfolio, buyerUserTokenPortfolio, sellerUserTokenPortfolio);

      // Update buyer, seller portoflios, and transaction status
      const updatedBuyerBase = await PortfolioQueryProcessor.UpdateTokenAmount(buyerUserBasePortfolio.amount, buyerUser.user_id, '9');
      const updatedBuyerToken = await PortfolioQueryProcessor.UpdateTokenAmount(buyerUserTokenPortfolio.amount, buyerUser.user_id, transactionRequest.token_id);

      //
      const updatedSellerBase = await PortfolioQueryProcessor.UpdateTokenAmount(sellerUserBasePortfolio.amount, sellerUser.user_id, '9');
      const updatedSellerToken = await PortfolioQueryProcessor.UpdateTokenAmount(sellerUserTokenPortfolio.amount, sellerUser.user_id, transactionRequest.token_id);
      console.log(updatedBuyerBase, updatedSellerBase, updatedBuyerToken, updatedSellerToken);

      const updatedTransactionRequest = await TransactionRequestProcessor.ApproveTransactionRequest(transactionRequest.transaction_request_id);
      console.log(updatedTransactionRequest);

      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, null);
    } catch (err) {
      console.log(err);
      console.log('Error in token repository, approveRequest.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async CompareTokenValues (buyerUserPortfolio, sellerUserPortfolio, amount) {
    // Conver sellers token to base token value
    const sellerUserToken = await TokenQueryProcessor.GetOneByID({ token_id: sellerUserPortfolio.token_id });
    const tradeTokenAmountConvertedToBase = parseFloat(sellerUserToken.price_per_unit) * parseFloat(amount);

    return { available: buyerUserPortfolio.amount, needed: tradeTokenAmountConvertedToBase };
  }

  static async CheckIfTransactionParticipantsExist (sellerUser, buyerUser) {
    if (!sellerUser || !buyerUser) {
      return false;
    }
    return true;
  }
}

module.exports = TokenRepository;
