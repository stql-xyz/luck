import USER from './utils/user';
import LOG from './utils/log';

App({
	onLaunch: function () {
		if (!wx.cloud) {
			console.error('请使用 2.2.3 或以上的基础库以使用云能力');
		} else {
			wx.cloud.init({
				env: 'test-9gxmzpqr89aa5721',
				traceUser: true,
			});
		}
		try {
			const userInfo = wx.getStorageSync('userInfo');
			if (typeof userInfo === 'object') {
				USER.setUser(userInfo);
				setTimeout(USER.getCloudUser.bind(USER), 2000);
			} else {
				USER.getCloudUser();
			}
		} catch (e) {
			LOG.info({ type: 'getStorage' });
		}
	},
});
