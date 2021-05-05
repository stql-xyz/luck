// client/pages/detail/detail.js
import COMFUN from '../../utils/comfun';
import LISTEN from '../../utils/listen';
const APP = getApp();
Page({

  data: {
    wx_num: 'xh3140877089',

    is_win: '',

    prize_id: '',
    prize_dtl: '',
    prize_cur: '',

    limit: 20,
    loading: false,
    down: false,
    prize_user: '',
    prize_user_count: '',
  },

  /** 获取当前抽奖详情 */
  async getPrizeDtl(hideLoading){
    const { prize_id } = this.data;
    const { _id: user_id } = await APP.getUser();
    if (!prize_id || !user_id) return;
    (hideLoading !== true) && wx.showLoading({ title: 'loading...' });
    try {
      const cloud_res = await wx.cloud.callFunction({
        name: 'prize',
        data: { $url: 'get_prize', prize_id, user_id },
      });
      this.getPrizeUser();
      COMFUN.result(cloud_res).success(({ prize_dtl, prize_cur, prize_user_count }) => {
        this.setData({ prize_dtl, prize_cur, prize_user_count });
      });
      if (this.data.prize_dtl.is_end) {
        const { end_luck_user_id, end_luck_code } = this.data.prize_dtl;
        const { prize_key = [] } = this.data.prize_cur;
        if (end_luck_user_id === user_id && prize_key.indexOf(end_luck_code) > -1) {
          this.setData({ is_win: true });
        } else {
          this.setData({ is_end: false });
        }
      }
    } catch (error) {
      COMFUN.showErr({ type: 'get_prize_dtl', error });
    }
    (hideLoading !== true) && wx.hideLoading();
  },

  /** 获取当前抽奖用户列表 */
  async getPrizeUser(force) {
    const { prize_id, prize_user, limit, down, loading } = this.data;
    if (!prize_id || loading) return;
    if (force !== true && down) return;
    this.setData({ loading: true });
    try {
      const cloud_res = await wx.cloud.callFunction({
        name: 'prize',
        data: {
          $url: 'get_prize_user', 
          prize_id,
          total: prize_user.length,
          limit,
        },
      });
      COMFUN.result(cloud_res).success(({ data }) => {
        const prize_user = (this.data.prize_user || []).concat(data);
        this.setData({ prize_user, down: !data.length });
      })
    } catch (error) {
      COMFUN.showErr({ type: 'get_prize_user', error });
    }
    this.setData({ loading: false });
  },

  /** 抽奖 */
  setLoading: false,
  async setPrize() {
    const { prize_id } = this.data;
    const { _id: user_id } = await APP.getUser();
    if (!prize_id || !user_id || this.setLoading) return;
    this.setLoading = true;
    const avatar_url = wx.getStorageSync('avatar_url');
    if (!avatar_url) {
      let userProfile = '';
      try {
        const user = await COMFUN.wxPromise(wx.getUserProfile)({ desc: '用户中奖码头像展示与识别' });
        userProfile = user.userInfo;
      } catch (error) {
        console.log(error);
      }
      if (!userProfile) {
        COMFUN.showErrModal({ content: '您未授权头像，暂时无法参与抽奖、请重新点击授权' });
        this.setLoading = false;
        return;
      }
      wx.showLoading({ title: 'loading...' });
      try {
        const cloud_res = await wx.cloud.callFunction({
          name: 'user',
          data: { $url: 'set_userInfo', user_id, userInfo: userProfile },
        });
        COMFUN.result(cloud_res);
        wx.setStorage({ key: 'avatar_url', data: userProfile.avatarUrl });
      } catch (error) {
        COMFUN.showErr({ type: 'set_userInfo', error });
      }
    } else {
      wx.showLoading({ title: 'loading...' });
    }
    try {
      const cloud_res = await wx.cloud.callFunction({
        name: 'prize',
        data: { $url: 'set_prize_join', prize_id, user_id },
      });
      COMFUN.result(cloud_res).success(() => {
        wx.showToast({ title: '参与成功' });
        const { prize_user, limit } = this.data;
        this.getPrizeDtl(true);
        if (prize_user.length < limit) {
          this.getPrizeUser(true);
        }
      });
    } catch (error) {
      COMFUN.showErr({ type: 'get_prize_cur', error });
    }
    wx.hideLoading();
    this.setLoading = false;
  },

  onLoad: function (options) {
    const { prize_id } = options;
    this.setData({ prize_id }, this.getPrizeDtl);
    LISTEN.on(LISTEN.keys.setUserInfo, this.getPrizeDtl);
  },

  handleCopy() {
		getApp().vibrate();
    const { wx_num } = this.data;
    wx.setClipboardData({ data: wx_num });
  },

  onUnload: function () {
    LISTEN.off(LISTEN.keys.setUserInfo, this.getPrizeDtl);
  },

  onPullDownRefresh: function () {

  },
})