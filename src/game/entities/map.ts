import type kaplay from 'kaplay'
import { TILE_SIZE } from '../kaplay'

type KCtx = ReturnType<typeof kaplay>

const floorAssets = ['floor-tiles', 'floor', 'field-pink', 'field-green']

export function addOptimizedCollisions(k: KCtx, map: string[], targetChar: string, tag: string) {
    const activeStrips: Array<{ start: number, width: number, rowStart: number, height: number, obj?: any }> = [];

    for (let row = 0; row < map.length; row++) {
        const line = map[row];
        const currentLineStrips: Array<{ start: number, width: number }> = [];

        // --- Step 1: Identify horizontal strips in this row ---
        let startCol: number | null = null;
        for (let col = 0; col <= line.length; col++) {
            const char = line[col];
            if (char === targetChar && startCol === null) {
                startCol = col;
            } else if (char !== targetChar && startCol !== null) {
                currentLineStrips.push({ start: startCol, width: col - startCol });
                startCol = null;
            }
        }

        // --- Step 2: Try to merge with active strips from previous rows ---
        // Iterate backwards through activeStrips to manage removal
        for (let i = activeStrips.length - 1; i >= 0; i--) {
            const strip = activeStrips[i];
            const matchIndex = currentLineStrips.findIndex(s => s.start === strip.start && s.width === strip.width);

            if (matchIndex !== -1) {
                // Found a match! Increment height and remove from current processing
                strip.height += 1;
                currentLineStrips.splice(matchIndex, 1);
            } else {
                // No match found for this active strip anymore - render it and remove
                renderCollision(k, strip, tag);
                activeStrips.splice(i, 1);
            }
        }

        // --- Step 3: Add any brand new strips to the active list ---
        currentLineStrips.forEach(s => {
            activeStrips.push({ ...s, rowStart: row, height: 1 });
        });
    }

    // Final Pass: Render any remaining active strips at the bottom of the map
    activeStrips.forEach(s => renderCollision(k, s, tag));
}

function renderCollision(k: KCtx, data: any, tag: string) {
    k.add([
        k.rect(data.width * TILE_SIZE, data.height * TILE_SIZE),
        k.pos(data.start * TILE_SIZE, data.rowStart * TILE_SIZE),
        k.area(),
        k.body({ isStatic: true }),
        k.opacity(0),
        tag
    ]);
}

export function getOuterWallFrame(map: string[], row: number, col: number) {
    // const isOut = (r: number, c: number) => map[r]?.[c] === 'R';
    const isOut = (r: number, c: number) => {
        if (r < 0 || r >= map.length || c < 0 || c >= map[r].length) return true;
        return false;
    }

    const N = isOut(row - 1, col);
    const S = isOut(row + 1, col);
    const E = isOut(row, col + 1);
    const W = isOut(row, col - 1);

    // 1. Exterior Corners (Rounded Green Pipes)
    if (N && W && !E && !S) return 169; // Top-Left
    if (N && E && !W && !S) return 174; // Top-Right
    if (S && W && !E && !N) return 313; // Bottom-Left
    if (S && E && !W && !N) return 318; // Bottom-Right

    // 2. Edges (Pipes)
    if (N && !E && !W) {
        if (map[row][col + 1] === '2') return 171;
        if (map[row][col - 1] === '2') return 172; // Top horizontal with water on the right
        if ((map[row][col + 1] !== '2' || map[row][col - 1] !== '2') && map[row + 1][col] === 'W') return 170;
        return 173; // Top horizontal
    }
    if (S && !E && !W) {
        if (map[row][col + 1] === '1') return 315;
        if (map[row][col - 1] === '1') return 316;
        if ((map[row][col + 1] !== '1' || map[row][col - 1] !== '1') && map[row - 1][col] === 'W') return 314;
        return 317; // Bottom footing
    }
    if (W && !N && !S) {
        if (map[row + 1][col] === 'R' && map[row - 1][col] === 'R' && map[row][col + 1] === 'W') return 280;
        return 217; // Left vertical
    }
    if (E && !N && !S) {
        if (map[row + 1][col] === 'R' && map[row - 1][col] === 'R' && map[row][col - 1] === 'W') return 287;
        return 222; // Right vertical
    }
    // 3. Interior
    return 185;
}

