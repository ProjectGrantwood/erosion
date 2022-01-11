const brush = {

	size: 40,
	radius: 20,
	radiusSquared: 400,
	state: 0,
	states: [
		'addWater',
		'removeWater',
		'addElevation',
		'subElevation',
		'addSpring',
		'removeSpring',
	],
	stateNames: [
		'Add Water',
		'Remove Water',
		'Increase Elevation',
		'Decrease Elevation',
		'Add Spring',
		'Remove Spring',
	],

	addWater(x, y) {
		let d = new Water(x, y);
		grid[x][y].nextWaterObjects.push(d);
		grid[x][y].nextWaterLevel += 1
		drops.push(d);
		SETTINGS.totalDrops += 1;
		monitorEvaporationCycle();
	},

	removeWater(x, y) {
		if (grid[x][y].nextWaterLevel <= 0) {
			return;
		}
		let d = grid[x][y].nextWaterObjects[grid[x][y].nextWaterObjects.length - 1];
		grid[x][y].nextWaterObjects.pop();
		grid[x][y].nextWaterLevel -= 1
		drops.splice(drops.indexOf(d), 1)

		SETTINGS.totalDrops -= 1;
	},

	addElevation(x, y, amt = 1) {
		grid[x][y].nextElevation = grid[x][y].nextElevation + amt > MAX_ELEVATION ? MAX_ELEVATION : grid[x][y].nextElevation + amt;
	},

	subElevation(x, y, amt = 1) {
		grid[x][y].nextElevation = grid[x][y].nextElevation - amt < MIN_ELEVATION ? MIN_ELEVATION : grid[x][y].nextElevation - amt;
	},

	addSpring(x, y) {
		if (springs[x][y].active === true) {
			return;
		}
		springs[x][y].active = true;
	},

	removeSpring(x, y) {
		if (springs[x][y].active === false) {
			return;
		}
		springs[x][y].active = false;
	},

	applyOverRadius(aFunction, x, y) {

		if ((this.size === 1) || aFunction === this.addSpring) {
			aFunction(x, y);
			return false;
		}

		const xmin = x - this.radius;
		const xmax = x + this.radius;
		const ymin = y - this.radius;
		const ymax = y + this.radius;

		let averageElevation = 0;
		let elevationRange;

		if (aFunction === this.addElevation || aFunction === this.subElevation) {
			let total = 0;
			let minElevation, maxElevation;
			for (let i = xmin; i < xmax; i++) {
				const xdist = Math.abs(i - x);
				for (let j = ymin; j < ymax; j++) {
					const ydist = Math.abs(j - y);
					const distance = ((xdist * xdist + ydist * ydist));
					if (!(i > -1 && j > -1 && i < W && j < H) || distance > this.radiusSquared) {
						continue;
					}
					if (total === 0) {
						minElevation = grid[x][y].elevation;
						maxElevation = grid[x][y].elevation;
					}
					minElevation = Math.min(grid[x][y].elevation, minElevation);
					maxElevation = Math.max(grid[x][y].elevation, maxElevation);
					averageElevation += grid[x][y].elevation;
					total += 1;
				}
			}
			averageElevation /= total;
			elevationRange = maxElevation - minElevation;
			for (let i = xmin; i < xmax; i++) {
				const xdist = Math.abs(i - x);
				for (let j = ymin; j < ymax; j++) {
					const ydist = Math.abs(j - y);
					const distance = ((xdist * xdist + ydist * ydist));
					if (!(i > -1 && j > -1 && i < W && j < H) || distance > this.radiusSquared) {
						continue;
					}
					aFunction(i, j, averageElevation / grid[i][j].elevation * distance / this.radiusSquared);
				}
			}
		}
		else {
			for (let i = xmin; i < xmax; i++) {
				const xdist = Math.abs(i - x);
				for (let j = ymin; j < ymax; j++) {
					const ydist = Math.abs(j - y);
					const distance = ((xdist * xdist + ydist * ydist));
					if (!(i > -1 && j > -1 && i < W && j < H) || distance > this.radiusSquared) {
						continue;
					}
					aFunction(i, j);
				}
			}
		}
	},

	render(id, toRender) {
		document.getElementById(id).innerHTML = toRender;
	},

	increaseSize(amt = 1) {
		this.size = this.size + amt;
		this.recalculateConstants();
		this.render('brushsizebutton', `Brush Size: ${this.size}`);
	},

	decreaseSize(amt = 1) {
		this.size = this.size - amt;
		this.size = this.size < 1 ? 1 : this.size;
		this.recalculateConstants();
		this.render('brushsizebutton', `Brush Size: ${this.size}`);
	},

	recalculateConstants() {
		this.radius = constrain(Math.floor(this.size / 2), 1, Infinity);
		this.radiusSquared = this.radius ** 2;
	},

	cycleState() {
		this.state += 1;
		this.state = this.state === this.states.length ? 0 : this.state;
		this.render('brushfunctionbutton', `Brush Function: ${this.getState(true)}`);
	},

	getState(toRender) {
		if (toRender) {
			return this.stateNames[this.state];
		}
		let renderString;
		switch (this.states[this.state]) {
			case 'addWater': renderString = this.addWater; break;
			case 'removeWater': renderString = this.removeWater; break;
			case 'addElevation': renderString = this.addElevation; break;
			case 'subElevation': renderString = this.subElevation; break;
			case 'addSpring': renderString = this.addSpring; break;
			case 'removeSpring': renderString = this.removeSpring; break;
		}
		return renderString;
	},

	setState(indexOrStateId) {
		let type = typeof indexOrStateId;
		switch (type) {
			case 'number': this.state = indexOrStateId; break;
			case 'String': this.state = this.states.indexOf(indexOrStateId); break;
		}
		this.render('brushfunctionbutton', `Brush Function: ${this.getState(true)}`);
	}

}