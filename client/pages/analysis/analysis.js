// client/pages/analysis/analysis.js
import COMFUN from '../../utils/comfun';
Page({
  data: {
    tempFileURL: '',
    prize_title: '',
    key_total: '',
    end_factor: '',
    user_count: '',
  },
  async handleDownload(fileID) {
    try {
      const fileList = [{ fileID, maxAge: 60 * 60 }];
      const { fileList: [{ tempFileURL } = {}] = [] } = await COMFUN.wxPromise(wx.cloud.getTempFileURL)({ fileList });
      this.setData({ tempFileURL });
    } catch (error) {
      COMFUN.showErr({ error, type: 'down_load_xlsx' });
    }
  },
  handleCopy() {
    const { tempFileURL } = this.data;
    if (!tempFileURL) {
      wx.showToast({ title: '数据正在生成中、请稍等' });
      return;
    };
    getApp().vibrate();
    wx.setClipboardData({ data: tempFileURL });
  },
  async getAnalysisData() {
    const { prize_id } = this.data;
    if (!prize_id) return;
    wx.showLoading();
    try {
      const cloud_res = await wx.cloud.callFunction({
        name: 'prize',
        data: { $url: 'get_analysis', prize_id },
      });
      COMFUN.result(cloud_res).success((data) => {
        const { prize_title, key_total, end_factor, end_raw_data } = data;
        this.setData({ prize_title, key_total, end_factor });
        this.handleDownload(end_raw_data);
      });
    } catch (error) {
      COMFUN.showErr({ error, type: 'get_analysis_data' });
    }
    wx.hideLoading();
  },
  onLoad: function(options) {
    const { prize_id, user_count } = options;
    this.setData({ prize_id, user_count }, this.getAnalysisData);
  },
})