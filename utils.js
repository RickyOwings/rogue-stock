/** 
	* @param {number} from
	* @param {number} to 
*/
export function randomRange(from, to) {
	const delta = to - from;
	return Math.random() * delta + from;
}
