//tester.js
define(function (require) {
	const helper = require("./helper.js");

	document.addEventListener("StartMakeStreamCmd", function(e) {
		let maker = helper.doStart();
		let AdXCanvas = document.querySelector("#AdXCanvas");
		let AdXTextStream = AdXCanvas.captureStream(25);

		let monitor = document.querySelector("#Monitor");
		monitor.srcObject = AdXTextStream;

		let event = new CustomEvent("StreamReady", { "detail": {stream: AdXTextStream}});
		document.dispatchEvent(event);

	});

	document.addEventListener("StopMakeStreamCmd", function(e) {
		helper.doStop();

		let context = AdXCanvas.getContext('2d');
		context.clearRect(0, 0, AdXCanvas.width, AdXCanvas.height);

		AdXTextStream = null;
	});
});