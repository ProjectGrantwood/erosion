let w = 300;
let h = 300;
let von_neumann = [
	[0, -1],
	[1, 0],
	[0, 1],
	[-1, 0]
];

let moore = [
	[0, -1],
	[1, -1],
	[1, 0],
	[1, 1],
	[0, 1],
	[-1, 1],
	[-1, 0],
	[-1, -1]
];
const defaultNeighborhood = moore;
const cellSize = 1;

let endCol = [255, 255, 0];
let startCol = [0, 0, 0];

let maxHeight = 255;
let minHeight = 0;

let maxDrops = 50000;
let evaporationRate = 50;
let rainRate = 50;
let rainRatio = 1 / 8;
let sedimentDeposit = 1 / 9;
let springTrickleRate = 10;

let viewDrops = true;
let evaporatingPhase = 0;

let drops = [];
const grid = new Array(w).fill().map(e => new Array(h).fill(0));
let toppledCells = [];
const noiseScale = 75;

let springs = [{
	x: Math.floor(w / 2),
	y: Math.floor(h / 2),
	offset: Math.floor(Math.random() * springTrickleRate)
}];

let rainyRegionCenter = {
	x: Math.floor(w / 2),
	y: Math.floor(h / 2)
};

let rainyRegionRadius = 40;
let evaporationCycle = 0;
let evaporationFrequency = 10;
let evaporationPhaseDuration = 0.5;
let turnProbability = 0.5;
let maxWaterLevelToRender = 4;


function setup() {
	createCanvas(w, h);
	pixelDensity(1);
	const canvas = document.getElementById('defaultCanvas0');
	const grid_wrapper = document.getElementById('grid-wrapper');
	grid_wrapper.appendChild(canvas);
	noiseDetail(5, 0.5);
	background(0);
	for (let x = 0; x < w; x++) {
		for (let y = 0; y < h; y++) {

			let xoff = x + w / 2;
			let yoff = y + h / 1.5;
			let n = noise(xoff / noiseScale, yoff / noiseScale);
			let elevation = n * 255; //(minHeight + (maxHeight - minHeight)) / 2 - 127 + (0.5 + n) * 127;
			grid[x][y] = {
				elevation: elevation,
				toppleElevation: elevation,
				toppled: 0,
				water: 0
			};
		}
	}
}

function draw() {
	if (mouseIsPressed) {
		mousePressed();
	}
	if (evaporationCycle) {
		if (evaporatingPhase) {
			for (let i = 0; i < evaporationRate; i++) {
				evaporate();
			}
		} else {
			for (let i = 0; i < rainRate; i++) {
				rain();
			}
		}
	}
	for (let s of springs) {
		if ((frameCount + springTrickleRate) % (springTrickleRate - s.offset) === 0) {
			brush.addElevation(s.x, s.y, 1);
			brush.addWater(s.x, s.y, 1);
		}
	}
	for (let d = 0; d < drops.length; d++) {
		drops[d].try();
	}
	swapToppledElevation();
	renderAll();
	document.getElementById('drops').innerHTML = `Number of Drops: ${drops.length}`;
	document.getElementById('evaporationPhase').innerHTML = `Evaporation Phase: ${evaporatingPhase === 1 ? 'Evaporating': 'Raining'}`
}

function topple(x, y, neighborhood = defaultNeighborhood) {
	if (grid[x][y].elevation < neighborhood.length) {
		return;
	}
	let total = 0;
	for (let n of neighborhood) {
		let x2 = x + n[0];
		let y2 = y + n[1];
		x2 = x2 < 0 ? width - 1: x2 > width - 1 ? 0: x2;
		y2 = y2 < 0 ? height - 1: y2 > height - 1 ? 0: y2;
		if (grid[x][y].elevation - neighborhood.length > grid[x2][y2].elevation + sedimentDeposit) {
			grid[x2][y2].toppleElevation += sedimentDeposit;
			if (grid[x2][y2].toppled === 0) {
				toppledCells.push([x2, y2]);
				grid[x2][y2].toppled = 1;
			}
			total += sedimentDeposit;
		}
	}
	grid[x][y].toppleElevation -= total;
	if (grid[x][y].toppled === 0) {
		grid[x][y].toppled = 1;
		toppledCells.push([x, y]);
	}

}

function swapToppledElevation() {
	for (let c of toppledCells) {
		let x = c[0];
		let y = c[1];
		grid[x][y].toppled = 0;
		grid[x][y].elevation = grid[x][y].toppleElevation;
	}
	toppledCells = [];
}

function toggleEvaporationCycle() {
	if (evaporationCycle === 1) {
		evaporationCycle = 0;
	} else if (evaporationCycle === 0) {
		evaporationCycle = 1;
	}
}

