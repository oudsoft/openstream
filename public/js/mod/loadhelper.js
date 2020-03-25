//loadhelper.js
requirejs.config({
	/*
    baseUrl: './js/mod/',
    paths: {
        app: './js/mod/'
    }
	*/
});
requirejs(['js/merger.js', 'js/mod/helper.js' /*, 'js/mod/filetostream.js'*/]);