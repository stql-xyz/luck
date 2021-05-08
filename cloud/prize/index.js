// 云函数入口文件
const cloud = require('wx-server-sdk');
const TcbRouter = require('tcb-router');
const moment = require('moment');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database({ throwOnNotFound: false });
const _ = db.command;
const $ = db.command.aggregate;
const log = cloud.logger();

// 云函数入口函数
exports.main = async (event) => {
	const app = new TcbRouter({ event });
	const { user_id, prize_id } = event;
	/** 获取抽奖列表 */
	app.router('get_prize_list', async (ctx) => {
		try {
			const { list: data = [] } = await db.collection('prize')
				.aggregate()
				.match({ is_end: _.exists(false) })
				.lookup({ from: 'user', localField: 'user_id', foreignField: '_id', as: 'userinfo' })
				.addFields({ user_info: $.arrayElemAt(['$userinfo', 0]) })
				.addFields({
					'user_info.prize_id': '$_id',
					'user_info.prize_title': '$prize_title',
					'user_info.prize_end': '$prize_end',
					'user_info.cover': '$cover',
				})
				.replaceRoot({ newRoot: '$user_info' })
				.project({
					_id: false,
					prize_id: true,
					avatar_url: true,
					nickname: true,
					prize_end: true,
					prize_title: true,
					cover: true,
				})
				.end();
			for(let i = 0; i< data.length; i++) {
				const { prize_id } = data[i];
				const { total } = await db.collection('prize_user').where({ prize_id, user_id }).count();
				data[i].prize_user = total > 0;
			}
			ctx.body = { ok: true, data };
		} catch (error) {
			log.error({ name: 'get_prize_list', error });
			ctx.body = { ok: false };
		}
	});
	/** 获取当前用户抽奖列表详情 */
	app.router('get_prize_list_history', async (ctx) => {
		try {
			const { list: data = [] } = await db.collection('prize_user')
				.aggregate()
				.match({ user_id })
				.lookup({ from: 'prize', localField: 'prize_id', foreignField: '_id', as: 'prize' })
				.addFields({ prize: $.arrayElemAt(['$prize', 0]) })
				.group({
					_id: '$prize._id',
					is_end: $.first('$prize.is_end'),
					cover: $.first('$prize.cover'),
					prize_title: $.first('$prize.prize_title'),
					user_id: $.first('$prize.user_id'),
				})
				.lookup({ from: 'user', localField: 'user_id', foreignField: '_id', as: 'userinfo' })
				.addFields({ user_info: $.arrayElemAt(['$userinfo', 0]) })
				.addFields({
					'user_info.is_end': '$is_end',
					'user_info.prize_id': '$_id',
					'user_info.prize_title': '$prize_title',
					'user_info.cover': '$cover',
				})
				.replaceRoot({ newRoot: '$user_info' })
				.project({
					_id: false,
					is_end: true,
					prize_id: true,
					avatar_url: true,
					nickname: true,
					prize_title: true,
					cover: true,
				})
				.end();
			ctx.body = { ok: true, data };
		} catch (error) {
			log.error({ name: 'get_prize_list', error });
			ctx.body = { ok: false };
		}
	});
	/** 抽奖详情 */
	app.router('get_prize', async (ctx) => {
		try {
			const { data: prize_dtl } = await db.collection('prize').doc(prize_id).get();
			// 当前用户中奖码
			const { list: cur_user = [] } = await db.collection('prize_user')
				.aggregate()
				.match({ prize_id, user_id })
				.lookup({ from: 'user', localField: 'user_id', foreignField: '_id', as: 'userinfo' })
				.addFields({ user_info: $.arrayElemAt(['$userinfo', 0]) })
				.addFields({ 'user_info.prize_key': '$prize_code' })
				.replaceRoot({ newRoot: '$user_info' })
				.project({ _id: true, prize_key: true, avatar_url: true })
				.group({
					_id: '$_id',
					avatar_url: $.first('$avatar_url'),
					prize_key: $.push('$prize_key'),
				})
				.end();
			const prize_cur = cur_user[0] || {};
			/** 当前参与用户数量 */
			const { list: prize_user_list = [] } = await db.collection('prize_user')
				.aggregate()
				.match({ prize_id })
				.lookup({ from: 'user', localField: 'user_id', foreignField: '_id', as: 'userinfo' })
				.addFields({ user_info: $.arrayElemAt(['$userinfo', 0]) })
				.replaceRoot({ newRoot: '$user_info' })
				.group({ _id: '$_id' })
				.group({  _id: null, count: $.sum(1) })
				.project({ _id: false })
				.end();
			const { count: prize_user_count = 0 } = prize_user_list[0] || {};
			if (prize_dtl.is_end) {
				const { data = {} } = await db.collection('user').doc(prize_dtl.end_luck_user_id).get();
				prize_dtl.end_luck_user_avatar = data.avatar_url;
			}
			ctx.body = { ok: true, prize_dtl, prize_cur, prize_user_count };
		} catch (error) {
			log.error({ name: 'get_prize', error });
			ctx.body = { ok: false };
		}
	});
	/** 抽奖分析 */
	app.router('get_analysis', async (ctx) => {
		try {
			const { data: prize } = await db.collection('prize').doc(prize_id).get();
			const { prize_title, end_raw_data, end_factor } = prize;
			const { total: key_total } = await db.collection('prize_user').where({ prize_id }).count();
			ctx.body = { ok: true, prize_title, end_raw_data, end_factor, key_total };
		} catch (error) {
			log.error({ name: 'get_analysis', error });
			ctx.body = { ok: false };
		}
	});
	/** 通知所有用户抽奖 */
	const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))
	const setNewActiveMsg = async (prize_id) => {
		const { data = [] } = await db.collection('user').field({ _openid: true }).get();
		for(let i = 0; i < data.length; i ++) {
			await sleep(1000 * 2);
			const touser = data[i]._openid;
			try {
				await cloud.openapi.subscribeMessage.send({
					touser,
					page: 'pages/detail/detail?prize_id=' + prize_id,
					data: {
						thing1: { value: `免费抽${prize_title}已经开始了` },
						thing2: { value: moment.format('YYYY年MM月DD日') },
						thing7: { value: '快来看看吧' },
					},
					templateId: ACTIVE_RES,
				});
			} catch (error) {
				log.error({ error, touser });
			}
		}
	}
	/** 设置抽奖 */
	app.router('set_prize', async (ctx) => {
		const { user_id, cover, prize_end, prize_title, prize_desc } = event;
		try {
			if (prize_id) {
				await db.collection('prize').doc(prize_id).update({ data: { cover, prize_end, prize_title, prize_desc, update_time: db.serverDate() }});
			} else {
				// prize_id 的值等待赋值
				await db.collection('prize').add({ data: { user_id, cover, prize_end, prize_title, prize_desc, create_time: db.serverDate() }});
				setNewActiveMsg(prize_id);
			}
			ctx.body = { ok: true };
		} catch (error) {
			log.error({ name: 'set_prize', error });
			ctx.body = { ok: false };
		}
	});
	/** 获取抽奖用户 */
	app.router('get_prize_user', async (ctx) => {
		try {
			const { total, limit } = event;
			const { list = [] } = await db.collection('prize_user')
				.aggregate()
				.match({ prize_id })
				.sort({ prize_time: 1 })
				.skip(total)
				.limit(limit)
				.lookup({ from: 'user', localField: 'user_id', foreignField: '_id', as: 'userinfo' })
				.addFields({ user_info: $.arrayElemAt(['$userinfo', 0]) })
				.addFields({ 'user_info.prize_key': '$prize_code' })
				.replaceRoot({ newRoot: '$user_info' })
				.project({ _id: true, prize_key: true, avatar_url: true })
				.group({
					_id: '$_id',
					avatar_url: $.first('$avatar_url'),
					prize_key: $.push('$prize_key'),
				})
				.end();
			ctx.body = { ok: true, data: list };
		} catch (error) {
			log.error({ name: 'get_prize_user', error });
			ctx.body = { ok: false };
		}
	});
	/** 报名抽奖 */
	const setPrize = async () => {
		try {
			const { prize_id } = event;
			const { total: prize_total } = await db.collection('prize_user').where({ prize_id }).count();
			const prize_key = `${prize_total + 1}`.padStart(6, 0);
			const format_time = moment().format('YYYY-MM-DD_HH:mm:ss');
			const prize_code = `${prize_key}_${format_time}`;
			await db.collection('prize_user').add({
				data: { user_id, prize_id, prize_key, prize_code },
			});
			return true;
		} catch (error) {
			log.error({ name: 'set_prize_join', error });
			return false;
		}
	};
	app.router('set_prize_join', async (ctx) => {
		try {
			let time = 20;
			let result = false;
			while((time --) > 0 && result === false) {
				result = await setPrize();
			}
			ctx.body = { ok: true, is_join: result };
		} catch (error) {
			console.log(error);
			log.error({ name: 'set_prize_join', error });
			ctx.body = { ok: false };
		}
	});

	return app.serve(); // 必需返回
};