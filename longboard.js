/*
longboard drawing 
*/

const longboardModeToken = 'mode-longboard';
const longboardCanvasId = 'longboard-canvas';

var longboardState = {
    currentFill: 'black',
    capoFret: 0,
    transparency: 0,
    stringState: new Array(6).fill(null).map(() => ({
        state: "open",
        finger: null,
        opacity: 1,
        fret: 0,
        fill: 'black'
    })),
    
};

var longboardSettings={
    colorScheme: {
        neckColor: "#fffbf0",
        neckBorderColor: "#e8e3dd",
        stringColor: "#df9d61",
        fretColor: "#99948e",
        dotColor: "#e8e3dd"
    },
    proportions: {
        horizontalPadding: 0,
        verticalPadding: 0,
        borderFretsVerticalMargin: 10,
        nutWidth: 1,
        fretWidth: 3,
        stringPadding: 2
    },
    verticalParts: 0,
    horizontalParts: 0,
    fretCount: 24,
    widthToHeightRatio: 6,
};

persistObject('longboard-state', longboardState, onLongboardStateRestored);

//Called after deserialization
function onLongboardStateRestored() {
    //TODO: use if needed
}

/**
 * Create longboard-related HTML controls
 */

window.addEventListener('load', function () {
    var lastchild = document.querySelector("#mode-keyboard-controls");

    var element = document.createElement('template');

    //Insert switch

    lastchild.insertAdjacentHTML('afterend', "<div class='mode-dependent' id='" + longboardModeToken + "-controls'>" +
        "<label class='switch'>" +
        "<input type='checkbox' id='longboard-show' onchange='setLongboardVisibility(this)'>" +
        "<span class='slider'>Показать</span></label>" +
        "Подсветка " +
        "<input type='color' id='fill-longboard-finger-color' value='#000000' onchange='updateLongboardSettingsFromUI()'><br /><br />" +
        "Номер лада с каподастром " +
        "<input type='text' id='longboard-capo-number' " +
        "value = '" + longboardState.capoFret + "' " +
        "onchange='updateLongboardSettingsFromUI()' " +
        "onKeyUp='updateLongboardSettingsFromUI()'>" +
        "Прозрачность " +
        "<div class='rangeslidecontainer'>" +
        "<input type='range' min='0' max='100' value='" + longboardState.transparency + "' class='rangeslider' " +
        "id='longboard-transparency' onchange='updateLongboardSettingsFromUI()'><br />" +
        "</div>" +
        "</div>");

    lastchild.insertAdjacentHTML('afterend', "<label class='switch'>" +
        "<input type='checkbox' id='" + longboardModeToken + "' onchange='changemode(this)'>" +
        "<span class='slider'>ГИТАРНЫЙ ГРИФ</span></label>");

    //Insert canvas

    document.querySelector("#keyboard").insertAdjacentHTML('afterend', '<div id="longboard" class="canvas-container" style="display:none">' +
        '<canvas id="' + longboardCanvasId + '" height="150"></canvas></div>');

    avaliableContainerIds.push('longboard');   //container id actually
    modeDependentRenderers['longboard'] = drawLongboard;

    //Register handlers for freboard mode
    availableModeFunctions[longboardCanvasId] =
        {
            'mode-longboard': function (x, y, canvas, evtype, code) { toggleLongboardFretHighlight(x, y, canvas, evtype, code) },
        };

    longboard = addModeListeners(document.getElementById(longboardCanvasId));


    document.getElementById(longboardModeToken).addEventListener('change',
        function (event) {

            if (document.getElementById(longboardModeToken).checked) {

                document.getElementById('longboard-show').checked = true;

                setLongboardVisibility(document.getElementById('longboard-show'));
            }
            return false;
        }, false);

});

function updateLongboardSettingsFromUI() {

    longboardState.capoFret = parseInt(document.querySelector('#longboard-capo-number').value);
    longboardState.currentFill = document.querySelector('#fill-longboard-finger-color').value;
    longboardState.transparency = document.querySelector('#longboard-transparency').value;

    if (isNaN(longboardState.capoFret))
        longboardState.capoFret = 0;

    saveState();
    redraw();
}


function setLongboardVisibility(source) {

    showCanvasAccordingToMode(source.checked ? 'longboard' : null);

    if (!source.checked) {
        redraw();
        return;
    }

    updateLongboardSize();

    drawLongboard();
}

