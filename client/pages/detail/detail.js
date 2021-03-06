// client/pages/detail/detail.js
import COMFUN from '../../utils/comfun';
import LISTEN from '../../utils/listen';
import USER from '../../utils/user';

const ACTIVE_NEW = '0NQKCZqMCr-i9pYYtw2qm469uDwnrTMv8WD1BmeH1yo';
const ACTIVE_RES = 'Pumq7uKH8RW3Kxlw2G_bQKgM5-S-y8mTXY3PkgsC5ts';
const AppData = getApp().globalData;
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
				if (end_luck_user_id === user._id && prize_key.indexOf(end_luck_code) > -1) {
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
		COMFUN.vibrate();
		this.setLoading = true;
		if (!user.avatar_url) {
			await USER.updateCloudUser();
			if (!USER.getUser().avatar_url) {
				COMFUN.showErrModal({ content: '请先授权获取头像信息' });
			} else {
				COMFUN.showErrModal({ content: '头像更新成功、请重新点击参与' });
			}
			return this.setLoading = false;
		} else {
			try {
				const tmplIds = [ACTIVE_NEW, ACTIVE_RES];
				await COMFUN.wxPromise(wx.requestSubscribeMessage)({ tmplIds });
			} catch (error) {
				console.log(error);
			}
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
		setTimeout(() => {
			this.loadShareData();
		}, 3000);
	},

	async loadShareData() {
		const { prize_dtl } = this.data;
		const user = USER.getUser();
		try {
			if (!prize_dtl || !user) return;
			const prize_id = prize_dtl._id;
			if (!USER.getUserShare(prize_id, 'avatar_url')) {
				const { tempFilePath: avatar_url } = await COMFUN.wxPromise(wx.cloud.downloadFile)({ fileID: user.avatar_url });
				USER.setUserShare(prize_id, 'avatar_url', avatar_url);
			}
			// if (!USER.getUserShare(prize_id, 'qrcode_url')) {
			// 	const page = 'pages/detail/detail';
			// 	const { prize_id } = this.data;
			// 	const cloud_res = await wx.cloud.callFunction({ name: 'user', data: { $url: 'get_qrcode', prize_id, user_id: user._id, page } });
			// 	COMFUN.result(cloud_res);
			// 	const { tempFilePath: qrcode_url } = await COMFUN.wxPromise(wx.cloud.downloadFile)({ fileID: cloud_res.result.data });
			// 	USER.setUserShare(prize_id, 'qrcode_url', qrcode_url);
			// }
			console.log('OK');
		} catch (error) {
			console.log(error);
		}
	},

	onUnload: function () {
		LISTEN.off(this.getPrizeDtl);
	},

	onPullDownRefresh: function () {

	},

	onShareAppMessage: function () {
		const { cover, _id, prize_title } = this.data.prize_dtl || {};
		const { nickname } = USER.getUser() || {};
		const title = `${nickname}邀请你免费参加【${prize_title}】抽奖`;
		const path = `/pages/detail/detail?prize_id=${_id}`;
		const result = { title, path };
		cover && (result.imageUrl = cover);
		return result;
	}
});