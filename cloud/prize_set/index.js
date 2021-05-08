// 云函数入口文件
const cloud = require('wx-server-sdk');
const TcbRouter = require('tcb-router');
const moment = require('moment');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database({ throwOnNotFound: false });
const log = cloud.logger();

const ACTIVE_NEW = '0NQKCZqMCr-i9pYYtw2qm469uDwnrTMv8WD1BmeH1yo';
// 云函数入口函数
exports.main = async (event, context) => {
	const app = new TcbRouter({ event });
  	/** 通知所有用户抽奖 */
	const setNewActiveMsg = async (prize_id, prize_title) => {
		const { data = [] } = await db.collection('user').field({ _openid: true }).get();
		for(let i = 0; i < data.length; i ++) {
			setTimeout(async () => {
				const touser = data[i]._openid;
				try {
					await cloud.openapi.subscribeMessage.send({
						touser,
						page: 'pages/detail/detail?prize_id=' + prize_id,
						data: {
							thing1: { value: `免费抽${prize_title}已经开始了` },
							time2: { value: moment().format('YYYY年MM月DD日') },
							thing7: { value: '快来看看吧' },
						},
						templateId: ACTIVE_NEW,
					});
				} catch (error) {
					log.error({ error, touser });
				}
			}, i * 1000);
		}
	}
	// ------------------------编辑抽奖页面
	/** 设置抽奖 */
	app.router('set_prize', async (ctx) => {
		const { prize_id, user_id, cover, prize_end, prize_title, prize_desc } = event;
		try {
			if (prize_id) {
				await db.collection('prize').doc(prize_id).update({ data: { cover, prize_end, prize_title, prize_desc, update_time: db.serverDate() }});
			} else {
				// prize_id 的值等待赋值
        const { _id } = await db.collection('prize').add({ data: { user_id, cover, prize_end, prize_title, prize_desc, create_time: db.serverDate() }});
				setNewActiveMsg(_id, prize_title);
			}
			ctx.body = { ok: true };
		} catch (error) {
			log.error({ name: 'set_prize', error });
			ctx.body = { ok: false };
		}
  });
	return app.serve(); // 必需返回
}