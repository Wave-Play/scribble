import { Player } from '../components/Player'
import { useSyncState } from '@robojs/sync'
import { useEffect, useRef } from 'react'
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas'
import { useDiscordSdk } from '../hooks/useDiscordSdk'
import { DiscordSession, IGuildsMembersRead } from '../core/types'
import { getUserAvatarUrl } from '../utils/discord'
import { TopBar } from '../components/TopBar'

type PlayerState = DiscordSession['user'] & {
	isTalking?: boolean
}

export const Activity = () => {
	const { accessToken, discordSdk, session } = useDiscordSdk()
	const [players, setPlayers] = useSyncState<PlayerState[]>([], [discordSdk?.channelId, 'players'])
	const [, setScores] = useSyncState<Record<string, number>>({}, [discordSdk?.channelId, 'scores'])
	const canvasRef = useRef<ReactSketchCanvasRef | null>(null)
	const hasDrawing = useRef(false)

	useEffect(() => {
		const run = async (accessToken: string, session: DiscordSession) => {
			// Add the user to the list of players
			// Get guild specific nickname and avatar, and fallback to user name and avatar
			const guildMember: IGuildsMembersRead | null = await fetch(
				`https://discord.com/api/users/@me/guilds/${discordSdk.guildId}/member`,
				{
					method: 'get',
					headers: { Authorization: `Bearer ${accessToken}` }
				}
			)
				.then((j) => j.json())
				.catch(() => {
					return null
				})

			const avatarUri = getUserAvatarUrl({
				guildMember,
				user: session.user
			})

			setPlayers((existingPlayers) => {
				const playerIndex = existingPlayers.findIndex((p) => p.id === session.user.id)

				if (playerIndex === -1) {
					const res = [...existingPlayers, { ...session.user, avatar: avatarUri, isTalking: false }]
					return res
				} else {
					const newPlayers = [...existingPlayers].filter((p) => p.id !== session.user.id)
					const res = [...newPlayers, { ...session.user, avatar: avatarUri, isTalking: false }]
					return res
				}
			})
		}

		if (accessToken && session) {
			run(accessToken, session)

			// Remove the user from the list of players after they leave
			return () => {
				if (players.length) {
					const res = [...players].filter((p) => p.id !== session.user.id)
					setPlayers(res)
				}
			}
		}
	}, [accessToken, session])

	const onReset = async (topic: string) => {
		if (hasDrawing.current) {
			// Have AI grade our drawing
			// TODO: Use SVG paths for lightweight data
			console.log(`PK >> Grading drawing...`)
			const image = await canvasRef.current?.exportImage('png')
			console.log(`PK >> Image:`, image)

			// Clean up
			canvasRef.current?.clearCanvas()
			console.log(`PK >> Cleared canvas!`)
			hasDrawing.current = false

			// Have AI grade our drawing asynchonously
			const response = await fetch('/api/grade', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ image, topic })
			})
			const data = await response.json()

			// Update the scores
			setScores((scores) => {
				const existingScore = scores[session!.user.id] ?? 0
				return { ...scores, [session!.user.id]: existingScore + data.grade }
			})
			console.log(`PK >> Grade Data:`, data)
		} else {
			console.log(`PK >> No drawing to grade!`)
		}
	}

	return (
		<div className="activity_container">
			<TopBar onReset={onReset} />
			<div className="content_container">
				<div className="player_container">
					{players.map((p) => (
						<Player key={p.id} avatar={p.avatar} id={p.id} name={p.username} talking={p.isTalking} />
					))}
				</div>
				<div className="canvas_container">
					<ReactSketchCanvas
						ref={canvasRef}
						style={{ border: 'none' }}
						onChange={(paths) => {
							if (paths?.length) {
								hasDrawing.current = true
								console.log(`PK >> Drawing detected!`)
							}
						}}
						width="100%"
						height="100%"
						canvasColor="transparent"
						strokeColor="#a855f7"
					/>
				</div>
			</div>
		</div>
	)
}
