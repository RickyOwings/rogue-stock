export const contentTypes = Object.freeze({
	"js": "text/javascript",
	"html": "text/html",
	"txt": "text/plain",
	"css": "text/css",
	"png": "text/png",
	"svg": "image/svg+xml",
});

/** 
	* Generates the content type
	* @param {string} url 
*/
export function genContentType(url) {
	const s = url.split(".");	
	if (s.length <= 1) {
		return null;
	}
	
	// Casting the type to this. This is bad but I am just 
	// using constant for lsp purposes so I don't care
	
	const extension = /** @type {keyof typeof contentTypes} */ (s[s.length - 1]);
	const contentType = contentTypes[extension];

	if (!contentType) return null;

	return contentType;
}
