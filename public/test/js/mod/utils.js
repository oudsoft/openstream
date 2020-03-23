// utils.js

define(function (require) {
	//define(function () {
	return {
		addTextToBody: function (text) {
			const div = document.createElement('div');
			div.textContent = text;
			document.body.appendChild(div);
		},
		unkhown: function() {
			return 'Unkhown';
		}
	};
	//});
});
