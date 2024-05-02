import { AI } from '@robojs/ai'
import { logger } from 'robo.js'

export default async () => {
	const reply = await AI.chatSync(
		[
			{
				role: 'user',
				content: 'Quick, come up with a random thing for me to draw in 10 seconds! Must be something distinct that can easily be recognized.'
			}
		],
		{ showTyping: false }
	)
	logger.debug('AI replied:', reply)

	return reply
}
