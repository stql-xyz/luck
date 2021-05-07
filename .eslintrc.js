module.exports = {
	'env': {
		'node': true,
		'es2021': true
	},
	'extends': 'eslint:recommended',
	'parserOptions': {
		'ecmaVersion': 12,
		'sourceType': 'module'
	},
	'globals': {
		'__DEV__': true,
		'__WECHAT__': true,
		'__ALIPAY__': true,
		'App': true,
		'Page': true,
		'Component': true,
		'Behavior': true,
		'wx': true,
		'getApp': true,
		'getCurrentPages': true,
	},
	'rules': {
		'indent': [
			'error',
			'tab'
		],
		'linebreak-style': [
			'error',
			'unix'
		],
		'quotes': [
			'error',
			'single'
		],
		'semi': [
			'error',
			'always'
		]
	}
};
