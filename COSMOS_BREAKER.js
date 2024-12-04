const cv = document.getElementById("breakoutCanvas");
// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
/** @type {CanvasRenderingContext2D} */ 
const c = cv.getContext("2d");
//so retro
c.imageSmoothingEnabled = false;

// CONTROLS: Nice way to do controls
var pressedKeys = {};
window.addEventListener("keydown", (e) => { pressedKeys[e.code] = true; });
window.addEventListener("keyup", (e) => { delete pressedKeys[e.code]; });

// IMAGE LOADER : to have the game not start until everything is loaded
var spritesToLoad = {
	placeholder : "sprites/placeholder.png",
};
var loadProgress = 0;
/** @type {Object.<string,HTMLImageElement>} */
var sprites = {};
var promises = Object.keys(spritesToLoad).map(spriteName => {
	var promise = new Promise((resolve,_) => {
		var img = new Image();
		img.onload = _ => {
			sprites[spriteName] = img;
			loadProgress++; console.log(loadProgress);
			resolve();
		}
		img.src = spritesToLoad[spriteName];
	});
	return promise;
});

/**
 * @type {boolean}  true = collided, false = not\
 * @param {Thing} one 
 * @param {Thing} two  */
function collide(one, two) {
	if (!one.touchable || !two.touchable) {return false;}
	if (one.x < two.x + two.w && one.x + one.w > two.x && one.y < two.y + two.h && one.y + one.h > two.y) {
		one.hit(two);
		two.hit(one);
		return true;
	}
	return false;
}

/** @type {Thing[]} */
var things = [];
class Thing {
	constructor(x = 0, y = 0, spr = sprites.placeholder, width = -1, height = -1) {
		this.x = x;
		this.y = y;
		this.spr = spr;
		this.w = (width == -1 ? spr.width*5 : width);
		this.h = (height == -1 ? spr.height*5 : height);
		this.flipX = false;	// horizontal sprite flip
		this.flipY = false; // vertical sprite flip
		this.visible = true; // if you can see it
		this.touchable = true; // if you can collide with it
	}

	draw() {
		if (!this.visible) {return;}
		var mx = this.flipX ? -1 : 1;
		var my = this.flipY ? -1 : 1
		c.translate(this.x, this.y);
		c.scale(mx, my);
		c.drawImage(this.spr, 0, 0, this.w*mx, this.h*my);
	}

	// runs on collide
	/** @param {Thing} other thing you collided with */ 
	hit(other) { 
		
	}
}

/** 
 * @type {HTMLImageElement}
 * @param {number} level
 */
function getBrickSprite(level = 1) {
	var sprite = sprites.placeholder;
	// make a thing that lets you figure out what sprite to use based on level
	return sprite;
}

class Brick extends Thing {
	constructor(x = 0, y = 0, level = 1) {
		this.level = level;
		super(x, y, getBrickSprite(this.level), width, height);
	}

	/** @param {Thing} other */ 
	hit(other) {
		this.level -= 1;
		this.spr = getBrickSprite(this.level);
		super.hit(other);
	}
}

//Starts loading all the images, when done runs init()
Promise.all(promises).then(init);


/*===========================================
				THE GAME !!!
===========================================*/
var player; // paddle
var ball; // ball


function init()
{
	player = new Thing();
	things.push(player);
	requestAnimationFrame(update);
}

var last;
var dt = Number.EPSILON;
function update(timestamp) {
	if (last === undefined) { last = timestamp; }
  	dt = timestamp - last;
	last = timestamp;

	if (pressedKeys["ArrowRight"] || pressedKeys["KeyD"]) { 
		player.x += 0.25*dt; 
		player.flipX = false;
	} 
	if (pressedKeys["ArrowLeft"] || pressedKeys["KeyA"]) { 
		player.x -= 0.25*dt;
		player.flipX = true;
	} 
	if (pressedKeys["ArrowDown"] || pressedKeys["KeyS"]) {
		player.y += 0.25*dt;
	} 
	if (pressedKeys["ArrowUp"] || pressedKeys["KeyW"]) { 
		player.y -= 0.25*dt;
	} 

	fps.innerHTML = Math.trunc(100000.0/dt)/100; 
	
	draw();
	requestAnimationFrame(update);
}

function draw()
{
	c.clearRect(0,0,cv.width,cv.height);
	c.save();	// saves the state of the canvas so that I can change scale and stuff and then reset it
	for (const t of things) {
		t.draw();
		c.restore(); // loads the saved state
	}
}