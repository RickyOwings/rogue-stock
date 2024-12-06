import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { initConfig } from './config.js';
import { initUserInput } from './input.js';
import { genContentType, contentTypes } from './contentType.js';
import * as Stocks from './stocks/index.js';

console.clear();

/** @description configuration files initialization */
const config = initConfig();

Stocks.init({
	_config: config,
});

/** @description object that contains functions for handling terminal user input */
const userInput = initUserInput(config);


function handle404(
	/** @type {string} */ url, 
	/** @type{import('node:http').ServerResponse} */ res
) {
	userInput.error(chalk.red(`[URL]         ${url}`));
	userInput.error(chalk.red(`[404]`));
	res.writeHead(404, {'content-type': contentTypes.txt});
	res.end("404 Not Found");
}


const server = http.createServer(function(req, res) {
	let url = req.url;
	if (url === undefined) return;
	if (url === '/') url = "/index.html";
	if (url === "/favicon.ico") url = "/favicon.svg";

	// gets the html content type to be used
	const contentType = genContentType(url);

	if (!contentType) { // If the content type is not defined
		handle404(url, res);
		return;
	};

	/** @type {Buffer} 
	 * @description File that we send back to the user*/
	let file;
	try { // Doing a try catch when reading the file. If it doesn't exist, then 404
		file = fs.readFileSync(path.join(config.appDir, url));
	} catch (err) {
		handle404(url, res);
		return;
	}

	userInput.log(chalk.green(`[URL]         ${url}`))
	userInput.log(chalk.yellow(`[Content-Type]     ${contentType}`))

	res.writeHead(200, {'content-type': contentType});
	res.end(file);
});

server.listen(config.port, config.ip, function(){
	console.log(`Listening on ${chalk.green(`${config.fullAddress()}`)}`);
});
