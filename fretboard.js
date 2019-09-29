/*
Fretboard drawing 
*/

const fretboardModeToken = 'mode-fretboard';
const fretboardCanvasId = 'fretboard-canvas';

const stringStates = {muted:'muted',open:'open', pressed: 'pressed'};

var fretboardSettings = {
    guitarTuningChromatic: [4,9,2,7,11,4], //EADGBE
    chordName: "Chord",
    fingerFill : 'black',
    capoFret: 0,
    stringState:new Array(6).fill(null).map(()=>({state:"open",finger:null,fret:0, fill:'black'})),
    widthToHeightRatio: 0.64,
};

/**
 * Create fretboard-related HTML controls
 */

window.addEventListener('load', function () {
    var lastchild = document.querySelector("#mode-keyboard-controls");

    var element = document.createElement('template');

    //Insert switch

    lastchild.insertAdjacentHTML('afterend', "<div class='mode-dependent' id='" + fretboardModeToken + "-controls'>" +
        "<label class='switch'>" +
        "<input type='checkbox' id='fretboard-show' onchange='setFretboardVisibility(this)'>" +
        "<span class='slider'>Показать</span></label>"+
        "<input type='text' id='fretboard-chord-name' placeholder='Название аккорда' "+
        "onchange='updateFretboardSettingsFromUI()' "+
        "onKeyUp='updateFretboardSettingsFromUI()'>"+
        "Подсветка номера пальца"+
        "<input type='color' id='fill-fretboard-finger-color' value='#000000' onchange='updateFretboardSettingsFromUI()'><br /><br />"+
        "<input type='text' id='fretboard-capo-number' placeholder='Номер лада с каподастром' "+
        "onchange='updateFretboardSettingsFromUI()' "+
        "onKeyUp='updateFretboardSettingsFromUI()'>"+
        "</div>");

    lastchild.insertAdjacentHTML('afterend', "<label class='switch'>" +
        "<input type='checkbox' id='" + fretboardModeToken + "' onchange='changemode(this)'>" +
        "<span class='slider'>АППЛИКАТУРЫ</span></label>");

    //Insert canvas

    document.querySelector("#keyboard").insertAdjacentHTML('afterend', '<div id="fretboard" class="canvas-container" style="display:none">' +
        '<canvas id="' + fretboardCanvasId + '" height="500"></canvas></div>');

    avaliableContainerIds.push('fretboard');   //container id actually
    modeDependentRenderers['fretboard'] = drawFretboard;

    //Register handlers for freboard mode
    availableModeFunctions[fretboardCanvasId] =
        {
            'mode-basetone': function (x, y, canvas, evtype) { /*nothing*/ },
            'mode-alttone': function (x, y, canvas, evtype) {  /*nothing*/ },
            'mode-chords': function (x, y, canvas, evtype) {  /*nothing*/ },
            'mode-arrows': function (x, y, canvas, evtype) { /*nothing*/ },
            'mode-labels': function (x, y, canvas, evtype) {  /*nothing*/ },
            'mode-fill': function (x, y, canvas, evtype) { /*nothing*/ },
            'mode-highlight': function (x, y, canvas, evtype) { /*nothing*/ },
            'mode-keyboard': function (x, y, canvas, evtype) {  /*nothing*/ },
            'mode-fretboard': function (x, y, canvas, evtype, code) { toggleFretHighlight(x, y, canvas, evtype, code) },
        };

    fretboard = addModeListeners(document.getElementById(fretboardCanvasId));

    document.getElementById(fretboardModeToken).addEventListener('change',
        function (event) {

            if (document.getElementById(fretboardModeToken).checked) {

                document.getElementById('fretboard-show').checked = true;

                setFretboardVisibility(document.getElementById('fretboard-show'));
            }
            return false;
        }, false);

});

function updateFretboardSettingsFromUI(){

    fretboardSettings.chordName = document.querySelector('#fretboard-chord-name').value;
    fretboardSettings.fingerFill = document.querySelector('#fill-fretboard-finger-color').value;
    fretboardSettings.capoFret = parseInt(document.querySelector('#fretboard-capo-number').value);

    if(fretboardSettings.chordName == null || fretboardSettings.chordName == "")
        fretboardSettings.chordName = "Chord";

    if(isNaN(fretboardSettings.capoFret))
        fretboardSettings.capoFret = 0;

    redraw();
}

function setFretboardVisibility(source) {

    showCanvasAccordingToMode(source.checked ? 'fretboard' : null);

    if (!source.checked) {
        redraw();
        return;
    }

    updateFretboardSize();

    drawFretboard();
}


function drawFretboard() {

    drawFretboardBase(fretboard.ctx, fretboard.clientWidth, fretboard.clientHeight);
    drawStringStates(fretboard.ctx, fretboard.clientWidth, fretboard.clientHeight);
    drawFingerPositions(fretboard.ctx, fretboard.clientWidth, fretboard.clientHeight);
    drawNoteNames(fretboard.ctx, fretboard.clientWidth, fretboard.clientHeight);
}

function updateFretboardSize() {
    var height = fretboard.clientHeight;

    /* TODO : adapt to desired ratio */

    document.querySelector("#" + fretboardCanvasId).width = height * fretboardSettings.widthToHeightRatio;
}
function drawStringStates(ctx, w, h) {
    /* TODO : string states menu (open, muted, none)*/
    ctx.fillStyle = 'black';
    ctx.font = Math.round(0.1 * h).toString() + "px Times New Roman";
    ctx.textAlign = 'center';
    for (var i = 0; i < 6; i++) {
        var state = translateStringState(fretboardSettings.stringState[i].state,i);
        ctx.fillText(state, 3 / 16 * w + 2 / 16 * w * i, 0.3 * h);
    }
}
/*TODO: state type*/

