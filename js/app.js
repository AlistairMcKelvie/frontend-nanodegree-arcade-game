// Map
var IMAGES = {
    water: 'images/water-block.png',
    grass: 'images/grass-block.png',
    stone: 'images/stone-block.png'
};

var Map = function(){
    this.rows = [
        IMAGES.water,
        IMAGES.stone,
        IMAGES.stone,
        IMAGES.stone,
        IMAGES.stone,
        IMAGES.stone,
        IMAGES.grass,
        IMAGES.grass
    ],
    this.minXTile = 0,
    this.maxXTile = this.rows.length,
    this.minYTile = 0,
    this.maxYTile = 7,
    this.tile = {
        width: 101,
        height: 83
    }
    this.startX = Math.ceil(this.maxXTile / 2);
    this.startY = this.maxYTile;
};
var MAP = new Map;

COLLISION_ON = false;

var GameEntity = function(initTileX, initTileY) {
    this.tileX = initTileX;
    this.tileY = initTileY;
    this.xOffset = 0;
    this.yOffset = -30;
    this.x = MAP.tile.width * this.tileX + this.xOffset;
    this.y = MAP.tile.height * this.tileY + this.yOffset;
    this.rotPtX = 50.5;
    this.rotPtY = 125;
    this.collisionWidth = 50;
    this.dead = false;
}

GameEntity.prototype.render = function() {
    ctx.save();
    ctx.translate(this.x + this.rotPtX, this.y  + this.rotPtY);
    ctx.rotate(this.rot);
    ctx.drawImage(Resources.get(this.sprite), -this.rotPtX, -this.rotPtY);
    ctx.restore();
};


// Enemies our player must avoid
var Enemy = function(initTileX, initTileY) {
    this.base = GameEntity;
    this.base(initTileX, initTileY);
}
Enemy.prototype = new GameEntity;


// Draw the enemy on the screen, required method for game

var Bug = function(initTileX, initTileY) {
    // Variables applied to each of our instances go here,
    // we've provided one for you to get started
    this.base = Enemy;
    this.base(initTileX, initTileY);
    this.dx = 0;
    this.dy = 0;
    this.speed = Math.random() * 700;
    this.targetSpeed = this.speed;
    this.acceleration = 0;
    this.dxChangeTimer = (Math.random()) * 3;
    this.deadly = true;

    // The image/sprite for our enemies, this uses
    // a helper we've provided to easily load images
    this.sprite = 'images/enemy-bug.png';
};
Bug.prototype = new Enemy;

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Bug.prototype.update = function(dt) {
    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same dx for
    // all computers.
    if (this.dead) {
        this.deathAnimate(dt);
    } else {
        this.normalUpdate(dt);
    }
};

Bug.prototype.normalUpdate = function(dt) {
    this.dxChangeTimer -= dt;
    if (this.dxChangeTimer <= 0) {
        if (this.targetSpeed == 0) {
            this.targetSpeed = Math.random() * 700;
            this.dxChangeTimer = 2;
        } else {
            this.targetSpeed = 0;
            this.dxChangeTimer = 0.5;
        }
    }
    this.dx += (this.targetSpeed - this.dx) * 0.1;
    this.x += dt * this.dx;
    if (this.x > ctx.canvas.width) {
        this.x = this.x % ctx.canvas.width;
    }
}

Bug.prototype.deathAnimate = function(dt) {
    // only animate if it's on screen
    if (this.x > -100) {
        this.deathTimer += dt;
        this.dy += 200 * dt;
        this.x += this.dx * dt;
        this.y += this.dy * dt;
        this.rot = -Math.PI * (this.deathTimer) * 2;
    }
};

Bug.prototype.collide = function() {
    this.dead = true;
    this.deathTimer = 0;
    this.dx = -this.dx;
}

var Rock = function(initTileX, initTileY) {
    this.base = Enemy;
    this.base(initTileX, initTileY);
    this.deadly = false;
    this.sprite = 'images/Rock.png';
}
Rock.prototype = new Enemy;

Rock.prototype.update = function() {
    // do nothing
};

