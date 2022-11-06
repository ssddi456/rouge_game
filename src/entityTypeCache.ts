import { ICollisionable } from "./types";
import { Vector } from "./vector";
import { enemys } from "./runnerApp";


export function createFastLookup(pool: (ICollisionable & { dead: boolean })[], collisionCellSize = 40) {
    
    let entityGrid: Record<string, ICollisionable[]> | null = null;
    function clearEntityTypeCache() {
        entityGrid = null;
    }

    function getPositionKey(position: Vector) {
        return Math.floor(position.x / collisionCellSize) + '_' + Math.floor(position.y / collisionCellSize);
    }
    function getNearbyPositionKey(position: Vector) {
        const x = Math.floor(position.x / collisionCellSize);
        const y = Math.floor(position.y / collisionCellSize);
        return [
            String(x) + '_' + String(y - 0),
    
            String(x - 1) + '_' + String(y - 1),
            String(x) + '_' + String(y - 1),
            String(x + 1) + '_' + String(y - 1),
    
            String(x - 1) + '_' + String(y - 0),
            String(x + 1) + '_' + String(y - 0),
    
            String(x - 1) + '_' + String(y + 1),
            String(x) + '_' + String(y + 1),
            String(x + 1) + '_' + String(y + 1),
        ];
    }
    function getNearbyPositionKeyInDistance(position: Vector, distance: number) {
        if (distance <= collisionCellSize) {
            return getNearbyPositionKey(position);
        }
        const x = Math.floor(position.x / collisionCellSize);
        const y = Math.floor(position.y / collisionCellSize);
    
        const ret = [];
        const k = Math.ceil(distance / collisionCellSize);
        let m, n, s;
        for (m = 1; m < k + 1; m++) {
            for (n = -m; n < m + 1; n++) {
                ret.unshift(String(x + n) + '_' + String(y - m));
                ret.push(String(x + n) + '_' + String(y + m));
            }
    
            for (s = -m + 1; s < m; s++) {
                ret.push(String(x - m) + '_' + String(y + s));
                ret.push(String(x + m) + '_' + String(y + s));
            }
        }
        ret.unshift(String(x) + '_' + String(y));
    
        return ret;
    }
    function initEntityGrid() {
        if (!entityGrid) {
            entityGrid = {};
            // 每帧初始化
            const allItem = pool.filter(e => !e.dead);
            for (let index = 0; index < allItem.length; index++) {
                const element = allItem[index];
                const key = getPositionKey(element.position);
                entityGrid[key] = entityGrid[key] || [];
                entityGrid[key].push(element);
            }
        }
    }
    function getEntitiesNearby(position: Vector): ICollisionable[] {
        initEntityGrid();
        // 
        const keys = getNearbyPositionKey(position);
        const ret: ICollisionable[] = [];
        // consts in loop are much slower than declare in upper scope
        // maybe native const are better
        let k;
        let pack;
        let index;
    
        for (let jndex = 0; jndex < keys.length; jndex++) {
            k = keys[jndex];
            if (entityGrid!.hasOwnProperty(k)) {
                pack = entityGrid![k];
                for (index = 0; index < pack.length; index++) {
                    ret.push(pack[index]);
                }
            }
        }
    
        return ret;
    }
    function walkEntitiesNearbyInDistance(position: Vector, distance: number, handler: (item: ICollisionable) => boolean | void): void {
        initEntityGrid();
        // 
        const keys = getNearbyPositionKeyInDistance(position, distance);
        const ret: ICollisionable[] = [];
        // consts in loop are much slower than declare in upper scope
        // maybe native const are better
        let k;
        let pack;
        let index;
    
        out: for (let jndex = 0; jndex < keys.length; jndex++) {
            k = keys[jndex];
            if (entityGrid!.hasOwnProperty(k)) {
                pack = entityGrid![k];
                for (index = 0; index < pack.length; index++) {
                    const ifStop = handler(pack[index]);
                    if (ifStop) {
                        break out;
                    }
                }
            }
        }
    }


    return {
        clearEntityTypeCache,
        getEntitiesNearby,
        walkEntitiesNearbyInDistance
    };
}
