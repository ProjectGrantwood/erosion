class Water {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.dir = Math.floor(Math.random() * DEFAULT_NEIGHBORHOOD.length);
		this.sedimentLoad = 0;
	}

    pickupSediment(){
		if (grid[this.x][this.y].elevation - SETTINGS.erosionFactor <= MIN_ELEVATION){
			return;
		}
		grid[this.x][this.y].elevation -= SETTINGS.erosionFactor;
		this.sedimentLoad += SETTINGS.erosionFactor;
	}

    depositSediment() {
		if (this.sedimentLoad - SETTINGS.erosionFactor >= 0) {
			grid[this.x][this.y].elevation += SETTINGS.erosionFactor
			this.sedimentLoad -= SETTINGS.erosionFactor;
		}
	}

	turn(rightOrLeft) {
		this.dir = rightOrLeft === 'right' ? (DEFAULT_NEIGHBORHOOD.length + this.dir + 1) % DEFAULT_NEIGHBORHOOD.length: (DEFAULT_NEIGHBORHOOD.length + this.dir - 1) % DEFAULT_NEIGHBORHOOD.length;
	}

    erode() {
		topple(this.x, this.y);
	}

	getCurrentElevation() {
		return grid[this.x][this.y].elevation + grid[this.x][this.y].waterLevel;
	}

	getProposedElevation() {
		let x = this.x;
		let y = this.y;
		let direction = DEFAULT_NEIGHBORHOOD[this.dir];
		x += direction[0];
		y += direction[1];
		x = wrap(x, 0, W - 1);
		y = wrap(y, 0, H - 1);
		return grid[x][y].elevation + grid[x][y].waterLevel;
	}

    moveForward() {
		let direction = DEFAULT_NEIGHBORHOOD[this.dir];
		let x = this.x + direction[0];
		let y = this.y + direction[1];
		x = wrap(x, 0, W - 1)
		y = wrap(y, 0, H - 1);
		grid[this.x][this.y].waterLevel -= 1;
		this.x = x;
		this.y = y;
		grid[this.x][this.y].waterLevel += 1;
		if (Math.random() < SETTINGS.turnProbability) {
			return this.turn(['left', 'right'][Math.floor(Math.random() * 2)])
		}
	}

	update() {
		let current = this.getCurrentElevation() - SETTINGS.erosionFactor;
		let proposed = this.getProposedElevation() + SETTINGS.erosionFactor;
		if (current > proposed) {
            if (SETTINGS.erosionEnabled){
			    this.pickupSediment();
            }
			this.moveForward();
		} else {
			if (SETTINGS.erosionEnabled){
			    this.depositSediment();
            }
			let p = Math.random();
			if (p < 1/2) {
				this.turn('right')
			} else {
				this.turn('left');
			}
		}
	}


}