Rock.prototype.collide = function() {
    // do nothing
};

// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.
var Player = function(initTileX, initTileY) {
    this.base = GameEntity;
    this.base(initTileX, initTileY);
    this.collided = false;
    this.rot = 0;
    this.sprite = "images/char-boy.png";
    this.lives = 3;
    this.currentCollions = [];
    this.doingIntroAnim = true;
    this.doingIntroAnim = true;
    this.jumping = false;
};
Player.prototype = new GameEntity;

Player.prototype.update = function(dt) {
    if (this.doingIntroAnim == true) {
        this.introAnimate(dt);
    } else if (this.dead == true) {
        this.deathAnimate(dt);
    } else {
        this.normalUpdate();
    }
    //console.log('x: ' + this.tileX + ', y: ' + this.tileY + ', rot: ' + this.rot / Math.PI + 'pi');
};

Player.prototype.normalUpdate = function() {
        if (this.tileY <= MAP.minYTile) {
            // WINNER!
            VictorySequence();
        } else {
            this.tileX = clamp(this.tileX, MAP.minXTile, MAP.maxXTile);
            this.tileY = clamp(this.tileY, MAP.minYTile, MAP.maxYTile);
            // save this pos may have to go back to it after collision
            var oldX = this.x;
            var oldY = this.y;
            this.x = MAP.tile.width * this.tileX + this.xOffset;
            this.y = MAP.tile.height * this.tileY + this.yOffset;
        }
        this.collision();
        if (player.collided) {
            // deny move and go back last pos
            this.x = oldX;
            this.y = oldY;
            this.tileX = (this.x - this.xOffset) / MAP.tile.width;
            this.tileY = (this.y - this.yOffset) / MAP.tile.height;
            this.collided = false;
        }
    };

    var Jump = function(startXTile, startYTile, destXTile, destYTile) {
        this.xProgress = 0;
        this.yProgress = 0;
        this.destXOffset = (destXTile - startXTile) * MAP.tile.width;
        this.destYOffset = (destYTile - startYTile) * MAP.tile.height;
        this.jumpDist = Math.sqrt(Math.pow(this.destXOffset, 2) + Math.pow(this.destYOffset, 2));
        this.jumpHeight = this.jumpDist / 1;
        this.speed = 150;
        this.dx = this.speed * this.destXOffset / this.jumpDist;
        this.dy = this.speed * this.destYOffset / this.jumpDist;
        this.finished = false;
    }

    Jump.prototype.update = function(dt) {
        // jump eqn z = (4h/d)(x - (x^2)/d)
        // jump zy = (4h/d)(1 - 2x/d)
        var newXProg = this.xProgress + this.dx * dt;
        var newYProg = this.yProgress + this.dy * dt;
        dz = (4 * this.jumpHeight / this.jumpDist) * (1 - 2 * newXProg / this.jumpDist);
        console.log(newXProg);
        console.log(newYProg);
        console.log(dz);
        console.log('----------');
        this.xUpdateVal = newXProg - this.xProgress;
        this.yUpdateVal = newYProg - this.yProgress - dz;
        this.xProgress = newXProg;
        this.yProgress = newYProg;
        if (this.xProgress >= this.destXOffset && this.yProgress >= this.destYOffset) {
            this.finished = true;
        }
    };


    Player.prototype.introAnimate = function(dt) {
        if (this.x >= MAP.startX * MAP.tile.width + this.xOffset) {
            // Made it to start location
            this.tileX = MAP.startX;
            this.tileY = MAP.startY;
            this.doingIntroAnim = false;
        } else if (!this.jump || this.jump.finished == true) {
            // Start a new jump
            this.jump = new Jump(this.tileX, this.tileY, this.tileX + 1, this.tileY);
            this.jump.update(dt);
            this.x += this.jump.xUpdateVal;
            this.y += this.jump.yUpdateVal;
            this.jumping = true;
        } else {
            this.jump.update(dt);
            this.x += this.jump.xUpdateVal;
            this.y += this.jump.yUpdateVal;
        }
    };

    Player.prototype.deathAnimate = function(dt) {
        this.deathTimer += dt;
        this.rot = Math.min(Math.PI * (this.deathTimer) * 2, Math.PI / 2);
        if (this.deathTimer > 1.3) {
        // Death anim complete
        this.reset();
        // Update these now or now or render gets called before normal
        // update and draws with updated rotation but not updated pos
        this.x = MAP.tile.width * this.tileX + this.xOffset;
        this.y = MAP.tile.height * this.tileY + this.yOffset;
    }
};

