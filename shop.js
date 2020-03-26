//shop.js
function classA (id) {

    this.id = id;
    this.array = [];

    this.add = function(newObject) {
        this.array.push(newObject);
    };

	this.callAdd = function(value) {
		classA.add(value);
	}
}

let objA = new classA('01');
let objB_01 = new classA('02');
let objB_02 = new classA('03');
objA.add(objB_01);
objA.callAdd(objB_02);
console.log(objA.array);
//objA.add(objB_02);
//objA.add(objB_03);