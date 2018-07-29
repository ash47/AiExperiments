const gameWidth = window.innerWidth;
const gameHeight = window.innerHeight;

// Max screen position of a character
const maxPosition = gameWidth * 0.25;

// Height and camera settings
const floorHeight = 112;
const cameraSpeed = 5;

// Scaling the player / projectiles
const playerScale = 0.5;
const playerDuckScale = 0.25
const scaleProjectile = 0.5;

// How fast the projectiles move
const projectileSpeed = 750;

// How height we jump
const jumpHeight = 500;

// Max gravity
const maxGravity = 5000;

// Delay in shooting
const shootDelay = 0.5

// The AI stuff
var maxPlayers = 250;

class GameManager {
    constructor({manager}) {
        var _this = this;

        // Store brain
        this.manager = manager;

        // Game starts unactive
        this.gameActive = false;

        this.game = new Phaser.Game({
            type: Phaser.AUTO,
            width: gameWidth,
            height: gameHeight,
            physics: {
                default: 'arcade',
                arcade: {
                    debug: false,
                    //gravity: { y: 1000 }
                }
            },
            scene: {
                preload: function() {
                    _this.preload(this);
                },
                create: function() {
                    _this.create(this);
                },
                update: function() {
                    _this.update(this);
                }
            }
        });
    }

    preload(scene) {
        scene.load.image('blue_bg', 'img/blue_bg.jpg');        

        scene.load.image('floor', 'img/floor.png');        
        scene.load.image('roof', 'img/roof.png');        
        scene.load.image('projectile-2', 'img/projectile-2.png');  

        scene.load.spritesheet('ninja', 'img/ninja.png', {
	        frameWidth: 379,
	        frameHeight: 468
	    });      
    }

    create (scene) {
    	// Store the scene
    	this.scene = scene;

    	// Init animations
        this.scene.anims.create({
	        key: 'run',
	        frames: this.scene.anims.generateFrameNumbers('ninja', { start: 0, end: 5, first: 0 }),
	        frameRate: 18,
	        repeat: -1
	    });

    	// Craete the background
        var theBG = this.scene.add.sprite(0, 0, 'blue_bg')
            .setOrigin(0, 0);

        // Create the floor
        //this.floorGroup = this.scene.physics.add.staticGroup();
        //this.floorGroup.create(0, gameHeight - 100, 'grass');

        var floor = this.scene.add.tileSprite(0, 0, gameWidth, floorHeight, 'floor');
        floor.setOrigin(0, 0);
    	floor.setPosition(0, gameHeight - floorHeight);
    	this.scene.physics.add.existing(floor, false);
    	floor.body.allowGravity = false;
    	floor.body.immovable = true;
    	this.floor = floor;

    	var roof = this.scene.add.tileSprite(0, 0, gameWidth, floorHeight, 'roof');
        roof.setOrigin(0, 0);
    	roof.setPosition(0, 0);
    	this.scene.physics.add.existing(roof, false);
    	roof.body.allowGravity = false;
    	roof.body.immovable = true;
    	this.roof = roof;

    	// Create a store for all projectiles
    	this.projectileGroup = this.scene.physics.add.group();

        // Create all the players
        this.allPlayers = [];
        for(var i=0; i<maxPlayers; ++i) {
        	var xx = (i + 1) * maxPosition/(maxPlayers + 1);

        	this.createPlayer({xPosition: xx, manager: this});
        }

        // Create a store for all projectiles
        this.allProjectiles = [];

        // Tell the AI manager we're ready
        this.manager.onReady();

        // Hook clicking
        $('body').click(this.handleClick.bind(this));
        $('body').mousemove(this.handleMouseMove.bind(this));
    }

    // Add score to any players that are alive
    addScore() {
    	for(var i=0; i<this.allPlayers.length; ++i) {
    		var ply = this.allPlayers[i];
    		ply.addScore(1);
    	}
    }

