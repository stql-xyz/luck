// client/pages/detail/detail.js
import COMFUN from '../../utils/comfun';
import LISTEN from '../../utils/listen';
const APP = getApp();
Page({

  data: {
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
  prize_dtl_loading: false,
  async getPrizeDtl(){
    const { prize_id } = this.data;
    if (!prize_id) return;
    wx.showLoading({ title: 'loading...' });
    this.prize_dtl_loading = true;
    try {
      const cloud_res = await wx.cloud.callFunction({
        name: 'prize',
        data: { $url: 'get_prize', prize_id },
      });
      COMFUN.result(cloud_res).success(({ data }) => {
        this.setData({ prize_dtl: data });
      })
    } catch (error) {
      COMFUN.showErr({ type: 'get_prize_dtl', error });
    }
    this.prize_dtl_loading = false;
    this.closeLoading();
  },
  closeLoading() {
    if (!this.prize_cur_loading && !this.prize_dtl_loading) {
      wx.hideLoading();
    }
  },
  /** 获取当前用户抽奖状态 */
  prize_cur_loading: false,
  async getPrizeCur() {
    const { prize_id } = this.data;
    const { _id: user_id } = await APP.getUser();
    if (!prize_id || !user_id) return;
    wx.showLoading({ title: 'loading...' });
    this.prize_cur_loading = true;
    try {
      const cloud_res = await wx.cloud.callFunction({
        name: 'prize',
        data: { $url: 'get_prize_cur', prize_id, user_id },
      });
      COMFUN.result(cloud_res).success(({ data }) => {
        this.setData({ prize_cur: data });
      });
    } catch (error) {
      COMFUN.showErr({ type: 'get_prize_cur', error });
    }
    this.prize_cur_loading = false;
    this.closeLoading();
  },
  /** 抽奖 */
  setLoading: false,
  async setPrize() {
    const { prize_id } = this.data;
    const { _id: user_id } = await APP.getUser();
    if (!prize_id || !user_id || this.setLoading) return;
    this.setLoading = true;
    const avatar_url = wx.getStorageSync('avatar_url');
    console.log(avatar_url);
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
        this.getPrizeCur();
        this.getPrizeUserCount();
        const { prize_user, limit } = this.data;
        if (prize_user.length < limit) {
          this.getPrizeUser();
        }
      });
    } catch (error) {
      COMFUN.showErr({ type: 'get_prize_cur', error });
    }
    wx.hideLoading();
    this.setLoading = false;
  },
  /** 获取当前抽奖用户列表 */
  async getPrizeUser() {
    const { prize_id, prize_user, limit } = this.data;
    if (!prize_id) return;
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
  },
  /** 获取当前参与抽奖人数 */
  async getPrizeUserCount() {
    const { prize_id } = this.data;
    if (!prize_id) return;
    try {
      const cloud_res = await wx.cloud.callFunction({
        name: 'prize',
        data: { $url: 'get_prize_user_count', prize_id },
      });
      COMFUN.result(cloud_res).success(({ data }) => {
        this.setData({ prize_user_count: data });
      })
    } catch (error) {
      COMFUN.showErr({ type: 'get_prize_user_count', error });
    }
  },
  onLoad: function (options) {
    LISTEN.on(LISTEN.keys.setUserInfo, this.getPrizeCur);
    const { id:prize_id = '17453ede608d013405e7ddf51561b396' } = options;
    this.setData({ prize_id });
    this.getPrizeDtl();
    this.getPrizeCur();
    setTimeout(() => {
      this.getPrizeUserCount();
      this.getPrizeUser();
    }, 100);
  },

  onUnload: function () {
    LISTEN.off(LISTEN.keys.setUserInfo, this.initPageUserData);
  },

  onPullDownRefresh: function () {

  },
})