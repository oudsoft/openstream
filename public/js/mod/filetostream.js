//filetostream.js
define(function (require) {
	var fs = require('fs');
	var data = '';

	var readStream = fs.createReadStream('video/sample.mp4', 'utf8');

	readStream.on('data', function(chunk) {
		data += chunk;
	}).on('end', function() {
		console.log(data);
	});
});