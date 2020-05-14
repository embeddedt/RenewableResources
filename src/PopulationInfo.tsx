import React from 'react';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import TimerBar from './TimerBar';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import Typography from '@material-ui/core/Typography';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import Button from '@material-ui/core/Button';

const PopulationInfo: React.FunctionComponent<{ generated: number; required: number; forceOpen?: boolean; showTimer: boolean; }> = (props) => {
    const [ isOpen, setIsOpen ] = React.useState(true);
    const [ endGame, setEndGame ] = React.useState(false);
    const [ showingEndDialog, setShowingEndDialog ] = React.useState(true);
    const onCloseEnd = () => setShowingEndDialog(false);
    const onChange = React.useCallback((evt, state) => {
        setIsOpen(state);
    }, []);
    React.useEffect(() => {
        if(props.forceOpen)
            setIsOpen(true);
    }, [ props.forceOpen ]);
    React.useEffect(() => {
        if(props.generated >= props.required)
            setEndGame(true);
    }, [ props.generated, props.required ]);
    return <ExpansionPanel square expanded={isOpen} onChange={onChange} className="population-info">
        <ExpansionPanelSummary expandIcon={<ExpandLessIcon />}>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
            <div className="population-column">
                <Typography variant="h5">POWER</Typography>
                <p></p>
                <ul>
                    <li style={{color: props.generated < props.required ? "red" : "green"}}>Currently generated: {props.generated}</li>
                    <li style={{color: "black"}}>Required: {props.required}</li>
                </ul>
            </div>
        </ExpansionPanelDetails>
        {endGame && <Dialog open={showingEndDialog} onClose={onCloseEnd}>
            <DialogTitle>Congratulations!</DialogTitle>
            <DialogContent>
                You successfully generated {props.required} kWh of power for the city!
                <p></p>
                You can refresh the page to play again.
            </DialogContent>
            <DialogActions>
                <Button color="primary" onClick={onCloseEnd}>OK</Button>
            </DialogActions>
        </Dialog>}
    </ExpansionPanel>;
}
export default PopulationInfo;