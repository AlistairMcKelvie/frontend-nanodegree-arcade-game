// for testing
COLLISION_ON = true;

/*
 * All images used in the game. No longer added in engine, just add them here.
 */
var IMAGES = {
    water: 'images/water-block.png',
    grass: 'images/grass-block.png',
    stone: 'images/stone-block.png',
    bug: 'images/enemy-bug.png',
    rock: 'images/Rock.png',
    player: 'images/char-boy.png'
};

/*
 * Map class, change values here to modify map
 */
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

/*
 * Various states which the game / entities can be in.
 */
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

/*
 * GameEntity class, used as prototype for player and enemies.
 * Parameters: initX, initY - tile coords to create entity at.
 */
var GameEntity = function(initTileX, initTileY) {
    // current tile
    this.tileX = initTileX;
    this.tileY = initTileY;
    // offset values to draw entity in correct part of tile
    this.xOffset = 0;
    this.yOffset = -30;
    // current rotation in radians
    this.rotation = 0;
    // calculate coords from tile values
    this.x = MAP.tile.width * this.tileX + this.xOffset;
    this.y = MAP.tile.height * this.tileY + this.yOffset;
    // the centre point of the entity which it rotates on if rotation occurs
    this.rotPtX = 50.5;
    this.rotPtY = 125;
    // radius of the entity - used for collision detection
    this.collisionWidth = 50;
    // will this entity kill with player on collision, override this in children
    this.deadly = false;

    this.state = EntityStateEnum.NORMAL;
}

GameEntity.prototype.render = function() {
    // Render the entity:
    // - translate the canvas origin to the center of rotation of the entity
    // - rotate the canvas
    // - draw the image at the origin of the canvas
    // - restore the canvas back to how it was before
    ctx.save();
    ctx.translate(this.x + this.rotPtX, this.y  + this.rotPtY);
    ctx.rotate(this.rotation);
    ctx.drawImage(Resources.get(this.sprite), -this.rotPtX, -this.rotPtY);
    ctx.restore();
};



/*
 * Enemy class, which the various enemy class use as a prototype.
 * Currently it has no properties different to to it's parent GameEntity, and is empty.
 * Parameters: initX, initY - tile coords to create entity at.
 */
var Enemy = function(initTileX, initTileY) {
    this.base = GameEntity;
    this.base(initTileX, initTileY);
}
Enemy.prototype = new GameEntity;

/*
 * Bug enemy class.
 * Parameters: initX, initY - tile coords to create entity at.
 */
var Bug = function(initTileX, initTileY) {
    this.base = Enemy;
    this.base(initTileX, initTileY);
    // initial speed, random value 0-700
    this.u = Math.random() * 700;
    this.v = 0;
    // target speed, initally set to current speed, will be updated later
    this.uTarget = this.u;
    // timer until a new speed is set
    this.uChangeTimer = (Math.random()) * 3;
    // bugs kill player on collision
    this.deadly = true;

    this.sprite = IMAGES.bug;
};
Bug.prototype = new Enemy;

/*
 * Update the bugs's position, required method for game
 * Parameter: dt, a time delta between ticks
 */
Bug.prototype.update = function(dt) {
    // call update function based on state
    if (this.state == EntityStateEnum.DEAD) {
        this.deathAnimate(dt);
    } else {
        this.normalUpdate(dt);
    }
};

/*
 * Bug update if it's in it's normal state
 * Parameter: dt, a time delta between ticks
 */
Bug.prototype.normalUpdate = function(dt) {
    // countdown for new target speed
    this.uChangeTimer -= dt;
    if (this.uChangeTimer <= 0) {
        // generate a new target speed, if it's currently stationary
        // set a random speed, otherwise stop it
        if (this.uTarget == 0) {
            this.uTarget = Math.random() * 700;
            this.uChangeTimer = 2;
        } else {
            this.uTarget = 0;
            this.uChangeTimer = 0.5;
        }
    }
    // accelerate towards target speed
    this.u += (this.uTarget - this.u) * 0.25;
    // update position
    this.x += dt * this.u;
    // wrap back on to the left if it's off screen
    if (this.x > ctx.canvas.width) {
        this.x = this.x % ctx.canvas.width;
    }
}

/*
 * Bug update if it's dead
 * Parameter: dt, a time delta between ticks
 */
Bug.prototype.deathAnimate = function(dt) {
    // only animate if it's on screen
    if (this.x > -100) {
        // accelerate downwards
        this.v += 400 * dt;
        // update pos
        this.x += this.u * dt;
        this.y += this.v * dt;
        // spin
        this.rotation -= 2 * Math.PI * dt;
    }
};

/*
 * Bug collided
 */
Bug.prototype.collide = function() {
    // set it's tile y offscreen so it can't collide anymore
    this.tileY = -1;
    // switch it's speed so if flies away
    // this would be better if if the player had a speed property,
    // but it doesn't so this will do.
    this.u = -this.u;

    this.state = EntityStateEnum.DEAD;
}

/*
 * Rock enemy class.
 * Parameters: initX, initY - tile coords to create entity at.
 */
var Rock = function(initTileX, initTileY) {
    this.base = Enemy;
    this.base(initTileX, initTileY);
    this.sprite = IMAGES.rock;
}
Rock.prototype = new Enemy;

