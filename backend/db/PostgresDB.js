var express = require('express');
var router = express.Router();
const pg = require('pg');

class PostgresDB {

    constructor (){
        client = null;
    }
    
    static Connect(){
        this.client = new pg.Client("postgres://postgres:pantelaa23@localhost:5432/token_world");
        this.client.connect();
    }

};

module.exports = PostgresDB;