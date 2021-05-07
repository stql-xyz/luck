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
		const user = USER.getUser();
		if (this.loading || !user) return;
		this.loading = true;
		const { prize_list } = this.data;
		prize_list === '' && wx.showLoading({ title: '加载中...' });
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
	onLoad: function () {
		this.getPrizeList();
		LISTEN.on(this.getPrizeList);
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
	onPullDownRefresh: async function () {
		COMFUN.vibrate();
		await this.getPrizeList();
		wx.stopPullDownRefresh();
		wx.showToast({ title: '刷新成功', icon: 'none', duration: 1000 });
	},
	onShareAppMessage: function () {

	}
});