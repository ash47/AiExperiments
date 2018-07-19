var chartHeight = 200;

var gameWidth = window.innerWidth;
var gameHeight = window.innerHeight;

var maxPlayers = 100;
var maxEnemies = 10;
var enemySpeed = 10;
var enemyRadius = 120;
var playerRadius = 60;
var playerSpeed = 20;
var maxDistance = Math.sqrt(gameWidth * gameWidth + gameHeight * gameHeight) + enemyRadius;

var searchRange = enemyRadius * 2;

var generationNumber = 1;
var superBest = null;

var playerStartingPosition = [
	gameWidth / 2,
	gameHeight / 2
	//Math.random() * gameWidth,
	//Math.random() * gameHeight
];

var scalerMaxDistance = maxDistance + Math.max(gameWidth, gameHeight)

const STATE_SIMULATING = 1;

// How many of the closest to feed it info on
//var totalClosest = 4;
var totalClosest = 4;

const Neat = neataptic.Neat;
const architect = neataptic.Architect;
const neat = new Neat(4, 4, null, {
    popsize: maxPlayers,
    elitism: Math.round(0.2 * maxPlayers),
    mutationRate: 0.3,
    mutationAmount: 30,
    /*network: new architect.Random(
		2 + 3 * totalClosest,
		2 + 3 * totalClosest + 4,
		4
	)*/
  }
)

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

let highestScore = 0

