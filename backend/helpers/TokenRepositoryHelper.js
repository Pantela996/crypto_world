const TokenQueryProcessor = require('../db/query_processors/TokenQueryProcessor');

class TokenRepositoryHelper {
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

module.exports = TokenRepositoryHelper;
