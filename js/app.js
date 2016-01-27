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
var MAP = new Map();


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
 * Game state class, used for tracking what the current behaviour of the game should be.
 */
var GameState = function() {
    // start the game with the intro
    this.state = GameStatesEnum.INTRO;
    // Count up till the end of the game after win / loss
    this.gameEndCounter = 0;
};

/*
 * Games state updater, called by the engine.
 * Currently just counts up to the end of the game after victory / loss
 */
GameState.prototype.update = function(dt) {
    // if th
    if (this.state == GameStatesEnum.VICTORY || this.state == GameStatesEnum.LOSE) {
        this.gameEndCounter += dt;
        if (this.gameEndCounter > 5) {
            newGame();
        }
    }
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
    // width of the entity - used for collision detection
    this.width = 100;
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
    // width of the entity - used for collision detection
    this.width = 100;

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
    // width of the entity - used for collision detection
    this.width = 100;

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
    // radius of the entity - used for collision detection
    this.width = 60;

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
 * update the player's position for intro animation
 * parameter: dt, a time delta between ticks
 */
Player.prototype.introAnimate = function(dt) {
    if (!this.jump) {
        // There's no jump, start the first one
        this.jumpCount = 0;
        this.jump = new Jump(this.tileX, this.tileY, this.tileX + 1, this.tileY);
    } else if (this.jumpCount == 4 && this.jump.finished) {
        // Made it to destination, set tile coords and game state to normal
        this.tileX++;
        gameState.state = GameStatesEnum.NORMAL;
        this.jump = false;
    } else if (this.jump.finished) {
        // Last jump finished, start a new one
        this.tileX++;
        this.jump = new Jump(this.tileX, this.tileY, this.tileX + 1, this.tileY);
        this.jumpCount++;
    } else {
        // Normal jump update - jump calculates dx, dy, dz at
        // each point of the jump and those values are added to x & y.
        // dz is added to y as it appears on the same axis
        // When the jump is complete update the tile coords.
        this.jump.update(dt);
        this.x += this.jump.dx;
        this.y += this.jump.dyz;
    }
};

/*
 * update the player's rotation for death animation
 * parameter: dt, a time delta between ticks
 */
Player.prototype.deathAnimate = function(dt) {
    this.deathTimer += dt;
    // rotate to max value of pi/2
    this.rotation = Math.min(Math.PI * (this.deathTimer) * 2, Math.PI / 2);
    if (this.deathTimer > 1.3) {
        // Death anim complete
        this.state = EntityStateEnum.RESPAWNING;
    }
};

/*
 * update the player's position for the victory animation
 * parameter: dt, a time delta between ticks
 */
Player.prototype.victoryAnimate = function(dt) {
    if (!this.jump) {
        // Start first jump (initial jump y value is 1 down from current, location
        // so that the player jumps from that location, to their currenct location)
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


/*
 * update the player's position for the respawn animation
 * parameter: dt, a time delta between ticks
 */
Player.prototype.respawnAnimate = function(dt) {
    if (!this.jump) {
        this.rotation = 0;
        // Start first jump - jump back to start location
        this.jump = new Jump(this.tileX, this.tileY, MAP.startX, MAP.startY);
    } else if (this.jump.finished) {
        // Made it to destination, go back to normal mode
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

/*
 * Player collision method, checks collision with everything in the allEnemies array,
 * if any collisions occur it returns true, otherwise it returns false.
 * If the a collided enemy has the deadly property set to true, the players life count
 * is decremented, and it's state is set to dead. The enemies collieded method is also
 * called.
 */
Player.prototype.collision = function() {
    // plr used for keeping a reference to the player in the inner function
    var plr = this;
    var collided = false;
    allEnemies.forEach(function(enemy) {
        // Collision detection on x axis.
        // If the distance between the is less than 1/2 the sum of the player and
        // enemy widths, then a collision has occured.
        var dist = Math.abs(plr.x - enemy.x);
        if (dist <= (plr.width + enemy.width) / 2) {
            var collideX = true;
        } else {
            var collideX = false;
        }
        // Collision detection y axis, both player and enemys stay on discrete y
        // levels, so just check if they are on the same level.
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

/*
 * Handle key board input update player tile coords based on arrow key input
 * parameter: key, name of the key pressed(left, right, up, down)
 */
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

/*
 * Jump class - used to calculate the dx, dy values of jumping entity.
 * parameters: startXTile, startYTile - the tile coords of the start the jump
 *             destXTile, destYTile - the tile coords of the end of the jump
 */
var Jump = function(startXTile, startYTile, destXTile, destYTile) {
    // coords of the jump, relative to start location
    this.x = 0;
    this.y = 0;
    this.z = 0
    // coords of the destination, relative to the start location
    this.destX = (destXTile - startXTile) * MAP.tile.width;
    this.destY = (destYTile - startYTile) * MAP.tile.height;
    // jump surface distance
    this.jumpDist = Math.sqrt(Math.pow(this.destX, 2) + Math.pow(this.destY, 2));
    // jump height (z cord
    this.jumpHeight = -0.5 * this.jumpDist;
    // surface speed of the jump
    this.speed = 150;
    // time to complete jump, used for checking if final timestep has overshot
    this.jumpTime = 0;
    this.finalJumpTime = this.jumpDist / this.speed;
    // u, v - x, y speeds
    this.u = this.speed * this.destX / this.jumpDist;
    this.v = this.speed * this.destY / this.jumpDist;
    // is the jump complete
    this.finished = false;
};

/*
 * Update the dx & dyz values of the jump.
 * dyz is the sum dy & dz
 * These values are used to update the jumping entite's x * y values respectively.
 * parameter: dt, a time delta between ticks
 */
Jump.prototype.update = function(dt) {
    this.jumpTime += dt;
    // If the total time of the jump is greater than the finalJump time the jump
    // will overshoot, so reduce dt such the jump will end at the correct time
    // and won't overshoot.
    if (this.jumpTime > this.finalJumpTime) {
        dt = dt - (this.jumpTime - this.finalJumpTime);
        this.finished = true;
    }
    // calculate dx & dy, and update x & y
    this.dx = this.u * dt;
    this.dy = this.v * dt;
    this.x += this.dx;
    this.y += this.dy;
    // calculate dz and z from x & y
    var dz = this.calculateZ(this.x, this.y) - this.z;
    this.z += dz;
    // set dyz from dy & dz
    this.dyz = this.dy + dz;
};

/*
 * Calculate jump z from x & y, based on the quadratic eqn:
 * z = (4H/D)(x - (x^2)/D), where D is the distance of the jump and H is the height of the jump
 */
Jump.prototype.calculateZ = function(x, y) {
    var dist = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    var z = (4 * this.jumpHeight / this.jumpDist) * (dist - Math.pow(dist, 2) / this.jumpDist);
    return z;
};

/*
 * Screen text function, used for displaying text on the screen.
 * called by the engine
 */
renderScreenText = function() {
    // display current player lives
    ctx.font = '40px serif';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.fillText('LIVES: ' + player.lives, 15, MAP.tile.height * 0.8);

    if (gameState.state == GameStatesEnum.VICTORY || gameState.state == GameStatesEnum.LOSE) {
        // Set up victory / loss text style and display, with text depending on the state.
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

/*
 * Proceedure to setup a new game - adds all the entities, and creates a new game state.
 */
var createEnemies = function() {
    // the all enemies array
    var allEnemies = []
    // y rows to contain bugs
    var bugRows = [1, 3, 4];
    // generate random bugs in each row and push to allEnemies
    bugRows.forEach(function(row) {
        var bugCount = randomInt(3, 5);
        for (var i = 0; i < bugCount; i++) {
            allEnemies.push(new Bug(randomInt(MAP.minXTile, MAP.maxXTile), row));
        }
    });

    // Generate the rocks. The top and bottom rows have only one gap, but
    // middle row has more gaps to allow intermediate hiding locations for 
    // the player going left or right.

    // Top & bottom rows
    var missingRock;
    [2, 6].forEach(function(row) {
        // randomly generate one empty space
        missingRock = randomInt(MAP.minXTile, MAP.maxXTile);
        for (var col = 0; col <= MAP.maxXTile; col++) {
            // fill up all the tiles in the row except the missing one
            if (col != missingRock) {
                allEnemies.push(new Rock(col, row));
            }
        }
    });

    // Middle row (one missing rock must align with one below)
    var row = 5;
    var rockCount = 6;
    // set containing all the tiles which already have rock in them
    var addedRocks = new Set();
    var addedRockCount = 0;
    while (addedRockCount < rockCount) {
        // Keep trying to add rocks until up to the rock count
        // will fail and try again if the generate value is already in 
        // the set or the required missing tile
        col = randomInt(MAP.minXTile, MAP.maxXTile);
        if (col != missingRock && !addedRocks.has(col)) {
            allEnemies.push(new Rock(col, row));
            addedRocks.add(col);
            addedRockCount++;
        }
    }
    return allEnemies

    // create the game state
    gameState = new GameState();
};

/*
 * Global objects
 */
var allEnemies = createEnemies();
// player starts offscreen and jumps on
var player = new Player(MAP.minXTile - 1, MAP.maxYTile);
var gameState = new GameState();


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

/*
 * Clamp number between min / max value.
 */
function clamp(number, min, max) {
    return number < min ? min : number > max ? max : number;
}

/*
 * Generates a random int between lower & upper (both inclusive).
 */
function randomInt(lower, upper) {
    return Math.floor(Math.random() * (upper - lower + 1) + lower);
}
