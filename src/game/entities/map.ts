import type kaplay from 'kaplay'
import { TILE_SIZE } from '../kaplay'
import { addPortal } from '@/game/entities/portal'

type KCtx = ReturnType<typeof kaplay>


const waterRects: Array<{ x: number, y: number }> = [];

export function drawMap(k: KCtx, ch: string, x: number, y: number) {
    if (ch === 'c') {
        k.add([
            k.sprite("small-orange-crystal"),
            k.pos(x, y),
            k.area(),
            k.body({ isStatic: true }),
            'wall',
        ])
    }
    if (ch === 'G') {
        k.add([
            k.sprite("big-green-crystal-rock"),
            k.pos(x, y),
            k.area(),
            k.body({ isStatic: true }),
            'wall',
        ])
    }
    if (ch === 'b') {
        k.add([
            k.sprite("boulder-grey"),
            k.pos(x, y),
            k.area(),
            k.body({ isStatic: true }),
            'wall',
        ])
    }

    if (ch === 'E') {
        k.add([
            k.sprite("transition"),
            k.pos(x, y),
            k.area(),
            k.z(1),
            'cave-exit',
        ])
    }
    if (ch === 'T') {
        k.add([
            k.sprite("tree-green-2"),
            k.pos(x, y),
            k.area(),
            k.body({ isStatic: true }),
            'wall',
        ])
    }
    if (ch === 't') {
        k.add([
            k.sprite("tree-green"),
            k.pos(x, y),
            k.area(),
            k.body({ isStatic: true }),
            'wall',
        ])
    }

    if (ch === 'r') {
        k.add([k.sprite("boulder-grey"), k.pos(x, y),])
    }

    if (ch === 'O') {
        addPortal(k, x, y, 'OVERWORLD', [100, 200, 100])
    }
}

function mergeRectangles(k: KCtx, rects: Array<{ x: number, y: number }>, tileSize: number) {
    // For simplicity, create a bounding box that covers all water
    // (You could implement proper polygon merging for exact shapes)
    const xs = rects.map(r => r.x);
    const ys = rects.map(r => r.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs) + tileSize;
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys) + tileSize;

    // Return polygon as array of points (counterclockwise)
    return [
        k.vec2(minX, minY),
        k.vec2(maxX, minY),
        k.vec2(maxX, maxY),
        k.vec2(minX, maxY),
    ];
}

// function addMergedCollisions(k: KCtx, map: string[], targetChar: string, tag: string) {
//   for (let row = 0; row < map.length; row++) {
//     let startCol: number | null = null;
//     const line = map[row];

//     for (let col = 0; col <= line.length; col++) {
//       const char = line[col];

//       // If we find our target and aren't currently tracking a strip
//       if (char === targetChar && startCol === null) {
//         startCol = col;
//       }
//       // If we hit a different char (or end of line) and were tracking a strip
//       else if (char !== targetChar && startCol !== null) {
//         const width = col - startCol;

//         k.add([
//           k.rect(width * TILE_SIZE, TILE_SIZE*2),
//           k.pos(startCol * TILE_SIZE, row * TILE_SIZE),
//           k.area(),
//           k.body({ isStatic: true }),
//           k.opacity(0), // Keep it invisible
//           tag
//         ]);

//         startCol = null; // Reset for next strip
//       }
//     }
//   }
// }

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
