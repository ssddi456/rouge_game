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

function getBlockId(x: number, y: number){
    return `${x}_${y}`;
}

export function createBlockContext<T> ( {
    blockWidth,
    blockHeight,
    createInitBlockInfo,
    loadBlock,
    releasBlock,
}: BlockContextOption<T>){
    
    function getCurrentBlockInfo(x: number, y: number) {
        const _x = Math.floor(x / blockWidth);
        const _y = Math.floor(y / blockHeight);
        const l = x < (_x + 0.5) * blockWidth;
        const t = y < (_y + 0.5) * blockHeight;
    
        const aroundBlocks: Record<string, {x: number, y: number}> = {
            A0: { x: _x - 1, y: _y - 1 },
            A1: { x: _x, y: _y - 1 },
            A2: { x: _x + 1, y: _y - 1 },
            B0: { x: _x - 1, y: _y },
            B2: { x: _x + 1, y: _y },
            C0: { x: _x - 1, y: _y + 1 },
            C1: { x: _x, y: _y + 1 },
            C2: { x: _x + 1, y: _y + 1 }
        };
    
        const toPreload: Record<string, number> = {};
        const toRelease: Record<string, number> = {};
        const updateInfo: Record<string, number> = {};

        if (l) {
            increaseProp(toPreload, "A0");
            increaseProp(toPreload, "B0");
            increaseProp(toPreload, "C0");
    
            increaseProp(toRelease, "A2", -1);
            increaseProp(toRelease, "B2", -1);
            increaseProp(toRelease, "C2", -1);
        } else {
            increaseProp(toPreload, "A0", -1);
            increaseProp(toPreload, "B0", -1);
            increaseProp(toPreload, "C0", -1);
    
            increaseProp(toRelease, "A2");
            increaseProp(toRelease, "B2");
            increaseProp(toRelease, "C2");
        }
    
        if (t) {
            increaseProp(toPreload, "A0");
            increaseProp(toPreload, "A1");
            increaseProp(toPreload, "A2");
    
            increaseProp(toRelease, "C0", -1);
            increaseProp(toRelease, "C1", -1);
            increaseProp(toRelease, "C2", -1);
        } else {
            increaseProp(toPreload, "A0", -1);
            increaseProp(toPreload, "A1", -1);
            increaseProp(toPreload, "A2", -1);
    
            increaseProp(toRelease, "C0");
            increaseProp(toRelease, "C1");
            increaseProp(toRelease, "C2");
        }
    
        for (const key in toPreload) {
            const element = toPreload[key];
            increaseProp(updateInfo, key, element);
        }

        for (const key in toRelease) {
            const element = toRelease[key];
            increaseProp(updateInfo, key, element);
        }

        return {
            id: getBlockId(x, y),
            x: _x,
            y: _y,
            l,
            t,
            aroundBlocks,
            toRelease,
            toPreload,
            updateInfo,
        };
    }
    
    const blockData: Record<string, T & { id: string, released: boolean, loaded: boolean}> = {};


    function getBlockInfoByPos({x, y}: {x: number, y: number}){
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
            loadBlock(id, blockData[id]);
        }
        return blockData[id];
    }

    function update(x: number, y: number){
        const currentBlockInfo = getCurrentBlockInfo(x, y);
        const currentBlock = getBlockInfoByPos({ x, y });

        for (const key in currentBlockInfo.updateInfo) {
            if (Object.prototype.hasOwnProperty.call(currentBlockInfo.updateInfo, key)) {
                const element = currentBlockInfo.updateInfo[key];
                if (element !== 0) {
                    const pos = currentBlockInfo.aroundBlocks[key];
                    const id = getBlockId(pos.x, pos.y)
                    const block = getBlockInfoByPos(pos);
                    if (element > 0) {
                        if (!block.loaded) {
                            block.loaded = true;
                            loadBlock(id, block);
                        }
                        block.released = false;
                    } else if (element < 0) {
                        if (!block.released) {
                            releasBlock(id, block);
                            block.released = true;
                            block.loaded = false;
                        }
                    }
                }
            }
        }
    }

    return {
        getCurrentBlockInfo,
        getBlockInfoByPos,
        update
    };
}
