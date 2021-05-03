// client/pages/edit/edit.js
import COMFUN from '../../utils/comfun';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    prize_id: '',
    cover: '',
    prize_title: '',
    prize_desc: '',
  },

  async handleUploadImage() {
    try {
      const imageRes = await COMFUN.wxPromise(wx.chooseImage)({
        count: 9,
        sizeType: ['compressed'],
        sourceType: ['album'],
      });
      const { path, size } = imageRes.tempFiles[0];
      if (size > 1024 * 1024 * 0.95) {
        this.stopClickSubmit(); // 取消立即更新
        await COMFUN.wxPromise(wx.showModal)({ title: '图片太大了', content: '请修改后重试', showCancel: false, confirmText: '我知道了' });
        return;
      }
      const suffix = /\.\w+$/.exec(path)[0];
      const { fileID } = await COMFUN.wxPromise(wx.cloud.uploadFile)({
        cloudPath: `cover/${Date.now()}${Math.round(
          Math.random() * 100000
        )}${suffix}`,
        filePath: path,
      });
      this.setData({ cover: fileID });
    } catch (error) {
      COMFUN.showErr({ error, type: 'upload_image' })
    }
  },
  async setPrizeData() {
    try {
      const { prize_id, cover, prize_title, prize_desc } = this.data;
      const result = await COMFUN.wxPromise(wx.showModal)({
        title: prize_id ? '修改' : '新增',
        content: prize_id ? '确定修改此抽奖内容吗' : '确定新增抽奖吗',
      });
      if (!result.confirm) return;
      wx.showLoading();
      const cloud_res = await wx.cloud.callFunction({
        name: 'prize',
        data: {
          $url: 'set_prize',
          prize_id,
          cover,
          prize_title,
          prize_desc,
        },
      });
      COMFUN.result(cloud_res).success(() => {
        wx.hideLoading();
        wx.showToast({ title: '修改成功' });
        this.getPrizeData(false);
      })
    } catch (error) {
      wx.hideLoading();
      COMFUN.showErr({ type: 'set_prize_dtl', error });
    }
  },
  async getPrizeData(loading = true) {
    const { prize_id } = this.data;
    if (!prize_id) return;
    loading && wx.showLoading();
    try {
      const cloud_res = await wx.cloud.callFunction({
        name: 'prize',
        data: { $url: 'get_prize', prize_id },
      });
      COMFUN.result(cloud_res).success(({ data }) => {
        const { cover = '', prize_title = '', prize_desc = '' } = data;
        this.setData({ cover, prize_title, prize_desc });
      })
    } catch (error) {
      COMFUN.showErr({ type: 'get_prize_dtl', error });
    }
    loading && wx.hideLoading();
  },
  onLoad: function (options) {
    const { prize_id = '17453ede608d013405e7ddf51561b396' } = options;
    this.setData({ prize_id }, this.getPrizeData);
  },
})