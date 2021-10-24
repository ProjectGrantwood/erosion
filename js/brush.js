const brush = {

	size: 1,
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
		drops.push(new Water(x, y));
		grid[x][y].waterLevel += 1;
		monitorEvaporationCycle();
	},

	removeWater(x, y) {
		let dropsOnCell = drops.filter(e => e.x === x && e.y === y);
		for (let drop of dropsOnCell) {
			let d = drops.indexOf(drop);
			let x = drops[d].x;
			let y = drops[d].y;
			grid[x][y].waterLevel -= 1;
			drops.splice(d, 1);
		}
	},

	addElevation(x, y, amt = SETTINGS.erosionFactor) {
		grid[x][y].elevation = grid[x][y].elevation + amt > MAX_ELEVATION ? MAX_ELEVATION : grid[x][y].elevation + amt;
	},

	subElevation(x, y, amt = SETTINGS.erosionFactor) {
		grid[x][y].elevation = grid[x][y].elevation - amt < MIN_ELEVATION ? MIN_ELEVATION : grid[x][y].elevation - amt;
	},

	addSpring(x, y) {
		if (!springs.some(e => e.x === x && e.y === y)) {
			springs.push({
				x: x, y: y, offset: Math.floor(Math.random() * SETTINGS.baseSpringGenerationRate)
			});
		}
	},

	removeSpring(x, y) {
		let index;
		for (let s = 0; s < springs.length; s++){
			if (springs[s].x === x && springs[s].y === y) {
				index = s;
				break;
			}
		}
		springs.splice(index, 1);
	},

	applyOverRadius(aFunction, x, y) {
		if (this.size === 1 || aFunction === this.addSpring) {
			aFunction(x, y, 1);
			return false;
		}
		let size = constrain(Math.floor(this.size / 2), 1, this.size);
		let xmin = x - size;
		let xmax = x + size;
		let ymin = y - size;
		let ymax = y + size;
		for (let i = xmin; i < xmax; i++) {
			for (let j = ymin; j < ymax; j++) {
				if (!(i > -1 && j > -1 && i < W && j < H)) {
					continue;
				}
				aFunction(i, j, 1);
			}
		}
	},

	render(id, toRender) {
		document.getElementById(id).innerHTML = toRender;
	},

	increaseSize() {
		this.size = this.size + 1;
		this.render('brushsizebutton', `Brush Size: ${this.size}`);
	},

	decreaseSize() {
		this.size = this.size - 1;
		this.size = this.size < 1 ? 1 : this.size;
		this.render('brushsizebutton', `Brush Size: ${this.size}`);
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