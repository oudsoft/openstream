//dbpool.js
require('dotenv').config();
var pg = require('pg');
var pool;

var config = {
		user: process.env.PGUSER,
		host: process.env.PGHOST,
		database: process.env.PGDATABASE,
		password: process.env.PGPASSWORD,
		port: process.env.PGPORT,
};

module.exports = {
    getPool: function () {
		if (pool) return pool; // if it is already there, grab it here
		pool = new pg.Pool(config);
		return pool;
	}
}