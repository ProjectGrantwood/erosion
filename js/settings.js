const W = 512;
const H = 512;
const MAX_ELEVATION = 255;
const MIN_ELEVATION = 1;
const COLOR_MAX_ELEVATION = [192, 255, 216];
const COLOR_MIN_ELEVATION = [64, 0, 0];
const DEFAULT_NEIGHBORHOOD = getNeighborhood('moore');

const SETTINGS = {

	//settings with numeric values

	maxDrops: 50000,
	evaporationRate: 200,
	rainRate: 200,
	minDropRatio: 1 / 4,
	erosionFactor: 1 / 8,
	maxSedimentLoad: 4,
	baseSpringGenerationRate: 1,
	noiseScale: 1 / 100,
	rainyRegionRadius: Math.floor(Math.sqrt(W * H) / 8),
	turnProbability: 1 / 3,
	clampWaterDisplayLevel: 1,
	totalDrops: 0,

	//boolean settings

	viewDrops: true,
	isInEvaporationPhase: false,
	evaporationCycleEnabled: false,
	erosionEnabled: true,
	springGenerationEnabled: false,

	toggle(property) {
		this[property] = toggle(this[property]);
	},

	//object settings

	rainyRegionCenter: {
		x: Math.floor(W / 2),
		y: Math.floor(H / 2)
	},

	//enums

	edgeMode: 'VOID',

	enums: {
		'edgeMode': [
			'WRAP',
			'VOID',
			'IGNORE',
		],
	},

	setEdgeMode(mode) {
		if (!this.enums['edgeMode'].includes(mode)){
			return false;
		}
		this.edgeMode = mode;
	}
}