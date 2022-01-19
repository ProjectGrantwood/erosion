//constant parameters





let currentCell = {
	x: 0,
	y: 0,
	waterLevel: 0,
	elevation: 0,
	update(){
		this.waterLevel = grid[this.x][this.y].waterLevel;
		this.elevation = grid[this.x][this.y].elevation;
	},
	render() {
		document.getElementById('mouseX').innerHTML = `x: ${this.x}`;
		document.getElementById('mouseY').innerHTML = `y: ${this.y}`;
		document.getElementById('waterLevel').innerHTML = `Water Level: ${this.waterLevel}`;
		document.getElementById('elevation').innerHTML = `Elevation: ${this.elevation}`;
	}
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
	noiseDetail(12, 0.5);
	background(0);

	const canvas = document.getElementById('defaultCanvas0');
	const grid_wrapper = document.getElementById('grid-wrapper');
	grid_wrapper.appendChild(canvas);

	springs[Math.floor(W / 2)][Math.floor(H / 2)].active = true;

	for (let x = 0; x < W; x++) {
		for (let y = 0; y < H; y++) {
			let xoff = x;
			let yoff = y;
			let n = 0.5 + 0.3 * Math.cos(TAU * (noise(xoff * SETTINGS.noiseScale, yoff * SETTINGS.noiseScale, Math.cos(TAU * noise(xoff * SETTINGS.noiseScale * 2, yoff * SETTINGS.noiseScale * 2)))));
			n += 1 - ((H - y * 2) ** 2 + (W - x * 2) ** 2) / ((W * H + W * H));
			n /= 2;
			let elevation = Math.floor((n * MAX_ELEVATION) / SETTINGS.erosionFactor) * SETTINGS.erosionFactor;
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
	if (SETTINGS.springGenerationEnabled === true) {
		for (let y = 0; y < H; y++) {
			for (let x = 0; x < W; x++) {
				if (springs[x][y].active === true) {
					let s = springs[x][y];
					if ((frameCount + SETTINGS.baseSpringGenerationRate) % (SETTINGS.baseSpringGenerationRate - s.offset) === 0) {
						brush.addElevation(x, y);
						brush.addWater(x, y);
					}
				}
			}
		}
	}

	for (let d of drops){
		d.update();
	}
	
	renderAll();
	document.getElementById('drops').innerHTML = `Number of Drops: ${SETTINGS.totalDrops}`;
	document.getElementById('evaporationPhase').innerHTML = `Evaporation Phase: ${SETTINGS.isInEvaporationPhase === true ? 'Evaporating': 'Raining'}`
	currentCell.update();
	currentCell.render();
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
	if (grid[x][y].elevation < neighborhood.length * SETTINGS.erosionFactor) {
		return;
	}
	let total = 0;
	for (let n of neighborhood) {
		let x2 = x + n[0];
		let y2 = y + n[1];
		x2 = x2 < 0 ? W - 1: x2 > W - 1 ? 0: x2;
		y2 = y2 < 0 ? H - 1: y2 > H - 1 ? 0: y2;
		if (grid[x][y].elevation - neighborhood.length * SETTINGS.erosionFactor > grid[x2][y2].elevation + SETTINGS.erosionFactor) {
			grid[x2][y2].nextElevation += SETTINGS.erosionFactor;
			total += SETTINGS.erosionFactor;
		}
	}
	grid[x][y].nextElevation -= total;
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
	currentCell.x = x;
	currentCell.y = y;
	currentCell.waterLevel = grid[x][y].waterLevel;
	currentCell.elevation = grid[x][y].elevation;
}



function renderAll() {
	loadPixels();
	let pix = 0;
	if (SETTINGS.viewDrops) {
		for (let y = 0; y < H; y++) {
			for (let x = 0; x < W; x++) {
				let e = grid[x][y].elevation / MAX_ELEVATION;
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
				let e = grid[x][y].elevation / MAX_ELEVATION;
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
