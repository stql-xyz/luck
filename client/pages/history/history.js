import COMFUN from '../../utils/comfun';
import LISTEN from '../../utils/listen';
import USER from '../../utils/user';
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
		const user = USER.getUser();
		if (!user) return;
		wx.showLoading({ title: '加载中...' });
		try {
			const cloud_res = await wx.cloud.callFunction({
				name: 'prize',
				data: { $url: 'get_prize_list_history', user_id: user._id },
			});
			COMFUN.result(cloud_res).success(({ data }) => {
				this.setData({ prize_list: data });
			});
		} catch (error) {
			COMFUN.showErr({ error, type: 'get_prize_list' });
		}
		wx.hideLoading();
	},
	onLoad: function () {
		this.getPrizeList();
		LISTEN.on(this.getPrizeList);
	},
	onUnload: function () {
		LISTEN.off(this.getPrizeList);
	},
	onPullDownRefresh: async function () {
		COMFUN.vibrate();
		await this.getPrizeList();
		wx.stopPullDownRefresh();
		wx.showToast({ title: '刷新成功', icon: 'none', duration: 1000 });
	},
});