Rock.prototype.update = function() {
    // I'm a rock - do nothing
};

Rock.prototype.collide = function() {
    // I'm a rock - do nothing
};

/*
 * Player class
 * Parameters: initX, initY - tile coords to create entity at
 */
var Player = function(initTileX, initTileY) {
    this.base = GameEntity;
    this.base(initTileX, initTileY);
    // current player lives
    this.lives = 3;

    this.sprite = IMAGES.player;
};
Player.prototype = new GameEntity;

/*
 * update the player's position
 * parameter: dt, a time delta between ticks
 */
Player.prototype.update = function(dt) {
    // select appropriate update method, based on game & player state
    switch (gameState.state) {
        case GameStatesEnum.INTRO:
            this.introAnimate(dt);
            break;
        case GameStatesEnum.VICTORY:
            this.victoryAnimate(dt);
            break;
        case GameStatesEnum.LOSE:
            this.deathAnimate(dt);
            break;
        default:
            switch (this.state) {
                case EntityStateEnum.DEAD:
                    this.deathAnimate(dt);
                    break;
                case EntityStateEnum.RESPAWNING:
                    this.respawnAnimate(dt);
                    break;
                default:
                    this.normalUpdate();
            }
    }
};

/*
 * update the player's position if player and game states are normal
 * parameter: dt, a time delta between ticks
 */
Player.prototype.normalUpdate = function() {
    // clamp position inside the maps bounds
    this.tileX = clamp(this.tileX, MAP.minXTile, MAP.maxXTile);
    this.tileY = clamp(this.tileY, MAP.minYTile, MAP.maxYTile);
    // if player is in top row of map set state to victory
    if (this.tileY <= MAP.minYTile) {
        gameState.state = GameStatesEnum.VICTORY;
    } else {
        // save current pos as we may have to revert to it after collision
        var oldX = this.x;
        var oldY = this.y;
        this.x = MAP.tile.width * this.tileX + this.xOffset;
        this.y = MAP.tile.height * this.tileY + this.yOffset;

        // run collision method, if any collisions are detected
        // it will return true
        if (this.collision()) {
            // if collision occured set position back to old position
            this.x = oldX;
            this.y = oldY;
            this.tileX = (this.x - this.xOffset) / MAP.tile.width;
            this.tileY = (this.y - this.yOffset) / MAP.tile.height;
        }
    }
};

/*
 * update the player's position, for intro animation
 * parameter: dt, a time delta between ticks
 */
Player.prototype.introAnimate = function(dt) {
    if (!this.jump) {
        this.jumpCount = 0;
        this.jump = new Jump(this.tileX, this.tileY, this.tileX + 1, this.tileY);
    } else if (this.jumpCount == 4 && this.jump.finished) {
        // Made it to destination, set tile coords and game state to normal
        this.tileX = MAP.startX;
        this.tileY = MAP.startY;
        gameState.state = GameStatesEnum.NORMAL;
        this.jump = false;
    } else if (!this.jump || this.jump.finished) {
        // Last jump finished, start a new one
        // Start a new jump
        this.jump = new Jump(this.tileX, this.tileY, this.tileX + 1, this.tileY);
        this.jumpCount++;
    } else {
        // normal jump update
        this.jump.update(dt);
        this.x += this.jump.dx;
        this.y += this.jump.dyz;
    }
};

Player.prototype.deathAnimate = function(dt) {
    this.deathTimer += dt;
    this.rotation = Math.min(Math.PI * (this.deathTimer) * 2, Math.PI / 2);
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
        this.x += this.jump.dx;
        this.y += this.jump.dyz;
    }
};

Player.prototype.respawnAnimate = function(dt) {
    if (!this.jump) {
        this.rotation = 0;
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
        this.x += this.jump.dx;
        this.y += this.jump.dyz;
    }
};

Player.prototype.collision = function() {
    var plr = this;
    var collided = false;
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
            collided = true;
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
    return collided;
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
    this.x = 0;
    this.y = 0;
    this.destX = (destXTile - startXTile) * MAP.tile.width;
    this.destY = (destYTile - startYTile) * MAP.tile.height;
    this.jumpDist = Math.sqrt(Math.pow(this.destX, 2) + Math.pow(this.destY, 2));
    this.jumpHeight = -0.5 * this.jumpDist;
    this.speed = 150;
    this.finalJumpTime = this.jumpDist / this.speed;
    this.jumpTime = 0;
    this.u = this.speed * this.destX / this.jumpDist;
    this.v = this.speed * this.destY / this.jumpDist;
    this.z = 0
    this.finished = false;
};

Jump.prototype.update = function(dt) {
    this.jumpTime += dt;
    // jump z = (4h/d)(x - (x^2)/d)
    if (this.jumpTime > this.finalJumpTime) {
        dt = dt - (this.jumpTime - this.finalJumpTime);
        this.finished = true;
    }
    this.dx = this.u * dt;
    this.dy = this.v * dt;
    this.x += this.dx;
    this.y += this.dy;
    var dist = Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    var dz = (4 * this.jumpHeight / this.jumpDist) * (dist - Math.pow(dist, 2) / this.jumpDist) - this.z;
    this.z += dz;
    this.dyz = this.dy + dz;
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
        var bugCount = randomInt(3, 5);
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
