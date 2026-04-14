import type kaplay from 'kaplay'
// import { TILE_SIZE } from '../kaplay'
import { useGameStore } from '@/stores/gameStore'
// import { itemApi } from '@/api/game'

type KCtx = ReturnType<typeof kaplay>

export function addChest(k: KCtx, x: number, y: number, patternName: string) {
    const chest = k.add([
        k.sprite('chest-close'),
        k.pos(x, y),
        k.area(),
        k.body({ isStatic: true }),
        k.anchor('center'),
        'chest',
        { opened: false }
    ])

    chest.onCollide('player', async () => {
        if (chest.opened) return
        if (useGameStore.getState().isGamePaused) return

        const gameStore = useGameStore.getState()
        gameStore.pauseGame()

        useGameStore.setState({
            currentDungeonPatternId: patternName,
            onChestAnswered: () => {
                chest.opened = true
                k.destroy(chest)
            },
        })

        gameStore.triggerChestBattle({} as never)
    })

    return chest
}