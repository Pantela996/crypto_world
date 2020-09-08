const pg = require('pg');

class PostgresDB {
  static Connect () {
    this.client = new pg.Client('postgres://postgres:pantelaa23@localhost:5432/token_world');
    this.client.connect();
  }
};

module.exports = PostgresDB;
