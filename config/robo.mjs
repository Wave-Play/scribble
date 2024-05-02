// @ts-check

/**
 * @type {import('robo.js').Config}
 **/
export default {
	experimental: {
		disableBot: true
	},
	logger: {
		level: 'info'
	},
	plugins: [],
	type: 'robo',
	watcher: {
		ignore: ['src/app', 'src/components', 'src/hooks', 'src/app-utils']
	}
}
