import { Rect } from "./rect";

function increaseProp(object: Record<string, number>, prop: string, val: number = 1) {
    object[prop] = (object[prop] || 0) + val;
}

interface BlockContextOption<T> {
    blockWidth: number,
    blockHeight: number,
    createInitBlockInfo: (id: string, rect: Rect) => T
    loadBlock(id: string, block: T): void,
    releasBlock(id: string, block: T): void,
}

function getBlockId(x: number, y: number) {
    return `${x}_${y}`;
}

type RowKey = 'A' | 'B' | 'C' | 'D' | 'E';
type ColKey = '0' | '1' | '2' | '3' | '4';
type GridKey = `${RowKey}${ColKey}`
function getAroundBlock({ x, y }: { x: number, y: number }, key: GridKey){
    switch (key) {
        case 'A0': return { x: x - 2, y: y - 2 };
        case 'A1': return { x: x - 1, y: y - 2 };
        case 'A2': return { x, y: y - 2 };
        case 'A3': return { x: x + 1, y: y - 2 };
        case 'A4': return { x: x + 2, y: y - 2 };

        case 'B0': return { x: x - 2, y: y - 1 };
        case 'B1': return { x: x - 1, y: y - 1 };
        case 'B2': return { x, y: y - 1 };
        case 'B3': return { x: x + 1, y: y - 1 };
        case 'B4': return { x: x + 2, y: y - 1 };

        case 'C0': return { x: x - 2, y };
        case 'C1': return { x: x - 1, y };
        case 'C2': throw 'illegal key C2';
        case 'C3': return { x: x + 1, y };
        case 'C4': return { x: x + 2, y };

        case 'D0': return { x: x - 2, y: y + 1 };
        case 'D1': return { x: x - 1, y: y + 1 };
        case 'D2': return { x, y: y + 1 };
        case 'D3': return { x: x + 1, y: y + 1 };
        case 'D4': return { x: x + 2, y: y + 1 };

        case 'E0': return { x: x - 2, y: y + 2 };
        case 'E1': return { x: x - 1, y: y + 2 };
        case 'E2': return { x, y: y + 2 };
        case 'E3': return { x: x + 1, y: y + 2 };
        case 'E4': return { x: x + 2, y: y + 2 };
        default:
            throw 'illegal key ' + key;
    }
}
export function createBlockContext<T>({
    blockWidth,
    blockHeight,
    createInitBlockInfo,
    loadBlock,
    releasBlock,
}: BlockContextOption<T>) {
    function getCurrentPosInfo(x: number, y: number) {
        const _x = Math.floor(x / blockWidth);
        const _y = Math.floor(y / blockHeight);
        return {
            x: _x,
            y: _y,
            l: x < (_x + 0.5) * blockWidth,
            t: y  < (_y + 0.5) * blockHeight,
        }
    }

    let prevPosInfo = { x: 0, y: 0, l: true, t: true };
    function getCurrentBlockInfo({ x: _x, y: _y, l, t }: { x: number, y: number, l: boolean, t: boolean }) {
        const toPreload: Partial<Record<GridKey, number>> = {};
        const toRelease: Partial<Record<GridKey, number>> = {};
        const updateInfo: Partial<Record<GridKey, number>> = {};

        if (l) {
            increaseProp(toPreload, "B1");
            increaseProp(toPreload, "C1");
            increaseProp(toPreload, "D1");

            increaseProp(toRelease, "A4", -1);
            increaseProp(toRelease, "B4", -1);
            increaseProp(toRelease, "C4", -1);
            increaseProp(toRelease, "D4", -1);
            increaseProp(toRelease, "E4", -1);
        } else {
            increaseProp(toPreload, "A0", -1);
            increaseProp(toPreload, "B0", -1);
            increaseProp(toPreload, "C0", -1);
            increaseProp(toPreload, "D0", -1);
            increaseProp(toPreload, "E0", -1);

            increaseProp(toRelease, "B3");
            increaseProp(toRelease, "C3");
            increaseProp(toRelease, "D3");
        }

        if (t) {
            increaseProp(toPreload, "B1");
            increaseProp(toPreload, "B2");
            increaseProp(toPreload, "B3");

            increaseProp(toRelease, "E0", -1);
            increaseProp(toRelease, "E1", -1);
            increaseProp(toRelease, "E2", -1);
            increaseProp(toRelease, "E2", -1);
            increaseProp(toRelease, "E3", -1);
        } else {
            increaseProp(toPreload, "A0", -1);
            increaseProp(toPreload, "A1", -1);
            increaseProp(toPreload, "A2", -1);
            increaseProp(toPreload, "A3", -1);
            increaseProp(toPreload, "A4", -1);

            increaseProp(toRelease, "D0");
            increaseProp(toRelease, "D1");
            increaseProp(toRelease, "D2");
        }

        for (const key in toPreload) {
            const element = toPreload[key as GridKey];
            increaseProp(updateInfo, key, element);
        }

        for (const key in toRelease) {
            const element = toRelease[key as GridKey];
            increaseProp(updateInfo, key, element);
        }

        return {
            id: getBlockId(_x, _y),
            toRelease,
            toPreload,
            updateInfo,
        };
    }

    const blockData: Record<string, T & { id: string, released: boolean, loaded: boolean }> = {};


    function getBlockInfoByPos({ x, y }: { x: number, y: number }) {
        const id = getBlockId(x, y);
        if (!blockData[id]) {
            blockData[id] = {
                id,
                ...createInitBlockInfo(id, new Rect(
                    x * blockWidth,
                    y * blockHeight,
                    blockWidth,
                    blockHeight
                )),
                released: false,
                loaded: false,
            };
        }
        return blockData[id];
    }

    function update(x: number, y: number) {
        const currentPosInfo = getCurrentPosInfo(x, y);
        if (
            currentPosInfo.x == prevPosInfo.x
            && currentPosInfo.y == prevPosInfo.y
            && currentPosInfo.l == prevPosInfo.l
            && currentPosInfo.t == prevPosInfo.t
        ) {
            return;
        }
        
        const currentBlockInfo = getCurrentBlockInfo(currentPosInfo);
        const currentBlock = getBlockInfoByPos(currentPosInfo);

        if (!currentBlock.loaded) {
            loadBlock(currentBlock.id, currentBlock);
            currentBlock.loaded = true;
        }

        console.log(getBlockInfoByPos(currentPosInfo), currentPosInfo, currentBlockInfo.updateInfo);
        
        for (const key in currentBlockInfo.updateInfo) {
            if (Object.prototype.hasOwnProperty.call(currentBlockInfo.updateInfo, key)) {
                const element = currentBlockInfo.updateInfo[key as GridKey]!;
                if (element !== 0) {
                    const pos = getAroundBlock(currentPosInfo, key as GridKey);
                    const id = getBlockId(pos.x, pos.y)
                    const block = getBlockInfoByPos(pos);
                    if (element > 0) {
                        if (!block.loaded) {
                            loadBlock(id, block);
                        }
                        block.loaded = true;
                        block.released = false;
                    } else if (element < 0) {
                        if (!block.released) {
                            releasBlock(id, block);
                        }
                        block.released = true;
                        block.loaded = false;
                    }
                }
            }
        }

        prevPosInfo = currentPosInfo;
    }

    return {
        update
    };
}
