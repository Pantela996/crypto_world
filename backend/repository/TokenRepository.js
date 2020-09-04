const TokenQueryProcessor = require('../db/query_processors/TokenQueryProcessor');
const ResponseBuilder = require('../helpers/ResponseBuilder');
const ResponseCodes = require('../helpers/ResponseCodes');
const UserQueryProcessor = require('../db/query_processors/UserQueryProcessor');
const PortfolioQueryProcessor = require('../db/query_processors/PortfolioQueryProcessor');
const TransactionRequestProcessor = require('../db/query_processors/TransactionRequestProcessor');

class TokenRepository {
  static async CreateToken (req) {
    try {
      const userID = req.user.user_id;
      const tokenFoundByNameAndUser = await TokenQueryProcessor.GetOneByNameAndUser(req.body, userID);
      // 409 is conflict error
      if (tokenFoundByNameAndUser) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.NAME_ALREADY_EXISTS, 409, null);
      }
      const insertIntoToken = await TokenQueryProcessor.Create(req.body, userID);
      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, 'Success');
    } catch (err) {
      console.log(err);
      console.log('Error in token repository, createToken.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async ApproveToken (req) {
    try {
      // It can be represented as enum in model
      if (req.user.role !== 1) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.FORBIDDEN_ACCESS, 403, null);
      }

      const tokenFoundByNameAndUser = await TokenQueryProcessor.GetOneByNameAndUser(req.body, req.body.user_id);

      if (!tokenFoundByNameAndUser) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);
      }

      if (tokenFoundByNameAndUser.status === 2) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.ALREADY_APPROVED, 409, null);
      }

      const approvedToken = await TokenQueryProcessor.ApproveToken(req.body, req.body.user_id);
      const addedTokenToPortfolio = await PortfolioQueryProcessor.Create(approvedToken.token_id, approvedToken.user_id, approvedToken.initial_coin_offering);

      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, 'Success');
    } catch (err) {
      console.log(err);
      console.log('Error in token repository, approveToken.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }

  static async CreatePurchase (req) {
    try {
      const buyerUser = await UserQueryProcessor.GetOneByID(req.user);
      const sellerUser = await UserQueryProcessor.GetOneByID({ user_id: req.body.seller_id });

      if (!sellerUser || !buyerUser) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.RESOURCE_DONT_EXIST, 404, null);
      }

      // Get buyers and seller portfolio, base and trade token.
      const buyerUserPortfolio = await PortfolioQueryProcessor.GetPortfolioBaseTokenAmount(buyerUser);
      const sellerUserPortfolio = await PortfolioQueryProcessor.GetOneByID(req.body.token_id, sellerUser);

      // Conver sellers token to base token value
      const sellerUserToken = await TokenQueryProcessor.GetOneByID({ token_id: sellerUserPortfolio.token_id });
      const tradeTokenAmountConvertedToBase = sellerUserToken.price_per_unit * req.body.amount;

      // When converted, compare values in terms of base token
      if (buyerUserPortfolio.amount < tradeTokenAmountConvertedToBase) {
        return ResponseBuilder.BuildResponse(0, '', ResponseCodes.token.INSUFFICIENT_FUNDS, 409, null);
      }

      const insertIntoTransactionRequest = await TransactionRequestProcessor.Create(req.user.user_id, req.body.seller_id, req.body.amount, req.body.token_id);
      return ResponseBuilder.BuildResponse(1, '', ResponseCodes.auth.SUCCESS, 200, 'Success');
    } catch (err) {
      console.log(err);
      console.log('Error in token repository, createPurchase.');
      return ResponseBuilder.BuildResponse(0, '', ResponseCodes.auth.INTERNAL_SERVER_ERROR, 500, null);
    }
  }
}

module.exports = TokenRepository;
