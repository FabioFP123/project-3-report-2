const canvas = document.getElementById("breakoutCanvas");
const ctx = canvas.getContext("2d");

// Ball properties
let ballRadius = 10;
let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 2;
let dy = -2;

// Paddle properties
const paddleHeight = 10;
const paddleWidth = 75;
let paddleX = (canvas.width - paddleWidth) / 2;

// Brick properties
const brickRowCount = 5;
const brickColumnCount = 7;
const brickWidth = 55;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 35;

// Game controls
let rightPressed = false;
let leftPressed = false;

// Brick setup
const bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
  bricks[c] = [];
  for (let r = 0; r < brickRowCount; r++) {
	bricks[c][r] = { x: 0, y: 0, status: 1 }; // status 1 = visible, 0 = destroyed
  }
}

// Event listeners
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);

function keyDownHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
  if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
}

function keyUpHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
  if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
}

function collisionDetection() {
  for (let c = 0; c < brickColumnCount; c++) {
	for (let r = 0; r < brickRowCount; r++) {
	  const b = bricks[c][r];
	  if (b.status === 1) {
		if (
		  x > b.x &&
		  x < b.x + brickWidth &&
		  y > b.y &&
		  y < b.y + brickHeight
		) {
		  dy = -dy;
		  b.status = 0; // Destroy brick
		}
	  }
	}
  }
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}

function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
	for (let r = 0; r < brickRowCount; r++) {
	  if (bricks[c][r].status === 1) {
		const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
		const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
		bricks[c][r].x = brickX;
		bricks[c][r].y = brickY;
		ctx.beginPath();
		ctx.rect(brickX, brickY, brickWidth, brickHeight);
		ctx.fillStyle = "#0095DD";
		ctx.fill();
		ctx.closePath();
	  }
	}
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  collisionDetection();

  // Ball movement
  x += dx;
  y += dy;

  // Ball collision with walls
  if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) dx = -dx;
  if (y + dy < ballRadius) dy = -dy;
  else if (y + dy > canvas.height - ballRadius) {
	if (x > paddleX && x < paddleX + paddleWidth) dy = -dy;
	else {
	  alert("GAME OVER");
	  document.location.reload();
	}
  }

  // Paddle movement
  if (rightPressed && paddleX < canvas.width - paddleWidth)
	paddleX += 7;
  else if (leftPressed && paddleX > 0) paddleX -= 7;

  requestAnimationFrame(draw);
}

draw();