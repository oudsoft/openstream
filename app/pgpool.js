//pgpool.js

var pg = require('pg');
var pool;
/*
var config = {
	host: '202.28.68.11',
	user: 'sasurean',
	database: 'windb', 
	password: 'drinking', 
	port: 1486, 
	max: 10, // max number of connection can be open to database
	idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
};
*/
var config = {
	host: 'localhost',
	user: 'Oodsoft',
	database: 'windb', 
	password: '', 
	port: 5432, 
	max: 10, // max number of connection can be open to database
	idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
};
module.exports = {
    getPool: function () {
      if (pool) return pool; // if it is already there, grab it here
      pool = new pg.Pool(config);
      return pool;
	}
}