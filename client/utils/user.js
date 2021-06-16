import LISTEN from './listen';
import COMFUN from './comfun';

class User {
	constructor() {
		this.user = undefined;
		this.share = {};
	}
	setUserShare(prize_id, key, value) {
		this.share[prize_id] = { ...(this.share[prize_id] || {}), [key]: value };
	}
	getUserShare(prize_id, key) {
		if (!this.share[prize_id]) return '';
		return this.share[prize_id][key];
	}
	setUser(user) {
		if (typeof user === 'object') {
			this.user = { ...(this.user || {}), ...user };
			wx.setStorage({ key: 'userInfo', data: this.user });
			LISTEN.fire();
		}
	}
	getUser() {
		return this.user;
	}
	async getCloudUser() {
		try {
			const db = wx.cloud.database();
			let { data = [] } = await db.collection('user').get();
			if (data.length === 0) {
				await db.collection('user').add({ data: { nickname: '', avatar_url: '', create_time: db.serverDate() } });
				data = (await db.collection('user').get()).data;
			}
			this.setUser(data[0]);
		} catch (error) {
			COMFUN.showErr({ error, type: 'get_cloud_user' });
		}
	}
	async updateCloudUser() {
		if (!this.user) return;
		COMFUN.vibrate();
		let userProfile = '';
		try {
			const { userInfo } = await COMFUN.wxPromise(wx.getUserProfile)({ desc: '用户中奖码头像展示与识别' });
			userProfile = userInfo;
		} catch (error) {
			console.log(error);
		}
		if (!userProfile) return;
		wx.showLoading();
		try {
			const cloud_res = await wx.cloud.callFunction({
				name: 'user',
				data: { $url: 'set_userInfo', user_id: this.user._id, userInfo: userProfile },
			});
			COMFUN.result(cloud_res);
			await this.getCloudUser();
		} catch (error) {
			COMFUN.showErr({ type: 'set_userInfo', error });
		}
		wx.hideLoading();
	}
}

const user = new User();

export default user;
