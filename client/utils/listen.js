class Listen {
	constructor(){
		this.onEvent = {};
		this.keys = {
			setUserInfo: 'SET_USER_INFO',
		};
	}
	/**
   * 监听函数
   * @param {string} name 监听keys中的名称
   * @param {function} fn key name对应的监听事件； 不可以直接写匿名函数、否则无法解订阅
   */
	on(name, fn) {
		if (name === '') throw '监听 name 不能为空';
		if (!this.onEvent[name]) {
			this.onEvent[name] = new Set();
		}
		this.onEvent[name].add(fn);
	}
	/**
   * 执行监听触发
   * @param {string} name 监听keys中的名称
   * @param  {...any} args 触发监听事件的参数
   */
	fire(name, ...args) {
		if (!this.onEvent[name]) return;
		this.onEvent[name].forEach((h) => h(...args));
	}
	/**
   * 取消监听
   * @param {string} name 监听keys中的名称
   * @param {function} fn 解除订阅的函数、不写解除所有函数
   */
	off(name, fn) {
		if (name === '') throw '注册名称不能为空、请检查';
		if (!this.onEvent[name]) throw name + ' 重复清除、请检查';
		if (fn === undefined) {
			delete this.onEvent[name];
		} else {
			this.onEvent[name].delete(fn);
		}
	}
	/**
   * 获取监听name的数量
   * @param {string} name 监听keys中的名称
   */
	size(name) {
		if (!this.onEvent[name]) throw name + ' 订阅不存在、请检查';
		return this.onEvent[name].size;
	}
}

const listen = new Listen();

export default listen;
