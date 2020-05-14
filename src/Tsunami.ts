import { genBuildings } from './GeneratorUtilities';
import { TileMap, Tile, TileGroundType, calcProximityFromWater, MAX_PROXIMITY_SEARCH_DISTANCE } from './Tile';
import { getRandomInt, scheduleIdleWorkLoop, clamp, getRandomArbitrary } from './utilities';


const SEA_LEVEL = getRandomArbitrary(-0.5, -0.1);
const TREE_RECURSE = 4;
export async function createTsunamiMap(): Promise<TileMap> {
    const noise = (window as any).noise;
    noise.seed(Math.random());
    function* tsunamiGen() {
        for(var y = 0; y < 64; y++) {
            for(var x = 0; x < 64; x++) {
                const t = new Tile({
                    ground: TileGroundType.Grass
                });
                let el =
                    noise.simplex2(Math.ceil(x / 4), Math.ceil(y / 4)) * 0.5 +
                    noise.simplex2(Math.ceil(x / 3), Math.ceil(y / 3)) * 0.25 +
                    noise.simplex2(Math.ceil(x / 2), Math.ceil(y / 2)) * 0.125 +
                    noise.simplex2(Math.ceil(x / 1), Math.ceil(y / 1)) * 0.0625;
                t.setAllElevations(el);
                if(el <= SEA_LEVEL) {
                    t.ground = TileGroundType.Water;
                    t.setAllElevations(SEA_LEVEL);
                    //t.setAllElevations(Math.max(t.getHighestElevation(), SEA_LEVEL))
                    //t.setAllElevations(clamp(t.getHighestElevation(), SEA_LEVEL - 0.1, SEA_LEVEL + 0.1));
                }
                yield t;
            }
        }
    }
    var arr = [];
    var tileStream = tsunamiGen();
    await scheduleIdleWorkLoop(64*64, () => {
        arr.push(tileStream.next().value);
    }, 16);
    const testTileMap: TileMap = new TileMap(arr, 64);
    /*
    await scheduleIdleWorkLoop(64*32, (i) => {
        const tile = testTileMap[i];
        const prox = calcProximityFromWater(tile);
        tile.cachedProximityFromWater = prox;
        tile.riskLevel = Math.max(1, MAX_PROXIMITY_SEARCH_DISTANCE - prox) + Math.max(0, (3-Math.round(tile.getHighestElevation())));
        tile.riskLevel = Math.min(tile.riskLevel, MAX_PROXIMITY_SEARCH_DISTANCE);
        if(prox < 3 && tile.ground != TileGroundType.Water) {
            tile.ground = TileGroundType.Sand;
        }
    });
    */
    for(var cluster = 0; cluster < 50; cluster++) {
        /* Try 10 times to spawn a cluster */
        for(var tr = 0; tr < 10; tr++) {
            /* Pick a tile */
            var i = getRandomInt(0, 64*64);
            const tile = testTileMap[i];
            if(tile.ground == TileGroundType.Water)
                continue;
            if(calcProximityFromWater(tile) <= 2)
                continue;
            /* Place building */
            genBuildings(tile);
            /* Attempt to randomly place buildings on the surrounding tiles */
            tile.getSurroundingTiles().forEach(tile => {
                if(tile.ground == TileGroundType.Water)
                    return;
                genBuildings(tile);
            });
            break;
        }
    }
    for(var cluster = 0; cluster < 50; cluster++) {
        /* Try 10 times to spawn a cluster */
        for(var tr = 0; tr < 10; tr++) {
            /* Pick a tile */
            var i = getRandomInt(0, 64*64);
            const tile = testTileMap[i];
            if(tile.ground == TileGroundType.Water || tile.building != null)
                continue;
            /* Place trees */
            genBuildings(tile, true);
            const treePlacer = (i, tile) => {
                if(i > TREE_RECURSE)
                    return;
                if(tile.ground == TileGroundType.Water || tile.building != null)
                    return;
                genBuildings(tile, true);
                tile.getSurroundingTiles().forEach(treePlacer.bind(void 0, i + 1));
            };
            /* Attempt to randomly place trees on the surrounding tiles */
            tile.getSurroundingTiles().forEach(treePlacer.bind(void 0, 0));
            break;
        }
    }
    
    return testTileMap;   
}