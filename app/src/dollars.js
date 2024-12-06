const INITIAL_DOLLAR_AMOUNT = 500;
let dollarAmount = INITIAL_DOLLAR_AMOUNT;

/** @type {HTMLElement} */
let counter;

export function init() {
	const _counter = document.body.querySelector("#dollarCounter");
	if (!(_counter instanceof HTMLElement)) return;
	counter = _counter;
	updateCounter();
}

export function updateCounter() {
	counter.innerHTML = `$${dollarAmount}`;
}

export function reset() {
	dollarAmount = INITIAL_DOLLAR_AMOUNT;
	updateCounter();
}
