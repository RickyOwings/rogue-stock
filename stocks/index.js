import * as SQL from 'node:sqlite';
import fs from 'node:fs';
import zod from 'zod';
import * as Utils from '../utils.js';

/** 
 * @description The rate by which the stock database is iterated
 */
const LOOP_INTERVAL = 100;

/**
 * @description The max amount of values per share stored on the database
 */
const MAX_SHARE_VALUE_COUNT = 1000;

/** 
 * @type {import('../config.js').Config | null} 
 * @description A module scope global that stores the config for functions. Initialized in init function
 */
let config = null;

/** 
 * @type {SQL.DatabaseSync | null} 
 * @description The SQL database modules scope reference
 */ 
let database = null;


/**
 * @description Checks if the global "database" exists, returning a boolean
 * @returns {boolean} Whether or not the SQL database exists
 */
export function databaseExists() {
	if (database === null) return false;
	return true;
}

/** 
 * @description The schema that can parse JSON file returned by database.
 * Ensures that the data is what we expect it to be 
 * (also nice with "typescript")
 */
const stockSchema = zod.array(
	zod.object({
		name: zod.string(),
		volatility: zod.number()
	}),
);

/** 
 * @description The schema for the share values retrieved by the database
 */
const shareValuesSchema = zod.array(
	zod.object({
		key: zod.number(),
		value: zod.number()
	})
);

/**
 * @description Function that runs a SQL query to the database checking 
 * if there is a table called "Stocks", that being the table that has
 * all of the stocks (not their stock values).
 */
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
 * @description The initialization function for the database module. If this function
 * is not called, then the "database" and "config" variables will not be initialized
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

/** 
 * Function that iterates through the different stocks and adds a new
 * latest share value
 */
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
				if (shareValueCount > MAX_SHARE_VALUE_COUNT) {
					limitShareValues(stock.name, shareValueCount - MAX_SHARE_VALUE_COUNT);
				}
			}
			
		}
	}

	setTimeout(iterateShareValues, LOOP_INTERVAL);
}


/**
 * @param {string} name 
 * @param {number} shareValue 
 * @param {number} volatility 
 * @description Wrapper for adding a new stock to the database
 */
export function addStock(
	name, 
	shareValue, 
	volatility
) {
	if (database === null) {
		console.log("Database doesn't exist");
		return;
	}

	// Inserting a new record in the Stocks table
	const query1 = database.prepare(`
INSERT INTO Stocks (name, volatility)
VALUES ('${name}', ${volatility});
`);

	query1.run();

	// Creating a new ShareValues_[insert stock name here] table
	const query2 = database.prepare(`
CREATE TABLE ShareValues_${name}(
	key INTEGER PRIMARY KEY,
	value FLOAT
)
`);
	query2.run();

	// Inserting an initial share value into the new ShareValues_[*] table
	const query3 = database.prepare(`
INSERT INTO ShareValues_${name} (value)
VALUES (${shareValue});
`);

	query3.run();
}

/**
 * @param {string} stock 
 * @description removes stocks from the database. 
 */
export function removeStock(stock) {
	// TODO: Implement removing stocks
	if (database === null) {
		console.log("Database doesn't exist");
		return false;
	}
	// Remove the record from Stocks
	// Remove the ShareValues_[*] table
}



/**
 * @param {string} stock - The name of the stock
 * @returns {boolean} Whether or not the stock exists
 * @description Queries the database for if a stock exists
 */
export function stockExists(stock) {
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


/**
 * @description 
 * Returns a database query for all of the stocks in the Stock table
 * Parses the query using the stockSchema to ensure the data is what
 * we expect it to be.
 */
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


/**
 * @param {string} name 
 * @description
 * Function which returns the share values stored in the table ShareValues[*]
 * Data from the SQL query is validated using the shareValuesSchema
 */
export function getShareValues(name) {
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


/**
 * @param {string} name 
 * @param {number} value 
 * @description
 * Adds a stock values into the ShareValues_[*] table
 */
export function addStockValue(name, value) {
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
 * @description Changes the values in the Stocks table
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


/** 
 * @param {string} name 
 * @param {number} [amount=1] 
 * @description
 * Prevents the ShareValues_[*] table from exceeding a given amount
 */
function limitShareValues(name, amount = 1) {
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
