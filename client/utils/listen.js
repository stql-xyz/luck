/** 只有用户listen */
class Listen {
	constructor(){
		this.onEvent = new Set();
	}
	on(fn) {
		this.onEvent.add(fn);
	}
	fire(...args) {
		this.onEvent.forEach((h) =>h(...args));
	}
	off(fn) {
		this.onEvent.delete(fn);
	}
	size() {
		return this.onEvent.size;
	}
}
const listen = new Listen();
export default listen;