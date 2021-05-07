// pages/my/my.js
import LISTEN from '../../utils/listen';
import COMFUN from '../../utils/comfun';
import USER from '../../utils/user';
Page({
	data: {
		user: '',
	},
	getUserInfo() {
		const user = USER.getUser();
		if (!user) return;
		this.setData({ user });
	},
	syncUserInfo() {
		USER.updateCloudUser();
	},
	onLoad: function () {
		this.getUserInfo();
		LISTEN.on(this.getUserInfo);
	},
	onUnload: function() {
		LISTEN.off(this.getUserInfo);
	},
	onTabItemTap() {
		COMFUN.vibrate();
	},
	onPullDownRefresh: async function () {
		COMFUN.vibrate();
		await USER.getCloudUser();
		wx.stopPullDownRefresh();
		wx.showToast({ title: '刷新成功', icon: 'none', duration: 1000 });
	},
});