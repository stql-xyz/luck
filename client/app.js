import COMFUN from './utils/comfun';
import LISTEN from './utils/listen';
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'st-1g05trs8941c9deb',
        traceUser: true,
      })
    }
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.globalData = { user: userInfo };
    this.getUser();
  },
  async getUser(update = false) {
    if (!this.globalData.user._id || update) {
      try {
        const db = wx.cloud.database();
        let { data = [] } = await db.collection('user').get();
        if (data.length === 0) {
          await db.collection('user').add({ data: { nickname: '', avatar_url: '', create_time: db.serverDate() } });
          data = (await db.collection('user').get()).data;
        }
        this.globalData.user = data[0];
        wx.setStorage({ data: data[0], key: 'userInfo' });
        LISTEN.fire(LISTEN.keys.setUserInfo);
      } catch (error) {
			  COMFUN.showErr({ error, type: 'get_cloud_user' });
      }
    }
    return this.globalData.user;
  }
})
