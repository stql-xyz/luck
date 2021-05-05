// components/mine/row_cell/row_cell.js
Component({
	options: {
		addGlobalClass: true,
		multipleSlots: true,
	},

	properties: {
		title: {
			type: String,
			value: '',
		},
		footer: {
			type: String,
			value: '',
		},
		link: {
			type: String,
			value: '',
		},
	},

	data: {},

	methods: {
		handleClick() {
			const { link } = this.properties;
			if (link) {
				wx.navigateTo({ url: link });
			}
		},
	},
});
