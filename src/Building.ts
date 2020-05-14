import { pad } from './utilities';

export interface Building extends Buildable {
    mainSprite: string;
    destroyedSprite?: string;
    baseSprite?: string;
    occupancy: number;
    residents: number;
}

export interface Buildable {
    name: string;
    hidden?: boolean;
    description?: string;
    destroyed: boolean;
    id?: string;
}

function buildingFactory(directory: string, buildingId: number, name: string, occupancy: number, destroyedId: number = 2, baseId: number = 1, description?: string) {
    return {
        mainSprite: 'sprites/town_temperate/' + directory + `/256_${pad(buildingId, 4)}.png`,
        baseSprite: typeof baseId == 'number' ? 'sprites/town_temperate/' + directory + `/256_${pad(baseId, 4)}.png` : undefined,
        destroyedSprite: 'sprites/town_temperate/' + directory + `/256_${pad(destroyedId, 4)}.png`,
        name,
        occupancy,
        hidden: true,
        description,
        residents: 0,
        destroyed: false
    };
}
const buildings: Building[] = [
    buildingFactory('5000', 3, "Heliport", 50, 2, null, "Heliports allow you to evacuate people from one area to another. This can be used to get people away from danger."),
    buildingFactory('1421-1425', 5, "Penthouse apartment", 100, 2, undefined, "Tall apartments hold a lot of people, but they are at greater risk of collapsing under extreme conditions."),
    buildingFactory('1426-1429', 4, "Brick apartment", 100),
    buildingFactory('1430-1433', 4, "Large house", 10, undefined, undefined, "Private houses are weak and don't hold many people. They are not the best choice for new designs."),
    buildingFactory('1434-1437', 4, "Church", 200, undefined, undefined, "Churches can house a lot of people effectively."),
    buildingFactory('1440-1443', 8, "Corporate office", 250),
    buildingFactory('1458-1460', 5, "Hospital", 170, undefined, undefined, "Hospitals can hold quite a few people and are often well-equipped to hndle disasters."),
    buildingFactory('1487-1488', 2, "Small house", 6, undefined, undefined, "Private houses are weak and don't hold many people. They are not the best choice for new designs.")
];

function treeFactory(directory: string): Building {
    return { mainSprite: "sprites/trees_temperate/" + directory + "/256_0004.png", residents: 0, hidden: true, destroyedSprite: "sprites/trees_temperate/" + directory + "/256_0007.png", occupancy: 0, name: "Tree", destroyed: false };
}
const trees: Building[] = [
    treeFactory('1583-1589'),
    treeFactory('1590-1596'),
    treeFactory('1597-1603'),
    treeFactory('1604-1610'),
    treeFactory('1611-1617'),
    treeFactory('1618-1624'),
    treeFactory('1625-1632'),
    treeFactory('1632-1638'),
    treeFactory('1639-1645'),
    treeFactory('1646-1652'),
    treeFactory('1653-1659'),
    treeFactory('1660-1666'),
    treeFactory('1667-1673'),
    treeFactory('1674-1680'),
    treeFactory('1681-1687'),
    treeFactory('1688-1694'),
    treeFactory('1695-1701'),
    treeFactory('1702-1708'),
];

export interface PowerSource extends Building {
    canBuildOnWater?: boolean;
    isPowerSource: true;
}

const powerSources: PowerSource[] = [
    { isPowerSource: true, mainSprite: "sprites/wind-turbine.svg", residents: 0, hidden: false, occupancy: 0, name: "Windmill", destroyed: false, description: "Windmills (also known as wind turbines) generate electricity by harnessing the wind. Their blades turn a shaft inside at a very slow speed. A gearbox is then used to turn a generator at a much higher speed. This produces electricity." },
    { isPowerSource: true, mainSprite: "sprites/solarpanel.svg", residents: 0, hidden: false, occupancy: 0, name: "Solar panel", destroyed: false, description: "Solar panels are arrays of cells containing a solar photovoltaic material that converts solar radiation or energy from the sun into direct current electricity. " },
    { isPowerSource: true, mainSprite: "sprites/dam.svg", residents: 0, hidden: false, occupancy: 0, name: "Hydroelectric dam", destroyed: false, canBuildOnWater: true, description: "Hydroelectric dams block a river to make a reservoir or collect water that is pumped there. When the water is released, the pressure behind the dam forces the water down pipes that lead to a turbine. This causes the turbine to turn, which turns a generator, which makes electricity." }
];

export { buildings, trees, powerSources };