function updateLongboardSize() {
    var height = longboard.clientHeight;

    /* TODO : adapt to desired ratio */
    updateVertical();
    updateHorizontal();
    document.querySelector("#" + longboardCanvasId).width = height * longboardSettings.widthToHeightRatio;

}

function updateHorizontal() {
    var partCount = 0;
    partCount += (longboardSettings.fretCount + 1) * longboardSettings.proportions.fretWidth;
    partCount += longboardSettings.proportions.nutWidth;
    partCount += longboardSettings.proportions.horizontalPadding * 2;
    longboardSettings.horizontalParts = partCount;
}

function updateVertical() {
    var partCount = 0;
    partCount += longboardSettings.proportions.verticalPadding * 2;
    partCount += longboardSettings.proportions.stringPadding * (6 + 1);
    longboardSettings.verticalParts = partCount;
}

function drawLongboard() {

    drawLongboardBase(longboard.ctx, longboard.clientWidth, longboard.clientHeight);
    drawStrings(longboard.ctx, longboard.clientWidth, longboard.clientHeight);
    drawFingers(longboard.ctx, longboard.clientWidth, longboard.clientHeight);
    /*TODO: draw something else */
}

/**
 * @param {CanvasRenderingContext2D} ctx 
 * @param {int} w 
 * @param {int} h 
 */
function drawFingers(ctx, w, h) {
    var hp = w / longboardSettings.horizontalParts;
    var vp = h / longboardSettings.verticalParts;

    for (let i = 0; i < longboardState.stringState.length; i++) {
        const guitarString = longboardState.stringState[i];

        //Open or Muted - not our fingering case
        if (guitarString.state != stringStates.pressed)
            continue;

        var fretStep = longboardSettings.proportions.fretWidth;
        var fretOffset = longboardSettings.proportions.horizontalPadding + longboardSettings.proportions.nutWidth + longboardSettings.proportions.fretWidth / 2;
        
        var fret = guitarString.fret - longboardState.capoFret -1;

        if(fret < 0)
            continue;
     
        var x = (fret * fretStep + fretOffset) * hp;

        var y = longboardSettings.proportions.verticalPadding * vp + longboardSettings.proportions.stringPadding*vp + longboardSettings.proportions.stringPadding*vp* i;

        var dotSize = longboardSettings.proportions.stringPadding / 2 * vp;
        
        var tAlpha = ctx.globalAlpha;

        ctx.font = Math.round(dotSize) + "px Arial black";

        ctx.globalAlpha = guitarString.opacity;
        ctx.fillStyle = guitarString.fill;    
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.globalAlpha = tAlpha;
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(guitarString.finger, x, y + 0.02 * h);
    }
}

/**
 * @param {CanvasRenderingContext2D} ctx 
 * @param {int} w 
 * @param {int} h 
 */