Player.prototype.collision = function() {
    plr = this;
    allEnemies.forEach(function(enemy) {
        if (enemy.x >= plr.x - (plr.collisionWidth + enemy.collisionWidth) / 2) {
            if (enemy.x <= plr.x + (plr.collisionWidth + enemy.collisionWidth) / 2) {
                var collideX = true;
            } else {
                var collideX = false;
            }
        } else {
            var collideX = false;
        }
        var collideY = enemy.tileY == plr.tileY;
        if (collideX && collideY && COLLISION_ON){
            plr.collided = true;
            if (enemy.deadly) {
                plr.dead = true;
                plr.deathTimer = 0;
                plr.lives--;
            }
            enemy.collide();
        }
    })
}

Player.prototype.reset = function() {
    this.rot = 0;
    this.tileX = MAP.startX;
    this.tileY = MAP.startY;
    this.dead = false;
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
    console.log('player xy: ' + this.x + ', ' + this.y);
};

Player.prototype.moveRight = function() {
    this.tileX += 1;
    console.log('player xy: ' + this.x + ', ' + this.y);
};

Player.prototype.moveUp = function() {
    this.tileY -= 1;
    console.log('player xy: ' + this.x + ', ' + this.y);
};

Player.prototype.moveDown = function() {
    this.tileY += 1;
    console.log('player xy: ' + this.x + ', ' + this.y);
};

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player
//
var allEnemies = []
var player;
var startGame = function() {
    // Generate random enemies
    var bugRows = [1, 3, 5];
    bugRows.forEach(function(row) {
        var bugCount = randomInt(2, 5);
        for (var i = 0; i < bugCount; i++) {
            allEnemies.push(new Bug(randomInt(MAP.minXTile, MAP.maxXTile), row));
        }
    });

    var rockRows = [2, 4];
    rockRows.forEach(function(row) {
        var filledCols = new Set();
        var rockCount = randomInt(7, 8);
        var i = 0;
        while (i < rockCount) {
            var col = randomInt(MAP.minXTile, MAP.maxXTile);
            if (filledCols.has(col)) {
               // rock already there, try again
            } else {
                allEnemies.push(new Rock(col, row));
                filledCols.add(col);
                i++;
            }
        }
    });

    // create player
    player = new Player(MAP.minXTile - 1, MAP.maxYTile);
};
startGame();


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

var VictorySequence = function() {
    screenText.displayVictory = true;
    screenText.victoryCounter = 0;
}

var ScreenText = function() {
    this.displayScore = true;
    this.displayVictory = false;
    this.victoryCounter = 0;
};

ScreenText.prototype.update = function(dt) {
    this.victoryCounter += dt;
    if (this.victoryCounter > 5) {
        this.displayVictory = false;
    }
}

ScreenText.prototype.render = function() {
    if (this.displayScore) {
        ctx.font = '40px serif';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#fff';
        ctx.fillText('LIVES: ' + player.lives, 15, MAP.tile.height * 0.8);
    }
    if (this.displayVictory) {
        ctx.font = '120px san-serif';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#ff0';
        ctx.fillText('WINNER', MAP.tile.width * MAP.maxXTile * 0.3, MAP.tile.height * MAP.maxYTile * 0.5);
    }
};
var screenText = new ScreenText;

function clamp(number, min, max) {
    // clamp number between min / max value
    return number < min ? min : number > max ? max : number;
}

function randomInt(lower, upper) {
    //generates a random int between lower & upper (both inclusive)
    return Math.floor(Math.random() * (upper - lower + 1) + lower);
}
