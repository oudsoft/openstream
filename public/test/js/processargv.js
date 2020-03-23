//processargv.js
process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});

/*
	USAGE
		run by cmmand
		$ node processargv.js one two=three four

*/
