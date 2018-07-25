const gameWidth = 512;
const gameHeight = 512;

// The AI stuff
const maxPlayers = 5;

var bgScaler = 5;
var bgScalerGrass = 4;
var bgScalerPole = 5;
var scalerBird = 5;

var overallMode = 0;

/*var allPipes = [];
var allBirds = [];

var addAllBirds;
var cleanupEverything;*/

class GameManager {
    constructor({manager, brain}) {
        var _this = this;

        // Store brain
        this.onGetNewBrain(brain);
        this.manager = manager;

        this.game = new Phaser.Game({
            type: Phaser.AUTO,
            width: gameWidth,
            height: gameHeight,
            physics: {
                default: 'matter',
                arcade: {
                    debug: true,
                    gravity: { y: 200 }
                },
                matter: {
                    gravity: 200,
                    debug: false
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
    //this.load.setBaseURL('http://labs.phaser.io');

        /*scene.load.image('floor', 'img/floor.png');
        scene.load.image('pipe_top', 'img/pipe_top.png');
        scene.load.image('pipe_bot', 'img/pipe_bot.png');
        scene.load.spritesheet('bird', 'img/bird.png', {
            frameWidth: 36,
            frameHeight: 24
        });
        scene.load.image('bg', 'img/bg.png');*/

        scene.load.image('blue_bg', 'img/blue_bg.jpg');        
        scene.load.image('grass', 'img/grass.png');        
        scene.load.image('pole', 'img/pole.png');        
        scene.load.image('propeller', 'img/propeller.png');        
        scene.load.image('bird-1', 'img/bird-1.png');        
        scene.load.image('bird-2', 'img/bird-2.png');        
        scene.load.image('bird-3', 'img/bird-3.png');        
    }

    create (scene) {
        // Store the scene
        this.scene = scene;

        // Start dead
        this.dead = false;

        this.spinSpeed = 0.05;
        this.rotationMode = -1;

        // The blue background

        var theBG = this.scene.add.sprite(0, 0, 'blue_bg')
            .setOrigin(0, 0);

        theBG.scaleX = 1/bgScaler;
        theBG.scaleY = 1/bgScaler;

        // The grass

        var theBGGrass = this.scene.add.sprite(0, 0, 'grass')
            .setOrigin(0, 0);

        theBGGrass.scaleX = 1/bgScalerGrass;
        theBGGrass.scaleY = 1/bgScalerGrass;

        theBGGrass.setPosition(0, gameHeight - theBGGrass.height / bgScalerGrass);

        // The pole

        var theBGPole = this.scene.add.sprite(0, 0, 'pole') 
            .setOrigin(0, 0);

        theBGPole.scaleX = 1/bgScalerPole;
        theBGPole.scaleY = 1/bgScalerPole;

        var xposNice = gameWidth/2 - theBGPole.width/2/bgScalerPole;
        var yposNice = gameHeight - theBGPole.height / bgScalerPole;

        theBGPole.setPosition(xposNice, yposNice);

        xposNice += theBGPole.width / bgScalerPole / 2;

        this.propeller = this.scene.matter.add.image(0, 0, 'propeller');
        this.propeller.body.isStatic = true;

        this.propeller.scaleX = 1/bgScalerPole;
        this.propeller.scaleY = 1/bgScalerPole;

        this.propeller.setPosition(xposNice, yposNice);

        var propWidth = 15;
        var propLength = 130;

        var colls = [];

        colls.push({x: -propWidth, y: -propLength});
        colls.push({x: propWidth, y: -propLength});
        colls.push({x: 0 , y: 0});

        var ang = Math.PI/4;
        colls.push({x: propWidth * Math.sin(ang) -propLength * -Math.cos(ang), y: -propWidth * Math.sin(ang) -propLength * -Math.cos(ang)});
        colls.push({x: -propWidth * Math.sin(ang) -propLength * -Math.cos(ang), y: propWidth * Math.sin(ang) -propLength * -Math.cos(ang)});
        colls.push({x: 0 , y: 0});

        var ang = Math.PI/4 * 3;
        colls.push({x: propWidth * Math.sin(ang) -propLength * -Math.cos(ang), y: propWidth * Math.sin(ang) +propLength * -Math.cos(ang)});
        colls.push({x: -propWidth * Math.sin(ang) -propLength * -Math.cos(ang), y: -propWidth * Math.sin(ang) +propLength * -Math.cos(ang)});
        colls.push({x: 0 , y: 0});

        this.propeller.setBody({
            type: 'fromVertices',
            verts: colls
        });        

        // Store nice positions
        this.centerScreen = xposNice;

        var _this = this;
        this.scene.matter.world.on('collisionstart', function (event, bodyA, bodyB) {
            var ourBird = null;
            if(bodyA.gameObject.isBird) {
                ourBird = bodyA.gameObject
            } else if(bodyB.gameObject.isBird) {
                ourBird = bodyB.gameObject
            }

            if(ourBird != null) {
                ourBird.destroy();
                _this.bird = null;
                _this.dead = true;
                _this.needsReset = true;
                _this.manager.onGameFinish();
                return;
            }
        });

        this.text = this.scene.add.text(4, 4, '', { fontSize: '32px', fill: '#000' });

        // Spawn the first bird
        this.needsReset = true;
        //this.spawnBird();
    }

    onGetNewBrain(leftBrain, rightBrain) {
        this.brain = leftBrain;
        this.brain.score = 0;
        this.brain.coolScore = 0;

        if(rightBrain != null) {
            this.leftBrain = leftBrain;
            this.rightBrain = rightBrain;
        }
    }

    reset() {
        // Do we have an active bird?
        if(this.bird != null) {
            this.bird.destroy();
            this.bird = null;
        }

        // We are no longer dead
        this.dead = false;

        // Reset rotation
        //this.propeller.rotation = 0;

        // Spawn a bird
        this.needsReset = true;
        //this.spawnBird();
    }

    spawnBird() {
        if(this.bird != null) {
            this.bird.destroy();
            this.bird = null;
        }

        var ourSide = 0;

        var sitDist = 105;

        var sideOffset = sitDist;
        if(Math.random() < 0.5) {
            sideOffset *= -1;
            ourSide = 0;
        } else {
            ourSide = 1;
        }

        if(overallMode == 0) {
            ourSide = -1;
            sideOffset = -sitDist;
        } else if(overallMode == 1) {
            ourSide = 0;
            sideOffset = sitDist;
        }

        // A bird
        this.bird = this.scene.matter.add.image(gameWidth / 2 + sideOffset, 0, 'bird-' + Util.getRandomInt(1, 1));

        // Store side
        this.bird.side = ourSide;

        this.bird.scaleX = 1/scalerBird;
        this.bird.scaleY = 1/scalerBird;
        //bird.setOrigin(bird.width / 2, bird.height);
        //scene.physics.add.existing(bird, false);

        this.bird.isBird = true;
    }

    update(scene) {
        if(this.needsReset) {
            if(this.propeller.rotation == 0) {
                this.needsReset = false;
                if(this.dead) return;
                this.spawnBird();
                return;
            } else if(this.propeller.rotation < 0) {
                this.propeller.rotation += this.spinSpeed;

                if(this.propeller.rotation >= 0) {
                    this.propeller.rotation = 0;
                    this.needsReset = false;

                    if(this.dead) return;
                    this.spawnBird();
                    return;
                }
            } else {
                this.propeller.rotation -= this.spinSpeed;

                if(this.propeller.rotation <= 0) {
                    this.propeller.rotation = 0;
                    this.needsReset = false;

                    if(this.dead) return;
                    this.spawnBird();
                    return;
                }
            }
            return;
        }

        if(this.dead) return;

        // Update score
        this.brain.score += 1;

        if(this.bird != null) {
            if(this.bird.y > gameHeight) {
                this.needsReset = true;

                // Create a new bird
                //this.spawnBird();

                // Increase score
                this.brain.coolScore += 1;

                // Reset rotation
                //this.propeller.rotation = 0;

                if(this.brain.coolScore >= 10) {
                    // We won overall!
                    this.manager.puzzleSolved(this.brain);
                }
            }
        }

        //this.currentPosition = ((this.propeller.rotation + Math.PI) % (2 * Math.PI / 3)) / (2 * Math.PI / 3);
        this.currentPosition = (this.propeller.rotation + Math.PI) / (2 * Math.PI);

        var birdPosY = (this.bird && this.bird.y) || 0;
        var birdSide = (this.bird && this.bird.side) || 0;

        var brainInputs = [
            // Rotation of the fan
            this.currentPosition,

            // Which side the bird is on
            //birdSide,

            // Y position of the bird
            Math.max(0, Math.min(birdPosY / gameHeight, 1)),

            // Current rotation mode
            this.rotationMode
        ];

        // Do the AI stuff
        var results;

        // Figure out which brain to use
        if(overallMode == 0 || overallMode == 1) {
            results = this.brain.activate(brainInputs);
        } else {
            if(birdSide == 0) {
                results = this.leftBrain.activate(brainInputs);
            } else {
                results = this.rightBrain.activate(brainInputs);
            }
        }

        var brainDisplay = [];
        for(var i=0; i<brainInputs.length; ++i) {
            brainDisplay.push(brainInputs[i].toFixed(2));
        }

        this.text.setText('Inputs: ' + brainDisplay.join(',') + '\nOutput: ' + results[0].toFixed(2) + '\nScore: ' + this.brain.score);

        // If something larger than half, toggle mode
        if(results[0] > 0.5) {
            this.rotationMode *= -1;
        }

        if(this.propeller != null) {
            this.propeller.rotation += this.spinSpeed * this.rotationMode;
        }
    }
}

class AIManager {
    constructor({}) {
        // Create one to manage the right
        var rightSide = new neataptic.Neat(3, 1, null, {
            popsize: maxPlayers,
            elitism: Math.round(0.2 * maxPlayers),
            mutationRate: 0.3,
            mutationAmount: 30
          }
        );

        // Create one to manage the left
        var leftSide = new neataptic.Neat(3, 1, null, {
            popsize: maxPlayers,
            elitism: Math.round(0.2 * maxPlayers),
            mutationRate: 0.3,
            mutationAmount: 30
          }
        );

        this.neat = leftSide;

        // Create the chart
        this.chart = new ChartManager({element: '#chart'});

        this.highestScore = 0;
        this.currentGeneration = 1;

        this.allGames = [];

        // Create the game manager
        for(var i=0; i<maxPlayers; ++i) {
            var ourManager = new GameManager({brain: this.neat.population[i], manager: this});
            this.allGames.push(ourManager);
        }

        // Display the best brain
        this.displayBestBrain();

        // Update text
        this.updateText();
    }

    // When we solved a puzzle
    puzzleSolved(solutionBrain) {
        if(overallMode == 0) {
            this.leftSolution = solutionBrain;
        } else if(overallMode == 1) {
            this.rightSolution = solutionBrain;
        } else {
            return;
        }

        // Increase the current solution solver
        overallMode += 1;

        // Reset all the brains
        this.resetAllGames();
    }

    displayBestBrain() {
        // Pick a brain that is alive
        var pickedBrain = null;

        for(var i=0; i<this.allGames.length; ++i) {
            var thisGame = this.allGames[i];

            if(!thisGame.dead) {
                pickedBrain = thisGame.brain;
                break;
            }
        }

        // did we fail to find a brain?
        if(pickedBrain == null) return;

        drawGraph(512, 512, pickedBrain.graph(512, 256), '#winnerNetwork');
    }

    // Called when a game ends
    onGameFinish() {
        // Display the best brain
        this.displayBestBrain();

        // Are there any games still running?
        for(var i=0; i<this.allGames.length; ++i) {
            var thisGame = this.allGames[i];

            if(!thisGame.dead) return;
        }

        // Go ahead and do mutations
        this.doMutations();
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

        this.resetAllGames();
    }

    updateText() {
        $('#KeyInfo').text('Generation: ' + this.currentGeneration + '\n' + 'Highscore: ' + this.highestScore);
    }

    resetAllGames() {
        for(var i=0; i<this.allGames.length; ++i) {
            var thisGame = this.allGames[i];

            // Add the new brain

            if(overallMode == 0 || overallMode == 1) {
                thisGame.onGetNewBrain(this.neat.population[i]);
            } else {
                thisGame.onGetNewBrain(this.leftSolution, this.rightSolution);
            }

            thisGame.reset();
        }
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

$(document).ready(function() {
   new AIManager({}); 
});