function drawLongboardBase(ctx, w, h) {
    var hp = w / longboardSettings.horizontalParts;
    var vp = h / longboardSettings.verticalParts;

    var nutWidth = longboardSettings.proportions.nutWidth;
    var horizontalPadding = longboardSettings.proportions.horizontalPadding;
    var verticalPadding = longboardSettings.proportions.verticalPadding;

    
    ctx.clearRect(0,0,w,h)

    // neck
    ctx.fillStyle = longboardSettings.colorScheme.neckColor;
    ctx.fillRect(hp * horizontalPadding, verticalPadding * vp + longboardSettings.proportions.borderFretsVerticalMargin,
         w - 2 * hp * horizontalPadding, 
         h - 2 * verticalPadding * vp - 2*longboardSettings.proportions.borderFretsVerticalMargin);

    ctx.fillStyle = longboardSettings.colorScheme.neckBorderColor;
    ctx.fillRect(hp * horizontalPadding, 
        verticalPadding * vp +  + longboardSettings.proportions.borderFretsVerticalMargin, 
        nutWidth * hp, h - 2 * verticalPadding * vp - 2 * longboardSettings.proportions.borderFretsVerticalMargin);

    ctx.lineWidth = 2;
    ctx.strokeStyle = longboardSettings.colorScheme.neckBorderColor;
    ctx.strokeRect(hp * horizontalPadding, 
        verticalPadding * vp +  longboardSettings.proportions.borderFretsVerticalMargin, 
        w - 2 * hp * horizontalPadding, 
        h - 2 * verticalPadding * vp - 2* longboardSettings.proportions.borderFretsVerticalMargin);


    ctx.strokeStyle = longboardSettings.colorScheme.fretColor;
    ctx.beginPath();

    //frets
    var fretStep = longboardSettings.proportions.fretWidth;
    var fretOffset = horizontalPadding + nutWidth + fretStep;
    for (var i = 0; i < longboardSettings.fretCount; i++) {
        ctx.moveTo((i * fretStep + fretOffset) * hp, vp * verticalPadding +  longboardSettings.proportions.borderFretsVerticalMargin);
        ctx.lineTo((i * fretStep + fretOffset) * hp, h - vp * verticalPadding -  longboardSettings.proportions.borderFretsVerticalMargin);
    }
    ctx.stroke();

    //dots
    ctx.fillStyle = longboardSettings.colorScheme.dotColor;
    var dotSize = longboardSettings.proportions.stringPadding / 4 * vp;
    for (var i = 1; i <= longboardSettings.fretCount; i++) {        
        switch (i % 12) {
            case 0:
                ctx.beginPath();
                ctx.arc(((i - 1.5) * fretStep + fretOffset) * hp, h * 0.5 + longboardSettings.proportions.stringPadding * vp, dotSize, 0, Math.PI * 2, false);
                ctx.arc(((i - 1.5) * fretStep + fretOffset) * hp, h * 0.5 - longboardSettings.proportions.stringPadding * vp, dotSize, 0, Math.PI * 2, false);
                ctx.fill();
                break;
            case 3:
            case 5:
            case 7:
            case 9:
                ctx.beginPath();
                ctx.arc(((i - 1.5) * fretStep + fretOffset) * hp, h * 0.5, dotSize, 0, Math.PI * 2, false);
                ctx.fill();
                break;
            default:
                continue;
        }
    }
}

/**
 * @param {CanvasRenderingContext2D} ctx 
 * @param {int} w 
 * @param {int} h 
 */
function drawStrings(ctx, w, h) {
    var hp = w / longboardSettings.horizontalParts;
    var vp = h / longboardSettings.verticalParts;

    var verticalOffset = vp*(longboardSettings.proportions.verticalPadding+longboardSettings.proportions.stringPadding);
    var verticalStep = vp*longboardSettings.proportions.stringPadding;

    ctx.lineWidth = 1;
    ctx.strokeStyle = longboardSettings.colorScheme.stringColor;
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
        ctx.moveTo(longboardSettings.proportions.horizontalPadding*hp, verticalOffset + verticalStep * i);
        ctx.lineTo(w-longboardSettings.proportions.horizontalPadding*hp, verticalOffset + verticalStep * i);
    }
    ctx.stroke();
}

function handleLongboardFretClick(x, y) {
    var clickPosition = getClickPosition(x, y);
    if (clickPosition == null)
        return;
    var clickedString = longboardState.stringState[clickPosition.string];
    //Remove finger

    if (clickedString.state == stringStates.pressed) {
        clickedString.state = stringStates.open;
        clickedString.fret = 0;
        return;
    }

    //Add finger

    var finger = prompt("Подпись");

    clickedString.state = stringStates.pressed;
    clickedString.finger = finger;
    clickedString.fret = clickPosition.fret +  longboardState.capoFret;
    clickedString.fill = longboardState.currentFill;
    clickedString.opacity = 1 - (longboardState.transparency/100);
    //TODO add finger color to longboard

    saveState();
}

function getClickPosition(x, y) {
    var w = longboard.clientWidth;
    var h = longboard.clientHeight;
    var hp = w / longboardSettings.horizontalParts;
    var vp = h / longboardSettings.verticalParts;
    var hOffset = longboardSettings.proportions.horizontalPadding;
    var yOffset = longboardSettings.proportions.verticalPadding;
    if (x > hp * (hOffset + longboardSettings.proportions.nutWidth) && x < w - hp * hOffset) {
        x -= hp * (hOffset + longboardSettings.proportions.nutWidth);
        y -= vp * yOffset;
        var fret = Math.ceil(x / (longboardSettings.proportions.fretWidth * hp));
        var string = Math.round(y / (longboardSettings.proportions.stringPadding * vp))-1;
        return { fret, string };
    }
    return null;
}
function toggleLongboardFretHighlight(x, y, cavnas, evtype, code) {

    if (evtype != 'mousedown')
        return;

    switch (code.button) {
        case 0:
            handleLongboardFretClick(x, y);
            break;
        default:
            code.preventDefault();
    }

    redraw();
}