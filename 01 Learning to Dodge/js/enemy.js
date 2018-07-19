class Enemy {
	constructor({maxDistance, speed, game, radius}) {
		this.active = false;
		this.beenOnScreen = false;
		this.speed = speed;
		this.game = game;
		this.radius = radius;
	}

	reset({position, direction}) {
		this.position = position.slice();
		this.direction = direction;
		this.distanceTravelled = 0;
		this.active = true;
		this.beenOnScreen = false;
	}

	isActive() {
		return this.active;
	}

	kill() {
		this.active = false;
	}

	draw({p}) {
		//p.textSize(15)
		//p.text('L', this.position[0], this.position[1]);

		p.fill(204, 101, 192, 127);
  		p.stroke(127, 63, 120);
  		p.ellipse(this.position[0], this.position[1], this.radius, this.radius);

		var yMotion = Math.sin(this.direction);
		var xMotion = Math.cos(this.direction);

		this.position[0] += xMotion * this.speed;
		this.position[1] += yMotion * this.speed;

		this.distanceTravelled += this.speed;

		// Check if we've been on the screen, and if so, die if we leave the screen
		if(!this.beenOnScreen) {
			if(this.game.onScreen(this.position, this.radius)) {
				this.beenOnScreen = true;
			}
		} else {
			if(!this.game.onScreen(this.position, this.radius)) {
				this.active = false;
			}
		}

		// Implement a max travel distance
		if(this.distanceTravelled > this.maxDistance) {
			this.active = false;
		}
	}
}