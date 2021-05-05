// pages/my/my.js
import LISTEN from '../../utils/listen';
import COMFUN from '../../utils/comfun';
const APP = getApp();
Page({

  data: {
    user: '',
  },

  async getUserInfo() {
    try {
      const db = wx.cloud.database();
      let { data = [] } = await db.collection('user').get();
      APP.globalData.user = data[0];
      wx.setStorage({ data: data[0], key: 'userInfo' });
      this.setData({ user: data[0] });
    } catch (error) {
      console.log(error);
    }
    wx.hideLoading();
  },

  async syncUserInfo() {
    const { _id: user_id } = this.data.user || {};
    if (!user_id) return;
    let userProfile = '';
		getApp().vibrate();
    try {
      const user = await COMFUN.wxPromise(wx.getUserProfile)({ desc: '用户中奖码头像展示与识别' });
      userProfile = user.userInfo;
    } catch (error) {
      console.log(error);
    }
    if (!userProfile) return;
    wx.showLoading({ title: 'loading...' });
    try {
      const cloud_res = await wx.cloud.callFunction({
        name: 'user',
        data: { $url: 'set_userInfo', user_id, userInfo: userProfile },
      });
      COMFUN.result(cloud_res);
      wx.setStorage({ key: 'avatar_url', data: userProfile.avatarUrl });
      wx.showToast({ title: '更新完成' });
      this.getUserInfo();
    } catch (error) {
      wx.hideLoading();
      COMFUN.showErr({ type: 'set_userInfo', error });
    }
  },

  onLoad: function () {
    this.getUserInfo();
    LISTEN.on(LISTEN.keys.setUserInfo, this.getUserInfo);
  },

  onUnload: function() {
    LISTEN.off(LISTEN.keys.setUserInfo, this.getUserInfo);
  },

  onTabItemTap() {
		getApp().vibrate();
  },

  onPullDownRefresh: async function () {
		getApp().vibrate();
		try {
			await this.getUserInfo();
		} catch (error) {
			console.log(error);
		}
    wx.stopPullDownRefresh();
		wx.showToast({ title: '刷新成功', icon: 'none', duration: 1000 });
	},

})