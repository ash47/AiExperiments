var gameWidth = 1024;
var gameHeight = 512;

var floorHeight = 112;

var cameraSpeed = 15.69;
var pipeMoveSpeed = 100 * cameraSpeed / 1.69;
var pipeWidth = 52;
var timeBetweenPipes = 0.75;
var pipeVerticalMoveSpeed = 2;

//var minHeightOffset = -45;
//var maxHeightOffset = 130;
var minHeightOffset = -150;
var maxHeightOffset = 150;
var maxHeightDiff = 40;

// The higher this number, the closer the pipes are
var makeTheGameHarder = 90;

var gravity = 600;
var jumpPower = 300;

var playerX = 148;

var bgFloor = null;

var scoreIncrease = 1;
var currentGeneration = 1;
var highestScore = 0;

var populationScore = 0;

var config = {
    type: Phaser.AUTO,
    width: gameWidth,
    height: gameHeight,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: gravity }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// The AI stuff
var maxPlayers = 250;

// Velocity (1 and -1)
// Our position on screen 0 and 1
// Height of next pipe 0 and 1

const neat = new neataptic.Neat(3, 1, null, {
    popsize: maxPlayers,
    elitism: Math.round(0.2 * maxPlayers),
    mutationRate: 0.3,
    mutationAmount: 30
  }
);

var allPipes = [];
var allBirds = [];

var addAllBirds;
var cleanupEverything;
var spawnNextPipe;
var updatePipePosition;

var game = new Phaser.Game(config);

function preload() {
    //this.load.setBaseURL('http://labs.phaser.io');

    this.load.image('floor', 'img/floor.png');
    this.load.image('pipe_top', 'img/pipe_top.png');
    this.load.image('pipe_bot', 'img/pipe_bot.png');
    this.load.spritesheet('bird', 'img/bird.png', {
        frameWidth: 36,
        frameHeight: 24
    });
    this.load.image('bg', 'img/bg.png');
}

function create () {
    // Reference to this
    var _this = this;

    //this.world.setBounds(0,0, gameWidth, gameHeight);

    //window.lmao = this;

    this.anims.create({
        key: 'flap',
        frames: this.anims.generateFrameNumbers('bird', { start: 0, end: 3, first: 0 }),
        frameRate: 3,
        repeat: -1
    });

    var bgCity = this.add.tileSprite(0, 0, gameWidth, gameHeight, 'bg');
    bgCity.setOrigin(0, 0);

    bgFloor = this.add.tileSprite(0, 0, gameWidth, floorHeight, 'floor');
    bgFloor.setOrigin(0, 0);
    bgFloor.setPosition(0, gameHeight - floorHeight);
    this.physics.add.existing(bgFloor, false);
    bgFloor.body.allowGravity = false;
    bgFloor.body.setCollideWorldBounds(true);

    //var particles = this.add.particles('logo');

    /*var emitter = particles.createEmitter({
        speed: 100,
        scale: { start: 1, end: 0 },
        blendMode: 'ADD'
    });*/

    var pipes = this.physics.add.group();

    function addBird(props) {
        props = props || {};
        props.jumpDelay = props.jumpDelay || 100;

        var bird = _this.physics.add.sprite(playerX, Math.random() * (gameHeight - floorHeight * 1.2), 'bird');
        bird.anims.play('flap');

        bird.body.setGravityY(gravity);

        // Assign the brain
        bird.brain = props.brain;
        bird.brain.score = 0;

        // Handle physics
        _this.physics.add.overlap(bird, pipes, onPlayerCrash, null, _this);
        _this.physics.add.overlap(bird, bgFloor, onPlayerCrash, null, _this);

        allBirds.push(bird);
    }

    function onPlayerCrash(player, object) {
        player.dead = true;
        player.body.allowGravity = false;
        player.body.setVelocity(-pipeMoveSpeed, 0);
    }

    addAllBirds = function() {
        // Add players
        for(var i=0; i<maxPlayers; ++i) {
            // Add the bird
            addBird({
                brain: neat.population[i]
            });
        }
    }

    /*addBird({
        jumpDelay: 500
    });

    addBird({
        jumpDelay: 1000
    });*/

    

    //var offScreenSignal = new Phaser.Signal();
    //offScreenSignal.add();

   	updatePipePosition = function(pipe) {
    	var posY = 0;

        if(pipe.ourProps.sort == 'pipe_bot') {
            posY = gameHeight - makeTheGameHarder;
        }

        posY -= pipe.ourProps.offset;
        pipe.y = posY;
    }

    function pipeSpawn(props) {
        props = props || {};
        props.sort = props.sort || 'pipe_top';
        props.offset = props.offset || 0;
        props.pipeMoveDir = props.pipeMoveDir || -1;

        var pipe = pipes.create(gameWidth + pipeWidth, 0, props.sort);
        pipe.body.allowGravity = false;
        pipe.body.setVelocityX(-pipeMoveSpeed);
        pipe.checkWorldBounds = true;
        pipe.ourProps = props;

        // We have gameWidth pixels and we move at pipeMoveSpeed speed
        var travelDistance = (pipe.x - playerX) / (pipeMoveSpeed/60) * pipeVerticalMoveSpeed * props.pipeMoveDir;
        
        props.targetOffset = props.offset;
        props.offset -= travelDistance;

        updatePipePosition(pipe);

        allPipes.push(pipe);

        window.pipe = pipe;
    }

    cleanupEverything = function() {
        // Cleanup pipes
        for(var i=0; i<allPipes.length; ++i) {
            allPipes[i].destroy();
        }
        allPipes = [];

        // Cleanup birds
        for(var i=0; i<allBirds.length; ++i) {
            allBirds[i].destroy();
        }
        allBirds = [];
    }

    var previousHeight = null;
    spawnNextPipe = function() {
    	var heightOffset = getRandomInt(minHeightOffset, maxHeightOffset);

    	if(previousHeight != null) {
    		var diff = Math.abs(heightOffset - previousHeight);

    		if(diff > maxHeightDiff) {
    			if(heightOffset < previousHeight) {
    				heightOffset = previousHeight - maxHeightDiff;
    			} else {
    				heightOffset = previousHeight + maxHeightDiff;
    			}
    		}

    	}
    	previousHeight = heightOffset;

    	var pipeMoveDir = -1;
    	if(Math.random() < 0.5) {
    		pipeMoveDir = 1;
    	}

        pipeSpawn({
            sort: 'pipe_top',
            offset: heightOffset,
            pipeMoveDir: pipeMoveDir
        });

        pipeSpawn({
            sort: 'pipe_bot',
            offset: heightOffset,
            pipeMoveDir: pipeMoveDir
        });
    }

    // Spawn in some birds
    addAllBirds();

    //pipe.body.onWorldBounds = offScreenSignal;


    //logo.setVelocity(100, 200);
    //logo.setBounce(1, 1);
    //logo.setCollideWorldBounds(true);

    //emitter.startFollow(logo);
}

