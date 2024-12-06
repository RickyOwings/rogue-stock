import readline from 'node:readline';
import chalk from 'chalk';
import * as Stock from './stocks/index.js';



/**
 * @param {import('./config.js').Config} config 
 */
export function initUserInput(config) {
	let doLogs = false;
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});	

	/** @typedef {true | string} ConditionRet */

	/** 
	 * @returns {Promise<number>} 
	 * @param {(value: number) => ConditionRet} condition 
	 * */
	function getUserNum(/** @type {string} */ prompt, condition = () => true) {
		return new Promise(resolve => {
			rl.question(prompt, async function(answer) {
				let number = +answer;
				let conditionCheck = condition(number);
				if (isNaN(number)) {
					console.log(chalk.red("INVALID"));
					number = await getUserNum(prompt, condition);
				} else if(typeof conditionCheck === 'string') {
					console.log(chalk.red(conditionCheck));
					number = await getUserNum(prompt, condition);
				}
				resolve(number); });
		});
	}

	/** 
	 * @returns {Promise<string>} 
	 * @param {(answer: string) => ConditionRet} condition 
	 * */
	function getUserStr(/** @type {string} */ prompt, condition = () => true) {
		return new Promise(resolve => {
			rl.question(prompt, async function(answer) {
				const conditionCheck = condition(answer);
				if (!answer.length) {
					console.log(chalk.red("INVALID"));
					answer = await getUserStr(prompt, condition);
				} else if(typeof conditionCheck === 'string') {
					console.log(chalk.red(conditionCheck));
					answer = await getUserStr(prompt, condition);
				}
				resolve(answer);
			});
		});
	}

	/** 
	 * @type {{[key: string]: (() => void) | (() => Promise<void>)}} *
	 * Object that stores all valid user responses to lowercase
	 */
	const responses = {

		q() {
			console.log("Quitting Server");
			process.exit(0);
		},

		quit() {
			responses.q();
		},

		clear() {
			console.clear();
		},

		cls() {
			responses.clear();
		},

		c() {
			responses.clear();
		},

		h() {
			console.log(`----Commands-----`);
			const names = Object.keys(responses);
			for(const name of names) {
				console.log(`${name}`);
			}
			console.log(`-----------------`);
		},

		help() {
			responses.h();
		},

		l() {
			responses.log();
		},

		log() {
			doLogs = !doLogs;
			console.log(!!doLogs ? "Logs are enabled" : "Logs are disabled");
		},

		ip() {
			console.log("SERVER IP ADDRESS: " + chalk.green(`http://${config.ip}:${config.port}`));
		},

		async addstock() {
			if (!Stock.databaseExists()) {
				console.log("Database doesn't exist! Can't add stocks!");
				return;
			}
			const name = await getUserStr(
				"Stock name: ",
				function(answer) {
					if (Stock.stockExists(answer)) {
						return "Stock already exists!"
					}
					return true;
				}
			);

			const shareValue = await getUserNum(
				"Share value [float]: ",
				function(value) {
					if (value >= 0) return true;
					return "Share value can't be negative";
				}
			);
			const volatility = await getUserNum(
				"Volatility [float]: ",
				function(value) {
					if (value >= 0) return true;
					return "Volatility can't be negative";
				}
			);

			Stock.addStock(name, shareValue, volatility);
		},

		logstocks() {
			const stocks = Stock.getStocks();	
			console.log(stocks);
		},



		async updatestock() {
			let noStocks = false;
			const name = await getUserStr(
				"Stock name: ", function(answer) {
					if(Stock.stockExists(answer)) return true;
					let ret = "Not a valid stock:\n";
					const data = Stock.getStocks();
					if (data === null) {
						noStocks = true;
						return true;
					}

					for(const d of data) {
						ret += "\t" + d.name + "\n";
					}
					
					return ret;
				}
			);

			if (noStocks) return;

			const r_shareValue = await getUserStr(
				"Share value [number | null]: ", function(answer) {
					if (answer === "null") return true;
					if (isNaN(+answer)) return "Not number or null";
					return true;
				}
			);

			const r_volatility = await getUserStr(
				"Volatility value [number | null]: ", function(answer) {
					if (answer === "null") return true;
					if (isNaN(+answer)) return "Not number or null";
					return true;
				}
			);


			if (r_shareValue !== "null") {
				Stock.updateStock({
					name,
					shareValue: +r_shareValue
				});
			}

			if (r_volatility !== "null") {
				Stock.updateStock({
					name,
					volatility: +r_volatility
				});
			}

		},
		async logsharevalues() {
			let noStocks = false;
			const name = await getUserStr(
				"Stock name: ", function(answer) {
					if(Stock.stockExists(answer)) return true;
					let ret = "Not a valid stock:\n";
					const data = Stock.getStocks();
					if (data === null) {
						noStocks = true;
						return true;
					}

					for(const d of data) {
						ret += "\t" + d.name + "\n";
					}
					
					return ret;
				}
			);

			if (noStocks) return;

			const values = Stock.getShareValues(name);
			if (values === null) return;
			if (values.length > 20) {
				values.splice(0, values.length - 20);
			}
			console.log(values);

		}
	};

	function promptUser() {
		rl.question(`${config.prompt}\n`, async function(answer){
			const func = responses[answer.toLowerCase()];
			if (typeof func === 'function') {
				await func();
				promptUser();
			}
			else {
				promptUser();
			}
		});
	}

	promptUser();
	return {
		/** @param {any[]} data */
		log(...data) {
			if(doLogs) {
				console.log(...data);
			}
		},
		/** @param {any[]} data */
		error(...data) {
			if (doLogs) {
				console.log(...data);
			}
		},
	}
}

/** @typedef {ReturnType<typeof initUserInput>} UserInput */
