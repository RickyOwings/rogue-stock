export async function init() {
	document.body.style.opacity = "0";
	const templates = document.body.querySelectorAll("div[template]")
	for(const template of templates) {
		const url = template.getAttribute("template");
		if (!url) continue;
		template.innerHTML = await (await fetch(url)).text();
	}
	document.body.style.opacity = "1";
}
