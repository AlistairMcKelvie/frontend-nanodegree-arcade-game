// Enemies our player must avoid
var Enemy = function(initY, speed) {
    // Variables applied to each of our instances go here,
    // we've provided one for you to get started
    this.y = initY;
    this.x = 0;
    this.speed = speed;

    // The image/sprite for our enemies, this uses
    // a helper we've provided to easily load images
    this.sprite = "images/enemy-bug.png";
};

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for
    // all computers.
    this.x += dt * this.speed;
    console.log(ctx);
    console.log(ctx.canvas.width);
    if (this.x > ctx.canvas.width) {
        this.x = this.x % ctx.canvas.width;
    }
};

// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.
var Player = function() {
    this.x = 200;
    this.y = 450;
    this.sprite = "images/char-boy.png"
};

Player.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

Player.prototype.update = function() {
    //TODO: implement this
};

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player
//
// TODO: add enemies to all enemies
var allEnemies = [new Enemy(60, 100),
                  new Enemy(140, 200),
                  new Enemy(220, 200),
                  new Enemy(60, 224),
                  new Enemy(140, 41)];
var player = new Player;


// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    player.handleInput(allowedKeys[e.keyCode]);
});
