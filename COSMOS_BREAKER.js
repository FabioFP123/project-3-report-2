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
	brick_1 : "sprites/brick_1.png",
	brick_2 : "sprites/brick_2.png",
	brick_3 : "sprites/brick_3.png",
	brick_4 : "sprites/brick_4.png",
	brick_5 : "sprites/brick_5.png",
	brick_6 : "sprites/brick_6.png",
	ball0 : "sprites/ball0.png",
	ball1 : "sprites/ball1.png",
	ball2 : "sprites/ball2.png",
	paddle0 : "sprites/paddle0.png",
	paddle1 : "sprites/paddle1.png",
	paddle2 : "sprites/paddle2.png",
	bg0 : "sprites/bg0.png",
	bg1 : "sprites/bg1.png",
	bg2 : "sprites/bg2.png",
	level_complete : "sprites/level_complete.png",
	game_over : "sprites/game_over.png",
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

class Thing {
	constructor(x = 0, y = 0, spr = sprites.placeholder, width = -1, height = -1) {
		this.x = x;
		this.y = y;
		this.vel = new Vector(0,0);
		this.spr = spr;
		this.w = (width == -1 ? spr.width*5 : width);
		this.h = (height == -1 ? spr.height*5 : height);
		this.visible = true; // if you can see it
		this.touchable = true; // if you can collide with it
		this.halfW = this.w/2;
		this.halfH = this.h/2;
		this.cTheta = Math.atan2(this.halfH, this.halfW);
	}

	draw() {
		if (!this.visible) {return;}
		c.drawImage(this.spr, this.x, this.y, this.w, this.h);
	}

	/** @param {Thing} other thing you collided with */ 
	hit(other) {  }
}

/** 
 * @type {HTMLImageElement}
 * @param {number} level
 */
function getBrickSprite(level = 1) {
	return sprites[`brick_${level}`];
}


class Brick extends Thing {
	constructor(x = 0, y = 0, level = 1, width = -1, height = -1) {
		super(x, y, getBrickSprite(level), width, height);
		this.level = level;
	}

	/** @param {Thing} other */ 
	hit(other) {
		if (!other.ball) {return;}
		this.level -= 1;
		
		if (this.level <= 0) { 
			this.visible = false;
			this.touchable = false;
			brick_count--;
		} else {
			this.spr = getBrickSprite(clamp(this.level, 1, 6));
		}
		var oldscore = score;
		score += 100;
		if (score.mod(5000) < oldscore) {
			balls_left++;
		}
		if (brick_count <= 0) {
			levelComplete;
		}
		super.hit(other);
	}
}

const ball_top_angle = 0.15;
const ball_bottom_angle = 0.2;

class Ball extends Thing {
	constructor(x = 0, y = 0) {
		super(x, y, sprites.placeholder, 4*5, 4*5);
		this.ball = true;
	}

