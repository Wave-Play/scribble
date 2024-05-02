import { useSyncState } from "@robojs/sync"
import { useDiscordSdk } from "../hooks/useDiscordSdk"

interface PlayerProps {
	avatar?: string | null
	id: string
	name: string
	talking?: boolean
}
export function Player({ avatar, id = '', name, talking }: PlayerProps) {
	const { discordSdk } = useDiscordSdk()
	const [scores] = useSyncState<Record<string, number>>({}, [discordSdk?.channelId, 'scores'])
	const playerScore = scores?.[id] ?? 0

	return (
		<>
			<div className={`player_avatar ${talking ? 'player__avatar__talking' : ''}`}>
				<img className="player_avatar__img" src={avatar ?? ''} width="100%" height="100%" />
			</div>
			<div className={'player_name'}>{name}</div>
			<span>{playerScore}</span>
		</>
	)
}
