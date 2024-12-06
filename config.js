import path from 'path';

export function initConfig() {
	return Object.freeze({
		appDir: path.resolve("./app"),
		stockDBFol: path.resolve("./stockDB/"),
		stockDBFile() {return path.join(this.stockDBFol, "stocks.db")},
		ip: "localhost",
		port: 3000,
		prompt: "press h to see commands...",
		fullAddress() {return `http://${this.ip}:${this.port}`},
	});
}

/** @typedef {ReturnType<typeof initConfig>} Config*/
