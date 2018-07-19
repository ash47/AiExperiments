class Player {
	constructor({game, radius, brain, speed}) {
		this.game = game;
		this.radius = radius;
		this.brain = brain;
		this.speed = speed;
	}

	reset({position}) {
		this.position = position.slice();
		this.active = true;
	}

	isActive() {
		return this.active;
	}

	kill() {
		this.active = false;
	}

	draw({p, brainInfo, extraScore}) {
		if(this.brain.isBest == 1) {
			p.fill(255, 0, 0, 127);
		} else if(this.brain.isBest == 2) {
			p.fill(0, 255, 0, 127);
		} else {
			p.fill(0, 0, 255, 127);
		}

		
  		p.stroke(127, 127, 255);
  		p.ellipse(this.position[0], this.position[1], this.radius, this.radius);

  		p.stroke(0, 0, 0, 255);
  		p.textSize(12)
		p.text(
			'Score: ' + this.brain.score + '\n' +
			brainInfo.join(',\n'), this.position[0], this.position[1]
		);

  		// Do movement
  		var ourMove = this.brain.activate(brainInfo);

  		//this.position[0] += ourMove[0] * this.speed - ourMove[1] * this.speed;
  		//this.position[1] += ourMove[2] * this.speed - ourMove[3] * this.speed;

  		this.position[0] += Math.round(ourMove[0]) * this.speed - Math.round(ourMove[1]) * this.speed;
  		this.position[1] += Math.round(ourMove[2]) * this.speed - Math.round(ourMove[3]) * this.speed;

  		// Basic scoring system
  		//this.brain.score += extraScore + 1;
  		this.brain.score += extraScore;
  	}
}