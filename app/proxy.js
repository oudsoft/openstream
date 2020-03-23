//proxy.js
const fs = require('fs');
const path = require('path');
const request = require('request');
const currentDir = __dirname;
const parentDir = path.normalize(currentDir + '/..');

const certificate = fs.readFileSync(parentDir + '/ssl-cert/server.crt', 'utf8');

const doCallVideo = function(url, header) {
	return new Promise(function(resolve, reject) {
		request({
			url: url,
			headers: header,
			method: "GET"
		}, function (err, response, body){
			if (!err) {	
				resolve(response);
			} else {
				console.log('ERR=>', err);
				console.log(err['ERR_TLS_CERT_ALTNAME_INVALID']);
				if (err['Error [ERR_TLS_CERT_ALTNAME_INVALID]']){
					resolve(response);
				} else {
					reject(err);
				}
			}
		});
	});
}

module.exports = function (app, obj) {
	app.post('/proxy', function(req, res) {
		/*
		let reqHeader = {};
		reqHeader['user-agent'] = req.headers['user-agent'];
		reqHeader['origin'] = 'anonymous';
		*/
		let reqHeader = req.headers;
		reqHeader['origin'] = 'anonymous';
		console.log(reqHeader);

		const reqURL = req.body.url;
		doCallVideo(reqURL, reqHeader).then((data) => {
			console.log(data);
			res.status(200).send(data);
		});
	});
}
