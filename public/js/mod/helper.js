//helper.js
define(function (require) {
	const marker = require("./textstreammaker.js");
	const AdWidth = 1280;
	const options = {
		boxWidth: AdWidth,
		canvasWidth: AdWidth,
		exWidth: AdWidth * 1.5,
		height: 150,
		ypos: 120,
		textColor: 'red',
		stepShift: 50,
		speed: 1000,
	};

	return {
		doStart: function() {
			const div = marker.doInit(options);
			var adDemo = document.querySelector('#AdXCanvasDiv');
			adDemo.style.position = 'relative';
			adDemo.style.width = '100%';
			adDemo.appendChild(div);

			marker.doStart();
			return marker;
		},
		doStop: function() {
			marker.doStop();
		}
	}	
});