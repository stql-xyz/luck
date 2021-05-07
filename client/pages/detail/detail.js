// client/pages/detail/detail.js
import COMFUN from '../../utils/comfun';
import LISTEN from '../../utils/listen';
import USER from '../../utils/user';

Page({

	data: {
		wx_num: 'xh68833',

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
		const user = USER.getUser();
		if (!prize_id || !user) return;
		(hideLoading !== true) && wx.showLoading({ title: '加载中...' });
		LISTEN.off(this.getPrizeDtl); // 监听只执行一次
		try {
			const cloud_res = await wx.cloud.callFunction({
				name: 'prize',
				data: { $url: 'get_prize', prize_id, user_id: user._id },
			});
			this.getPrizeUser();
			COMFUN.result(cloud_res).success(({ prize_dtl, prize_cur, prize_user_count }) => {
				this.setData({ prize_dtl, prize_cur, prize_user_count });
			});
			if (this.data.prize_dtl.is_end) {
				const { end_luck_user_id, end_luck_code } = this.data.prize_dtl;
				const { prize_key = [] } = this.data.prize_cur;
				// 判断是否中奖
				if (end_luck_user_id === user.user_id && prize_key.indexOf(end_luck_code) > -1) {
					this.setData({ is_win: true });
				} else if (prize_key.length > 0) {
					this.setData({ is_win: false });
				} else {
					(hideLoading !== true) && wx.hideLoading();
					const result = await COMFUN.wxPromise(wx.showModal)({
						title: '提示',
						content: '本次抽奖已结束、快去首页看看其他抽奖吧',
					});
					if (result.confirm) {
						wx.switchTab({ url: 'pages/home/home' });
					}
					return;
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
			});
		} catch (error) {
			COMFUN.showErr({ type: 'get_prize_user', error });
		}
		this.setData({ loading: false });
	},

	/** 抽奖 */
	setLoading: false,
	async setPrize() {
		const { prize_id } = this.data;
		const user = USER.getUser();
		if (!prize_id || !user || this.setLoading) return;
		this.setLoading = true;
		if (!user.avatar_url) {
			await USER.updateCloudUser();
		}
		if (!USER.getUser().avatar_url) {
			COMFUN.showErrModal({ content: '请先授权获取头像信息' });
			return;
		}
		wx.showLoading({ title: '加载中...' });
		try {
			const cloud_res = await wx.cloud.callFunction({
				name: 'prize',
				data: { $url: 'set_prize_join', prize_id, user_id: user._id },
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
	/** 中奖复制微信号兑奖 */
	handleCopy() {
		COMFUN.vibrate();
		const { wx_num } = this.data;
		wx.setClipboardData({ data: wx_num });
	},
	/** 去公众号的详情页 */
	handleGoActDtl() {
		const url = '/pages/web_view/web_view?aid=https://mp.weixin.qq.com/s/hL0zd5fx9QGpaPMug4ijbA';
		wx.navigateTo({ url });
	},

	onLoad: function (options) {
		const { prize_id } = options;
		this.setData({ prize_id }, this.getPrizeDtl);
		LISTEN.on(this.getPrizeDtl);
	},

	onUnload: function () {
		LISTEN.off(this.getPrizeDtl);
	},

	onPullDownRefresh: function () {

	},
});