class Game {
	constructor({}) {
		const game = this;

		this.chart = new Chart('#chart', {
			title: '',
			type: 'line',
			height: chartHeight,
			data: chartData
		})

		// Display the best brain every 2 seconds
		setInterval(() => {
			game.showBestBrain();
		}, 1000 * 2);

		// Draw the brain of the smartest dude
	    //this.showBestBrain();

		this.players = [];
		this.enemies = [];
		this.state = STATE_SIMULATING;

		this.currentFittest = null;

		new p5(p => {
			p.setup = () => {
				p.frameRate(60);
				p.createCanvas(gameWidth, gameHeight);

				// Spawn new players
				for(var i=0; i<maxPlayers; ++i) {
					var player = new Player({
						game: game,
						radius: playerRadius,
						speed: playerSpeed,
						brain: neat.population[i]
					});

					// Reset score to 0
					player.brain.score = 0;

					player.reset({
						//position: playerStartingPosition
						position: [Math.random() * gameWidth, Math.random() * gameHeight]
					});

					game.players.push(player);
				}
			}

			p.draw = () => {
				p.background('#EEE')
				p.fill(0)
				p.textSize(30)
				p.text('Generation Number: ' + generationNumber + '\n' +
					'Highest Score: ' + highestScore,
					5, 30
				);

				// Is someone alive?
				var someoneAlive = false;

				// Spawn new enemies
				while(game.enemies.length < maxEnemies) {
					var enemy = new Enemy({
						maxDistance: maxDistance,
						speed: enemySpeed,
						game: game,
						radius: enemyRadius
					});
					game.enemies.push(enemy);
				}

				var possibleTargets = [];

				// Loop over players
				for(var i=0; i<game.players.length; ++i) {
					var player = game.players[i];

					if(player.isActive()) {
						//var distances = [];

						var dangerLeft = 0;
						var dangerRight = 0;
						var dangerUp = 0;
						var dangerDown = 0;

						var ourPos = player.position;

						// Test every enemy, are we close to them?
						for(var j=0; j<game.enemies.length; ++j) {
							var enemy = game.enemies[j];

							// Is the enemy active?
							if(enemy.isActive()) {
								var enemyPos = enemy.position;

								var distance = game.distance(ourPos, enemyPos);

								// Are we touching?
								if(distance < Math.min(player.radius, enemy.radius)) {
									// Kill the player
									player.kill();
									break;
								}

								var distX = Math.abs(enemyPos[0] - ourPos[0]);
								var distY = Math.abs(enemyPos[1] - ourPos[1]);

								if(distX < enemyRadius) {
									if(distY < searchRange) {
										if(enemyPos[1] < ourPos[1]) {
											//dangerUp = (searchRange - distY)/searchRange;
											dangerUp = 1;
										} else {
											//dangerDown = (searchRange - distY)/searchRange;
											dangerDown = 1;
										}
									}
								}

								if(distY < enemyRadius) {
									if(distX < searchRange) {
										if(enemyPos[0] < ourPos[0]) {
											//dangerLeft = (searchRange - distX)/searchRange;
											dangerLeft = 1;
										} else {
											//dangerRight = (searchRange - distX)/searchRange;
											dangerRight = 1;
										}
									}
								}

								/*distances.push({
									distance: distance,
									enemy: enemy
								});*/
							}
						}

						// Are we outside the screen?
						if(!game.onScreen(player.position, player.radius)) {
							player.kill();
							continue;
						}

						// Are we still active?
						if(player.isActive()) {
							// Grab position
							var xPos = player.position[0];
							var yPos = player.position[1];

							//if(xPos < enemyRadius) dangerLeft = Math.max(dangerLeft, (enemyRadius - xPos)/enemyRadius);
							//if(xPos > gameWidth - enemyRadius) dangerRight = Math.max(dangerRight, (enemyRadius - gameWidth + xPos)/enemyRadius);
							//if(yPos < enemyRadius) dangerUp = Math.max(dangerUp, (enemyRadius - yPos)/enemyRadius);
							//if(yPos > gameHeight - enemyRadius) dangerDown = Math.max(dangerDown, (enemyRadius - gameHeight + yPos)/enemyRadius);

							if(xPos < enemyRadius) dangerLeft = 1;
							if(xPos > gameWidth - enemyRadius) 1;
							if(yPos < enemyRadius) dangerUp = 1;
							if(yPos > gameHeight - enemyRadius) dangerDown = 1;


							// Sort from smallest to largest
							/*distances.sort(function(a, b) {
								if(a.distance < b.distance) {
									return -1;
								} else if(a.distance > b.distance) {
									return 1;
								} else {
									return 0;
								}
							});*/

							var brainInfo = [
								Math.min(dangerLeft, 1),
								Math.min(dangerRight, 1),
								Math.min(dangerUp, 1),
								Math.min(dangerDown, 1)
								//Math.max(0, Math.min(xPos / gameWidth, 1)),
								//Math.max(0, Math.min(yPos / gameHeight, 1))

								//xPos / gameWidth,					// Distance to left
								//(gameWidth - xPos) / gameWidth,		// Distance to right
								//yPos / gameHeight,					// Distance to top
								//(gameHeight - yPos) / gameHeight,	// Distance to bottom
							];

							/*for(var j=0; j<totalClosest; ++j) {
								var distInfo = distances[j];

								if(distInfo == null) {
									//brainInfo.push(1);
									//brainInfo.push(1);
									brainInfo.push(1);
									brainInfo.push(1);
									brainInfo.push(1);
									continue;
								}

								var enemy = distInfo.enemy;
								var enemyPos = enemy.position;

								brainInfo.push(Math.max(0, Math.min(enemyPos[0] / gameWidth, 1)));
								brainInfo.push(Math.max(0, Math.min(enemyPos[1] / gameHeight, 1)));

								var xDist = (enemyPos[0] - ourPos[0]);
								var yDist = (enemyPos[1] - ourPos[1]);

								var realDist = Math.sqrt(xDist * xDist + yDist * yDist);

								brainInfo.push(Math.min(realDist / maxDistance, 1));

								// Calculate the distances
								/*var xDist = (enemyPos[0] - ourPos[0]);
								var yDist = (enemyPos[1] - ourPos[1]);

								if(xDist < 0) {
									brainInfo.push(Math.min(1, Math.abs(xDist) / maxDistance));
									brainInfo.push(1);
								} else {
									brainInfo.push(1);
									brainInfo.push(Math.min(1, Math.abs(xDist) / maxDistance));
								}

								if(yDist < 0) {
									brainInfo.push(Math.min(1, Math.abs(yDist) / maxDistance));
									brainInfo.push(1);
								} else {
									brainInfo.push(1);
									brainInfo.push(Math.min(1, Math.abs(yDist) / maxDistance));
								}*/

								// Push it onto the stack
								//brainInfo.push(xDist);
								//brainInfo.push(yDist);
							//}

							var extraScore = 1 - dangerUp - dangerDown - dangerLeft - dangerRight;

							//if(distances[0] != null) {
							//	extraScore += distances[0].distance / maxDistance;
							//}

							// Draw it
							player.draw({
								p: p,
								extraScore: extraScore,
								brainInfo: brainInfo 
							});

							// We have at least one player that is alive!
							someoneAlive = true;

							// This is a possible target
							possibleTargets.push(player)
						}
					} else {
						// do nothing
					}
				}

				//var targetPlayerNumber = -1;

				// Randomly sort array
				possibleTargets.sort(function() {
					if(Math.random() < 0.5) {
						return -1
					} else if(Math.random() < 0.5) {
						return 1;
					} else {
						return 0;
					}
				});

				// Loop over enemies
				for(var i=0; i<game.enemies.length; ++i) {
					var enemy = game.enemies[i];

					// Is this enemy active?
					if(enemy.isActive()) {
						// Draw it
						enemy.draw({
							p: p
						});
					} else {
						// Grab a random position on the board
						var targetPosition = [
							Math.random() * gameWidth,
							Math.random() * gameHeight
						];

						if(possibleTargets.length > 0) {
							var myTarget = possibleTargets.pop();
							targetPosition = myTarget.position;
						}

						/*while(++targetPlayerNumber < game.players.length) {
							if(game.players[targetPlayerNumber].isActive()) {
								targetPosition = game.players[targetPlayerNumber].position;
								break;
							}
						}*/

						/*if(game.players[i].isActive()) {
							//if(game.players[i].brain.score > 100) {
								targetPosition = game.players[i].position;
							//}
						}*/

						// Pick a random direction
						var targetDirection = Math.random() * Math.PI * 2;

						var yMotion = Math.sin(targetDirection);
						var xMotion = Math.cos(targetDirection);

						// Calculate where we should start
						var startPos = [
							targetPosition[0] - xMotion * maxDistance / 2,
							targetPosition[1] - yMotion * maxDistance / 2,
						];

						// Is this actually off screen?
						if(!game.onScreen(startPos)) {
							// Reset the enemy
							enemy.reset({
								position: startPos,
								direction: targetDirection
							});
						}
					}
				}

				if(!someoneAlive) {
					// Finish up the generation
					game.finishGeneration();
				}
			}
		});
	}