var watchingBrain = null;

var frameNumber = 0;
function update() {
    if(bgFloor != null) {
        bgFloor.tilePositionX += cameraSpeed;
    }

    // Do we spawn a new pipe?
    if(++frameNumber > 30 * timeBetweenPipes) {
    	spawnNextPipe();
    	frameNumber = 0;
    }

    // Process pipes
    for(var i=0; i<allPipes.length; ++i) {
        var pipe = allPipes[i];

        if(pipe.body.position.x < 0 - pipeWidth) {
            pipe.destroy();
            allPipes.splice(i, 1);

            // Increase the population score
            populationScore += 1;

            // Roll back to the previous i
            --i;
            continue;
        }

        // Make it move up or down
        pipe.ourProps.offset += pipe.ourProps.pipeMoveDir * pipeVerticalMoveSpeed;

        pipe.ourProps.totalMoved = (pipe.ourProps.totalMoved || 0) + pipeVerticalMoveSpeed;

        // if(pipe.ourProps.pipeMoveDir == -1) {
        // 	pipe.ourProps.offset -= pipeVerticalMoveSpeed;

        // 	// if(pipe.ourProps.offset < minHeightOffset) {
        // 	// 	pipe.ourProps.offset = minHeightOffset;

        // 	// 	pipe.ourProps.pipeMoveDir = 1;
        // 	// }
        // } else {
        // 	pipe.ourProps.offset += pipeVerticalMoveSpeed;

        // 	// if(pipe.ourProps.offset > maxHeightOffset) {
        // 	// 	pipe.ourProps.offset = maxHeightOffset;

        // 	// 	pipe.ourProps.pipeMoveDir = -1;
        // 	// }
        // }

        updatePipePosition(pipe);
    }

    var closestPipe = allPipes[0];
    if(closestPipe != null) {
    	var pipeNum = 0;

    	// Figure out which is closest
    	while(allPipes[pipeNum] != null) {
    		closestPipe = allPipes[pipeNum];
    		++pipeNum;

    		// Is this actually the closest pipe?
    		// We need to add the size of the pipe
    		if(closestPipe.body.position.x + 52 >= playerX) break;
    	}


        var currentX = closestPipe.body.position.x;
        var currentDistance = Math.max(0, Math.min(currentX - playerX, gameWidth));
        var currentDistanceScaled = currentDistance / gameWidth;

        //var maxDiff = maxHeightOffset - minHeightOffset;

        var currentHeight = gameHeight/2 - closestPipe.ourProps.targetOffset;
        var currentHeight2 = gameHeight/2 - closestPipe.ourProps.offset;

        var currentHeightScaled = Math.max(0, Math.min(1, currentHeight / gameHeight));
        var currentHeightScaled2 = Math.max(0, Math.min(1, currentHeight2 / gameHeight));
    } else {
        var currentDistanceScaled = 1;
        var currentHeightScaled = 0.5;
        var currentHeightScaled2 = 0.5;
    }

    /*if(isNaN(currentHeightScaled)) {
    	currentHeightScaled = 0.5;
    }*/

    var allDead = true;

    var firstAlive = null;

    // Process birds
    for(var i=0; i<allBirds.length; ++i) {
        var bird = allBirds[i];

        // Check if we fly off the top of the screen
        if(bird.body.position.y < -32) {
            bird.dead = true;
            continue;
        }

        // If our bird is dead, don't do AI stuff
        if(bird.dead) {
            continue;
        }

        if(firstAlive == null) {
            firstAlive = bird;
        }

        // Increase our brain score
        bird.brain.score += 1;

        // They aren't all dead
        allDead = false;

        if(bird.cantJump) {
        	continue;
        }

        var positionScaled = Math.max(0, Math.min(bird.body.position.y / gameHeight, 1));

        var velocityScaled = Math.max(Math.min(bird.body.velocity.y / gravity, 1), -1);

        // Calculate the brain info
        var brainInfo = [
            positionScaled - currentHeightScaled,
            positionScaled - currentHeightScaled2,
            //positionScaled,
            //currentHeightScaled,
            velocityScaled

            //currentDistanceScaled,
            //currentHeightScaled
        ];

        // Should we jump?
        var ourMove = bird.brain.activate(brainInfo);

        var doJump = false;

        // Let's check if it wants us to jump
        //if(Math.round(ourMove[0]) == 1) {
        if(ourMove[0] > 0 && !bird.cantJump) {
            // Do the jump
            //bird.setVelocityY(-jumpPower * ourMove[0]);
            bird.setVelocityY(-jumpPower);

            doJump = true;

            bird.cantJump = true;
            (function(bird) {
            	setTimeout(() => {
            		if(bird != null) {
            			delete bird.cantJump;
            		}
            	}, bird.jumpDelay);
            })(bird);

            //bird.setGravityY(gravity);
        } else {
        	//bird.setGravityY(gravity * 2);
        }

        // Are they watching us?
        if(firstAlive == bird) {
            var brainCopy = [];
            for(var j=0; j<brainInfo.length; ++j) {
                brainCopy[j] = brainInfo[j].toFixed(2);
            }
            $('#CurrentIO').text('Inputs: ' + brainCopy.join(', ') + ' Result = ' + ourMove[0].toFixed(2) + ' - jump = ' + doJump);
        }

        /*if(bird.body.position.x < 0 - pipeWidth) {
            bird.destroy();
            allBirds.splice(i, 1);

            // Roll back to the previous i
            --i;
            continue;
        }

        if(bird.body.position.y < -32) {
            bird.destroy();
            allBirds.splice(i, 1);

            // Roll back to the previous i
            --i;
            continue;
        }*/
    }

    // Do we need to see someone's brain?
    if(firstAlive != null) {
        if(watchingBrain != firstAlive) {
            // We are now watching this brain
            watchingBrain = firstAlive;

            // Render the brain
            drawGraph(watchingBrain.brain.graph(256, 256), '#winnerNetwork');
        }
    }

    // Is everyone dead?
    if(allDead) {
        doMutations();
    }
}

