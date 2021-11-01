const W = 512;
const H = 512;

const MAX_ELEVATION = 255;
const MIN_ELEVATION = 0;

const COLOR_MAX_ELEVATION = [192, 255, 216];
const COLOR_MIN_ELEVATION = [0, 0, 0];

const DEFAULT_NEIGHBORHOOD = getNeighborhood('moore');

const SETTINGS = {

	//settings with numeric values

	maxDrops: 50000,
	evaporationRate: 50,
	rainRate: 50,
	minDropRatio: 1 / 4,
	erosionFactor: 0.125,
	baseSpringGenerationRate: 10,
	noiseScale: 1 / 75,
	rainyRegionRadius: Math.floor(Math.sqrt(W * H)),
	turnProbability: 0.8,
	clampWaterDisplayLevel: 3,

	//boolean settings

	viewDrops: true,
	isInEvaporationPhase: false,
	evaporationCycleEnabled: false,
	erosionEnabled: true,

	toggle(property) {
		this[property] = toggle(this[property]);
	},

	//object settings

	rainyRegionCenter: {
		x: Math.floor(W / 2),
		y: Math.floor(H / 2)
	},

}

let grid = new Array(W).fill().map(e => new Array(H).fill(0));
let drops = [];
let toppledCells = [];
let springs = [{
	x: Math.floor(W / 2),
	y: Math.floor(H / 2),
	offset: Math.floor(Math.random() * SETTINGS.baseSpringGenerationRate)
}];


function setup() {
	createCanvas(W, H);
	pixelDensity(1);
	const canvas = document.getElementById('defaultCanvas0');
	const grid_wrapper = document.getElementById('grid-wrapper');
	grid_wrapper.appendChild(canvas);
	noiseDetail(5, 0.5);
	background(0);
	for (let x = 0; x < W; x++) {
		for (let y = 0; y < H; y++) {
			let xoff = x + W / 2;
			let yoff = y + H / 1.5;
			let n = 0.5 + 0.5 * (noise((xoff * SETTINGS.noiseScale), (yoff * SETTINGS.noiseScale)) - 0.5);
			let elevation = Math.floor((n * 255) / SETTINGS.erosionFactor) * SETTINGS.erosionFactor; //(minH + (maxH - minH)) / 2 - 127 + (0.5 + n) * 127;
			grid[x][y] = {
				elevation: elevation,
				toppleElevation: elevation,
				toppled: 0,
				waterLevel: 0,
				
			};
		}
	}
}

function draw() {
	if (SETTINGS.evaporationCycleEnabled) {
		if (SETTINGS.isInEvaporationPhase) {
			for (let i = 0; i < SETTINGS.evaporationRate; i++) {
				evaporate();
			}
		} else {
			for (let i = 0; i < SETTINGS.rainRate; i++) {
				rain();
			}
		}
	}
	for (let s of springs) {
		if ((frameCount + SETTINGS.baseSpringGenerationRate) % (SETTINGS.baseSpringGenerationRate - s.offset) === 0) {
			brush.addElevation(s.x, s.y);
			brush.addWater(s.x, s.y, 1);
		}
	}
	for (let d = 0; d < drops.length; d++) {
		drops[d].update();
	}
	
	swapToppledElevation();
	renderAll();
	document.getElementById('drops').innerHTML = `Number of Drops: ${drops.length}`;
	document.getElementById('evaporationPhase').innerHTML = `Evaporation Phase: ${SETTINGS.isInEvaporationPhase === true ? 'Evaporating': 'Raining'}`
}

