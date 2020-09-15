var PostgresDB = require('../PostgresDB');

class SellingRequestProcessor{

    static insertIntoTokenQuery = "INSERT INTO sell_request (seller_id, amount, coefficient, token_id) VALUES ($1,$2,$3,$4) RETURNING *";
    static selectAllSellRequestsQuery = "SELECT * FROM sell_request";
    static selectSellRequestByIDQuery = "SELECT * FROM sell_request where sell_request_id = $1"; 
    static deleteSellRequest = "DELETE FROM sell_request where sell_request_id = $1";

    static async Create(sellingRequestModel){
        const result = await PostgresDB.client.query(this.insertIntoTokenQuery,
            [sellingRequestModel.user.user_id, sellingRequestModel.amount, sellingRequestModel.coef, sellingRequestModel.token_id]);
        return result.rows[0];
    }

    static async All(){
        const result = await PostgresDB.client.query(this.selectAllSellRequestsQuery);
        return result.rows;
    }

    static async GetOneByID(sellRequestID){
        const result = await PostgresDB.client.query(this.selectSellRequestByIDQuery, [sellRequestID]);
        return result.rows[0];
    }

    static async Remove(sellRequestID){
        const result = await PostgresDB.client.query(this.deleteSellRequest, [sellRequestID]);
        return result.rows[0];
    }

}

module.exports = SellingRequestProcessor;