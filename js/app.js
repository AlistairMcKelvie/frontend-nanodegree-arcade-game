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
        IMAGES.stone,
        IMAGES.grass,
        IMAGES.grass
    ],
    this.minXTile = 0,
    this.maxXTile = 8,
    this.minYTile = 0,
    this.maxYTile = this.rows.length - 1,
    this.tile = {
        width: 101,
        height: 83
    }
    this.startX = Math.ceil(this.maxXTile / 2);
    this.startY = this.maxYTile;
};
var MAP = new Map;

var GameStatesEnum = {
    INTRO: 1,
    NORMAL: 2,
    VICTORY: 3,
    LOSE: 4
};

var EntityStateEnum = {
    NORMAL: 1,
    DEAD: 2,
    RESPAWNING: 3
};

COLLISION_ON = true;

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
    this.state = EntityStateEnum.NORMAL;
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
    if (this.state == EntityStateEnum.DEAD) {
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
    this.state = EntityStateEnum.DEAD;
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
};
Player.prototype = new GameEntity;

Player.prototype.update = function(dt) {
    switch (gameState.state) {
        case GameStatesEnum.INTRO:
            this.introAnimate(dt);
            break;
        case GameStatesEnum.NORMAL:
            if (this.state == EntityStateEnum.DEAD) {
                this.deathAnimate(dt);
            } else if (this.state == EntityStateEnum.RESPAWNING) {
                this.respawnAnimate(dt);
            } else {
                this.normalUpdate();
            }
            break;
        case GameStatesEnum.VICTORY:
            this.victoryAnimate(dt);
            break;
        case GameStatesEnum.LOSE:
            this.deathAnimate(dt);
    }
};

Player.prototype.normalUpdate = function() {
    this.tileX = clamp(this.tileX, MAP.minXTile, MAP.maxXTile);
    this.tileY = clamp(this.tileY, MAP.minYTile, MAP.maxYTile);
    if (this.tileY <= MAP.minYTile) {
        // WINNER!
        gameState.state = GameStatesEnum.VICTORY;
    } else {
        // save this pos may have to go back to it after collision
        var oldX = this.x;
        var oldY = this.y;
        this.x = MAP.tile.width * this.tileX + this.xOffset;
        this.y = MAP.tile.height * this.tileY + this.yOffset;
        this.collision();
        if (player.collided) {
            // deny move and go back last pos
            this.x = oldX;
            this.y = oldY;
            this.tileX = (this.x - this.xOffset) / MAP.tile.width;
            this.tileY = (this.y - this.yOffset) / MAP.tile.height;
            console.log('colided xy: ' + this.tileX + ', ' + this.tileY);
            this.collided = false;
        }
    }
};

Player.prototype.introAnimate = function(dt) {
    if (!this.jump) {
        // Start first jump
        this.jump = new Jump(this.tileX, this.tileY, this.tileX + 1, this.tileY);
    } else if (this.x >= MAP.startX * MAP.tile.width + this.xOffset) {
        // Made it to destination
        this.tileX = MAP.startX;
        this.tileY = MAP.startY;
        gameState.state = GameStatesEnum.NORMAL;
        this.jump = false;
    } else if (this.jump.finished) {
        // Update tile values
        this.tileX = this.jump.destXTile;
        this.tileY = this.jump.destYTile;
        this.x = MAP.tile.width * this.tileX + this.xOffset;
        this.y = MAP.tile.height * this.tileY + this.yOffset;
        // Start a new jump
        this.jump = new Jump(this.tileX, this.tileY, this.tileX + 1, this.tileY);
        this.jump.update(dt);
        this.x += this.jump.xUpdateVal;
        this.y += this.jump.yUpdateVal;
    } else {
        // normal jump update
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
        this.state = EntityStateEnum.RESPAWNING;
    }
};

Player.prototype.victoryAnimate = function(dt) {
    if (!this.jump) {
        // Start first jump
        this.jump = new Jump(this.tileX, this.tileY + 1, this.tileX, this.tileY);
    } else if (this.jump.finished) {
        // Made it to destination
    } else {
        // normal jump update
        this.jump.update(dt);
        this.x += this.jump.xUpdateVal;
        this.y += this.jump.yUpdateVal;
    }
};

Player.prototype.respawnAnimate = function(dt) {
    if (!this.jump) {
        this.rot = 0;
        // Start first jump
        this.jump = new Jump(this.tileX, this.tileY, MAP.startX, MAP.startY);
    } else if (this.jump.finished) {
        // Made it to destination
        this.tileX = MAP.startX;
        this.tileY = MAP.startY;
        gameState.state = GameStatesEnum.NORMAL;
        this.state = EntityStateEnum.NORMAL;
        this.jump = false;
    } else {
        // normal jump update
        this.jump.update(dt);
        this.x += this.jump.xUpdateVal;
        this.y += this.jump.yUpdateVal;
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
                plr.state = EntityStateEnum.DEAD;
                plr.deathTimer = 0;
                plr.lives--;
                if (plr.lives <= 0) {
                    gameState.state = GameStatesEnum.LOSE;
                }
            }
            enemy.collide();
        }
    })
};

