import * as Template from './template.js';
import * as Modal from './modal/index.js';
import * as Dollars from './dollars.js';
import * as Stocks from './stocks/index.js';
(async function() {
	await Template.init();
	Modal.init();
	Dollars.init();
	Stocks.init();
})();
