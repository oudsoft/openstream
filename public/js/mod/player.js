//player.js
define(function (require) {
   var myteam = require("./team");

   return {
      myfunc: function () {
		const adDiv = document.createElement('div');
		myteam.player.forEach((item) => {
			let adLinDiv = document.createElement('div');
			adLinDiv.innerHTML = '<div style="text-align: center; width: 100%;" class="blink"><b>' + item + '</b><div>';
			adDiv.appendChild(adLinDiv);
		});
		var adDemo = document.querySelector('#AdDemo');
        adDemo.appendChild(adDiv);
      }
   };
});  
