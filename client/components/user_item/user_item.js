// components/user_item/user_item.js
Component({

	options: {
		addGlobalClass: true,
	},

	properties: {
		prize_user: Object,
	},

	data: {
		isOpen: false,
	},

	methods: {
		handleChangeOpen() {
			const { isOpen } = this.data;
			this.setData({ isOpen: !isOpen });
		}
	}
});
