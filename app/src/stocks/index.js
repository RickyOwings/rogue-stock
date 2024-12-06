/** @typedef {{
 * 		name?: string,
 * 		element: HTMLElement,
 * 		iconUrl: string,
 * 		initialValue: number,
 *   	riskiness: number
 * }} StockElementParams 
 * */

class StockElement {

	/** @type {Map<string, StockElement>} 
	 * @description 
	 * The map that stores all globally accesible stocks.
	 * Can add to the map by calling the StockElement.addStock
	 * function. */ 
	static elements = new Map();

	/** 
	 * @description 
	 * Adds a stock to the static StockElement.elements Map.
	 * The name of the stock is used as the key for the Map.
	 * @param {StockElementParams} args 
	 * The arguments defined in StockElementParams.
	 * @returns {boolean} whether or not the stock has been added
	 */
	static addStock(args) {
		const {name} = args;
		if (!name) return false;
		StockElement.elements.set(name, new StockElement(args));
		return true;
	}

	/** @type {string} 
	 * @description The name of the stock */ 
	name;

	/** @type {HTMLElement} 
	 * @description The html element attributed to the stock. This is where everything
	 * related to the stock is contained (including the canvas for the graph). */ 
	element;

	/** @type {string} 
	 * @description The url for the stocks img element */
	iconUrl;

	/** @type {number} 
	 * @description The current value of the stock. This is on a per stock
	 * basis, so if the value were 100, then the value of 2 stocks would be
	 * 200 dollars total (2 * 100). */ 
	value;

	/** @type {number} 
	 * @description A value that denotes how risky the stock is. If a stock is
	 * more risky, then it has a higher chance of changing it's value. This in
	 * turn means that you can make more money or lose more money from these 
	 * stocks. */ 
	riskiness;

	/** @param {StockElementParams} args */
	constructor(args) {
		const {
			name = "noname",
			element,
			initialValue,
			riskiness,
			iconUrl,
		} = args;

		this.name = name;
		this.element = element;
		this.value = initialValue;
		this.riskiness = riskiness;
		this.iconUrl = iconUrl;

		this.#generateHTML();
	}

	#generateHTML() {
		this.element.innerHTML = `
<img src=${this.iconUrl} class="icon"></img>
<h2>${this.name} Stock</h2>
`
	}
}

function template(/** @type {string} */name, /** @type {string} */ iconUrl) {
	return `
<img src=${iconUrl} class="icon"></img>
<h2>${name} Stock</h2>
`	
}

export function init() {
	const stocksDiv = document.body.querySelector("#stocks");
	if (!stocksDiv) return;
	for(const element of stocksDiv.children) {

		if (!(element instanceof HTMLElement)) continue;

		const name = element.getAttribute("name");
		if (name === null) continue;

		const initialShareValueStr = element.getAttribute("initial-share-value");
		if (initialShareValueStr === null) continue;

		let initialShareValue = +initialShareValueStr;
		initialShareValue = (isNaN(initialShareValue)) ? 0 : initialShareValue;

		const iconUrl = element.getAttribute("icon");
		if (!iconUrl) continue;

		StockElement.addStock({
			name,
			riskiness: 1,
			iconUrl,
			initialValue: initialShareValue,
			element,
		});
	}
}
