const os = require('os');
const fs = require('fs');
const colors = require('colors/safe');
const https = require('https');
const express = require('express');
const app = express();

const serverPort = 443;

const privateKey = fs.readFileSync(__dirname + '/ssl-cert/server.pem', 'utf8');
const certificate = fs.readFileSync(__dirname + '/ssl-cert/server.crt', 'utf8');
const credentials = { key: privateKey, cert: certificate};

/*
const privateKey = fs.readFileSync(__dirname + '/ssl-cert/key6.pem', 'utf8');
const certificate = fs.readFileSync(__dirname + '/ssl-cert/server6.crt', 'utf8');
const credentials = { key: privateKey, cert: certificate /*, passphrase: '' */ /*};
*/

const corsMiddleware = function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
	/* res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept"); */
	next();
}
app.all("*", corsMiddleware);

/*
app.use(function(req, res, next) {
	if(req.headers['x-forwarded-proto']==='http') {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Request-Method', '*');
		res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
		res.setHeader('Access-Control-Allow-Headers', '*');
		if ( req.method === 'OPTIONS' ) {
			res.writeHead(200);
			res.end();
			return;
		}
		return res.redirect(['https://', req.get('Host'), req.url].join(''));
	}
	next();
});
*/

const httpsServer = https.createServer(credentials, app).listen(serverPort);

const geegee = require('./app/geegee.js');
const {openstreamApp, openstreamObj} = require('./app/openstream.js')(httpsServer);

/*************************************/
//const blog = require('../blog/blogapp.js');
//const win = require('../win/winapp.js');
//const mrqr = require('../src/lineqr.js');
const manual = require('../turnjs4/app/stevejobs.js');
/*************************************/

//console.log('find room name=socket => ' + colors.yellow(openstreamObj.getRoomByName('socket')));

const RootNames =['openstream', 'mystream'];;

app.use('/geegee', geegee);
RootNames.forEach((item)=>{
	app.use('/' + item, openstreamApp);
});

/*************************************/
//app.use('/blog', blog);
//app.use('/win', win);
//app.use('/mrqr', mrqr);
app.use('/manual', manual);
/*************************************/

