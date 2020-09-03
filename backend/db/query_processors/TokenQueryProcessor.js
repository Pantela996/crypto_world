var PostgresDB = require('../PostgresDB');

class TokenQueryProcessor{

    static createTokenQuery = "INSERT INTO token (name, initial_coin_offering, creation_date, price_per_unit, status) VALUES ($1,$2,$3,$4,$5) RETURNING *";

    static async Create(token){
        const result = PostgresDB.query(this.createTokenQuery);
        return result;
    }

}

module.exports = TokenQueryProcessor;