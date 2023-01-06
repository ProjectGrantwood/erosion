class Water {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.dir = Math.floor(Math.random() * DEFAULT_NEIGHBORHOOD.length);
		this.sedimentLoad = 0;
	}

    pickupSediment(){
		if (this.sedimentLoad > SETTINGS.maxSedimentLoad || grid[this.x][this.y].nextElevation - grid[this.x][this.y].nextWaterLevel * SETTINGS.sedimentPickup < MIN_ELEVATION){
			return;
		}
		grid[this.x][this.y].nextElevation -= SETTINGS.sedimentPickup;
		this.sedimentLoad += SETTINGS.sedimentPickup;
	}

    depositSediment() {
		if (this.sedimentLoad <= 0 || grid[this.x][this.y].elevation + SETTINGS.sedimentDropoff > MAX_ELEVATION) {
            return;
        }
			grid[this.x][this.y].nextElevation += SETTINGS.sedimentDropoff;
			this.sedimentLoad -= SETTINGS.sedimentDropoff;
	}

	turn(rightOrLeft) {
		this.dir = rightOrLeft === 'right' ? (DEFAULT_NEIGHBORHOOD.length + this.dir + 1) % DEFAULT_NEIGHBORHOOD.length: rightOrLeft === 'left' ? (DEFAULT_NEIGHBORHOOD.length + this.dir - 1) % DEFAULT_NEIGHBORHOOD.length: this.dir;
	}

    erode() {
		topple(this.x, this.y);
	}

	getElevation(cell) {
		return cell.elevation + cell.waterLevel;
	}

	getNextCell(){
		let x = this.x;
		let y = this.y;
		let direction = DEFAULT_NEIGHBORHOOD[this.dir];
		x += direction[0];
		y += direction[1];
		if (x < 0 || x > W - 1 || y < 0 || y > H - 1) {
			switch(SETTINGS.edgeMode) {
				case 'WRAP': 
					x = wrap(x, 0, W - 1);
					y = wrap(y, 0, H - 1);
					break;
				case 'VOID':
					return false;
				case 'IGNORE':
					return MAX_ELEVATION + 1;
			}
		}
		return grid[x][y];
	}

    moveForward() {
		let direction = DEFAULT_NEIGHBORHOOD[this.dir];
		let x = this.x + direction[0];
		let y = this.y + direction[1];
		x = wrap(x, 0, W - 1);
		y = wrap(y, 0, H - 1);
        grid[this.x][this.y].nextWaterObjects.splice(grid[this.x][this.y].nextWaterObjects.indexOf(this), 1);
        grid[this.x][this.y].nextWaterLevel -= 1;
		this.x = x;
		this.y = y;
        grid[this.x][this.y].nextWaterObjects.push(this);
        grid[this.x][this.y].nextWaterLevel += 1;
		if (Math.random() < SETTINGS.turnProbability) {
			return this.turn(['left', 'right'][Math.floor(Math.random() * 2)]);
		}
	}

	update() {
		let proposed = this.getNextCell();
		let proposedElevation = this.getElevation(proposed);

		if (proposedElevation === false) {

			//If getProposedElevation() returns "false" instead of a number, it determined that the edgeMode is set to "VOID" and that the drop has approached the edge of the grid space, and therefore must be removed.
			
			let d = grid[this.x][this.y].waterObjects[grid[this.x][this.y].nextWaterObjects.indexOf(this)];
			grid[this.x][this.y].nextWaterObjects.splice(d, 1);
			grid[this.x][this.y].nextWaterLevel -= 1;
			drops.splice(drops.indexOf(this), 1);
			SETTINGS.totalDrops -= 1;
			return;
		}
		
		let currentElevation = this.getElevation(grid[this.x][this.y])
		
		if (currentElevation >= proposedElevation + SETTINGS.sedimentDropoff) {
            if (SETTINGS.erosionEnabled){
				if (this.sedimentLoad < SETTINGS.maxSedimentLoad)
			    this.pickupSediment();
            }
			this.moveForward();
			if (SETTINGS.erosionEnabled && this.sedimentLoad > SETTINGS.sedimentDropoff){
				this.depositSediment();
				
			}
		} else {
			if (SETTINGS.erosionEnabled && this.sedimentLoad > SETTINGS.sedimentDropoff){
				this.depositSediment();
				
			}

			if (Math.random() < SETTINGS.turnProbability) this.turn(['left', 'right'][Math.floor(Math.random() * 2)]);
			
		}
	}
    
}