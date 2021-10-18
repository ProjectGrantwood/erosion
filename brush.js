const brush = {

	size: 1,

	addWater(x, y) {
		drops.push(new Water(x, y));
		grid[x][y].water += 1;
		monitorEvaporationCycle();
	},

	removeWater(x, y) {
		let dropsOnCell = drops.filter(e=>e.x === x && e.y === y);
		for (let drop of dropsOnCell) {
			let d = drops.indexOf(drop);
			let x = drops[d].x;
			let y = drops[d].y;
			grid[x][y].water -= 1;
			drops.splice(d, 1);
		}
	},

	addElevation(x, y, amt = sedimentDeposit) {
		grid[x][y].elevation = grid[x][y].elevation + amt > maxHeight ? maxHeight: grid[x][y].elevation + amt;
	},

	subElevation(x, y, amt = sedimentDeposit) {
		grid[x][y].elevation = grid[x][y].elevation - amt < 0 ? 0: grid[x][y].elevation - amt;
	},

	addSpring(x, y) {
		if (!springs.some(e => e.x === x && e.y === y)) {
			springs.push({
				x: x, y: y, offset: Math.floor(Math.random() * springTrickleRate)
			});
		}
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
				if (!(i > -1 && j > -1 && i < w && j < h)) {
					continue;
				}
				aFunction(i, j, 1);
			}
		}
	},

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

	render(id, toRender) {
		let el = document.getElementById(id);
		el.innerHTML = toRender;
	},

	increaseSize() {
		this.size = this.size + 1;
		this.render('brushsize', this.size);
	},

	decreaseSize() {
		this.size = this.size - 1;
		this.size = this.size < 1 ? 1: this.size;
		this.render('brushsize', this.size);
	},

	cycleState() {
		this.state += 1;
		this.state = this.state === this.states.length ? 0: this.state;
		this.render('brushstate', this.getState(true));
	},

	getState(toRender) {
		if (toRender) {
			return this.stateNames[this.state];
		}
		switch (this.states[this.state]) {
			case 'addWater': return this.addWater;
				case 'removeWater': return this.removeWater;
					case 'addElevation': return this.addElevation;
						case 'subElevation': return this.subElevation;
							case 'addSpring': return this.addSpring;
								case 'removeSpring': return this.removeSpring;
							}
					},

					setState(indexOrStateId) {
						let type = typeof indexOrStateId;
						switch (type) {
							case 'number': this.state = indexOrStateId; break;
							case 'String': this.state = this.states.indexOf(indexOrStateId); break;
						}
						this.render('brushstate', this.getState(true));
				}

		}