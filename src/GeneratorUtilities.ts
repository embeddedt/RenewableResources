import { Tile, isGroundType, TileGroundType, calcProximityFromWater, MAX_PROXIMITY_SEARCH_DISTANCE } from './Tile';
import { getRandomArrayMember, getRandomInt } from './utilities';
import { trees, buildings } from './Building'; 
export function genBuildings(t: Tile, useTrees = false) {
    const chances = 1; //getRandomInt(0, 32);
    let skipUnhoused = false;
    if(chances == 1) {
        t.population = 0;
        t.building = JSON.parse(JSON.stringify(getRandomArrayMember(useTrees ? trees : buildings, 1)));
        t.building.residents = t.building.occupancy;
        skipUnhoused = true;
    }
}