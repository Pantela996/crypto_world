var PostgresDB = require('../PostgresDB');

class TransactionRequestProcessor{
    static insertIntoTransactionRequestQuery = "INSERT INTO transaction_request (buyer_id, seller_id, amount, token_id) VALUES ($1,$2,$3,$4) RETURNING *";
    static selectTransactionRequestByIDQuery = "SELECT * FROM transaction_request where transaction_request_id = $1";
    static updateTransactionRequestQuery =  "UPDATE transaction_request SET status = 2 where transaction_request_id = $1 RETURNING *";

    static async Create(buyer_id, seller_id, amount, token_id){
        const result = await PostgresDB.client.query(this.insertIntoTransactionRequestQuery, [buyer_id, seller_id, amount, token_id]);
        return result.rows[0];
    }

    static async GetOneById(transaction_request_id){
        const result = await PostgresDB.client.query(this.selectTransactionRequestByIDQuery, [transaction_request_id]);
        if (result && result.rows.length === 0) {
            return false;
        }
        return result.rows[0];
    }

    static async ApproveTransactionRequest(transaction_request_id){
        const result = await PostgresDB.client.query(this.updateTransactionRequestQuery, [transaction_request_id]);
        return result.rows[0];
    }


}

module.exports = TransactionRequestProcessor;