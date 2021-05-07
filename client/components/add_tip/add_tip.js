// components/add_tip/add_tip.js
Component({
  options: {
		addGlobalClass: true,
	},
  properties: {

  },
  lifetimes: {
    attached: function() {
      const is_show = wx.getStorageSync('add_tip');
      if (!is_show) {
        const rect = wx.getMenuButtonBoundingClientRect();
        const { screenWidth } = wx.getSystemInfoSync();
        this.setData({
          arrowR: screenWidth - rect.right + rect.width*3/4 - 5,
          bodyR: screenWidth - rect.right,
          showTip: true,
        });
      }
    },
  },
  data: {
    showTip: false,
    arrowR: '',
    bodyR: '',
  },
  methods: {
    handleCloseTip() {
      wx.setStorage({
        data: true,
        key: 'add_tip',
      });
      this.setData({ showTip: false });
    }
  }
})
