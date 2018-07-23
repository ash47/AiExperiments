var gameWidth = 512;
var gameHeight = 512;

var floorHeight = 112;

var cameraSpeed = 1.69;
var pipeMoveSpeed = -100;
var pipeWidth = 52;

var minHeightOffset = -45;
var maxHeightOffset = 130;

var playerX = 48;

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
            gravity: { y: 200 }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// The AI stuff
var maxPlayers = 25;

const neat = new neataptic.Neat(1, 1, null, {
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
        props.jumpDelay = props.jumpDelay || 500;

        var bird = _this.physics.add.sprite(playerX, gameHeight / 2, 'bird');
        bird.anims.play('flap');

        bird.body.setGravityY(200);

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
        player.body.setVelocity(pipeMoveSpeed, 0);
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

    function pipeSpawn(props) {
        props = props || {};
        props.sort = props.sort || 'pipe_top';
        props.offset = props.offset || 0;

        var posY = 0;

        if(props.sort == 'pipe_bot') {
            posY = gameHeight
        }

        posY -= props.offset;

        var pipe = pipes.create(gameWidth + pipeWidth, posY, props.sort);
        pipe.body.allowGravity = false;
        pipe.body.setVelocityX(pipeMoveSpeed);
        pipe.body.update();
        pipe.checkWorldBounds = true;
        pipe.theOffset = props.offset;

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

    setInterval(function() {
        var heightOffset = getRandomInt(minHeightOffset, maxHeightOffset);

        pipeSpawn({
            sort: 'pipe_top',
            offset: heightOffset
        });

        pipeSpawn({
            sort: 'pipe_bot',
            offset: heightOffset
        });
    }, 2500);

    // Spawn in some birds
    addAllBirds();

    //pipe.body.onWorldBounds = offScreenSignal;


    //logo.setVelocity(100, 200);
    //logo.setBounce(1, 1);
    //logo.setCollideWorldBounds(true);

    //emitter.startFollow(logo);
}

var watchingBrain = null;

function update() {
    if(bgFloor != null) {
        bgFloor.tilePositionX += cameraSpeed;
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
    }

    var closestPipe = allPipes[0];
    if(closestPipe != null) {
        var currentX = closestPipe.body.position.x;
        var currentDistance = Math.max(0, Math.min(currentX - playerX, gameWidth));
        var currentDistanceScaled = currentDistance / gameWidth;

        //var maxDiff = maxHeightOffset - minHeightOffset;

        var currentHeight = gameHeight/2 - closestPipe.theOffset;


        var currentHeightScaled = Math.max(0, Math.min(1, currentHeight / gameHeight));
    } else {
        var currentDistanceScaled = 1;
        var currentHeightScaled = 0.5;
    }

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

        var positionScaled = Math.max(0, Math.min(bird.body.position.y / gameHeight, 1));

        // Calculate the brain info
        var brainInfo = [
            positionScaled - currentHeightScaled
            //positionScaled,
            //currentDistanceScaled,
            //currentHeightScaled
        ];

        // Should we jump?
        var ourMove = bird.brain.activate(brainInfo);

        var doJump = false;

        // Let's check if it wants us to jump
        //if(Math.round(ourMove[0]) == 1) {
        if(ourMove[0] > 0) {
            // Do the jump
            bird.setVelocityY(-200);

            doJump = true;
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
