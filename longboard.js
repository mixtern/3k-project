/*
longboard drawing 
*/

const longboardModeToken = 'mode-longboard';
const longboardCanvasId = 'longboard-canvas';

var longboardSettings = {
    colorScheme:{
        deckColor:"#E4C69F",
        deckBorderColor:"#603F18",
        stringColor:"#E7E8E8",
        fretColor:"#C0B151"
    },
    currentFill : 'black',
    capoFret : 0,
    transparency: 0,
    stringState:new Array(6).fill(null).map(()=>({
        state:"open",
        finger:null,
        fret:0, 
        fill:'black'})),
    widthToHeightRatio: 4,
};

persistObject('longboard-settings',longboardSettings, onLongboardSettingsRestored);

//Called after deserialization
function onLongboardSettingsRestored(){
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
        "<span class='slider'>Показать</span></label>"+    
        "Подсветка "+
        "<input type='color' id='fill-longboard-finger-color' value='#000000' onchange='updateLongboardSettingsFromUI()'><br /><br />"+
        "Номер лада с каподастром "+
        "<input type='text' id='longboard-capo-number' "+
        "value = '"+longboardSettings.capoFret+"' "+
        "onchange='updateLongboardSettingsFromUI()' "+
        "onKeyUp='updateLongboardSettingsFromUI()'>"+
        "Прозрачность "+
        "<div class='rangeslidecontainer'>"+
            "<input type='range' min='0' max='100' value='"+longboardSettings.transparency+"' class='rangeslider' "+
            "id='longboard-transparency' onchange='updateLongboardSettingsFromUI()'><br />"+
        "</div>"+
        "</div>");

    lastchild.insertAdjacentHTML('afterend', "<label class='switch'>" +
        "<input type='checkbox' id='" + longboardModeToken + "' onchange='changemode(this)'>" +
        "<span class='slider'>ГИТАРНЫЙ ГРИФ</span></label>");

    //Insert canvas

    document.querySelector("#keyboard").insertAdjacentHTML('afterend', '<div id="longboard" class="canvas-container" style="display:none">' +
        '<canvas id="' + longboardCanvasId + '" height="250"></canvas></div>');

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

function updateLongboardSettingsFromUI(){

    longboardSettings.capoFret = parseInt(document.querySelector('#longboard-capo-number').value);
    longboardSettings.currentFill = document.querySelector('#fill-longboard-finger-color').value;
    longboardSettings.transparency= document.querySelector('#longboard-transparency').value;

    if(isNaN(longboardSettings.capoFret))
        longboardSettings.capoFret = 0;

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

    document.querySelector("#" + longboardCanvasId).width = height * longboardSettings.widthToHeightRatio;
}



function drawLongboard() {

    drawLongboardBase(longboard.ctx, longboard.clientWidth, longboard.clientHeight);
    drawStrings(longboard.ctx, longboard.clientWidth, longboard.clientHeight);
    /*TODO: draw something else */
}



/**
 * @param {CanvasRenderingContext2D} ctx 
 * @param {int} w 
 * @param {int} h 
 */
function drawLongboardBase(ctx, w, h) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = longboardSettings.colorScheme.deckColor;
    ctx.fillRect(1/75 * w, 0.15 * h, 73/75 * w, 0.7 * h);
    
    ctx.fillStyle = longboardSettings.colorScheme.deckBorderColor;
    ctx.fillRect(1/75 * w, 0.15 * h, 2/75 * w, 0.7 * h);

    ctx.lineWidth = 5;
    ctx.strokeStyle = longboardSettings.colorScheme.deckBorderColor;
    ctx.strokeRect(1/75 * w, 0.15 * h, 73/75 * w, 0.7 * h);

    ctx.lineWidth = 3;
    ctx.strokeStyle = longboardSettings.colorScheme.stringColor;
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
        ctx.moveTo(1/75*w, 0.25 * h + 0.1 * h * i);
        ctx.lineTo(73/75*w, 0.25 * h + 0.1 * h * i);
    }
    ctx.stroke();

}

/**
 * @param {CanvasRenderingContext2D} ctx 
 * @param {int} w 
 * @param {int} h 
 */
function drawStrings(ctx,w,h){

    fretboardSettings.fretColor
    for (var i = 0; i < 6; i++) {
        ctx.moveTo(1/75*w, 0.25 * h + 0.1 * h * i);
        ctx.lineTo(73/75*w, 0.25 * h + 0.1 * h * i);
    }
}

function toggleLongboardFretHighlight(x, y, cavnas, evtype, code) {
    
    if (evtype != 'mousedown')
        return;
    
    switch (code.button) {
        case 0:
            /*handleLongboardFretClick(x, y);*/
            break;
        default:
            code.preventDefault();
    }
    
    redraw();
}
