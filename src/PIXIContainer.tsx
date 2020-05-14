import React from 'react';
import { _TileSystem, SharedTileSystemState } from './TileSystem';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { _debounce, playAudio, scheduleIdleWorkLoop, preloadAudio, getRandomInt, getRandomArbitrary } from './utilities';
import { TileMap, Tile, TileGroundType, overlayTextures, TileDirection, isGroundType, CompassDirection, calcProximityFromWater, AllDirections, MAX_PROXIMITY_SEARCH_DISTANCE } from './Tile';
import TileOverlay from './TileOverlay';
import { ConstructionType } from './Construction';
import ConstructionDialog from './ConstructionDialog';
import { Buildable, Building, buildings, trees, powerSources, PowerSource } from './Building';
import RenderController from './RenderController';
import * as Cull from 'pixi-cull';
import { ControlBar, ControlButton, ControlSeparator, ControlGroup } from './ControlBar';
import { RiskLevelButtonIcon, BuildingIcon, RedBombIcon, LandIcon, WaterIcon, BackIcon, PurpleInfoIcon, EvacuationIcon, HelpIcon, StartDisasterIcon } from './Icons';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import Button from '@material-ui/core/Button';
import MapLoadingScreen from './MapLoadingScreen';
import { getStringEnumName, stringTillFirstDigit } from './utilities';
import ConstructionOptionImage from './ConstructionOptionImage';
import { withSnackbar, WithSnackbarProps } from 'notistack';
import shortid from 'shortid';
import PopulationInfo from './PopulationInfo';
import { SnackbarProvider } from 'notistack';
import PhoneDialog from './PhoneDialog';


const HYDRO_LOWER = 1.9;

const POWER_REQ = 400;
function getTileSize() {
    const VMIN_FACTOR = (20/100);
    return roundToNearestMultipleOf(2)(getWindowVmins() * VMIN_FACTOR);
}
function getWindowVmins(): number {
    var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    return Math.min(w, h);
}
const roundToNearestMultipleOf = m => n => Math.round(n/m)*m;

const isNewMode = false;

const EVACUATION_RANGE = 7;

let instructionsViewedOnce = false;
function buildingSprites(building: Building): string[] {
    var arr = [];
    arr.push(building.mainSprite);
    if(typeof building.baseSprite != 'undefined')
        arr.push(building.baseSprite);
    if(typeof building.destroyedSprite != 'undefined' && building.destroyedSprite != building.mainSprite)
        arr.push(building.destroyedSprite);
    return arr;
}

type PIXIContainerState = Required<SharedTileSystemState>;

const enableCulling = true;
type DisasterControlButtonProps = {
    constructionType: ConstructionType;
    flag?: any;
    onClick: (type: ConstructionType, sticky: boolean, flag?: any) => void;
    sticky?: boolean;
    active: boolean|((t: ConstructionType, f: any) => boolean);
} & Omit<React.ComponentProps<typeof ControlButton>, "onClick"|"active"|"ref">;
const DisasterControlButton: React.FunctionComponent<DisasterControlButtonProps> = (props) => {
    const { onClick, sticky, flag, active, constructionType, ...rest } = props;
    const realOnClick = React.useCallback(() => {
        onClick(constructionType, sticky, flag);
    }, [ onClick, constructionType, sticky, flag ]);
    let realActive: boolean;
    if(typeof active == 'function')
        realActive = active(constructionType, flag);
    else
        realActive = active;
    return <ControlButton onClick={realOnClick} active={realActive} {...rest}/>;
};

function hydroAdjust(tile: Tile, adjust: number, tileSystem: _TileSystem) {
    var oldEl = tile.getHighestElevation();
    tile.setAllElevations(oldEl + adjust);
    for(var i = 0; i < 4; i++) {
        tile = tile.getTileInDirection(TileDirection.Southwest);
        if(tile.savedElevationData != null) {
            tile.setAllElevations(tile.savedElevationData.oldEl);
            tileSystem.updateTile(tile.getIndex());
            tile.savedElevationData = null;
        } else if(adjust < 0 && tile != null && isGroundType(tile.ground, TileGroundType.Water)) {
            var thisOldEl = tile.getHighestElevation();
            tile.setAllElevations(oldEl + (adjust * (1/(i+1))));
            tile.savedElevationData = { oldEl: thisOldEl };
            tileSystem.updateTile(tile.getIndex());
        } else
            break;
    }
    
}

