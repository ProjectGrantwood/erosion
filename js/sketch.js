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
	erosionFactor: 1 / 4,
	baseSpringGenerationRate: 10,
	noiseScale: 1 / 80,
	rainyRegionRadius: Math.floor(Math.sqrt(W * H)),
	turnProbability: 1 / 8,
	clampWaterDisplayLevel: 2,
	totalDrops: 0,

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

let springs = new Array(W).fill().map(
	e => new Array(H).fill().map(
		j =>
			({
				active: false, 
				offset: Math.floor(Math.random() * SETTINGS.baseSpringGenerationRate)
			})
		)
	
);

//////////////////////////////////////////////////////////////////////////////////////
//
// SETUP
//
//////////////////////////////////////////////////////////////////////////////////////

function setup() {

	createCanvas(W, H);
	pixelDensity(1);
	noiseDetail(5, 0.5);
	background(0);

	const canvas = document.getElementById('defaultCanvas0');
	const grid_wrapper = document.getElementById('grid-wrapper');
	grid_wrapper.appendChild(canvas);

	springs[Math.floor(W / 2)][Math.floor(H / 2)].active = true;

	for (let x = 0; x < W; x++) {
		for (let y = 0; y < H; y++) {
			let xoff = x + W / 2;
			let yoff = y + H / 1.5;
			let n = 0.5 + 0.5 * (noise((xoff * SETTINGS.noiseScale), (yoff * SETTINGS.noiseScale)) - 0.5);
			let elevation = Math.floor((n * 255) / SETTINGS.erosionFactor) * SETTINGS.erosionFactor; //(minH + (maxH - minH)) / 2 - 127 + (0.5 + n) * 127;
			grid[x][y] = {
				elevation: elevation,
				nextElevation: elevation,
				toppleElevation: elevation,
				toppled: 0,
				waterLevel: 0,
				nextWaterLevel: 0,
				waterObjects: [],
				nextWaterObjects: [],
			};
		}
	}
}

//////////////////////////////////////////////////////////////////////////////////////
//
// DRAW
//
//////////////////////////////////////////////////////////////////////////////////////

function draw() {

	swapAll();

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

	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			if (springs[x][y].active === true) {
				let s = springs[x][y];
				if ((frameCount + SETTINGS.baseSpringGenerationRate) % (SETTINGS.baseSpringGenerationRate - s.offset) === 0) {
					brush.addElevation(x, y);
					brush.addWater(x, y);
				}
			}
			// let drops = grid[x][y].waterObjects;
			// for (let d = 0; d < grid[x][y].waterObjects.length; d++){
			// 	drops[d].update();
			// }
		}
	}

	for (let d of drops){
		d.update();
	}
	
	renderAll();
	document.getElementById('drops').innerHTML = `Number of Drops: ${SETTINGS.totalDrops}`;
	document.getElementById('evaporationPhase').innerHTML = `Evaporation Phase: ${SETTINGS.isInEvaporationPhase === true ? 'Evaporating': 'Raining'}`
}

function swap(x, y){
	const temp = {elevation, waterLevel, waterObjects} = grid[x][y];
	grid[x][y].elevation = grid[x][y].nextElevation;
	grid[x][y].waterLevel = grid[x][y].nextWaterLevel;
	grid[x][y].waterObjects = grid[x][y].nextWaterObjects;
	grid[x][y].nextElevation = temp.elevation;
	grid[x][y].nextWaterLevel = temp.waterLevel;
	grid[x][y].nextWaterObjects = temp.nextWaterObjects;
}

function swapAll(){
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			swap(x, y);
		}
	}
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
			grid[x2][y2].nextElevation += SETTINGS.erosionFactor;
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
		grid[x][y].nextElevation = grid[x][y].nextElevation;
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
}

function mousePressed() {
	let x = Math.floor(mouseX);
	let y = Math.floor(mouseY);
	if ((x > -1 && y > -1 && x < W && y < H)) {
		brush.applyOverRadius(brush.getState(false), x, y);
		return false;
	}
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
					col[2] = (grid[x][y].elevation + grid[x][y].waterLevel) / (grid[x][y].elevation) * 255 / ((SETTINGS.clampWaterDisplayLevel - grid[x][y].waterLevel) < 1 ? (1 / grid[x][y].waterLevel): SETTINGS.clampWaterDisplayLevel - grid[x][y].waterLevel);
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
	let x = Math.floor(Math.random() * W);
	let y = Math.floor(Math.random() * H);
	brush.removeWater(x, y);
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
	if (SETTINGS.totalDrops < SETTINGS.maxDrops * SETTINGS.minDropRatio) {
		SETTINGS.isInEvaporationPhase = false;
	}
	if (SETTINGS.totalDrops >= SETTINGS.maxDrops) {
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
