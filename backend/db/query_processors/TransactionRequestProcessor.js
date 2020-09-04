var PostgresDB = require('../PostgresDB');

class TransactionRequestProcessor{
    static insertIntoTransactionRequestQuery = "INSERT INTO transaction_request (buyer_id, seller_id, amount, token_id) VALUES ($1,$2,$3,$4) RETURNING *";

    static async Create(buyer_id, seller_id, amount, token_id){
        const result = await PostgresDB.client.query(this.insertIntoTransactionRequestQuery, [buyer_id, seller_id, amount, token_id]);
        return result.rows[0];
    }


}

module.exports = TransactionRequestProcessor;