//routes.js
var util = require('util');
var express = require('express');
var app = express();
var passport = require("passport");

var fs = require('fs');
var request = require('request');
const { Pool, Client } = require('pg')
//const bcrypt= require('bcrypt-nodejs')
//const uuidv4 = require('uuid/v4');
//TODO
//Add forgot password functionality
//Add email confirmation functionality
//Add edit account page


app.use(express.static('public'));

const LocalStrategy = require('passport-local').Strategy;
//const connectionString = process.env.DATABASE_URL;

var currentAccountsData = [];

const pool = new Pool({
	user: process.env.PGUSER,
	host: process.env.PGHOST,
	database: process.env.PGDATABASE,
	password: process.env.PGPASSWORD,
	port: process.env.PGPORT/*,
	ssl: true */
});

module.exports = function (app) {
	//ใช้ในการ decode jwt ออกมา
	const ExtractJwt = require("passport-jwt").ExtractJwt;
	//ใช้ในการประกาศ Strategy
	const JwtStrategy = require("passport-jwt").Strategy;
	const jwtOptions = {
	   jwtFromRequest: ExtractJwt.fromHeader("authorization"),
	   secretOrKey: SECRET,//SECRETเดียวกับตอนencodeในกรณีนี้คือ MY_SECRET_KEY
	}
	const jwtAuth = new JwtStrategy(jwtOptions, (payload, done) => {
	   if(payload.sub === "openstream") done(null, true);
	   else done(null, false);
	});

	passport.use(jwtAuth);

	const requireJWTAuth = passport.authenticate("jwt",{session:false});
	
	app.get('/control', requireJWTAuth, function (req, res, next) {
		console.log(req.isAuthenticated());
		const hostname = req.headers.host;
		const rootname = req.originalUrl.split('/')[1];
		if(req.isAuthenticated()){
			const url = 'https://' + hostname + '/' + rootname +'/control.html';
			res.writeHead(301, {Location: url});
			res.end();
		}
		else{
			res.redirect('/' + rootname + '/login');
		}
	});
	
	app.get('/login', function (req, res, next) {
		const hostname = req.headers.host;
		const rootname = req.originalUrl.split('/')[1];
		if (req.isAuthenticated()) {
			const url = '/' + rootname +'/control.html';
			res.redirect(url);
		}
		else{
			const url = 'https://' + hostname + '/' + rootname + '/login.html';
			res.writeHead(301, {Location: url});
			res.end();
		}
	});
	
	app.get('/logout', function(req, res){
		console.log(req.isAuthenticated());
		req.logout();
		console.log(req.isAuthenticated());
		const hostname = req.headers.host;
		const rootname = req.originalUrl.split('/')[1];
		const url = 'https://' + hostname + '/' + rootname + '/login.html';
		res.writeHead(301, {Location: url});
		res.end();
	});
	/*
	app.post('/login',	passport.authenticate('local'/*, {
			successRedirect: '/openstream/control',
			failureRedirect: '/openstream/login'
		}*/ /*), function(req, res) {
			/*
		if (req.body.remember) {
			req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
		} else {
			req.session.cookie.expires = false; // Cookie expires at end of session
		}
		*/ /*
		const rootname = req.originalUrl.split('/')[1];
		res.redirect('/' + rootname + '/control');
	});*/
	app.post("/login", loginMiddleware, (req, res) => {
		//res.send("Login success");
		const jwt = require("jwt-simple");
		const payload = {
			sub: req.body.username,
			iat: new Date().getTime()//มาจากคำว่า issued at time (สร้างเมื่อ)
		};
		//res.send(jwt.encode(payload, SECRET));
		res.setHeader('jwt', jwt.encode(payload, SECRET))
		const hostname = req.headers.host;
		const rootname = req.originalUrl.split('/')[1];
		//const url = 'https://' + hostname + '/' + rootname + '/control.html';
		//res.writeHead(301, {Location: url});
		//res.end();
		res.redirect('/' + rootname + '/control');
	});	
}
const SECRET = "MY_SECRET_KEY"; //ในการใช้งานจริง คีย์นี้ให้เก็บเป็นความลับ
const loginMiddleware = (req, res, next) => {
	console.log(req.body.username);
	console.log(req.body.password);
	if(req.body.username === "openstream" && 
		req.body.password === "open@stream") next();
	else res.send("Wrong username and password") 
	//ถ้า username password ไม่ตรงให้ส่งว่า Wrong username and password
}


/*
passport.use('local', new  LocalStrategy({passReqToCallback : true}, (req, username, password, done) => {
	
	loginAttempt();
	async function loginAttempt() {
		
		const client = await pool.connect()
		try{
			await client.query('BEGIN')
			var currentAccountsData = await JSON.stringify(client.query('SELECT userid, "username", "password" FROM "users" WHERE "username"=$1', [username], function(err, result) {
				
				if(err) {
					return done(err)
				}	
				if(result.rows[0] == null){
					//req.flash('danger', "Oops. Incorrect login details.");
					return done(null, false);
				}
				else{
					/*
					bcrypt.compare(password, result.rows[0].password, function(err, check) {
						if (err){
							console.log('Error while checking password');
							return done();
						}
						else if (check){
							return done(null, [{userid: result.rows[0].userid, username: result.rows[0].userame}]);
						}
						else{
							//req.flash('danger', "Oops. Incorrect login details.");
							return done(null, false);
						}
					});
					*/ /*
					console.log(password, result.rows[0].password);
					if (password === result.rows[0].password){
						return done(null, [{userid: result.rows[0].userid, username: result.rows[0].userame}]);
						//return done(null, true);
					} else {
						return done(null, false);
					}
				}
			}))
		}
		
		catch(e){throw (e);}
	};
	
}));


passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(user, done) {
	done(null, user);
});		

*/