Player.prototype.handleInput = function(key) {
    if (gameState.state == GameStatesEnum.NORMAL && this.state == EntityStateEnum.NORMAL) {
        switch (key) {
            case "left":
                this.tileX -= 1;
                break;
            case "right":
                this.tileX += 1;
                break;
            case "up":
                this.tileY -= 1;
                break;
            case "down":
                this.tileY += 1;
        }
        console.log('player xy: ' + this.x + ', ' + this.y);
    }
};

var Jump = function(startXTile, startYTile, destXTile, destYTile) {
    console.log('start XY, dest XY: ' + startXTile + ' ' + startYTile + ', ' + destXTile + ' ' + destYTile);
    this.destXTile = destXTile;
    this.destYTile = destYTile;
    this.xProgress = 0;
    this.yProgress = 0;
    this.destXOffset = (destXTile - startXTile) * MAP.tile.width;
    this.destYOffset = (destYTile - startYTile) * MAP.tile.height;
    this.jumpDist = Math.sqrt(Math.pow(this.destXOffset, 2) + Math.pow(this.destYOffset, 2));
    this.jumpHeight = -this.jumpDist;
    this.speed = 300;
    this.dx = this.speed * this.destXOffset / this.jumpDist;
    this.dy = this.speed * this.destYOffset / this.jumpDist;
    this.finished = false;
};

Jump.prototype.update = function(dt) {
    // jump eqn z = (4h/d)(x - (x^2)/d)
    // jump dz = (4h/d)(1 - 2x/d)
    var newXProg = this.xProgress + this.dx * dt;
    var newYProg = this.yProgress + this.dy * dt;
    var prog = Math.sqrt(Math.pow(newXProg, 2) + Math.pow(newYProg, 2));
    dz = (4 * this.jumpHeight / this.jumpDist) * (1 - 2 * prog / this.jumpDist);
    this.xUpdateVal = newXProg - this.xProgress;
    this.yUpdateVal = newYProg - this.yProgress + dz;
    this.xProgress = newXProg;
    this.yProgress = newYProg;
    if (prog >= this.jumpDist) {
        this.finished = true;
    }
};

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player
//
var allEnemies;
var player;
var GameState = function() {
    this.state = GameStatesEnum.INTRO;
    this.gameEndCounter = 0;
};

GameState.prototype.update = function(dt) {
    if (this.state == GameStatesEnum.VICTORY || this.state == GameStatesEnum.LOSE) {
        this.gameEndCounter += dt;
        if (this.gameEndCounter > 5) {
            newGame();
        }
    }
};

var newGame = function() {
    // Generate random enemies
    allEnemies = [];
    var bugRows = [1, 3, 6];
    bugRows.forEach(function(row) {
        var bugCount = randomInt(2, 5);
        for (var i = 0; i < bugCount; i++) {
            allEnemies.push(new Bug(randomInt(MAP.minXTile, MAP.maxXTile), row));
        }
    });

    // Top & bottomg rows
    var missingRock;
    [2, 5].forEach(function(row) {
        missingRock = randomInt(MAP.minXTile, MAP.maxXTile);
        for (var col = 0; col <= MAP.maxXTile; col++) {
            if (col != missingRock) {
                allEnemies.push(new Rock(col, row));
            }
        }
    });
    // Middle row (one missing rock mus align with one below)
    var row = 4;
    var rockCount = 6;
    var addedRocks = new Set();
    var i = 0;
    while (i < rockCount) {
        // extra random rocks, can put rocks on top of each other, but thats ok
        col = randomInt(MAP.minXTile, MAP.maxXTile);
        if (col != missingRock && !addedRocks.has(col)) {
            allEnemies.push(new Rock(col, row));
            addedRocks.add(col);
            i++;
        }
    }

    // create player
    player = new Player(MAP.minXTile - 1, MAP.maxYTile);

    gameState = new GameState();
};
newGame();


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

var ScreenText = function() {
};

ScreenText.prototype.render = function() {
    ctx.font = '40px serif';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.fillText('LIVES: ' + player.lives, 15, MAP.tile.height * 0.8);
    if (gameState.state == GameStatesEnum.VICTORY || gameState.state == GameStatesEnum.LOSE) {
        ctx.font = '120px san-serif';
        ctx.fillStyle = '#ff0';
        ctx.textAlign = 'center';
        if (gameState.state == GameStatesEnum.VICTORY) {
            var text = 'WINNER!';
        } else {
            var text = 'YOU LOSE.';
        }
        ctx.fillText(text, MAP.tile.width * (MAP.maxXTile + 1) * 0.5, MAP.tile.height * (MAP.maxYTile + 1) * 0.5);
        ctx.strokeText(text, MAP.tile.width * (MAP.maxXTile + 1) * 0.5, MAP.tile.height * (MAP.maxYTile + 1) * 0.5);
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