    // Gets the next enemy for the given x position
    getNextProjectileInfo({xPosition}) {
    	for(var i=0; i<this.allProjectiles.length; ++i) {
    		var proj = this.allProjectiles[i];

    		var xPos = proj.getPositionX();

    		// Ignore this projectile if it is to our left
    		if(xPos < xPosition) continue;

    		// Calculate the x distance
    		var xDist = Math.abs(xPosition - xPos) / gameWidth;

    		// Grab the y position
    		var yPos = proj.getPositionY() / gameHeight;

    		// Grab the projectile AFTER this one
    		var proj2 = this.allProjectiles[i+1];

    		// Default the projectile distance to be 1
    		var projDist = 1;

    		if(proj2 != null) {
    			projDist = Math.abs(xPos - proj2.getPositionX()) / gameWidth;
    		}

    		return {
    			xDist: xDist,
    			yPos: yPos,
    			projDist: projDist
    		};
    	}

    	// No oncoming projectiles
    	return {
			xDist: 1,
			yPos: 0.5,
			projDist: 1
		};
    }

    handleClick(e) {
    	this.attemptToShoot({yPosition: e.clientY});
    }

    attemptToShoot({yPosition}) {
    	// Prevent mass spamage
    	if(this.cantShoot) return;
    	this.cantShoot = true;

    	// Create the projectile
    	this.createProjectile({yPosition: yPosition});

    	var _this = this;
    	setTimeout(function() {
    		_this.cantShoot = false;
    	}, shootDelay * 1000);
    }

    handleMouseMove(e) {
    	this.currentMouseX = e.clientX;
    	this.currentMouseY = e.clientY;
    }

    // Creates a projectile
    createProjectile({yPosition}) {
    	var proj = this.projectileGroup.create(gameWidth, yPosition, 'projectile-2');
    	proj.body.allowGravity = false;
    	proj.setVelocityX(-projectileSpeed);
    	proj.scaleX = scaleProjectile;
    	proj.scaleY = scaleProjectile;

    	var logicProj = new Projectile({sprite: proj, manager: this});
    	this.allProjectiles.push(logicProj);
    }

    createPlayer({xPosition}) {
    	// Create a physics object for this player
    	var sprite = this.scene.physics.add.sprite(xPosition, gameHeight / 2, 'ninja');
    	sprite.anims.play('run');
    	sprite.setBounce(0.2);

    	sprite.setGravity(0, maxGravity);

    	//sprite.body.setGravity(10, 10);

    	// Adjust bounding box
    	sprite.setSize(130, 350).setOffset(130, 100);

    	sprite.scaleX = playerScale;
    	sprite.scaleY = playerScale;

    	// Add collisions
    	this.scene.physics.add.collider(sprite, this.floor);
    	this.scene.physics.add.collider(sprite, this.roof);

    	// Add projectile collisions
    	this.scene.physics.add.overlap(sprite, this.projectileGroup, this.onPlayerCollision, null, this);

    	// Create the logical player
    	var ply = new Player({sprite: sprite, manager: this});

    	this.allPlayers.push(ply);
    }

    onPlayerCollision(ply, proj) {
    	// Player is now dead
    	ply.logic.setDead(true);

    	// Update the display of the best brain
    	this.manager.displayBestBrain();
    }

    reset(brains) {
        for(var i=0; i<maxPlayers; ++i) {
        	// Grab a player
        	var ply = this.allPlayers[i];

        	// Store the brain
        	ply.setBrain(brains[i]);
        	ply.setDead(false);
        	ply.resetHeight();
        }

        // The game is now active
        this.gameActive = true;
    }

    removeAllProjectiles() {
    	// Loop over all projectiles
    	for(var i=0; i<this.allProjectiles.length; ++i) {
        	var proj = this.allProjectiles[i];

        	// Kill it
        	proj.destroy();
        }

        // Reset projectiles array
        this.allProjectiles = [];
    }

