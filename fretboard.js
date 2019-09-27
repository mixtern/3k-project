/*
Fretboard drawing 
*/

var fretboardModeToken = 'mode-fretboard';
var fretboardCanvasId = 'fretboard-canvas';

var fretboardSettings = {
    /* todo : settings and state for fretboard here */

    widthToHeightRatio : 1.5,
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
        "<span class='slider'>Показать</span></label></div>");

    lastchild.insertAdjacentHTML('afterend', "<label class='switch'>" +
        "<input type='checkbox' id='" + fretboardModeToken + "' onchange='changemode(this)'>" +
        "<span class='slider'>ГИТАРНЫЙ ГРИФ</span></label>");

    //Insert canvas

    document.querySelector("#keyboard").insertAdjacentHTML('afterend', '<div id="fretboard" class="canvas-container" style="display:none">' +
        '<canvas id="'+fretboardCanvasId+'" height="500"></canvas></div>');

    avaliableContainerIds.push('fretboard');   //container id actually

    //Register handlers for freboard mode
    availableModeFunctions[fretboardCanvasId] =
        {
            'mode-basetone': function (x, y, canvas, evtype) { /*nothing*/ },
            'mode-alttone': function (x, y, canvas, evtype) {  /*nothing*/ },
            'mode-chords': toggleFretHighlight,
            'mode-arrows': function (x, y, canvas, evtype) { /*nothing*/ },
            'mode-labels': toggleFretLabel,
            'mode-fill': function (x, y, canvas, evtype) { /*nothing*/ },
            'mode-highlight': function (x, y, canvas, evtype) { /*nothing*/ },
            'mode-keyboard': function (x, y, canvas, evtype) {  /*nothing*/ },
            'mode-fretboard': function (x, y, canvas, evtype) {  /*nothing*/ },
        };

    fretboard = addModeListeners(document.getElementById(fretboardCanvasId));

    document.getElementById('mode-fretboard').addEventListener('change',
    function (event) {

        if (document.getElementById('mode-fretboard').checked) {

            document.getElementById('fretboard-show').checked = true;

            setFretboardVisibility(document.getElementById('fretboard-show'));
        }
        return false;
    },false);

});

function setFretboardVisibility(source) {    
    
    showCanvasAccordingToMode(source.checked ? 'fretboard' : null);

    if (!source.checked)
    {
        redraw();
        return;
    }

    drawFretboard();
}


function drawFretboard() {

    updateFretboardSize();
    drawFretboardBase(fretboard.ctx, fretboard.clientWidth, fretboard.clientHeight);
}

function updateFretboardSize() {
    var height = fretboard.clientHeight;

    /* todo : adapt to desired ratio */

    document.querySelector("#"+fretboardCanvasId).width = height * fretboardSettings.widthToHeightRatio;
}

function drawFretboardBase(ctx, w, h) {

    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, w, h);

    /* todo : draw fretboard! */
}

function toggleFretHighlight(x, y, cavnas, evtype) {

    if (evtype != 'mousedown')
        return;

    /* todo */
}

function toggleFretLabel(x, y, cavnas, evtype) {
    if (evtype != 'mousedown')
        return;

    /* todo */
}