	/** @param {Thing} other */ 
	hit(other) {
		var angle = Math.atan2((other.y + other.halfH) - (ball.y + ball.halfH), (other.x + other.halfW) - (ball.x + ball.halfW));
		console.log(angle = angle.mod(2*Math.PI));

		if (angle < other.cTheta) {
			ball.vel.x = Math.abs(ball.vel.x)*-1;
			console.log('LEFT');
		}
		else if (angle < (Math.PI-other.cTheta)) {
			ball.vel.y = Math.abs(ball.vel.y)*-1;
			console.log('Top');
		}
		else if (angle < (Math.PI+other.cTheta)) {
			ball.vel.x = Math.abs(ball.vel.x);
			console.log('right');
		}
		else if (angle < (2*Math.PI-other.cTheta)) {
			ball.vel.y = Math.abs(ball.vel.y);
			console.log('Bottom');
		}
		else {
			ball.vel.x = Math.abs(ball.vel.x)*-1;
			console.log('LEFT');
		}

		if (other == player) {
			ball.vel.rotate(Math.PI*player.vel);
			ball.vel.angle = clamp(ball.vel.angle, 1.1*Math.PI, 1.9*Math.PI);
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

var bricks = [];
var brick_count = 0;

const player_speed = 0.5;
const ball_speed = 0.6;

var ball_launched = false;
var balls_left = 3; // dont forget way to gameover and restart 

var gamelevel = 0;
var score = 0; // implement basic score would be good

var levels = [
	[
		"0005665000",
		"4000000004",
		"0031111300",
		"0000000000",
		"2220000222",
		"0111001110",
	],
	[
		"5000110005",
		"0011221100",
		"0123443210",
		"0123443210",
		"0011221100",
		"6000110006",
	],
	[
		"1010201010",
		"0203010302",
		"1030201010",
		"0204040402",
		"5010201050",
		"0201060102",
	],
];

function init()
{
	player = new Thing(400, 600-(8*5), sprites.paddle0, 16*5, 4*5);
	player.vel = 0;
	ball = new Ball(player.x + 6*5, player.y - 8*5);
	for (var i = 0; i < 6; i++) { // implement varied level layouts
		bricks[i] = [];
		for (var j = 0; j < 10; j++) {
			bricks[i][j] = new Brick(j*16*5, i*8*5, 1, 16*5, 8*5);
			bricks[i][j].visible = false;
			bricks[i][j].touchable = false;
		}
	}
	overlay_sprite = new Thing(0,0, sprites.placeholder, 800, 600);
	overlay_sprite.visible = false;
	loadLevel(gamelevel);
	requestAnimationFrame(update);
}

function loadLevel(level = 0) {
	brick_count = 0;
	level = level.mod(levels.length);
	bg.src = "sprites/bg" + level + ".png";
	player.spr = sprites["paddle"+level];
	ball.spr = sprites["ball"+level];
	for (var i = 0; i < 6; i++) { 
		var arr = levels[level][i].split(""); 
		for (var j = 0; j < 10; j++) {
			if (arr[j] != "0") {
				bricks[i][j].level = Number(arr[j]) || 1;
				bricks[i][j].spr = getBrickSprite(bricks[i][j].level);
				bricks[i][j].visible = true;
				bricks[i][j].touchable = true;
				brick_count++;
			}
			else {
				bricks[i][j].visible = false;
				bricks[i][j].touchable = false;
			}			
		}
	}
}

function levelComplete() {
	ball.vel.set(0, 0);
	ball_launched = false;
	overlay = true;
	overlay_type = "level_complete";
	overlay_sprite.spr = sprites.level_complete;
	overlay_sprite.visible = true;
}

function game_over() {
	overlay = true;
	overlay_type = "game_over";
	overlay_sprite.spr = sprites.game_over;
	overlay_sprite.visible = true;
}

var overlay = false;
var overlay_type = "";
var overlay_sprite;

var last;
var dt = Number.EPSILON;
function update(timestamp) {
	if (last === undefined) { last = timestamp; }
  	dt = timestamp - last;
	last = timestamp;

	player.vel = 0;
	if (overlay) {
		if (pressedKeys["Space"]) {
			overlay_sprite.visible = false;
			switch (overlay_type) {
				case "level_complete":
					gamelevel++;
					loadLevel(gamelevel);
					break;
				case "game_over":
					gamelevel = 0;
					score = 0;
					loadLevel(gamelevel);
					ball.vel.set(0, 0);
					ball.x = player.x + 6*5;
					ball.y = player.y - 6*5;
					ball_launched = false;
					ball.visible = true;
					balls_left = 3;
					break;
			}
			overlay = false;
		}
	}
	else {
		if (pressedKeys["ArrowRight"] || pressedKeys["KeyD"]) { player.vel = player_speed*dt;} 
		if (pressedKeys["ArrowLeft"] || pressedKeys["KeyA"]) {  player.vel = -player_speed*dt;}
		if (pressedKeys["Space"] && !ball_launched && balls_left > 0) { 
			ball_launched = true;
			ball.touchable = true;
			ball.vel.set(0, -ball_speed);
			ball.vel.angle = -Math.random()*Math.PI*2/3-Math.PI/6;
		}
		if (pressedKeys["BracketRight"]) { 
			levelComplete();
		}
	}

	player.x += player.vel;

	ball.x += ball.vel.x*dt;
	ball.y += ball.vel.y*dt;

	if (ball.x < 0 || ball.x + ball.w > 800) {
		ball.vel.x *= -1;
	}
	if (ball.y < 0) {
		ball.vel.y *= -1;
	}  
	if (ball.y > 600) {
		ball.touchable = false;
		ball.vel.set(0,0);
		ball_launched = false;
		balls_left--;
		if (balls_left <= 0) {
			ball.visible = false;
			game_over();
		}
	}

	collide(ball, player); // test against paddle
	for (var row of bricks) { 
		for (var b of row) { 
			collide(ball, b);	//test against bricks
		}
	}

	if (!ball_launched) {
		ball.x = player.x + 6*5;
		ball.y = player.y - 6*5;
	}
	
	draw();
	gamestatus.innerHTML = `
		LVL ${gamelevel}<br>
		SCORE: ${score}<br>
		${"&nbsp;".repeat(6)}x${balls_left}
	`;
	fps.innerHTML = Math.trunc(1000/dt);
	requestAnimationFrame(update);
}

function draw()
{
	c.clearRect(0,0,cv.width,cv.height);
	player.draw();
	ball.draw();
	for (var row of bricks) { 
		for (var b of row) { 
			b.draw();	//draw bricks
		}
	}
	overlay_sprite.draw();
	c.drawImage(sprites["ball"+gamelevel], 15, 63, 16, 16);
}