    update(scene) {
    	// Stop right here if the game isn't active
        if(!this.gameActive) return;

        // Move the floor
        if(this.floor != null) this.floor.tilePositionX += cameraSpeed;
        if(this.roof != null) this.roof.tilePositionX += cameraSpeed;

        var allDead = true;

        // Run the logic for each player
        for(var i=0; i<this.allPlayers.length; ++i) {
        	// Grab a player
        	var ply = this.allPlayers[i];

        	// Update the player
        	ply.update();

        	// Is it dead?
        	if(!ply.isDead()) {
        		// Player not dead, game isn't over
        		allDead = false;
        	}
        }

        // Run the logic for each projectile
        for(var i=0; i<this.allProjectiles.length; ++i) {
        	var proj = this.allProjectiles[i];

        	// Run the update
        	proj.update();

        	// Is it dead?
        	if(proj.dead) {
        		this.allProjectiles.splice(i, 1);

        		// Roll i back one so we don't miss any projectiles
        		--i;

        		// Process next one
        		continue;
        	}
        }

        // Is everyone dead?
        if(allDead) {
        	// Tell the AI manager that the game ended
        	this.manager.onGameFinish();
        }

        if(this.currentMouseX <= gameWidth * .75) {
        	this.attemptToShoot({yPosition: floorHeight + Math.random() * (gameHeight - floorHeight * 2)});
        }
    }
}

// The projectiles
class Projectile {
	constructor({sprite, manager}) {
		this.sprite = sprite;
		this.manager = manager;

		// We are not dead
		this.dead = false;
	}

	// Marks ourselves for delation and kills our sprite
	destroy() {
		this.dead = true;
		this.sprite.destroy();
	}

	update() {
		if(this.dead) return;

		this.sprite.angle -= Math.PI;

		// Are we off the left side of the screen?
		if(this.sprite.x < 0 - this.sprite.width) {
			// Tell the manager to add points
			this.manager.addScore();

			// Self destruct
			this.destroy();
		}
	}

	getPositionX() {
		return this.sprite.x;
	}

	getPositionY() {
		return this.sprite.y;
	}
}

// The player on the screen
class Player {
	constructor({sprite, manager}) {
		// All players start dead
		this.dead = true;

		// Store the manager
		this.manager = manager;

		// Store our local sprite
		this.sprite = sprite;

		// Store ourselves into the sprite
		this.sprite.logic = this;

		// We are not ducking to start with
		this.isDucked = false;

		// Store our scale
		this.myScale = playerScale;

		// Default as 1 gravity
		this.ourGravity = 1;
	}

	// Adds score
	addScore(amount) {
		// Dead brains dont get rewarded
		if(this.isDead()) return;

		// Add to the score
		this.brain.score += amount;
	}

	setBrain(brain) {
		// Store the brain
		this.brain = brain;

		// Reset score
		this.brain.score = 0;
	}

	isDead() {
		return this.dead;
	}

	setDead(state) {
		this.dead = state;

		// Turn gravity and stuff on based on our state
		this.sprite.body.allowGravity = !state;
		this.sprite.body.immovable = state;
		this.sprite.body.setVelocity(0, 0);

		if(this.dead) {
			// Set our y position to be way up in the air
			this.sprite.setPosition(this.sprite.x, -1000);
		}
	}

	jump(jumpPower) {
		// Can't jump while ducked
		if(this.isDucked) return;

		if(this.sprite.body.touching.down) {
			this.sprite.setVelocityY(-jumpHeight * jumpPower);
		}
	}

	setDuck(state) {
		// Are we already ducked?
		if(this.isDucked == state) return;

		// Can't change duck state in air
		if(!this.sprite.body.touching.down) return;

		var heightDiff =  this.sprite.height * playerScale / 2 - this.sprite.height * playerDuckScale / 2;

		this.isDucked = state;
		if(this.isDucked) {
			// Update Scale
			this.sprite.scaleY = playerDuckScale;

			// Update position
			this.sprite.setPosition(this.sprite.x, this.sprite.y + heightDiff - 4);

			// Store our scale
			this.myScale = playerDuckScale;
		} else {
			// Update Scale
			this.sprite.scaleY = playerScale;

			// Update position
			this.sprite.setPosition(this.sprite.x, this.sprite.y - heightDiff - 4);

			// Store our scale
			this.myScale = playerScale;
		}
	}