function mouseDragged() {
	return mousePressed();
}

function mousePressed() {
	let x = Math.floor(mouseX);
	let y = Math.floor(mouseY);
	if (!(x > -1 && y > -1 && x < w && y < h)) {
		return;
	}
	brush.applyOverRadius(brush.getState(false), x, y);
	return false;
}



function renderAll() {
	loadPixels();
	let pix = 0;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let e = grid[x][y].elevation / 255;
			let r = (startCol[0] * (1 - e) + endCol[0] * e);
			let g = (startCol[1] * (1 - e) + endCol[1] * e);
			let b = (startCol[2] * (1 - e) + endCol[2] * e);
			let col = [r,
				g,
				b];
			if (viewDrops && grid[x][y].water > 0) {
				col[2] = (grid[x][y].elevation + grid[x][y].water) / (grid[x][y].elevation + sedimentDeposit) * 255 /((maxWaterLevelToRender - grid[x][y].water) < 1 ? 1 / (grid[x][y].water): maxWaterLevelToRender - grid[x][y].water);
			}
			col[3] = 255;
			pixels[pix++] = col[0];
			pixels[pix++] = col[1];
			pixels[pix++] = col[2];
			pixels[pix++] = col[3];
		}
	}
	updatePixels();
}


function evaporate() {
	let d = Math.floor(Math.random() * drops.length);
	let x = drops[d].x;
	let y = drops[d].y;
	grid[x][y].water -= 1;
	drops.splice(d, 1);
	monitorEvaporationCycle();
}

function rain() {
	let x = Math.floor(randomGaussian(rainyRegionCenter.x, rainyRegionRadius));
	let y = Math.floor(randomGaussian(rainyRegionCenter.y, rainyRegionRadius));
	while (x < 0) {
		x += width;
	}
	while (y < 0) {
		y += height;
	}
	while (x > width - 1) {
		x -= width;
	}
	while (y > height - 1) {
		y -= height
	}
	brush.addWater(x, y, 1);
	monitorEvaporationCycle();
}

function monitorEvaporationCycle() {
	if (drops.length < maxDrops * rainRatio) {
		evaporatingPhase = 0;
	}
	if (drops.length >= maxDrops) {
		evaporatingPhase = 1;
	}
}



class Water {
	constructor(x, y, neighborhood = defaultNeighborhood) {
		this.x = x;
		this.y = y;
		this.dir = Math.floor(Math.random() * neighborhood.length);
		this.neighborhood = neighborhood;
		this.sedimentLoad = 0;
	}

	turn(rightOrLeft) {
		this.dir = rightOrLeft === 'right' ? (this.neighborhood.length + this.dir + 1) % this.neighborhood.length: (this.neighborhood.length + this.dir - 1) % this.neighborhood.length;
	}

	try () {
		let current = this.getCurrentElevation() - sedimentDeposit;
		let proposed = this.getProposedElevation() + sedimentDeposit;
		if (current >= proposed) {
			this.moveForward();
		} else {
			this.depositLoad();
			let p = Math.random();
			if (p < 1/2) {
				this.turn('right')
			} else {
				this.turn('left');
			}
		}
	}

	erode() {
		topple(this.x, this.y);
	}

	moveForward() {
		let direction = this.neighborhood[this.dir];
		let x = this.x + direction[0];
		let y = this.y + direction[1];
		x = x < 0 ? width - 1: x >= width ? 0: x;
		y = y < 0 ? height - 1: y >= height ? 0: y;
		let depositAmount = sedimentDeposit;
		grid[this.x][this.y].water -= grid[this.x][this.y].water > 0 ? 1: 0;
		grid[this.x][this.y].elevation -= depositAmount;
		this.sedimentLoad += depositAmount;
		this.x = x;
		this.y = y;
		grid[this.x][this.y].water += 1;
		if (Math.random() < turnProbability) {
			return this.turn(['left', 'right'][Math.floor(Math.random() * 2)])
		}
	}

	getCurrentElevation() {
		return grid[this.x][this.y].elevation + grid[this.x][this.y].water;
	}
	getProposedElevation() {
		let x = this.x;
		let y = this.y;
		let direction = this.neighborhood[this.dir];
		x += direction[0];
		y += direction[1];
		x = x < 0 ? width - 1: x >= width ? 0: x;
		y = y < 0 ? height - 1: y >= height ? 0: y;
		return grid[x][y].elevation + grid[x][y].water;
	}

	depositLoad() {
		if (this.sedimentLoad >= sedimentDeposit) {
			grid[this.x][this.y].elevation += sedimentDeposit
			this.sedimentLoad -= sedimentDeposit;
		}
	}

}

function toggleDrops() {
	if (viewDrops) {
		viewDrops = false;
	} else {
		viewDrops = true;
	}
}