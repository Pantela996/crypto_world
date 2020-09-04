var PostgresDB = require('../PostgresDB');

class TokenQueryProcessor{

    static insertIntoTokenQuery = "INSERT INTO token (name, initial_coin_offering, price_per_unit, user_id) VALUES ($1,$2,$3,$4) RETURNING *";
    static selectTokenByNameQuery = "SELECT * FROM token where name = $1";
    static selectTokenByIDQuery = "SELECT * FROM token where token_id = $1";
    static updateTokenStatusByNameQuery = "UPDATE token SET status = $1 where name = $2 and user_id = $3 RETURNING *";

    static async Create(token, userID){
        console.log(userID);
        const result = await PostgresDB.client.query(this.insertIntoTokenQuery, [token.name, token.initial_coin_offering, token.price_per_unit, userID]);
        return result.rows[0];
    }

    static async GetOneByName(token){
        const result = await PostgresDB.client.query(this.selectTokenByNameQuery, [token.name]);
        if (result && result.rows.length === 0) {
            return false;
        }
        return result.rows[0];
    }

    static async GetOneByID(token){
        const result = await PostgresDB.client.query(this.selectTokenByIDQuery, [token.token_id]);
        if (result && result.rows.length === 0) {
            return false;
        }
        return result.rows[0];
    }

    static async ApproveToken(token, userID){
        const result = await PostgresDB.client.query(this.updateTokenStatusByNameQuery, [2, token.name, userID]);
        return result.rows[0];
    }

    static async Reject(token, userID){
        const result = await PostgresDB.client.query(this.updateTokenStatusByNameQuery, [1, token.name, userID]);
        return result.rows[0];
    }

}

module.exports = TokenQueryProcessor;