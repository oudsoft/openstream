//un.js

let unApp = null;

unApp.get('/sayhello', (req, res) => {
	res.status(200).send({text: 'Hello'});
});

module.exports = function (app) {
	unApp = app;
	return {unApp};
};