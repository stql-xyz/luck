import COMFUN from '../../utils/comfun';
Page({
  data: {
    prize_list: '',
  },
  handleCardClick(event) {
    const { id } = event.currentTarget;
    if (!id) return;
    wx.navigateTo({ url: '/pages/detail/detail?prize_id=' + id});
  },
  async getPrizeList() {
    wx.showLoading({ title: 'loading' });
    try {
      const cloud_res = await wx.cloud.callFunction({
        name: 'prize',
        data: { $url: 'get_prize_list_history' },
      });
      COMFUN.result(cloud_res).success(({ data }) => {
        this.setData({ prize_list: data });
      });
    } catch (error) {
      COMFUN.showErr({ error, type: 'get_prize_list' });
    }
    wx.hideLoading();
  },
  onLoad: function (options) {
    this.getPrizeList();
  },
})