export function getInnerWallFrame(map: string[], row: number, col: number) {
    // const isOut = (r: number, c: number) => map[r]?.[c] === 'R';
    const isVertical = (r: number, c: number) => {
        if (map[r - 1][c] === 'R' || map[r - 1][c] === 'W' || (map[r - 1][c] === '.' && map[r + 1][c] === 'W')) return true;
        return false;
    }

    const vertical = isVertical(row, col);

    if (vertical) {
        if (map[row + 1][col] === '.' && map[row - 1][col] === 'W' && map[row][col + 1] === 'W' && map[row][col - 1] === '.') return 285;
        if (map[row + 1][col] === '.' && map[row - 1][col] === 'W' && map[row][col - 1] === 'W' && map[row][col + 1] === '.') return 282;
        if (map[row - 1][col] === '.' && map[row + 1][col] === 'W' && map[row][col - 1] === 'W' && map[row][col + 1] === '.') return 253;
        if (map[row - 1][col] === '.' && map[row + 1][col] === 'W' && map[row][col + 1] === 'W' && map[row][col - 1] === '.') return 252;
        if (map[row - 1][col] === 'W' && map[row + 1][col] === 'W' && map[row][col + 1] === 'W' && map[row][col - 1] === '.') return 269;
        if (map[row - 1][col] === 'W' && map[row + 1][col] === 'W' && map[row][col - 1] === 'W' && map[row][col + 1] === '.') return 268;
        if ((map[row + 1][col] === '.') && map[row - 1][col] === 'W') return 186;
        if ((map[row + 1][col] === 'W') && map[row - 1][col] === '.') return 298;
        return 251;
    } else {
        if ((map[row][col + 1] === '.') && map[row][col - 1] === 'W') return 202;
        if ((map[row][col + 1] === 'W') && map[row][col - 1] === '.') return 205;
        return 286;
    }
}

export function getOuterCaveWallFrame(map: string[], row: number, col: number) {
    const isOut = (r: number, c: number) => {
        if (r < 0 || r >= map.length || c < 0 || c >= map[r].length) return true;
        return false;
    }

    const N = isOut(row - 1, col);
    const S = isOut(row + 1, col);
    const E = isOut(row, col + 1);
    const W = isOut(row, col - 1);

    // 1. Exterior Corners (Rounded Green Pipes)
    if (N && W && !E && !S) return 161; // Top-Left
    if (N && E && !W && !S) return 166; // Top-Right
    if (S && W && !E && !N) return 305; // Bottom-Left
    if (S && E && !W && !N) return 310; // Bottom-Right

    // 2. Edges (Pipes)
    if (N && !E && !W) {
        if ((map[row][col + 1] === 'R' && map[row][col - 1] === 'R' && map[row + 1][col] === 'W')) return 162;
        return 165; // Top horizontal
    }
    if (S && !E && !W) {
        if ((map[row][col + 1] === 'R' && map[row][col - 1] === 'R') && map[row - 1][col] === 'W') return 306;
        return 309; // Bottom footing
    }
    if (W && !N && !S) {
        if (map[row + 1][col] === 'R' && map[row - 1][col] === 'R' && map[row][col + 1] === 'W') return 272;
        return 209; // Left vertical
    }
    if (E && !N && !S) {
        if ((map[row + 1][col] === 'R' || map[row - 1][col] === 'R') && map[row][col - 1] === 'W') return 280;
        return 214; // Right vertical
    }
    // 3. Interior
    return 214;
}

export function getInnerCaveWallFrame(map: string[], row: number, col: number) {
    const isVertical = (r: number, c: number) => {
        if (map[r - 1][c] === 'R' || map[r - 1][c] === 'W' || (map[r - 1][c] === '.' && map[r + 1][c] === 'W')) return true;
        return false;
    }

    const vertical = isVertical(row, col);

    if (vertical) {
        if (map[row + 1][col] === '.' && map[row - 1][col] === 'W' && map[row][col + 1] === 'W' && map[row][col - 1] === '.') return 277; //from top to right
        if (map[row + 1][col] === '.' && map[row - 1][col] === 'W' && map[row][col - 1] === 'W' && map[row][col + 1] === '.') return 274; //from top to left
        if (map[row - 1][col] === '.' && map[row + 1][col] === 'W' && map[row][col - 1] === 'W' && map[row][col + 1] === '.') return 245; //from bottom to left
        if (map[row - 1][col] === '.' && map[row + 1][col] === 'W' && map[row][col + 1] === 'W' && map[row][col - 1] === '.') return 244; //from bottom to right
        return 243;
    } else {
        if ((map[row][col + 1] === '.') && map[row][col - 1] === 'W') return 194;
        if ((map[row][col + 1] === 'W') && map[row][col - 1] === '.') return 197;
        return 278;
    }
}

const getHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
};

export const getFloorSprite = (zone: string): string => {
    const index = getHash(zone) % floorAssets.length;
    return floorAssets[index];
};
