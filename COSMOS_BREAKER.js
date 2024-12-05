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

Number.prototype.mod = function (n) {
	"use strict";
	return ((this % n) + n) % n;
  };

function clamp( value, min, max ) { return Math.max( min, Math.min( max, value ) ); }

class Vector {
	constructor(x, y) { this.x = x; this.y = y; }
	set( x, y ) { this.x = x; this.y = y; return this; }
	add( v ) { this.x += v.x; this.y += v.y; return this; }
	sub( v ) { this.x -= v.x; this.y -= v.y; return this; }
	multiply( v ) { this.x *= v.x; this.y *= v.y; 	return this; }
	multiplyScalar( scalar ) { this.x *= scalar; this.y *= scalar; return this; }
	divide( v ) { this.x /= v.x; this.y /= v.y; return this; }
	divideScalar( scalar ) { return this.multiplyScalar( 1 / scalar ); }
	dot( v ) { return this.x * v.x + this.y * v.y; }
	lengthSq() { return  this.x * this.x + this.y * this.y; }
	get length() { return Math.sqrt( this.x * this.x + this.y * this.y ); }
	set length( length ) { return this.normalize().multiplyScalar( length ); }
	normalize() { return this.divideScalar( this.length || 1 ); }
	get angle() { const angle = Math.atan2( - this.y, - this.x ) + Math.PI; return angle; }
	set angle(rad) { const l = this.length; this.set(Math.cos(rad), Math.sin(rad)); this.length = l; return this;}
	rotate(rad) {const ca = Math.cos(rad); const sa = Math.sin(rad); return this.set(this.x*ca - this.y*sa, this.x*sa + this.y*ca);}
	angleTo( v ) {
		const denominator = Math.sqrt( this.lengthSq() * v.lengthSq() );
		if ( denominator === 0 ) return Math.PI / 2;
		const theta = this.dot( v ) / denominator;
		return Math.acos( clamp( theta, -1, 1 ) );
	}
	reflect(normal) { return this.sub(normal.multiplyScalar(2*this.dot(normal))); }
}




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
		this.vel = new Vector(0,0);
		this.spr = spr;
		this.w = (width == -1 ? spr.width*5 : width);
		this.h = (height == -1 ? spr.height*5 : height);
		// this.flipX = false;	// horizontal sprite flip
		// this.flipY = false; // vertical sprite flip
		this.visible = true; // if you can see it
		this.touchable = true; // if you can collide with it
	}

	draw() {
		if (!this.visible) {return;}
		/*
		var mx = this.flipX ? -1 : 1;
		var my = this.flipY ? -1 : 1
		c.translate(this.x, this.y);
		c.scale(mx, my);
		c.drawImage(this.spr, 0, 0, this.w*mx, this.h*my);
		*/
		c.drawImage(this.spr, this.x, this.y, this.w, this.h);
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
	constructor(x = 0, y = 0, level = 1, width = -1, height = -1) {
		this.level = level;
		super(x, y, getBrickSprite(this.level), width, height);
	}

	/** @param {Thing} other */ 
	hit(other) {
		if (!other.ball) {return;}
		this.level -= 1;
		this.spr = getBrickSprite(this.level);
		super.hit(other);
	}
}

class Ball extends Thing {
	constructor(x = 0, y = 0) {
		super(x, y, sprites.placeholder, 4*5, 4*5);
		this.ball = true;
		this.halfW = this.w/2;
		this.halfH = this.h/2;
	}

	/** @param {Thing} other */ 
	hit(other) {
		if (other == bottom) {
			ball.touchable = false;
			ball.vel.set(0,0);
			ball_launched = false;
			balls_left--;
			if (balls_left <= 0) {
				ball.visible = false;
				// game_over();
			}
			return;
		}
		
		var ballCenter = new Vector(ball.x + ball.w/2,ball.y + ball.h/2);
		var otherCenter = new Vector(other.x + other.w/2, other.y + other.h/2);

		var angle = ballCenter.angleTo(otherCenter);
		console.log(angle = angle.mod(2*Math.PI));
		var normal = new Vector(0,0);

		if (angle < 0.2449786631) {
			normal.x = 1; // right collision?
		}
		else if (angle < (Math.PI-0.2449786631)) {
			normal.y = -1; // top
		}
		else if (angle < (Math.PI+0.2449786631)) {
			normal.x = -1; // left
		}
		else if (angle < (2*Math.PI-0.2449786631)) {
			normal.y = 1; //bottom
		}
		else {
			normal.x = 1; // right again
		}

		ball.vel.multiply(normal);

		if (other == player) {
			ball.vel.rotate(Math.PI*player.vel);
		}
		
	}
}

//Starts loading all the images, when done runs init()
Promise.all(promises).then(init);


/*===========================================
				THE GAME !!!
===========================================*/
/** @type {Thing} */
var player; // paddle
/** @type {Ball} */
var ball; // ball

var bottom; // kills the ball, offscreen

const player_movespeed = 0.25;

var ball_launched = false;
var balls_left = 3;

function init()
{
	//bounds
	var left = new Thing(0,0, sprites.placeholder, 4*5, 600);
	var top = new Thing(0,0, sprites.placeholder, 800, 4*5);
	var right = new Thing(800-4*5,0, sprites.placeholder, 4*5, 600);

	bottom = new Thing(0,600, sprites.placeholder, 800, 16*5);

	// things.push(left);
	// things.push(top);
	// things.push(right);
	// things.push(bottom);

	player = new Thing(400, 600-(8*5), sprites.placeholder, 16*5, 4*5);
	player.vel = 0;
	things.push(player);
	ball = new Ball(player.x + 6*5, player.y - 8*5);
	things.push(ball);
	requestAnimationFrame(update);
}

var last;
var dt = Number.EPSILON;
function update(timestamp) {
	if (last === undefined) { last = timestamp; }
  	dt = timestamp - last;
	last = timestamp;

	player.vel = 0;
	if (pressedKeys["ArrowRight"] || pressedKeys["KeyD"]) { 
		player.vel = player_movespeed*dt; 
		
	} 
	if (pressedKeys["ArrowLeft"] || pressedKeys["KeyA"]) { 
		player.vel = -player_movespeed*dt;
	}
	if (pressedKeys["Space"] && !ball_launched && balls_left > 0) { 
		ball_launched = true;
		ball.touchable = true;
		ball.vel.set(0.3, 0);
		ball.vel.angle = -Math.random()*Math.PI*2/3-Math.PI/6;
	}

	player.x += player.vel;

	ball.x += ball.vel.x*dt;
	ball.y += ball.vel.y*dt;

	if (ball.x < 0 || ball.x > 800) {
		ball.vel.x *= -1;
	}
	if (ball.y < 0 || ball.y > 600) {
		ball.vel.y *= -1;
	}  

	for (const t of things) {
		if (t.ball) {continue;}
		collide(ball, t);
	}

	

	if (!ball_launched) {
		ball.x = player.x + 6*5;
		ball.y = player.y - 8*5;
	}

	ball.x = clamp(ball.x, 0, 800);
	ball.y = clamp(ball.y, 0, 600);

	fps.innerHTML = Math.trunc(100000.0/dt)/100; 
	
	draw();
	requestAnimationFrame(update);
}

function draw()
{
	c.clearRect(0,0,cv.width,cv.height);
	// c.save();	// saves the state of the canvas so that I can change scale and stuff and then reset it
	for (const t of things) {
		t.draw();
		// c.restore(); // loads the saved state
	}
}