	update() {
		// Are we dead?
		if(this.dead) return;

		// We only run the AI if we are touching the ground
		//if(this.sprite.body.touching.down) {
			var projInfo = this.manager.getNextProjectileInfo({xPosition: this.sprite.x});

			// Calculate the inputs
			var brainInputs = [
				// Our current scale (basically if we are ducking or not)
				//this.myScale,

				// Height difference to next projectile
				projInfo.yPos - ((this.sprite.y + this.sprite.height/2 * playerScale) / gameHeight),
				//((this.sprite.y - this.sprite.height/2 * playerScale) / gameHeight) - projInfo.yPos,
				//((this.sprite.y + this.sprite.height/2 * playerScale) / gameHeight) - projInfo.yPos,

				// Our velocity
				this.sprite.body.velocity.y / jumpHeight,

				// Our current gravity as a percentage
				this.ourGravity,

				// Our y position on the screen
				//this.sprite.y / gameHeight,

				// Height of the next projectile
				//projInfo.yPos,

				// Distance to the next projectile
				projInfo.xDist,

				// Distance between the two oncoming projectiles
				//projInfo.projDist
			];

			// Activate our brain
			var ourMove = this.brain.activate(brainInputs);

			// Is this the best brain?
			var aiManager = this.manager.manager;
			if(aiManager.bestBrain == this.brain) {
				aiManager.updateIOText(brainInputs, ourMove);
			}

			this.sprite.setGravity(0, maxGravity * ourMove[0]);

			// Store our gravity
			this.ourGravity = ourMove[0];

			// Second input controls if we should be ducking, more than 50% and we will duck
			//this.setDuck(ourMove[1] > 0.5);

			// First input controls our jump power, > 50% and we attempt to jump
			/*if(ourMove[0] > 0.5) {
				//this.setDuck(false);
				//this.jump(Math.min(ourMove[0], 1));
				//this.jump(1);
			} else {
				//this.setDuck(true);
			}*/
		//}
		

		// Jump
		//this.jump();
	}

	resetHeight() {
		this.sprite.setPosition(this.sprite.x, gameHeight - this.sprite.height * playerScale/2 - floorHeight);
	}
}

class AIManager {
    constructor({}) {
        // Create one to manage the right
        this.neat = new neataptic.Neat(4, 1, null, {
            popsize: maxPlayers,
            elitism: Math.round(0.2 * maxPlayers),
            mutationRate: 0.3,
            mutationAmount: 30
          }
        );

        // Any AIs to import?
        if(window.importedBrain) {
            try {
                for(var i=0; i<this.neat.population.length; ++i) {
                    this.neat.population[i] = neataptic.Network.fromJSON(window.importedBrain[i % window.importedBrain.length]);
                }
            } catch(e) {
                alert('Warning: Failed to import AI!');
                alert(e.message)
            }
        }

        // Create the chart
        this.chart = new ChartManager({element: '#chart'});

        this.highestScore = 0;
        this.currentGeneration = 1;

        this.gameManager = new GameManager({manager: this});

        // Update text
        this.updateText();
    }

    // We are now ready
    onReady() {
    	// Begin brain stuff
    	this.gameManager.reset(this.getPopulation());

    	// Display the best brain
        this.displayBestBrain();
    }

    // Return the neat instance
    getNeat() {
    	return this.neat;
    }

    // Returns the current population
    getPopulation() {
    	return this.neat.population;
    }

    displayBestBrain() {
        // Pick a brain that is alive
        var pickedBrain = null;

        for(var i=0; i<this.gameManager.allPlayers.length; ++i) {
            var ply = this.gameManager.allPlayers[i];

            if(!ply.isDead()) {
                pickedBrain = ply.brain;
                break;
            }
        }

        // did we fail to find a brain?
        if(pickedBrain == null) return;

        // Is this already the best brain?
        if(this.bestBrain == pickedBrain) return;
        this.bestBrain = pickedBrain;

        // Render it
        drawGraph(512, 512, pickedBrain.graph(512, 256), '#winnerNetwork');
    }

