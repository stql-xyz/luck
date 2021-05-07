import COMFUN from '../../utils/comfun';
import USER from '../../utils/user';
import LISTEN from '../../utils/listen';
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
    const user = USER.getUser();
    if (this.loading || !user) return;
    this.loading = true;
    prize_list === '' && wx.showLoading({ title: 'loading' });
    try {
      const cloud_res = await wx.cloud.callFunction({
        name: 'prize',
        data: { $url: 'get_prize_list', user_id: user._id },
      });
      COMFUN.result(cloud_res).success(({ data }) => {
        this.setData({ prize_list: data });
      });
    } catch (error) {
      COMFUN.showErr({ error, type: 'get_prize_list' });
    }
    this.loading = false;
    prize_list === '' && wx.hideLoading();
    LISTEN.off(this.getPrizeList);
  },
  onLoad: function (options) {
    this.getPrizeList();
    LISTEN.on(this.getPrizeList)
  },
  onShow: function () {
    this.getPrizeList();
  },
  onUnload: function () {
    LISTEN.off(this.getPrizeList);
  },
  onTabItemTap() {
    COMFUN.vibrate();
  },
  onShareAppMessage: function () {

  }
})