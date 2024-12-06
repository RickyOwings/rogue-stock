export function init() {
	const modal = document.body.querySelector("#modal");
	if (!modal) return;

	for(const div of modal.children) {
		if (div instanceof HTMLDivElement)
			div.className = "modal-container";
	}

	propogateTargetVisibility();

	for(const elem of document.body.querySelectorAll("*[modal-action]")) {
		const target = elem.getAttribute("modal-action");
		if (!target) continue;
		if (!(elem instanceof HTMLElement)) continue;
		elem.onclick = function() {
			select(target);
		}	
	}

}

export function propogateTargetVisibility() {
	const modal = document.body.querySelector("#modal");
	if (!modal) return;
	for(const child of modal.children) {
		if (!child.classList.contains("modal-container")) continue;
		if ("#" + child.id === modal.getAttribute("target")) {
			child.classList.remove("invisible");
			console.log("ah");
		} else {
			child.classList.add("invisible");
		}
	}
}


/**
 * @param {string} target 
 */
export function select(target) {
	const modal = document.body.querySelector("#modal");
	if (!modal) return;
	modal.setAttribute("target", target);
	propogateTargetVisibility();	
}
