import { useSyncState } from '@robojs/sync'
import { BallTriangle } from 'react-loader-spinner'
import { useDiscordSdk } from '../hooks/useDiscordSdk'
import { useEffect } from 'react'

const GameLength = 10_000

interface TopBarProps {
	onReset: (topic: string) => void | Promise<void>
}
export const TopBar = (props: TopBarProps) => {
	const { onReset } = props
	const { discordSdk, session } = useDiscordSdk()
	const [game, setGame] = useSyncState(
		{
			isUpdating: false,
			ownerId: session!.user.id,
			ownerUpdatedAt: Date.now(),
			resetAt: Date.now(),
			title: 'Scribble'
		},
		[discordSdk?.channelId, 'game']
	)

	// Find the owner update time
	const secondsRemaining = Math.max(Math.ceil((game.resetAt - game.ownerUpdatedAt) / 1_000), 0)

	// TODO: Control central logic on server side
	useEffect(() => {
		if (game.isUpdating || game.ownerId !== session!.user.id) {
			return
		}

		const intervalId = setInterval(() => {
			setGame((game) => ({
				...game,
				ownerUpdatedAt: Date.now()
			}))
		}, 1_000)

		return () => clearInterval(intervalId)
	}, [game.ownerId, game.isUpdating])

	useEffect(() => {
		// Only reset the game if the time has run out and is owner
		if (secondsRemaining > 0 || game.ownerId !== session!.user.id) {
			return
		}

		// Mark the game as updating
		console.log(`PK >> Updating game...`)
		setGame((game) => ({
			...game,
			isUpdating: true
		}))

		// Reset the game
		const run = async () => {
			const response = await fetch('/api/reset')
			const data = await response.json()
			console.log(`PK >> Data:`, data)

			setGame((game) => ({
				...game,
				isUpdating: false,
				ownerUpdatedAt: Date.now(),
				resetAt: Date.now() + GameLength,
				title: data.text
			}))
			onReset(game.title)
		}
		run()
	}, [secondsRemaining])

	return (
		<div className="topbar">
			<div className="topbar_time_container">
				{!game.isUpdating && <div className="topbar_time">{secondsRemaining}</div>}
				<BallTriangle
					height={40}
					width={40}
					radius={5}
					color="white"
					ariaLabel="ball-triangle-loading"
					wrapperStyle={{}}
					wrapperClass=""
					visible={game.isUpdating}
				/>
			</div>
			<div className="topbar_title">{game.title}</div>
		</div>
	)
}
