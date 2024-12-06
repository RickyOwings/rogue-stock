import * as SQL from 'node:sqlite';
import fs from 'node:fs';
import zod from 'zod';
import * as Utils from '../utils.js';

const LOOP_INTERVAL = 100;


/** @type {import('../config.js').Config | null} */
let config = null;

/** @type {SQL.DatabaseSync | null} */ 
let database = null;

export function databaseExists() {
	if (database === null) return false;
	return true;
}

const stockSchema = zod.array(
	zod.object({
		name: zod.string(),
		volatility: zod.number()
	}),
);
const shareValuesSchema = zod.array(zod.object({
	key: zod.number(),
	value: zod.number()
}));

function tableExists() {
	if (!database) return false;
	const query = database.prepare(`
SELECT name FROM sqlite_master WHERE name='Stocks';
`);
	const results = query.all();
	if (results.length) return true;
	return false;
}

/**
 * @param {Object} param0 
 * @param {import('../config.js').Config} param0._config
 */
export function init({
	_config,
}) {
	config = _config;
	
	if (!fs.existsSync(config.stockDBFol)) {
		fs.mkdirSync(config.stockDBFol);
	}

	if (!fs.existsSync(config.stockDBFile())) {
		fs.writeFileSync(config.stockDBFile(), "");
	}

	database = new SQL.DatabaseSync(config.stockDBFile());

	if (!tableExists()) {
		database.exec(`
CREATE TABLE Stocks(
key INTEGER PRIMARY KEY,
name TEXT NOT NULL UNIQUE,
volatility FLOAT
);
`);
	}
	iterateShareValues();
}

const maxShareValueCount = 1000;

function iterateShareValues() {
	logic: {
		const stocks = getStocks();
		if (!stocks) break logic;
				
		for(const stock of stocks) {
			const shareValues = getShareValues(stock.name);
			if (shareValues === null) continue;
			const shareValueCount = shareValues.length;
			const latest = shareValues[shareValues.length - 1].value;
			const random = Utils.randomRange(-stock.volatility, stock.volatility);
			const newValue = latest + random;

			if (newValue >= 0) {
				addStockValue(stock.name, newValue);
				if (shareValueCount > maxShareValueCount) {
					limitShareValues(stock.name, shareValueCount - maxShareValueCount);
				}
			}
			
		}
	}
	setTimeout(iterateShareValues, LOOP_INTERVAL);
}


export function addStock(
	/** @type {string} */ name, 
	/** @type {number} */ shareValue, 
	/** @type {number} */ volatility
) {
	if (database === null) {
		console.log("Database doesn't exist");
		return;
	}

	const query1 = database.prepare(`
INSERT INTO Stocks (name, volatility)
VALUES ('${name}', ${volatility});
`);

	query1.run();

	const query2 = database.prepare(`
CREATE TABLE ShareValues_${name}(
	key INTEGER PRIMARY KEY,
	value FLOAT
)
`);
	query2.run();

	const query3 = database.prepare(`
INSERT INTO ShareValues_${name} (value)
VALUES (${shareValue});
`);

	query3.run();
}

export function removeStock(/** @type {string} */stock) {
	if (database === null) {
		console.log("Database doesn't exist");
		return false;
	}
}

export function stockExists(/** @type {string} */stock) {
	if (database === null) {
		console.log("Database doesn't exist");
		return false;
	}

	const query = database.prepare(`
SELECT * FROM Stocks
WHERE name='${stock}'
`);

	const results = query.all();
	if (results.length) {
		return true;
	}
	return false;
}



export function getStocks() {
	if (database === null) {
		return null;
	}

	const query = database.prepare(`
SELECT * FROM Stocks;
`);

	const resultsRaw = query.all();

	const results = stockSchema.safeParse(resultsRaw);

	if (results.data) {
		return results.data;
	}

	return null;
}

export function getShareValues(/** @type {string} */ name) {
	if (database === null) {
		return null;
	}

	const query = database.prepare(`
SELECT * FROM ShareValues_${name};
`);

	const results = query.all();
	const parse = shareValuesSchema.safeParse(results);
	if (parse.data) {
		return parse.data;
	}

	return null;
}

export function addStockValue(/** @type {string} */ name, /** @type {number} */value) {
	if (database === null) {
		return;
	}

	const query = database.prepare(`
INSERT INTO ShareValues_${name} (value)
VALUES (${value});
`);
	query.run();
}


/**
 * @param {Object} param0 
 * @param {string} param0.name 
 * @param {number} [param0.volatility]
 * @param {number} [param0.shareValue]
 */ 
export function updateStock({
	name,
	volatility,
	shareValue
}) {
	if (database === null) {
		console.log("Database doesn't exist!");
		return;
	}

	if (volatility !== undefined) {

		const query = database.prepare(`
UPDATE Stocks
SET volatility = ${volatility}
WHERE name='${name}';
		`);

		query.run();
	}
	if (shareValue !== undefined) {

		const query = database.prepare(`
UPDATE Stocks
SET shareValue = ${shareValue}
WHERE name='${name}';
		`);

		query.run();

	}
}

function limitShareValues(/** @type {string} */ name, amount = 1) {
	if (database === null) return;
	const query = database.prepare(`
DELETE FROM ShareValues_${name}
WHERE key IN (
	SELECT key FROM ShareValues_${name}
	LIMIT ${amount}
);
`);
	query.run();
}
