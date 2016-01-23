// Map dimensions
var MAP = {
    minXTile: 0,
    maxXTile: 4,
    minYTile: 0,
    maxYTile: 5,
    tile: {
        width: 101,
        height: 83
    }
}
COLLISION_ON = true;


// Enemies our player must avoid
var Enemy = function(initTileY, speed) {
    // Variables applied to each of our instances go here,
    // we've provided one for you to get started
    this.tileY = initTileY;
    this.yOffset = -30;
    this.y = MAP.tile.height * this.tileY + this.yOffset;
    this.x = 0;
    this.width = 50;
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
var Player = function(tileX, tileY) {
    this.xOffset = 0;
    this.yOffset = -30;
    this.tileX = tileX;
    this.tileY = tileY;
    this.width = 50;
    this.update();
    this.dead = false;
    this.rot = 0;
    this.sprite = "images/char-boy.png";
};

DEATH_TIMER = 0;
Player.prototype.render = function() {
    ctx.rotate(this.rot)
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

Player.prototype.update = function(dt) {
    if (this.dead == true) {
        this.rot = Math.PI * (dt - this.deathTime)
    } else {
        if (this.tileY <= MAP.minYTile) {
            // WINNER!
            this.reset();
        } else {
            this.tileX = clamp(this.tileX, MAP.minXTile, MAP.maxXTile);
            this.tileY = clamp(this.tileY, MAP.minYTile, MAP.maxYTile);
            this.x = MAP.tile.width * this.tileX + this.xOffset;
            this.y = MAP.tile.height * this.tileY + this.yOffset;
        }
        if (COLLISION_ON && this.collides()) {
            // LOSER!
            this.dead = true;
            this.deathTime = dt;
            this.reset();
        }
    }
};

Player.prototype.collides = function() {
    var plr = this;
    return allEnemies.some(function(enemy) {
        if (enemy.x >= plr.x - (plr.width + enemy.width) / 2) {
            if (enemy.x <= plr.x + (plr.width + enemy.width) / 2) {
                var collideX = true;
            } else {
                var collideX = false;
            }
        } else {
            var collideX = false;
        }
        var collideY = enemy.tileY == plr.tileY;
        if (collideX && collideY){
            return true;
        } else {
            return false;
        }
    })
}

Player.prototype.reset = function() {
    this.tileX = 2;
    this.tileY = 5;
    this.update()
}

Player.prototype.handleInput = function(key) {
    switch (key) {
        case "left":
            this.moveLeft();
            break;
        case "right":
            this.moveRight();
            break;
        case "up":
            this.moveUp();
            break;
        case "down":
            this.moveDown();
    }
};

Player.prototype.moveLeft = function() {
    this.tileX -= 1;
    this.update();
    console.log('player xy: ' + this.x + ', ' + this.y);
};

Player.prototype.moveRight = function() {
    this.tileX += 1;
    this.update();
    console.log('player xy: ' + this.x + ', ' + this.y);
};

Player.prototype.moveUp = function() {
    this.tileY -= 1;
    this.update;
    console.log('player xy: ' + this.x + ', ' + this.y);
};

Player.prototype.moveDown = function() {
    this.tileY += 1;
    this.update;
    console.log('player xy: ' + this.x + ', ' + this.y);
};




// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player
//
// TODO: add enemies to all enemies
var allEnemies = [new Enemy(1, 100),
                  new Enemy(2, 200),
                  new Enemy(3, 200)]
var player = new Player(2, 5);


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

function clamp(number, min, max) {
    // clamp number between min / max value
    return number < min ? min : number > max ? max : number;
}
