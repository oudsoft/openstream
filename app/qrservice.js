//qrservice.js
const fs = require('fs');
const colors = require('colors/safe');
const util = require("util");
const path = require('path');
const url = require('url'); 
const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/newentryqrcode', function(req, res) {
	//console.log(colors.blue("req.body : ") + colors.yellow(req.body));	
	const QRGenerator = require('./QRCodeGenerator');
	var entryType = req.body.entryType; //<master/client/vchat>
	var roomId = req.body.roomId;
	var roomName = req.body.roomName;    
	var screenId = req.body.screenId;
	var screenNo = req.body.screenNo;
	var hostname = req.headers.host;  
	var rootname = req.originalUrl.split('/')[1];
	var callee = '';
	QRGenerator(entryType, roomId, roomName, screenId, screenNo, hostname, rootname, callee, function(imageLink) {
		res.status(200).send(imageLink);
	});
})

app.post('/calleeentryqrcode', function(req, res) {
	//console.log(colors.blue("req.body : ") + colors.yellow(req.body));	
	const QRGenerator = require('./QRCodeGenerator');
	var entryType = req.body.entryType; //<master/client/vchat>
	var roomId = req.body.roomId;
	var roomName = req.body.roomName;    
	var screenId = req.body.screenId;
	var screenNo = req.body.screenNo;
	var hostname = req.headers.host;  
	var rootname = req.originalUrl.split('/')[1];
	var callee = req.body.callee;
	QRGenerator(entryType, roomId, roomName, screenId, screenNo, hostname, rootname, callee, function(imageLink) {
		res.status(200).send(imageLink);
	});
})

module.exports = app;
