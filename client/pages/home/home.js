import COMFUN from '../../utils/comfun';
const APP = getApp();
Page({
  data: {
    prize_list: '',
  },
  handleCardClick(event) {
    const { id } = event.currentTarget;
    if (!id) return;
    wx.navigateTo({ url: '/pages/detail/detail?prize_id=' + id});
  },
  loading: false,
  async getPrizeList() {
    const { prize_list } = this.data;
    const { _id: user_id } = await APP.getUser();
    if (this.loading || !user_id) return;
    this.loading = true;
    prize_list === '' && wx.showLoading({ title: 'loading' });
    try {
      const cloud_res = await wx.cloud.callFunction({
        name: 'prize',
        data: { $url: 'get_prize_list', user_id },
      });
      COMFUN.result(cloud_res).success(({ data }) => {
        this.setData({ prize_list: data });
      });
    } catch (error) {
      COMFUN.showErr({ error, type: 'get_prize_list' });
    }
    this.loading = false;
    prize_list === '' && wx.hideLoading();
  },
  onLoad: function (options) {
    this.getPrizeList();
  },
  onShow: function () {
    this.getPrizeList();
  },
  onTabItemTap() {
		getApp().vibrate();
  },
  onReachBottom: function () {

  },
  onShareAppMessage: function () {

  }
})