	finishGeneration() {
		if(this.currentFittest != null) {
			this.currentFittest.isBest = 0;
		}

		// Sort our AI
		neat.sort();

		// Grab stats
		var max = Math.round(neat.getFittest().score);
		var avg = Math.round(neat.getAverage());
		var min = Math.round(neat.population[neat.popsize - 1].score);

		chartData.labels.push(generationNumber.toString())
	    chartData.datasets[0].values.push(max)
	    chartData.datasets[1].values.push(avg)
	    chartData.datasets[2].values.push(min)

	    if (chartData.labels.length > 15) {
	      chartData.labels.shift()
	      chartData.datasets.forEach(d => d.values.shift())
	    }

	    // Update the chart
	    this.chart.update(chartData)

	    // Did we get a new max?
	    if (max > highestScore) {
	    	highestScore = max
	    	//superBest = neat.population[0];
	    }

	    // Show the best brain
	    this.showBestBrain();

		// Kill all active enemies
		this.killAllEnemies();

		// Increase the generation number
		++generationNumber;

		// Build the next generation
		const newGeneration = [];

		var niceList = [];

	    for (var i = 0; i < neat.elitism; i++) {
	      newGeneration.push(neat.population[i]);
	      //niceList.push(neat.population[i]);
	    }

	    for (var i = 0; i < neat.popsize - neat.elitism; i++) {
	      newGeneration.push(neat.getOffspring())
	    }

	    //niceList[0].isBest = 1;

	    neat.population = newGeneration;

		// Run the mutation
		neat.mutate();

		// Push in our best ones from the previous round
		for(var i=0; i<niceList.length; ++i) {
			neat.population.push(niceList[i]);
		}

		/*if(superBest != null) {
			superBest.isBest = 2;

			neat.population[neat.population.length - 1] = superBest;
		}*/

		// Reset all the players
		for(var i=0; i<this.players.length; ++i) {
			var player = this.players[i];

			// Insert new brain
			player.brain = neat.population[i];
			player.brain.score = 0;

			player.reset({
				//position: playerStartingPosition
				position: [Math.random() * gameWidth, Math.random() * gameHeight]
			});
		}
	}

	killAllEnemies() {
		for(var i=0; i<this.enemies.length; ++i) {
			var enemy = this.enemies[i];

			enemy.kill();
		}
	}

	// Are two circles touching?
	touching(pos1, pos2, radius1, radius2) {
		return this.distance(pos1, pos2) < Math.max(radius1, radius2);
	}

	// What is the distance between two points?
	distance(pos1, pos2) {
		var xDiff = pos1[0] - pos2[0];
		var yDiff = pos1[1] - pos2[1];

		return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
	}

	onScreen(position, radius=0) {
		//if(size == null) size = 
		return position[0] >= -radius && position[0] <= gameWidth+radius && position[1] >= -radius && position[1] <= gameHeight+radius;
	}

	showBestBrain() {
		if(this.currentFittest != null) {
			this.currentFittest.isBest = 0;
		}

		this.currentFittest = neat.getFittest();
		this.currentFittest.isBest = 2;

		// Draw the brain of the smartest dude
	    drawGraph(this.currentFittest.graph(512, 512), '#winnerNetwork');
	}
}