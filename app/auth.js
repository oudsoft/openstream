//auth.js
require('dotenv').config();
const util = require('util');
const express = require('express');
const flash = require('connect-flash');
const fs = require('fs');
const path = require('path');
const request = require('request');
const session = require("express-session");
const { Pool, Client } = require('pg');

const pool = new Pool({
	user: process.env.PGUSER,
	host: process.env.PGHOST,
	database: process.env.PGDATABASE,
	password: process.env.PGPASSWORD,
	port: process.env.PGPORT,
});

function doVerifyUser(username, password){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select userid, username from users where (username=$1) and (password=md5($2))";
			client.query(sqlCmd, [username, password]).then(res => {
				if (res.rowCount > 0){
					client.query('COMMIT');
					resolve(res.rows);
				} else {
					resolve({}); //<-- //should modify resolve etc. null/undefined for blank user
				}
			}).catch(err => {
				client.query('ROLLBACK');
				reject(err.stack)
			});
			client.release();
		});
	});
}

function doVerifyAgency(userid){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select id, status from agency where (userid=$1)";
			client.query(sqlCmd, [userid]).then(res => {
				if (res.rowCount > 0){
					client.query('COMMIT');
					resolve(res.rows);
				} else {
					resolve({});
				}
			}).catch(err => {
				client.query('ROLLBACK');
				reject(err.stack)
			});
			client.release();
		});
	});
}

function doGetAgencyDataFromRootName(rootname){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select promptpayno, promptpayname from agency where (agencyname=$1) and (status='active')";
			client.query(sqlCmd, [rootname]).then(res => {
				if (res.rowCount > 0){
					client.query('COMMIT');
					resolve(res.rows);
				} else {
					resolve({});
				}
			}).catch(err => {
				client.query('ROLLBACK');
				reject(err.stack)
			});
			client.release();
		});
	});
}

module.exports = function (app) {
	const bodyParser = require('body-parser');
	const cookieParser = require('cookie-parser');

	app.use(bodyParser.urlencoded({ extended: true }));

	app.use(cookieParser());

	app.use(session({
	    key: 'userid',
	    secret: 'openstream',
	    resave: false,
	    saveUninitialized: false,
	    cookie: {
			expires: 600000
	    }
	}));

	//app.use('/static', express.static(__dirname + '/../../public'));

	app.use((req, res, next) => {
	    if (req.cookies.userid && !req.session.user) {
			res.clearCookie('user_sid');        
	    }
	    next();
	});


	const sessionChecker = (req, res, next) => {
	    if (req.session.user && req.cookies.userid) {
			const rootname = req.originalUrl.split('/')[1];
			res.redirect('/' + rootname + '/dashboard');
	    } else {
			next();
	    }    
	};

	app.get('/control', (req, res) => {
		const hostname = req.headers.host;
		const rootname = req.originalUrl.split('/')[1];	
		if (req.session.user && req.cookies.userid) {
			const url = 'https://' + hostname + '/' + rootname + '/control.html';
			res.writeHead(301, {Location: url});
			res.end();
		} else {	
	    	res.redirect('/' + rootname + '/login.html?t=a');
		}
	});

	app.get('/signup', (req, res) => {
		//res.sendFile(__dirname + '/../../public/signup.html');
		const rootname = req.originalUrl.split('/')[1];		
	    res.redirect('/' + rootname + '/signup.html');
	});

	app.post('/signup', (req, res) => {
		const rootname = req.originalUrl.split('/')[1];
		User.create({
		    username: req.body.username,
		    email: req.body.email,
		    password: req.body.password
		})
		.then(user => {
		    req.session.user = user.dataValues;
		    res.redirect('/' + rootname + '/dashboard');
		})
		.catch(error => {
		    res.redirect('/' + rootname + '/signup');
		});
	});


	app.get('/login', (req, res) => {
		//res.sendFile(__dirname + '/../../public/login.html');
		const rootname = req.originalUrl.split('/')[1];		
	    res.redirect('/' + rootname + '/login.html');
	});
	app.post('/login', (req, res) => {
		const hostname = req.headers.host;
		const rootname = req.originalUrl.split('/')[1];
		let username = req.body.username;
		let password = req.body.password;
		let loginType = req.body.type;
		console.log(username, password, loginType);
		doVerifyUser(username, password).then((user) => {
			console.log(user);
			if (user.length === 0) {
				res.redirect('/' + rootname + '/login.html?t=' + loginType + '&er=1');
			} else {
				if (user[0].userid){
					doVerifyAgency(user[0].userid).then((agency) => {
						console.log(agency);
						let url = '';
						if (agency[0].status === 'active') {
							let youruser = {userid: user[0].userid, username: user[0].username, agencyid: agency[0].id};
							req.session.user = youruser;
							res.clearCookie('openstream');
							res.cookie('openstream', youruser);
							url = '/' + rootname + '/control.html';
							res.status(200).send({url: url, status: {code: 200}});
						} else {
							url = '/' + rootname + '/login.html?t=' + loginType + '&er=3';
							res.status(200).send({url: url, status: {code: 210}});
						}
					});
				} else {
					url = '/' + rootname + '/login.html?t=' + loginType + '&er=2';
					res.status(200).send({url: url, status: {code: 211}});
				}
			}
		});
	});


	app.get('/dashboard', (req, res) => {
		const hostname = req.headers.host;
		const rootname = req.originalUrl.split('/')[1];
	    if (req.session.user && req.cookies.userid) {
			const url = 'https://' + hostname + '/' + rootname + '/control.html';
			res.writeHead(301, {Location: url});
			res.end();
	    } else {
			res.redirect('/' + rootname + '/login');
	    }
	});


	app.get('/logout', (req, res) => {
		const rootname = req.originalUrl.split('/')[1];
	    if (req.session.user && req.cookies.userid) {
			res.clearCookie('openstream');
			res.redirect('/' + rootname + '/');
	    } else {
			res.redirect('/' + rootname + '/login');
	    }
	});

	app.post('/getagencydata', (req, res) => {
		const rootname = req.originalUrl.split('/')[1];
		doGetAgencyDataFromRootName(rootname).then((agency) => {
			res.status(200).send(agency);
		});
	});
}
