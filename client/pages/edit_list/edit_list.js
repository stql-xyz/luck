import COMFUN from '../../utils/comfun';
Page({
  data: {
    prize_list: [],
  },
  handleCardClick(event) {
    const { id } = event.currentTarget;
    if (!id) return;
    wx.navigateTo({ url: '/pages/edit/edit?prize_id=' + id});
  },
  async getPrizeList() {
    try {
      const cloud_res = await wx.cloud.callFunction({
        name: 'prize',
        data: { $url: 'get_prize_list' },
      });
      COMFUN.result(cloud_res).success(({ data }) => {
        this.setData({ prize_list: data });
      });
    } catch (error) {
      COMFUN.showErr({ error, type: 'get_prize_list' });
    }
  },
  onShow: function (options) {
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