/**
 * 
 * @param {string} stateName 
 */
function translateStringState(stateName,string) {    
    switch (stateName) {
        case stringStates.muted:
            return "×"
        case stringStates.open:
            return "○";
        default:
            return "";
    }
}
/**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {int} w 
 * @param {int} h 
 */
function drawFingerPositions(ctx, w, h) {
    ctx.font = Math.round(0.06 * h) + "px Times New Roman";

    for (let i = 0; i < fretboardSettings.stringState.length; i++) {
        const gutarString = fretboardSettings.stringState[i];
        
        //Open or Muted - not our fingering case
        if(gutarString.state != stringStates.pressed)
            continue;

        var x = 3 / 16 * w + 2 / 16 * w * i;
        var y = 0.26 * h + 0.1 * h * gutarString.fret;
        ctx.fillStyle = gutarString.fill;
        ctx.beginPath();
        ctx.arc(x, y, 0.035 * h, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.fillText(gutarString.finger, x, y + 0.02 * h);

    }
}


/**
 * @param {CanvasRenderingContext2D} ctx 
 * @param {int} w 
 * @param {int} h 
 */
function drawFretboardBase(ctx, w, h) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'black';
    ctx.font = Math.round(0.15 * h).toString() + "px Times New Roman";
    ctx.textAlign = 'center';
    ctx.fillText(fretboardSettings.chordName, 0.5 * w, 0.2 * h);

    ctx.strokeRect(3 / 16 * w, 0.3 * h, 5 / 8 * w, 0.52 * h);
    ctx.fillRect(3 / 16 * w, 0.3 * h, 5 / 8 * w, 0.02 * h);

    ctx.beginPath();
    for (var i = 1; i < 6; i++) {
        ctx.moveTo(3 / 16 * w + 2 / 16 * w * i, 0.3 * h);
        ctx.lineTo(3 / 16 * w + 2 / 16 * w * i, 0.82 * h);
    }
    for (var i = 1; i < 5; i++) {
        ctx.moveTo(3 / 16 * w, 0.3 * h + 0.104 * h * i);
        ctx.lineTo(13 / 16 * w, 0.3 * h + 0.104 * h * i);
    }
    ctx.stroke();
}

function drawNoteNames(ctx, w, h) {
    
    ctx.fillStyle = 'black';
    ctx.font = Math.round(0.06 * h).toString() + "px Times New Roman";
    ctx.textAlign = 'center';

    for (let nstring = 0; nstring!=fretboardSettings.guitarTuningChromatic.length; nstring++) {
        var tuning = fretboardSettings.guitarTuningChromatic[nstring];

        if(fretboardSettings.stringState[nstring].state == stringStates.muted)
            continue;
     
        if(fretboardSettings.stringState[nstring].state == stringStates.pressed)          
            tuning+=fretboardSettings.stringState[nstring].fret;
        
        tuning+=fretboardSettings.capoFret;

        ctx.fillText(getChromaticNoteName(tuning), 3 / 16 * w + 2 / 16 * w * nstring, 0.88 * h);

    }

}


function handleFretClick(x, y) {
    var w = fretboard.clientWidth;
    var h = fretboard.clientHeight;
    if (y > 0.3 * h && y < 0.8 * h && x > 0.125 * w && x < 0.875 * w) {

        var clickedString = fretboardSettings.stringState[Math.round((7 * x - w) / w)];

        //Remove finger

        if(clickedString.state == stringStates.pressed)
        {
            clickedString.state = stringStates.open;
            clickedString.fret = 0;    
            return;
        }

        //Add finger

        var finger = prompt("Номер пальца");
        var fret = Math.round((y - 0.352 * h) / (0.104 * h)) + 1;

        clickedString.state = stringStates.pressed;
        clickedString.finger = finger;
        clickedString.fret = fret;       
        clickedString.fill = fretboardSettings.fingerFill;
    }
}
function handleMuteClick(x, y) {
    var w = fretboard.clientWidth;
    var h = fretboard.clientHeight;
    if (y > 0.2 * h && y < 0.3 * h && x > 0.125 * w && x < 0.875 * w) {
        var string = Math.round((7 * x - w) / w);
        switchStringState(string);
    }
}
function switchStringState(stringNumber) {
    var current = fretboardSettings.stringState[stringNumber].state
    var newState = "";
    switch (current) {
        case stringStates.muted:
            newState = stringStates.open;
            break;
        case stringStates.pressed:
            newState = stringStates.open;
            break;
        default:
            newState = stringStates.muted;
            break;
        
    }
    
    fretboardSettings.stringState[stringNumber].state = newState
}


function toggleFretHighlight(x, y, cavnas, evtype, code) {
    
    if (evtype != 'mousedown') 
        return;
    
    switch (code.button) {
        case 0:
            handleFretClick(x, y);
            handleMuteClick(x, y);
            break;
        default:
            code.preventDefault();
    }
    redraw();
}

function toggleFretLabel(x, y, cavnas, evtype) {
    if (evtype != 'mousedown')
        return;

    /* TODO */
}

const chromaticNotes = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

function getChromaticNoteName(index){
    return chromaticNotes[index % chromaticNotes.length];
}