// Do mutations
function doMutations() {
    // Cleanup EVERYTHING
    cleanupEverything();

    // Sort our AI
    neat.sort();

    // Grab stats
    var max = Math.round(neat.getFittest().score);
    var avg = Math.round(neat.getAverage());
    var min = Math.round(neat.population[neat.popsize - 1].score);

    // Store stats
    updateChart(currentGeneration, max, avg, min);

    // Increase the generation number
    ++currentGeneration;

    // Did we get a new max?
    if (max > highestScore) {
        highestScore = max
    }

    // Update text
    updateText();

    // Mutate

    // Build the next generation
    const newGeneration = [];

    for (var i = 0; i < neat.elitism; i++) {
        newGeneration.push(neat.population[i]);
        //niceList.push(neat.population[i]);
    }

    for (var i = 0; i < neat.popsize - neat.elitism; i++) {
        newGeneration.push(neat.getOffspring())
    }
    
    neat.population = newGeneration;

    neat.mutate();

    // Population score resets
    populationScore = 0;

    // Add all the birds
    addAllBirds();
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const chartData = {
  labels: [],
  datasets: [
    {
      name: 'Max',
      values: []
    },
    {
      name: 'Average',
      values: []
    },
    {
      name: 'Min',
      values: []
    }
  ]
}

var chart;

function updateText() {
    // Update the generation number
    $('#KeyInfo').html('Generation: ' + currentGeneration + '<br>' + 'Highscore: ' + highestScore);
}

function updateChart(generationNumber, max, avg, min) {
    console.log(generationNumber, max, avg, min);
    console.log(typeof(generationNumber), typeof(max), typeof(avg), typeof(min));

    chartData.labels.push(generationNumber.toString())
    chartData.datasets[0].values.push(max)
    chartData.datasets[1].values.push(avg)
    chartData.datasets[2].values.push(min)

    if (chartData.labels.length > 15) {
        chartData.labels.shift()
        chartData.datasets.forEach(d => d.values.shift())
    }

    chart.update(chartData)
}

$(document).ready(function() {
    chart = new Chart('#chart', {
        title: '',
        type: 'line',
        height: 128,
        data: chartData
    });

    // Update the text
    updateText();
});
