const os = require('os');
const fs = require('fs');
const colors = require('colors/safe');
const https = require('https');
const express = require('express');
const app = express();

const serverPort = 443;
const privateKey = fs.readFileSync(__dirname + '/ssl-cert/server.pem', 'utf8');
const certificate = fs.readFileSync(__dirname + '/ssl-cert/server.crt', 'utf8');

const credentials = { key: privateKey, cert: certificate /* , passphrase: '' */ };

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


const httpsServer = https.createServer(credentials, app).listen(serverPort);
const io = require('socket.io')(httpsServer);
const {openstreamApp} = require('./app/openstream.js')(httpsServer);

/*************************************/
const blog = require('../blog/blogapp.js');
const win = require('../win/winapp.js');
const mrqr = require('../src/lineqr.js');
const wrtc = require('../node-webrtc-examples/index6.js');
/*************************************/

//console.log('find room name=socket => ' + colors.yellow(openstreamObj.getRoomByName('socket')));

const RootNames =['openstream', 'openstream/un'];;

RootNames.forEach((item)=>{
	app.use('/' + item, openstreamApp);
});

/*************************************/
app.use('/blog', blog);
app.use('/win', win);
app.use('/mrqr', mrqr);
app.use('/wrtc', wrtc);
/*************************************/