var notifiedAdblocker = false;
class PIXIContainer extends React.PureComponent<{ tileMap: TileMap; onGoBack: () => void; }&Partial<WithSnackbarProps>, PIXIContainerState> {
    canvasRef = React.createRef<HTMLCanvasElement>();
    viewport: Viewport;
    cull: any;
    tileSystem: _TileSystem;
    pixiSizeHandler: () => void;
    nextStateToSet: Partial<SharedTileSystemState> = null;
    previouslyChosenTile: Tile = null;
    pendingTimeouts: number[] = [];
    _isMounted: boolean = false;
    clearFromPending(n: number) {
        const idx = this.pendingTimeouts.indexOf(n);
        if(idx != -1)
            this.pendingTimeouts.splice(idx, 1);
    }
    setTimeout(fn: Function, time?: number, ...args: any[]): number {
        const n = setTimeout((...cbargs) => {
            this.clearFromPending(n);
            fn(...cbargs);
        }, time, ...args);
        this.pendingTimeouts.push(n);
        return n;
    }
    clearTimeout(n: number) {
        this.clearTimeout(n);
        this.clearFromPending(n);
    }
    checkSnackbarCompatibility(ref: HTMLElement) {
        if(notifiedAdblocker)
            return;
        notifiedAdblocker = true;
        if(window.getComputedStyle(ref).display == 'none') {
            window.alert("It appears that you have an adblocker which is blocking some game notifications from appearing. You may want to disable it for this game (it does not have any ads).");
        }
    }
    constructor(props) {
        super(props);
        this.cull = null;
        this.state = {
            hoverX: null,
            hoverY: null,
            currentlyHoveredTile: null,
            currentlySelectedTile: null,
            constructionType: null,
            initiallyRendered: false,
            willNeedToCull: false,
            interactionAllowed: false,
            tileRiskLevelVisible: false,
            stickyActionInProgress: false,
            constructionFlag: null,
            showError: false,
            errString: "",
            disasterRunning: false,
            expiryDate: 0,
            forcedQueryTile: null,
            showForcedQuery: false,
            disasterFinished: false,
            newspaperClosed: false,
            instructionsHidden: instructionsViewedOnce
        };
        this.nextStateToSet = {};
        this.tileSystem = new _TileSystem(this);
        this.clearSelectedTile = this.clearSelectedTile.bind(this);
        this.updatePixiSize = this.updatePixiSize.bind(this);
        this.performBuild = this.performBuild.bind(this);
        this.startTileBasedAction = this.startTileBasedAction.bind(this);
        this.checkActive = this.checkActive.bind(this);
    }
    performBuild(item: Buildable) {
        this.performBuildOnTile(this.state.currentlySelectedTile, item);
    }
    performBuildOnTile(tile: Tile, item: Buildable) {
        const building = item as PowerSource; /* FIXME */
        let typesMatch = (isGroundType(tile.ground, TileGroundType.Water) == !!building.canBuildOnWater);
        if(!typesMatch) {
            this.showError(`That can${building.canBuildOnWater ? " only " : "'t"} be built on water`);
        } else {
            let allowConstruction = true;
            if(building.name.startsWith("Hydro")) {
                const behind = tile.getTileInDirection(TileDirection.Northeast);
                const infront = tile.getTileInDirection(TileDirection.Southwest);
                if((behind == null || !isGroundType(behind.ground, TileGroundType.Water)) || (infront == null || !isGroundType(infront.ground, TileGroundType.Water))) {
                    this.showError("There must be at least one water tile in front of and behind the dam.");
                    allowConstruction = false;
                }
            }
            if(allowConstruction) {
                tile.building = JSON.parse(JSON.stringify(building));
                tile.building.id = shortid.generate();
    
                if(building.name.startsWith("Hydro")) {
                    hydroAdjust(tile, -HYDRO_LOWER, this.tileSystem);
                }
                
                if(tile.explosionOverride != null) {
                    tile.ground = tile.explosionOverride;
                    tile.explosionOverride = null;
                } else if(!isGroundType(tile.ground, TileGroundType.Sand))
                    tile.ground = building.canBuildOnWater ? TileGroundType.Water : TileGroundType.Grass;
                const index = tile.getIndex();
                playAudio("audio/construction.mp3");
                if(building.name.startsWith("Hydro")) {
                    const searchFn = tile => {
                        if(tile == null)
                            return;
                        if(!isGroundType(tile.ground, TileGroundType.Water))
                            return;
                        if(tile.building != null)
                            return;
                        const behind = tile.getTileInDirection(TileDirection.Northeast);
                        const infront = tile.getTileInDirection(TileDirection.Southwest);
                        if((behind == null || !isGroundType(behind.ground, TileGroundType.Water)) || (infront == null || !isGroundType(infront.ground, TileGroundType.Water))) {
                            return;
                        }
                        this.performBuildOnTile(tile, item);
                    };
                    /* Search to the left and right and see if we need to construct a dam */
                    searchFn(tile.getTileInDirection(TileDirection.Northwest));
                    searchFn(tile.getTileInDirection(TileDirection.Southeast));
                }
            }
        }
        this.onActionCompleted(tile);
    }
    updatePixiSize() {
        this.tileSystem.tileSize = getTileSize();
        this.tileSystem.app.renderer.resize(0, 0);
        this.viewport.resize(this.tileSystem.app.view.clientWidth, this.tileSystem.app.view.clientHeight);
        
        this.tileSystem.app.renderer.resize(this.tileSystem.app.view.clientWidth, this.tileSystem.app.view.clientHeight);
        window.removeEventListener("resize", this.pixiSizeHandler);
        this.tileSystem.onResize().then(() => {
            if(this._isMounted) {
                window.addEventListener("resize", this.pixiSizeHandler);
                this.viewport.dirty = true;
            }
        });
    }
    onTileChange(index: number) {
        if(this.state.currentlyHoveredTile == this.props.tileMap[index] || this.state.currentlySelectedTile == this.props.tileMap[index])
            this.forceUpdate();
    }
    componentWillUnmount() {
        this._isMounted = false;
        window.removeEventListener("resize", this.pixiSizeHandler);
        this.tileSystem.app.destroy(false);
        this.pendingTimeouts.forEach(n => {
            clearTimeout(n);
        });
        this.pendingTimeouts = [];
        for (var textureUrl in PIXI.utils.BaseTextureCache) {
            delete PIXI.utils.BaseTextureCache[textureUrl];
        }
        for (var textureUrl in PIXI.utils.TextureCache) {
            delete PIXI.utils.TextureCache[textureUrl];
        }
        this.tileSystem.lastTileMap.tileSystem = null;
        this.tileSystem = new _TileSystem(this); /* fresh TileSystem */
    }
    clearSelectedTile(evt?: PIXI.interaction.InteractionEvent) {
        if(typeof evt == 'object' && (evt as any).doIgnoreTileClick) {
            /* It seems that PIXI might cache the event object */
            (evt as any).doIgnoreTileClick = false;
            return;
        }
        
        this.setState({ currentlySelectedTile: null }, () => this.tileSystem.clearSelectedTile(evt));
    }
    componentDidMount() {
        const tileMap = this.props.tileMap;
        PIXI.Application.prototype.render = null; // Disable auto-rendering by removing the function
        this.tileSystem.app = new PIXI.Application({ view: this.canvasRef.current, transparent: true });
        this.tileSystem.app.view.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        this.viewport = new Viewport({
            screenWidth: this.tileSystem.app.view.clientWidth,
            screenHeight: this.tileSystem.app.view.clientHeight,
            worldWidth: 1000,
            worldHeight: 1000,
            divWheel: this.canvasRef.current,
            interaction: this.tileSystem.app.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
        });
        this.viewport.zIndex = 1000;

        // hook into hover events
        (this.viewport as any).on("disaster-hover", (data: SharedTileSystemState) => {
            if(this.state.currentlySelectedTile != null) {
                delete data.hoverX;
                delete data.hoverY;
            }
            this.nextStateToSet = Object.assign(this.nextStateToSet, data);
        });
        (this.viewport as any).on("disaster-tilepicked", (data: SharedTileSystemState) => {
            this.onTilePick(data.currentlySelectedTile);
        });
        (this.viewport as any).on("click", this.clearSelectedTile);
        // add the this.viewport to the stage
        this.tileSystem.app.stage.addChild(this.viewport);
        this.tileSystem.app.renderer.plugins.interaction.moveWhenInside = true;
        this.tileSystem.app.renderer.plugins.interaction.setTargetElement(this.canvasRef.current);
        this.tileSystem.rootObject = this.viewport;

        // activate plugins
        this.tileSystem.plugins.forEach((plugin) => this.viewport[plugin]());
        this.tileSystem.tileSize = getTileSize();
        const loader = this.tileSystem.app.loader;
        this.tileSystem.loadedSprites = this.tileSystem.loadedSprites.concat(
            this.tileSystem.explosionSprites,
            Object.values(overlayTextures),
            Object.values(TileGroundType).map(groundType => Object.values(groundType)).flat() as string[],
            buildings.map(building => buildingSprites(building)).flat(),
            trees.map(building => buildingSprites(building)).flat(),
            powerSources.map(building => buildingSprites(building)).flat(),
            "sprites/person.png"
        ).filter(val => val != null);
        var loadedPromise: Promise<PIXI.Loader>;

        this._isMounted = true;
        this.tileSystem.loadedSprites.forEach(sprite => loader.add(sprite, sprite));
        loadedPromise = new Promise(resolve => loader.load(resolve));

        loadedPromise.then(() => {
            this.tileSystem.setupObjects();
            this.tileSystem.updateTileObjects(tileMap).then((centerPoint) => {
                var p: Promise<void>;
                this.viewport.moveCenter(centerPoint as any);
                if(enableCulling) {
                    this.cull = new Cull.SpatialHash({
                        dirtyTest: false
                    });
                    this.cull.addContainerPromisified = function(container: PIXI.Container&{cull: any;}, staticObject?: boolean): Promise<void> {
                        return new Promise(resolve => {
                            const added = function(object)
                            {
                                object[this.spatial] = { hashes: [] }
                                this.updateObject(object)
                            }.bind(this)
        
                            const removed = function (object)
                            {
                                this.removeFromHash(object)
                            }.bind(this)
        
                            scheduleIdleWorkLoop(container.children.length, i => {
                                let object = container.children[i];
                                object[this.spatial] = { hashes: [] }
                                this.updateObject(object)
                            }, 20).then(() => {
                                container.cull = {}
                                this.containers.push(container)
                                container.on('childAdded', added)
                                container.on('childRemoved', removed)
                                container.cull.added = added
                                container.cull.removed = removed
                                if (staticObject)
                                {
                                    container.cull.static = true
                                }
                                resolve();
                            });
                        });
                    };
                    p = this.cull.addContainerPromisified(this.viewport);
                } else
                    p = Promise.resolve();
                
                p.then(() => {
                    this.viewport.dirty = true;
                    var firstRenderCompleted = false;
                    this.tileSystem.app.ticker.add(() => {
                        if(Object.keys(this.nextStateToSet).length > 0) {
                            try {
                                this.setState(this.nextStateToSet as any);
                            } catch(e) {
                                console.error("error", e);
                            }
                            this.nextStateToSet = {};
                        }
                        if (enableCulling && this.viewport.dirty)
                        {
                            this.cull.cull(this.viewport.getVisibleBounds());
                            RenderController.queueRender();
                        }
                        if (RenderController.needsRender() || this.tileSystem.isDragging()) { // Manually render when something has changed
                            RenderController._queuedRender = false;
                            this.tileSystem.app.renderer.render(this.tileSystem.app.stage);
                            this.viewport.dirty = false;
                            if(!firstRenderCompleted) {
                                firstRenderCompleted = true;
                                this.setState({ initiallyRendered: true });
                                preloadAudio("audio/construction.mp3");
                                preloadAudio("audio/explosion.mp3");
                                preloadAudio("audio/ocean.mp3");
                            }
                        }
                    });
                });
            });
        });

        this.pixiSizeHandler = _debounce(250, this.updatePixiSize);
        window.addEventListener("resize", this.pixiSizeHandler);
        this.updatePixiSize();
    }
    getCurrentOverlayTile(): Tile {
        if(this.state.currentlyHoveredTile != null)
            return this.state.currentlyHoveredTile;
        else if(this.state.currentlySelectedTile != null)
            return this.state.currentlySelectedTile;
        else
            return null;
    }
    isDialogBasedConstructionType(type: ConstructionType) {
        return type == ConstructionType.Structures;
    }
    checkActive(type: ConstructionType, flag?: any): boolean {
        if(type != this.state.constructionType)
            return false;
        if(flag == undefined || typeof flag == 'undefined')
            flag = null;
        if(flag != this.state.constructionFlag)
            return false;
        return true;
    }
    cancelCurrentAction(additionalState?: any, onComplete?: () => void) {
        this.clearSelectedTile();
        this.setState(Object.assign({}, additionalState, { constructionType: null, constructionFlag: null }), onComplete);
        this.tileSystem.interactionAllowed = false;
        this.previouslyChosenTile = null;
    }
    startTileBasedAction(type: ConstructionType, sticky: boolean, flag?: any) {
        playAudio("audio/pop.mp3");
        if(this.state.constructionType != null) {
            /* Action in progress - check if it's the same */
            if(this.checkActive(type, flag)) {
                this.cancelCurrentAction();
                return;
            }
        }
        this.previouslyChosenTile = null;
        this.tileSystem.interactionAllowed = true;
        this.setState({ constructionType: type, constructionFlag: flag, stickyActionInProgress: sticky });
    }
    performAction(tile: Tile) {
        new Promise(resolve => {
            if(this.state.constructionType == ConstructionType.TerraformDown) {
                tile.raiseWholeTile(-0.5);
                let didFlood = false;
                for(const direction of AllDirections) {
                    const tileInDirection = tile.getTileInDirection(direction);
                    if(tileInDirection != null && tileInDirection.getLowestElevation() >= tile.getHighestElevation() && isGroundType(tileInDirection.ground, TileGroundType.Water)) {
                        tile.flood();
                        didFlood = true;
                        break;
                    }
                }
                playAudio(didFlood ? "audio/flood.mp3" : "audio/terraform.mp3", resolve);
            } else if(this.state.constructionType == ConstructionType.TerraformUp) {
                tile.raiseWholeTile(0.5);
                playAudio("audio/terraform.mp3", resolve);
            } else if(this.state.constructionType == ConstructionType.Teardown) {
                this.tileSystem.tileObjects[tile.getIndex()].triggerExplosion().then(() => {
                    let replaceWithWater = false;
                    if(tile.building != null) {
                        if(tile.building.name.startsWith("Hydro")) {
                            replaceWithWater = true;
                            const searchFn = (tile, dir, init) => {
                                if(tile == null)
                                    return;
                                if(!isGroundType(tile.ground, TileGroundType.Water))
                                    return;
                                if(tile.building == null || !tile.building.name.startsWith("Hydro"))
                                    return;
                                const behind = tile.getTileInDirection(TileDirection.Northeast);
                                const infront = tile.getTileInDirection(TileDirection.Southwest);
                                if((behind == null || !isGroundType(behind.ground, TileGroundType.Water)) || (infront == null || !isGroundType(infront.ground, TileGroundType.Water))) {
                                    return;
                                }
                                if(!init) {
                                    tile.building = null;
                                    const i = tile.getIndex();
                                    this.tileSystem.tileObjects[i].triggerExplosion();
                                    hydroAdjust(tile, HYDRO_LOWER, this.tileSystem);
                                    this.tileSystem.updateTile(i);
                                }
                                
                                /* Search to the left and right and see if we need to construct a dam */
                                searchFn(tile.getTileInDirection(dir), dir, false);
                            };
                            hydroAdjust(tile, HYDRO_LOWER, this.tileSystem);
                            searchFn(tile, TileDirection.Northwest, true);
                            searchFn(tile, TileDirection.Southeast, true);
                        }
                    }
                    tile.building = null;
                    if(isGroundType(tile.ground, TileGroundType.Sand))
                        tile.explosionOverride = TileGroundType.Sand;
                    if(replaceWithWater) {
                        tile.ground = TileGroundType.Water;
                    } else
                        tile.ground = TileGroundType.Dirt1;
                    resolve();
                });
            } else if(this.state.constructionType == ConstructionType.ChangeGroundType) {
                tile.ground = this.state.constructionFlag;
                if(tile.ground == TileGroundType.Water)
                    playAudio("audio/ocean.mp3", resolve);
                else
                    resolve();
            } else if(this.state.constructionType == ConstructionType.ShowInfo) {
                this.setState({ forcedQueryTile: tile, showForcedQuery: true });
                playAudio("audio/pop.mp3", resolve);
            } else {
                playAudio("audio/pop.mp3", resolve);
            }
        }).then(() => this.onActionCompleted(tile));
    }
    onActionCompleted(tile: Tile) {
        if(tile != null) {
            tile.doTileUpdate();
            this.tileSystem.updateTile(tile.getIndex());
        }
        if(!this.state.stickyActionInProgress) {
            this.cancelCurrentAction();
        }
    }
    setSelectionHighlightVisible(tile: Tile, visible: boolean) {
        this.tileSystem.tileObjects[tile.getIndex()].tileSelectionHighlight.visible = visible;
    }
    housePeople(destination: Tile, numPeople: number, radius: number = 5) {
        const availableTiles = destination.searchInRing(radius).flat(2).map(n => this.props.tileMap[n]);
        /* First try and put everyone in buildings */
        for(const tile of availableTiles) {
            if(isGroundType(tile.ground, TileGroundType.Water))
                continue;
            if(tile.building != null) {
                const availableSpace = Math.min(numPeople, tile.building.occupancy - tile.building.residents);
                numPeople -= availableSpace;
                tile.building.residents += availableSpace;
            }
        }
        /* Now spread the remaining population over all the tiles */
        const perTile = Math.floor(numPeople / availableTiles.length);
        for(const tile of availableTiles) {
            if(isGroundType(tile.ground, TileGroundType.Water))
                continue;
            tile.population += perTile;
            numPeople -= perTile;
            this.tileSystem.updateTile(tile.getIndex());
        }
        destination.population += numPeople;
        this.tileSystem.updateTile(destination.getIndex());
    }
    evacuateTiles(from: Tile, to: Tile) {
        const evacuateSources = from.searchInRing(EVACUATION_RANGE).flat(2).map(n => this.props.tileMap[n]);
        let totalEvacuees = 0;
        for(const tile of evacuateSources) {
            if(isGroundType(tile.ground, TileGroundType.Water))
                continue;
            const agreeableDishoused = getRandomInt(0, tile.population+1);
            totalEvacuees += agreeableDishoused;
            tile.population -= agreeableDishoused;
            if(tile.building != null) {
                const agreeableResidents = getRandomInt(0, tile.building.residents+1);
                totalEvacuees += agreeableResidents;
                tile.building.residents -= agreeableResidents;
            }
            this.tileSystem.updateTile(tile.getIndex());
        }
        
        if(totalEvacuees > 0) {
            this.housePeople(to, totalEvacuees, EVACUATION_RANGE);
            this.props.enqueueSnackbar(totalEvacuees + " people agreed to evacuate!", { variant: 'success' });
        } else
            this.props.enqueueSnackbar("No one chose to evacuate.", { variant: 'error' });
    }
    checkActionAllowed(tile: Tile): string {
        if(this.state.constructionType == ConstructionType.Structures) {
            if(tile.building != null)
                return "You can't build that here; there is already something else on this tile.";
        } else if(this.state.constructionType == ConstructionType.TerraformDown || this.state.constructionType == ConstructionType.TerraformUp) {
            const keyword = this.state.constructionType == ConstructionType.TerraformDown ? "lower" : "raise";
            if(tile.building != null)
                return `You can't ${keyword} tiles with something on them.`;
            else if(isGroundType(tile.ground, TileGroundType.Water))
                return `You can't ${keyword} water.`;
            const elevationsSurroundingTile: { [key: number]: number; } = {};
            const whichElevationSurrounding = `get${this.state.constructionType == ConstructionType.TerraformUp ? 'Lowest' : 'Highest'}Elevation`;
            const whichElevationUs = `get${this.state.constructionType == ConstructionType.TerraformDown ? 'Lowest' : 'Highest'}Elevation`;
            const nw = tile.getTileInDirection(TileDirection.Northwest);
            if(nw != null)
                elevationsSurroundingTile[TileDirection.Northwest] = (nw[whichElevationSurrounding]());
            const ne = tile.getTileInDirection(TileDirection.Northeast);
            if(ne != null)
                elevationsSurroundingTile[TileDirection.Northeast]  = (ne[whichElevationSurrounding]());
            const sw = tile.getTileInDirection(TileDirection.Southwest);
            if(sw != null)
                elevationsSurroundingTile[TileDirection.Southwest] = (sw[whichElevationSurrounding]());
            const se = tile.getTileInDirection(TileDirection.Southeast);
            if(se != null)
                elevationsSurroundingTile[TileDirection.Southeast] = (se[whichElevationSurrounding]());
            const tileElevation = tile[whichElevationUs]();
            for(const elevationSurroundingTile of Object.values(elevationsSurroundingTile)) {
                const difference = tileElevation - elevationSurroundingTile;
                if((this.state.constructionType == ConstructionType.TerraformUp && difference >= 1.5) || (this.state.constructionType == ConstructionType.TerraformDown && difference <= -1.5)) {
                    return `You can't ${keyword} that tile any further.`;
                }
            }
        } else if(this.state.constructionType == ConstructionType.ChangeGroundType) {
            if(this.state.constructionFlag == TileGroundType.Water) {
                if(tile.getSlantDirection() != null)
                    return "Water can't be slanted.";
                else if(tile.building != null)
                    return "Ground under a building can't be changed to water.";
            }
        } else if(this.state.constructionType == ConstructionType.Teardown) {
            if(tile.building == null || !(tile.building as PowerSource).isPowerSource)
                return "You can only remove power sources.";
        } else if(this.state.constructionType == ConstructionType.Evacuate) {
            if(tile.building == null || (tile.building.name != "Heliport" && tile.building.name != "Hospital")) {
                return "Evacuation can only be done between heliports and/or hospitals.";
            }
            const tooClose = this.previouslyChosenTile == null ? false : tile.searchInRing(EVACUATION_RANGE).some(ring => ring.some(idx => this.props.tileMap[idx] == this.previouslyChosenTile));
            if(tooClose) {
                this.setSelectionHighlightVisible(this.previouslyChosenTile, false);
                const sameTile = this.previouslyChosenTile == tile;
                this.previouslyChosenTile = null;
                return sameTile ? "It's pointless to move people where they came from." : "These evacuation centres are too close to each other.";
            }
            if(this.previouslyChosenTile != null) {
                this.setSelectionHighlightVisible(this.previouslyChosenTile, false);
                this.evacuateTiles(this.previouslyChosenTile, tile);
                this.cancelCurrentAction();
            } else
                this.setSelectionHighlightVisible(tile, true);
        }
        return null;
    }
    showError(errString: string) {
        playAudio("audio/error.mp3", undefined, undefined, false);
        this.setState({ showError: true, errString: errString });
    }
    onTilePick(tile: Tile) {
        /* Check if the action is valid */
        const errString = this.checkActionAllowed(tile);
        if(errString != null && errString.trim().length > 0) {
            this.showError(errString);
        } else {
            /* Trigger an action */
            if(!this.isDialogBasedConstructionType(this.state.constructionType)) {
                this.performAction(tile);
            } else {
                this.setState({ currentlySelectedTile: tile });
            }
            this.previouslyChosenTile = tile;
        }
        
    }

