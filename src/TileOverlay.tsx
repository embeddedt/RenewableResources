

import React from 'react';
import { LightningIcon } from './Icons';

interface TileOverlayProps {
    name: string;
    isSelected: boolean;
    style?: React.CSSProperties;
    show: boolean;
    constructionMode?: boolean;
    riskColor: number;
    riskLevel: number;
    embed?: boolean;
    powerGen: number;
}

/*<div className="tile-overlay-clipper">
            <div className={`tile-overlay-wrapper tile-overlay-${props.isSelected ? "selected" : "unselected"}`}>*/
const TileOverlay = React.forwardRef<HTMLDivElement, TileOverlayProps>((props, ref) => {
    if(!props.show || props.name == undefined)
        return null;
    const riskColor = props.riskColor.toString(16);
    let deadComponent;
    if(props.powerGen > 0)
        deadComponent = <>&nbsp;<span><LightningIcon/>&nbsp;{props.powerGen + " kWh"}</span></>;
    return  <div className={`tile-overlay-container tile-overlay-${props.isSelected ? "selected" : "unselected"} ${props.embed ? "tile-overlay-embed" : ""}`} ref={ref} style={props.style}>
        <div className="tile-risk-level-text" style={{ backgroundColor: `#${riskColor}`} }>{props.riskLevel}</div>
        <div className="tile-info-container">
            {props.name}
            <p></p>
            <span className="icon-information">{deadComponent}</span>
        </div>
    </div>;
    /*</div>
        </div>
        {props.isSelected && <div className={`modal-backdrop ${!props.isSelected ? "modal-backdrop-clear" : "modal-backdrop-translucent"}`} onClick={onClickAway}></div>}*/
});
export default TileOverlay;