    // Called when a game ends
    onGameFinish() {
        // Display the best brain
        this.displayBestBrain();

        // Are there any games still running?
        /*for(var i=0; i<this.allGames.length; ++i) {
            var thisGame = this.allGames[i];

            if(!thisGame.dead) return;
        }*/

        // Go ahead and do mutations
        this.doMutations();

        // Remove all the remaining projectiles
        this.gameManager.removeAllProjectiles();

        // Update the brains
        this.gameManager.reset(this.getPopulation());
    }

    // Do mutations
    doMutations() {
        // Sort our AI
        this.neat.sort();

        // Grab stats
        var max = Math.round(this.neat.getFittest().score);
        var avg = Math.round(this.neat.getAverage());
        var min = Math.round(this.neat.population[this.neat.popsize - 1].score);

        // Store stats
        this.chart.updateChart(this.currentGeneration, max, avg, min);

        // Increase the generation number
        ++this.currentGeneration;

        // Did we get a new max?
        if (max > this.highestScore) {
            this.highestScore = max
        }

        // Update text
        this.updateText();

        // Mutate

        // Build the next generation
        const newGeneration = [];

        for (var i = 0; i < this.neat.elitism; i++) {
            newGeneration.push(this.neat.population[i]);
            //niceList.push(neat.population[i]);
        }

        for (var i = 0; i < this.neat.popsize - this.neat.elitism; i++) {
            newGeneration.push(this.neat.getOffspring())
        }
        
        this.neat.population = newGeneration;

        this.neat.mutate();
    }

    updateText() {
        $('#KeyInfo').text('Generation: ' + this.currentGeneration + '\n' + 'Highscore: ' + this.highestScore);
    }

    updateIOText(brainInputs, output) {
    	var ioNice = [];
    	for(var i=0; i<brainInputs.length; ++i) {
    		ioNice.push(brainInputs[i].toFixed(2));
    	}

    	var ooNice = [];
    	for(var i=0; i<output.length; ++i) {
    		ooNice.push(output[i].toFixed(2));
    	}

    	$('#CurrentIO').text('Inputs: ' + ioNice.join(',') + '\nOutputs: ' + ooNice.join(','));
    }

    resetAllGames() {
        /*for(var i=0; i<this.allGames.length; ++i) {
            var thisGame = this.allGames[i];

            // Add the new brain

            if(overallMode == 0 || overallMode == 1) {
                thisGame.onGetNewBrain(this.neat.population[i]);
            } else {
                thisGame.onGetNewBrain(this.leftSolution, this.rightSolution);
            }

            thisGame.reset();
        }*/
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function startEverything() {
	// Figure out how many ninjas
	maxPlayers = parseInt($('#maxPlayers').val());
	if(typeof(maxPlayers) != 'number' || isNaN(maxPlayers) || maxPlayers <= 0) {
		alert('Please enter a valid number of ninjas to create!');
		return;
	}

	// Remove pregame stuff
	$('#preGame').remove();

    $('body').removeClass('gameMenu');

	// Create the AI manager
	window.aiManager = new AIManager({});
}

function exportAI() {
    var gameManager = window.aiManager.gameManager;
    var allPlayers = gameManager.allPlayers;

    var exportedBrains = [];

    for(var i=0; i<allPlayers.length; ++i) {
        var ply = allPlayers[i];

        if(!ply.isDead()) {
            var brain = ply.brain;

            exportedBrains.push(brain.toJSON());
        }
    }

    var currentBrainsNice = JSON.stringify(exportedBrains);

    try {
        JSON.parse(currentBrainsNice);
    } catch(e) {
        alert('Failed to export AI, something went wrong :/');
        return;
    }

    //var currentBrains = window.aiManager.neat.export();
    //var currentBrainsNice = JSON.stringify(currentBrains);

    prompt('Here is all the brains of the current simulation:', currentBrainsNice);
}

// Imports an AI brain
function doImportAI() {
    var brainCode = prompt('Paste the code for the brain here', '');

    if(brainCode == null || brainCode.length <= 0) {
        alert('Please paste valid brain code.');
        return;
    }

    try {
        window.importedBrain = JSON.parse(brainCode);
    } catch(e) {
        // Error
        alert('This was not a valid brain! ' + e.message);
        return;
    }

    startEverything();
}

$(document).ready(function() {
	// startEverything
});
