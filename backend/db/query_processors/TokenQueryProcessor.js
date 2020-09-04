var PostgresDB = require('../PostgresDB');

class TokenQueryProcessor{

    static insertIntoTokenQuery = "INSERT INTO token (name, initial_coin_offering, price_per_unit, user_id) VALUES ($1,$2,$3,$4) RETURNING *";
    static selectTokenByNameQuery = "SELECT * FROM token where name = $1 and user_id = $2";
    static selectTokenByIDQuery = "SELECT * FROM token where token_id = $1";
    static updateTokenStatusByNameQuery = "UPDATE token SET status = 2 where name = $1 and user_id = $2 RETURNING *";

    static async Create(token, userID){
        console.log(userID);
        const result = await PostgresDB.client.query(this.insertIntoTokenQuery, [token.name, token.initial_coin_offering, token.price_per_unit, userID]);
        return result.rows[0];
    }

    static async GetOneByNameAndUser(token, userID){
        const result = await PostgresDB.client.query(this.selectTokenByNameQuery, [token.name, userID]);
        if (result && result.rows.length === 0) {
            return false;
        }
        return result.rows[0];
    }

    static async GetOneByID(token){
        console.log(token, "token");
        const result = await PostgresDB.client.query(this.selectTokenByIDQuery, [token.token_id]);
        if (result && result.rows.length === 0) {
            return false;
        }
        return result.rows[0];
    }

    static async ApproveToken(token, userID){
        const result = await PostgresDB.client.query(this.updateTokenStatusByNameQuery, [token.name, userID]);
        return result.rows[0];
    }

}

module.exports = TokenQueryProcessor;