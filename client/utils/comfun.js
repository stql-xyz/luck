class Comfun {
	/**
   * 通用云函数调用结果提示
   * @param {result} 云函数结果数据
   */
	result({ result: cloud_res }) {
		if (!cloud_res.ok) {
			throw new Error('请求报错 ok: false');
		}
		/** ok: true 要求必执行 */
		const okComplete = (cb) => {
			typeof cb === 'function' && cb();
		};
		/** 成功请求处理 */
		const success = (cb) => {
			if (cloud_res.ok && !cloud_res.errMsg) {
				typeof cb === 'function' && cb(cloud_res);
				typeof cb === 'string' && wx.showToast({ title: cb, icon: 'success' });
			}
			return { complete: okComplete };
		};
		/** 有错误回调函数、 错误处理 */
		const error = (errcb) => {
			if (cloud_res.ok && cloud_res.errMsg) {
				wx.showModal({
					showCancel: false,
					confirmText: '我知道了',
					title: '提示',
					content: cloud_res.errMsg,
					complete: () => {
						typeof errcb === 'function' && errcb();
					},
				});
			}
			return { success };
		};
		/** 没有错误参数、直接调用成功函数 */
		const withoutError = (...args) => {
			error();
			success(...args);
			return { complete: okComplete };
		};
		return { error, success: withoutError, complete: okComplete };
	}
	/**
   * 通用小提示
   */
	showTip(tip) {
		if (!tip) return;
		wx.showToast({ title: tip, icon: 'none' });
	}
	/**
   * 通用网络错误提示
   */
	showErr({ error, type, title = '网络连接失败、请重试' }) {
		console.log(error, type);
		this.showTip(title);
	}
	/**
   * 通用网络错误提示弹框
   */
	showErrModal(options) {
		wx.showModal({
			title: '提示',
			showCancel: false,
			confirmText: '我知道了',
			...options,
		});
	}
	/** 格式化数字 */
	formatThuousandNumber(num) {
		return `${num}`.replace(/\d{1,3}(?=(\d{3})+$)/g, function (s) {
			return s + ',';
		});
	}
	/**
   * 格式化小于10的时间
   * @param {number} num 数字
   */
	formatNum(num) {
		return num > 9 ? num : `0${num}`;
	}
	/**
   * 返回历史事件
   * @param {Date} date 日期对象
   * @param {Boolean} sample 精简模式
   */
	formatDate2Str(oldDate, sample = false) {
		const date = new Date(oldDate);
		if (date.toString() === 'Invalid Date') return;
		const now = new Date();
		now.setHours(0,0,0);
		let str = '';
		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();
		const hour = date.getHours();
		const minute = date.getMinutes();

		const differDate = ((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)).toFixed(8);
		const strList = ['今天', '昨天', '前天', '三', '四', '五', '六', '七', '八', '九'];
		if (now.getTime() < date.getTime()) {
			str = strList[0];
		} else if (differDate <= 1) {
			str = strList[1];
		} else if (differDate <= 2) {
			str = strList[2];
		} else if (differDate < 8) {
			str = `${strList[Math.ceil(differDate)]}天前`;
		} else {
			const add_yaer = (now.getFullYear() !== year);
			add_yaer && (str = `${year}-`);
			const monthDay = `${this.formatNum(month)}-${this.formatNum(day)}`;
			str = `${str}${monthDay}`;
			if (add_yaer) return str;
		}
		const hourMinute = `${this.formatNum(hour)}:${this.formatNum(minute)}`;
		str = sample ? str : `${str} ${hourMinute}`;
		return str;
	}
	/**
   * 封装微信原生api为promise
   * @param {函数} fn wxApi
   */
	wxPromise(fn) {
		return function (obj) {
			const args = [];
			let len = arguments.length - 1;
			while (len-- > 0) args[len] = arguments[len + 1];

			if (obj === void 0) obj = {};
			return new Promise(function (resolve, reject) {
				obj.success = function (res) {
					resolve(res);
				};
				obj.fail = function (err) {
					reject(err);
				};
				fn.apply(void 0, [obj].concat(args));
			});
		};
	}
}

const comfun = new Comfun();

export default comfun;