function topple(x, y, neighborhood = DEFAULT_NEIGHBORHOOD) {
	if (grid[x][y].elevation < neighborhood.length) {
		return;
	}
	let total = 0;
	for (let n of neighborhood) {
		let x2 = x + n[0];
		let y2 = y + n[1];
		x2 = x2 < 0 ? W - 1: x2 > W - 1 ? 0: x2;
		y2 = y2 < 0 ? H - 1: y2 > H - 1 ? 0: y2;
		if (grid[x][y].elevation - neighborhood.length > grid[x2][y2].elevation + SETTINGS.erosionFactor) {
			grid[x2][y2].toppleElevation += SETTINGS.erosionFactor;
			if (grid[x2][y2].toppled === 0) {
				toppledCells.push([x2, y2]);
				grid[x2][y2].toppled = 1;
			}
			total += SETTINGS.erosionFactor;
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
	if (SETTINGS.evaporationCycleEnabled === true) {
		SETTINGS.evaporationCycleEnabled = false;
	} else if (SETTINGS.evaporationCycleEnabled === false) {
		SETTINGS.evaporationCycleEnabled = true;
	}
}

function mouseDragged() {
	mousePressed();
	return false;
}

function mousePressed() {
	let x = Math.floor(mouseX);
	let y = Math.floor(mouseY);
	if (!(x > -1 && y > -1 && x < W && y < H)) {
		return;
	}
	brush.applyOverRadius(brush.getState(false), x, y);
	return false;
}

function mouseMoved(){
	let x = Math.floor(mouseX);
	let y = Math.floor(mouseY);
	if (!(x > -1 && y > -1 && x < W && y < H)) {
		return;
	}
	document.getElementById('mouseX').innerHTML = `x: ${x}`;
	document.getElementById('mouseY').innerHTML = `y: ${y}`;
	let cellInfo = grid[x][y];
	document.getElementById('waterLevel').innerHTML = `Water Level: ${cellInfo.waterLevel}`;
	document.getElementById('elevation').innerHTML = `Elevation: ${cellInfo.elevation}`;
}



function renderAll() {
	loadPixels();
	let pix = 0;
	if (SETTINGS.viewDrops) {
		for (let y = 0; y < H; y++) {
			for (let x = 0; x < W; x++) {
				let e = grid[x][y].elevation / 255;
				let r = (COLOR_MIN_ELEVATION[0] * (1 - e) + COLOR_MAX_ELEVATION[0] * e);
				let g = (COLOR_MIN_ELEVATION[1] * (1 - e) + COLOR_MAX_ELEVATION[1] * e);
				let b = (COLOR_MIN_ELEVATION[2] * (1 - e) + COLOR_MAX_ELEVATION[2] * e);
				let col = [r,
					g,
					b];
				if (grid[x][y].waterLevel > 0) {
					col[2] = (grid[x][y].elevation + grid[x][y].waterLevel) / (grid[x][y].elevation) * 255 / ((SETTINGS.clampWaterDisplayLevel - grid[x][y].waterLevel) < 1 ? 1 / (grid[x][y].waterLevel): SETTINGS.clampWaterDisplayLevel - grid[x][y].waterLevel);
				}
				col[3] = 255;
				pixels[pix++] = col[0];
				pixels[pix++] = col[1];
				pixels[pix++] = col[2];
				pixels[pix++] = col[3];
			}
		}
	} else {
		for (let y = 0; y < H; y++) {
			for (let x = 0; x < W; x++) {
				let e = grid[x][y].elevation / 255;
				let r = (COLOR_MIN_ELEVATION[0] * (1 - e) + COLOR_MAX_ELEVATION[0] * e);
				let g = (COLOR_MIN_ELEVATION[1] * (1 - e) + COLOR_MAX_ELEVATION[1] * e);
				let b = (COLOR_MIN_ELEVATION[2] * (1 - e) + COLOR_MAX_ELEVATION[2] * e);
				let col = [r,
					g,
					b];
				col[3] = 255;
				pixels[pix++] = col[0];
				pixels[pix++] = col[1];
				pixels[pix++] = col[2];
				pixels[pix++] = col[3];
			}
		}
	}
	updatePixels();
	
}


function evaporate() {
	let d = Math.floor(Math.random() * drops.length);
	let x = drops[d].x;
	let y = drops[d].y;
	grid[x][y].waterLevel -= 1;
	drops.splice(d, 1);
	monitorEvaporationCycle();
}

function rain() {
	let x = Math.floor(randomGaussian(SETTINGS.rainyRegionCenter.x, SETTINGS.rainyRegionRadius));
	let y = Math.floor(randomGaussian(SETTINGS.rainyRegionCenter.y, SETTINGS.rainyRegionRadius));
	x = wrap(x, 0, W - 1);
	y = wrap(y, 0, H - 1);
	brush.addWater(x, y, 1);
	monitorEvaporationCycle();
}

function monitorEvaporationCycle() {
	if (!SETTINGS.evaporationCycleEnabled) {
		return;
	}
	if (drops.length < SETTINGS.maxDrops * SETTINGS.minDropRatio) {
		SETTINGS.isInEvaporationPhase = false;
	}
	if (drops.length >= SETTINGS.maxDrops) {
		SETTINGS.isInEvaporationPhase = true;
	}
}

function toggleDrops() {
	if (SETTINGS.viewDrops) {
		SETTINGS.viewDrops = false;
	} else {
		SETTINGS.viewDrops = true;
	}
}
