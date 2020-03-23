//textstreammaker.js
define(function (require) {
	const adtext = require("./adtext.js");

	let options = {};
	let shiftCount = 1;
	let cvw = 0;
	let textIndex = 0;
	let timeLine;

	const init = function() {
			const AdXCanvasDiv = document.createElement('div');
			AdXCanvasDiv.style.width = options.boxWidth;
			AdXCanvasDiv.style.height = options.height;
			AdXCanvasDiv.style.border = '3px solid green';
			AdXCanvasDiv.style.position = 'relative';
			AdXCanvasDiv.style.display = 'block';

			const AdXCanvas = document.createElement('canvas');
			AdXCanvas.id = "AdXCanvas";
			cvw = options.canvasWidth + options.exWidth + options.stepShift;
			AdXCanvas.style.width = cvw;
			AdXCanvas.style.height = options.height;
			AdXCanvas.style.border = '3px solid gray';
			AdXCanvas.style.position = 'relative';
			AdXCanvas.style.display = 'block';


			AdXCanvasDiv.appendChild(AdXCanvas);

			options.AdXCanvas = AdXCanvas;
			return AdXCanvasDiv;
	}

	return {
		doInit: function(value) {
			options = value;
			let div = init();
			return div;
		},
		doRender: function (text, x) {
			options.AdXCanvas.style.fontFamily = 'THNiramitAS';
			const ctx = options.AdXCanvas.getContext('2d');
			ctx.font = 'bold 100px THNiramitAS';
			ctx.fillStyle = options.textColor;
			ctx.textAlign = 'left';
			//console.log(AdXFrameWidth);
			let w = ctx.measureText(text).width;
			//console.log(w);
			ctx.fillText(text, x, options.ypos);
		},
		doPlay: function(text, x) {
			const ctx = options.AdXCanvas.getContext('2d');
			var imageData = ctx.getImageData(options.stepShift, 0, ctx.canvas.width-options.stepShift, ctx.canvas.height);
			ctx.putImageData(imageData, 0, 0);
			ctx.clearRect(ctx.canvas.width-options.stepShift, 0, options.stepShift, ctx.canvas.height);

			let timeAd = window.setTimeout(() => {
				let timer = this.doPlay(text, x);
				window.clearTimeout(timer);
				shiftCount++;
				if ((options.stepShift*shiftCount) > (cvw)){
					window.clearTimeout(timeAd);
					shiftCount = 1;
					if (textIndex < (adtext.texts.length-1)){
						textIndex++;
					} else {
						textIndex = 0;
					}
					let textItem = adtext.texts[textIndex];
					this.doRender(textItem, x);
				}
				return timeAd;
			}, options.speed);
		},
		doStart: function() {
			const ctx = options.AdXCanvas.getContext('2d');
			const startX = options.canvasWidth + options.stepShift;
			ctx.canvas.width = cvw;

			let textItem = adtext.texts[textIndex];

			this.doRender(textItem, startX);
			timeLine = window.setTimeout(() => {
				this.doPlay(textItem, startX);
			}, 5500);
		},
		doStop: function() {
			window.clearTimeout(timeLine);
		},
		getStream: function(){
			return options.AdXCanvas.captureStream(25);
		}
   };
});  