    invertRiskLevel = () => {
        playAudio("audio/pop.mp3", () => {
            this.tileSystem.tileRiskLevelVisible = !this.tileSystem.tileRiskLevelVisible;
            RenderController.queueRender();
        });
    };
    onErrorAcknowledge = () => {
        this.setState({ showError: false });
    };
    endQuery = () => {
        this.setState({ showForcedQuery: false });
    }
    closeNewspaper = () => {
        //this.setState({ newspaperClosed: true });
    }
    /*
    saveTileMap = () => {
        import("./TileMapSaver").then(mod => mod.saveMap(this.props.tileMap));
    };
    */
    getTileName(tile: Tile): string {
        return tile?.building ? `${tile.building.name}${tile.building.destroyed ? " (destroyed)" : ""}` : stringTillFirstDigit(getStringEnumName(TileGroundType, tile?.ground));
    }
    validHover() {
        return this.state.hoverX != null && this.state.hoverY != null;
    }
    getDisasterString(): JSX.Element {
        const census = this.props.tileMap.takeCensus();
        const success = ((census.dead)/(census.housed+census.unhoused+census.dead)) <= (1/8);
        return <>
            <div className="head">Vicious tsunami strikes</div>
            <div className="content">
                <div className="columns">
                    <div className="column">
                    <p>{`On ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}, ` +
                    `a devastating tsunami struck the region. The waves inundated many coastal buildings and most remaining displaced people ` +
                    `were killed or severely injured.`}</p>
                    {success && <p>
                        The city's evacuations manager did an excellent job of providing shelter for displaced people.
                        With their help, most of the population was able to survive the tsunami.
                        Only {census.dead} people died, compared to the {census.housed} who had been safely sheltered.
                    </p>}
                    {success && <p>Several other cities are now requesting to hire the evacuations manager on a contract basis.</p>}
                    {!success && <p>
                        Civilians were furious about the steps taken to prevent damage. "Significantly more time could
                        have been spent evacuating low-lying areas and sheltering those without homes," one angry survivor stated.
                    </p>}
                    {!success && <p>The disaster's toll on the city was high, with {census.dead} people dead.</p>}
                    {!success && <p>
                        Local officials are looking for  a replacement for the current evacuations manager,
                        who has been suspended pending a full investigation.
                    </p>}
                    <p>Thanks for playing {document.title}! If you want to play the game again, refresh the page.</p>
                    </div>
                </div>
            </div>
        </>;
        
    }
    hideInstructions = () => {
        this.setState({ instructionsHidden: true }, () => instructionsViewedOnce = true);
    }
    showInstructions = () => this.setState({ instructionsHidden: false })
    render() {
        const tile = this.getCurrentOverlayTile();
        const name = this.getTileName(tile);
        const generatedPower = this.props.tileMap.getPower();
        const buttons = <>
            {isNewMode && <>
                <ControlButton icon={BackIcon} onClick={this.props.onGoBack}/>
                <ControlSeparator/>
            </>}
            <ControlButton icon={HelpIcon} onClick={this.showInstructions}/>
            <ControlSeparator/>
            <ControlGroup>
                <DisasterControlButton title="Add building" constructionType={ConstructionType.Structures} icon={BuildingIcon} onClick={this.startTileBasedAction} active={this.checkActive}/>
                <DisasterControlButton title="Clear tile" sticky constructionType={ConstructionType.Teardown} icon={RedBombIcon} onClick={this.startTileBasedAction} active={this.checkActive}/>
            </ControlGroup>
            {isNewMode && <>
                <ControlSeparator/>
                <DisasterControlButton sticky title="Make water" constructionType={ConstructionType.ChangeGroundType} flag={TileGroundType.Water} icon={WaterIcon} onClick={this.startTileBasedAction} active={this.checkActive}/>
                <DisasterControlButton sticky title="Make grass" constructionType={ConstructionType.ChangeGroundType} flag={TileGroundType.Grass} icon={LandIcon} onClick={this.startTileBasedAction} active={this.checkActive}/>
            </>}
            <ControlSeparator/>
            <DisasterControlButton title="Query tile" sticky constructionType={ConstructionType.ShowInfo} icon={PurpleInfoIcon} onClick={this.startTileBasedAction} active={this.checkActive}/>
        </>;
        return <>
            {(this.state.initiallyRendered && !this.state.disasterFinished) && <ControlBar>
                {this.state.disasterRunning ? <span style={{lineHeight: "1.5"}}>A disaster is taking place!</span> : buttons}
            </ControlBar>}
            <TileOverlay constructionMode={true} show={tile != null && this.state.interactionAllowed && this.validHover() && !this.isDialogBasedConstructionType(this.state.constructionType)} name={name} riskLevel={tile?.riskLevel} riskColor={tile?.getRiskLevelColor()} isSelected={false}
                powerGen={tile?.currentPowerGeneration}
                style={{
                    transform: `translateX(1em) translateY(-50%) translate(${this.state.hoverX}px, ${this.state.hoverY}px)`
                }}/>
            <canvas ref={this.canvasRef} style={{
                visibility: this.state.initiallyRendered ? null : 'hidden',
                touchAction: 'none',
                cursor: 'inherit'
            }}/>
            {!this.state.initiallyRendered && <MapLoadingScreen loadingText="Populating the area..."/>}
            <ConstructionDialog show={this.state.currentlySelectedTile != null && this.isDialogBasedConstructionType(this.state.constructionType)}
                type={this.state.constructionType} onChooseItem={this.performBuild} targetTile={this.state.currentlySelectedTile}
                onBuildCancel={this.onActionCompleted.bind(this, null)}/>
            <Dialog open={this.state.showError} onClose={this.onErrorAcknowledge}>
                <DialogTitle>Action not allowed</DialogTitle>
                <DialogContent dividers>
                    {this.state.errString}
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.onErrorAcknowledge} color="primary">OK</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={this.state.showForcedQuery} onClose={this.endQuery} hideBackdrop={true}>
                <DialogContent className="tile-overlay-embed-parent">
                    <ConstructionOptionImage mainSprite={this.state.forcedQueryTile?.getAppropriateMainSprite()} baseSprite={this.state.forcedQueryTile?.getAppropriateBaseSprite()}
                        leftColor={this.tileSystem.tileObjects[this.state.forcedQueryTile?.getIndex()]?.leftColor} rightColor={this.tileSystem.tileObjects[this.state.forcedQueryTile?.getIndex()]?.rightColor}/>
                    <TileOverlay embed constructionMode={true} show={this.state.forcedQueryTile != null} name={this.getTileName(this.state.forcedQueryTile)}
                        riskLevel={this.state.forcedQueryTile?.riskLevel} riskColor={this.state.forcedQueryTile?.getRiskLevelColor()} isSelected={false}
                        powerGen={this.state.forcedQueryTile?.currentPowerGeneration}/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.endQuery} color="primary">OK</Button>
                </DialogActions>
            </Dialog>
            {this.state.initiallyRendered && <PopulationInfo showTimer forceOpen={this.state.disasterFinished} generated={generatedPower} required={POWER_REQ}/>}
            <PhoneDialog open={this.state.disasterFinished && !this.state.newspaperClosed} onClose={this.closeNewspaper}>
                <DialogContent className="newspaper">
                    {this.getDisasterString()}
                </DialogContent>
            </PhoneDialog>
            <PhoneDialog open={this.state.initiallyRendered && !this.state.instructionsHidden} onClose={this.hideInstructions}>
                <DialogTitle>{instructionsViewedOnce ? "Instructions" : "Welcome"}</DialogTitle>
                <DialogContent>
                    {!instructionsViewedOnce && <>
                        Welcome to {document.title}!
                        <p></p>
                    </>}
                    <strong>Objective</strong>
                    <p></p>
                    The goal of this game is to power a city with renewable energy sources. You need to generate {POWER_REQ} kWh of power
                    for the city.
                    <p></p>
                    <strong>How to play</strong>
                    <p></p>
                    You can drag the map around to see the whole city. You can also zoom by either pinching or using the mouse wheel,
                    depending on your device.
                    <p></p>
                    Most buttons require you to choose a tile to perform an action on. Click the button, and then click the tile
                    you would like to work with.
                    <p></p>
                    <strong>Construction</strong>
                    <p></p>
                    Construction is performed with the <BuildingIcon/> button. You'll be offered a list of power sources to choose from.
                    <p></p>
                    Some power sources work more efficiently in certain areas than others.
                    <p></p>
                    <strong>Power output</strong>
                    <p></p>
                    Use the information button to find out how much electricity is being generated by each power source. It will vary based on where it is placed. Why?
                    When you click the <PurpleInfoIcon/> button, you will be able to hover
                    (if you are using a mouse) or click on a tile to see more information about it.
                    <p></p>
                    <strong>Municipal statistics</strong>
                    <p></p>
                    The panel at the bottom of the screen can be opened to see general statistics about how much power you're generating
                    compared to the requirements.
                    <p></p>
                    Reminder: to win the game, you must successfully generate {POWER_REQ} kWh of power.
                    <p></p>
                    Good luck! If you want to refer to these instructions later, you can click on the <HelpIcon/> button.
                </DialogContent>
                <DialogActions>
                    <Button color="primary" onClick={this.hideInstructions}>{instructionsViewedOnce ? "OK" : "Start"}</Button>
                </DialogActions>
            </PhoneDialog>
        </>;
    }
}
const SnackbarPixiCont = withSnackbar(PIXIContainer);
const PixiContProvider = (props) => {
    return <SnackbarProvider><SnackbarPixiCont {...props}>{props.children}</SnackbarPixiCont></SnackbarProvider>;
};
export default PixiContProvider;