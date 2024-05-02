import { AI } from '@robojs/ai'
import { logger } from 'robo.js'
import type { RoboRequest } from '@robojs/server'

interface RequestBody {
	image: string
	topic: string
}

export default async (req: RoboRequest<RequestBody>) => {
	const { image, topic } = req.body
	logger.debug('Grading image:', image)

	// See what AI thinks of the image
	const reply = await AI.chatSync(
		[
			{
				role: 'system',
				content: `Grade this image on a scale of 0 to 100 based on how close the image is to "${topic}". Reply with only the number.`
			},
			{
				role: 'user',
				content: [
					{
						type: 'image_url',
						image_url: {
							url: image
						}
					}
				]
			}
		],
		{ showTyping: false }
	)
	logger.debug('AI graded:', reply)

	// Parse the grade from the reply (extract numbers and convert to a number between 0 and 100)
	let grade = 0

	if (reply?.text) {
		const match = reply.text.match(/\d+/)
		if (match) {
			grade = Math.min(100, Math.max(0, parseInt(match[0], 10)))
		}
	}

	return { grade, text: reply?.text }
}
