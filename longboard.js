/*
longboard drawing 
*/

const longboardModeToken = 'mode-longboard';
const longboardCanvasId = 'longboard-canvas';

const knownStringStates ={
    none : 0,
    open : 1,
    closed : 2,
    customLabel : 3
};

var longboardState = {
    currentFill: 'black',
    currentFingerSize : 14,
    capoFret: 0,
    transparency: 0,
    fingers: [],
    stringStates:[
        knownStringStates.open,
        knownStringStates.open,
        knownStringStates.open,
        knownStringStates.open,
        knownStringStates.open,
        knownStringStates.open],
    stringLabels:['','','','','','']
};



var longboardSettings={
    colorScheme: {
        neckColor: "#fffbf0",
        neckBorderColor: "#e8e3dd",
        stringColor: "#df9d61",
        fretColor: "#99948e",
        dotColor: "#e8e3dd",
        stringStateColor : "#505050",
        stringStateColorDarker : "#303030",
    },
    proportions: {
        horizontalPadding: 0,
        verticalPadding: 0,
        borderFretsVerticalMargin: 10,
        nutWidth: 2,
        fretWidth: 3,
        stringPadding: 2
    },
    verticalParts: 0,
    horizontalParts: 0,
    fretCount: 24,
    widthToHeightRatio: 6,
    lastWidth : 0,
    lastHeight: 0,
};

persistObject('longboard-state', longboardState, onLongboardStateRestored);

//Called after deserialization
function onLongboardStateRestored() {
    document.querySelector("#longboard-capo-number").value = longboardState.capoFret;
    document.querySelector("#fill-longboard-finger-color").value = longboardState.currentFill;
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
        "<input type='color' id='fill-longboard-finger-color' value='" + longboardState.currentFill + "' onchange='updateLongboardSettingsFromUI()'><br /><br />" +
        "Номер лада с каподастром " +
        "<input type='text' id='longboard-capo-number' " +
        "value = '" + longboardState.capoFret + "' " +
        "onchange='updateLongboardSettingsFromUI()' " +
        "onKeyUp='updateLongboardSettingsFromUI()'>" +
        "<div class='rangeslidecontainer' style='visibility:hidden'>" +
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
            'mode-longboard': longboardEventHandler,
            'mode-arrows': createArrowsHandler,
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

/**
 * 
 * @param {int} stringNumber 
 * @param {knownStringState} state 
 */
function setStringState(stringNumber,state){
    longboardState.stringStates[stringNumber] = state;
}

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

    longboardSettings.lastWidth = longboard.clientWidth;
    longboardSettings.lastHeight = longboard.clientHeight;

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

    if(longboardSettings.verticalParts == 0)
        updateLongboardSize();

    drawLongboardBase(longboard.ctx, longboard.clientWidth, longboard.clientHeight);
    drawStrings(longboard.ctx, longboard.clientWidth, longboard.clientHeight);
    drawFingers(longboard.ctx, longboard.clientWidth, longboard.clientHeight);

    drawStringStates(longboard.ctx,longboard.clientWidth,longboard.clientHeight);

    //State - related render
    if(fingerInputMode.render != null)
        fingerInputMode.render(longboard.clientWidth,longboard.clientHeight,longboard.ctx);
    
    //arrows, labels, etc
    invokeModeIndependentRendereres(longboard.ctx, longboard.clientWidth, longboard.clientHeight);
}


function getFingerCenter(fret,string,w,h){

    var hp = w / longboardSettings.horizontalParts;
    var vp = h / longboardSettings.verticalParts;

    return {x:(fret * longboardSettings.proportions.fretWidth + longboardSettings.proportions.horizontalPadding + 
        longboardSettings.proportions.nutWidth + longboardSettings.proportions.fretWidth / 2) * hp,

        y:longboardSettings.proportions.verticalPadding * vp + longboardSettings.proportions.stringPadding*vp + longboardSettings.proportions.stringPadding*vp* string};
}


function renderFingerOutlines(ctx,x1,x2,y1,y2,size){
    ctx.beginPath();
    //upper cap
    ctx.arc(x1, y1, size, Math.PI, 0, false);
    //lower cap
    ctx.arc(x2, y2, size, 0, Math.PI, false);
    //connect
    ctx.closePath();
}

function renderFingerOrBarr(finger, w,h, ctx, isGhost){
    
    var a = ctx.globalAlpha;

    var p1 = getFingerCenter(finger.fret - 1 - longboardState.capoFret,finger.string1,w,h);
    var p2 = getFingerCenter(finger.fret - 1 - longboardState.capoFret,finger.string2,w,h);
    
    if(isGhost)
    {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = finger.fill;    
        renderFingerOutlines(ctx,p1.x,p2.x,p1.y,p2.y,finger.size);
        ctx.fill();           

        ctx.globalAlpha = 0.7;
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'black';    
        ctx.setLineDash([5, 3]); 
        renderFingerOutlines(ctx,p1.x,p2.x,p1.y,p2.y,finger.size);
        ctx.stroke();           
        ctx.setLineDash([1, 0]);
    }
    else
    {
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = 'black';
        renderFingerOutlines(ctx,p1.x,p2.x,p1.y,p2.y,finger.size);
        ctx.stroke();  

        ctx.fillStyle = finger.fill;
        ctx.globalAlpha = 1;
        ctx.setLineDash([1, 0]);

        renderFingerOutlines(ctx,p1.x,p2.x,p1.y,p2.y,finger.size);
        ctx.fill();                           
    }

    //label  

    var label = finger.label.length == 0 && isGhost ? "_" : finger.label;

    ctx.globalAlpha = 0.3;
    ctx.font = Math.round(finger.size) + "px Arial black";
    
    var textHeight = ctx.measureText("M").width;
    
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText(label, p1.x-1, p1.y-1 + textHeight/2);

    ctx.font = Math.round(finger.size) + "px Arial black";
    ctx.globalAlpha = 1;
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(label, p1.x, p1.y + textHeight/2);
    
    ctx.globalAlpha =a;
}

/**
 * @param {CanvasRenderingContext2D} ctx 
 * @param {int} w 
 * @param {int} h 
 */
function drawFingers(ctx, w, h) {

    for (let finger of longboardState.fingers) {

        var fret = finger.fret - longboardState.capoFret -1;

        if(fret < 0)
            continue;

        renderFingerOrBarr(
            finger,
            w,h,ctx,
            false);
    }
}

/**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {int} w 
 * @param {int} h 
 */
function drawStringStates(ctx,w,h){

    ctx.fillStyle = longboardSettings.colorScheme.stringStateColor;
    ctx.font = "22px Arial";
    ctx.textAlign = 'left';

    for (let nstring = 0; nstring < longboardState.stringStates.length; nstring++) {
        const sstate = longboardState.stringStates[nstring];
        
        if(sstate === knownStringStates.none || sstate === knownStringStates.customLabel)
            continue;

        if(longboardState.fingers.find(s=>s.string1 <= nstring && s.string2 >= nstring) != undefined)
            continue;

        var pos = getFingerCenter(-0.8,nstring,w,h);

        pos.y+=ctx.measureText("M").width/2 - 3;
        pos.x-=ctx.measureText("o").width/2 + 2;

        if(sstate == knownStringStates.open)
            ctx.fillText("o", pos.x,pos.y);
        if(sstate == knownStringStates.closed)
            ctx.fillText("x", pos.x,pos.y);
    }

    ctx.fillStyle = longboardSettings.colorScheme.stringStateColorDarker;
    ctx.font = "15px Arial";
    ctx.textAlign = 'left';
    
    for (let nstring = 0; nstring < longboardState.stringStates.length; nstring++) {
        const sstate = longboardState.stringStates[nstring];
        
        if(sstate !== knownStringStates.customLabel)
            continue;

        if(longboardState.fingers.find(s=>s.string1 <= nstring && s.string2 >= nstring) != undefined)
            continue;

        var pos = getFingerCenter(-0.8,nstring,w,h);

        ctx.fillStyle = longboardSettings.colorScheme.stringColor;
        ctx.globalAlpha = 1;
        ctx.setLineDash([1, 0]);

        const padRad = ctx.measureText("M").width*0.7;

        ctx.beginPath();
        //upper cap
        ctx.arc(pos.x-10, pos.y, padRad, Math.PI/2, -Math.PI/2, false);
        //lower cap
        ctx.arc(pos.x, pos.y, padRad, -Math.PI/2, Math.PI/2, false);
        //connect
        ctx.closePath();

        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.fillText(longboardState.stringLabels[nstring], 
            pos.x-ctx.measureText(longboardState.stringLabels[nstring]).width/2 - 2,
            pos.y+ctx.measureText("M").width/2-2);
        
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


function mousePositionToFretPosition(x, y) {
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

        if(string < 0 || string > 5)
            return null;

        return { fret, string };
    }
    return null;
}

function mousePositionToNutPosition(x,y){

    var w = longboard.clientWidth;
    var h = longboard.clientHeight;

    var hOffset = longboardSettings.proportions.horizontalPadding;

    var hp = w / longboardSettings.horizontalParts;

    if(x >= hp * (hOffset + longboardSettings.proportions.nutWidth))
        return null;

    var vp = h / longboardSettings.verticalParts;

    return Math.round(y / (longboardSettings.proportions.stringPadding * vp))-1;
}

function maybeHandleNutClick(x,y, isCtrl){
    var nstring = mousePositionToNutPosition(x,y);

    if(null == nstring)
        return null;

    if(nstring < 0 || nstring > 5)
        return null;

    if(isCtrl){
        longboardState.stringStates[nstring] = knownStringStates.open;
        redraw();
        return null;
    }

    if(longboardState.stringStates[nstring] === knownStringStates.closed){
        longboardState.stringStates[nstring] = knownStringStates.customLabel;
        longboardState.stringLabels[nstring] = "_";
        return nstring;
    }

    longboardState.stringStates[nstring] = knownStringStates.closed;

    redraw();

    return null;
}


var _escKeycode = 27;
var _delKeycode = 46;
var _bckspKeycode = 8;

/**
 * State machine
 */
const FingerInputModes = {
    Ghost: {
        state : {pos: null, mousepos:{x:0,y:0}},

        render : function(w,h,ctx){
       
            if(this.state.pos == null)
                return;

            var center = getFingerCenter(this.state.pos.fret-1,this.state.pos.string,w,h);
                        
            var a = ctx.globalAlpha;
            ctx.globalAlpha = 0.3;
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 3])
            ctx.strokeStyle = 'black';    
            ctx.beginPath();
            ctx.arc(center.x, center.y, longboardState.currentFingerSize, 0, Math.PI * 2, false);
            ctx.stroke();
            ctx.setLineDash([1, 0])
            ctx.globalAlpha =a;
            
        },
        mousemove: function (x, y, evt) {

            this.state.pos = mousePositionToFretPosition(x, y);
            
            this.state.mousepos.x = x;
            this.state.mousepos.y = y;

            redraw();
        },
        mousedown: function (x, y, evt) {

            evt.preventDefault();

            if(this.state.pos == null)
            {
                let nstring = maybeHandleNutClick(x,y,evt.ctrlKey);
                if(nstring!==null){
                    fingerInputMode = FingerInputModes.NutLabelPlacement;
                    fingerInputMode.state={
                        template:
                        {
                            string: nstring,
                            label : ""
                        }};

                    redraw();
                }

                return;
            }

            var filtered  = longboardState.fingers.filter(finger=>
                finger.fret != this.state.pos.fret ||           
                finger.string1 > this.state.pos.string ||
                finger.string2 < this.state.pos.string
            );

            if(filtered.length != longboardState.fingers.length)
            {
                longboardState.fingers = filtered;
                redraw();
                saveState();
                return;
            }

            fingerInputMode = FingerInputModes.FingerPlacement;
            fingerInputMode.state.template.placementStart = this.state.pos;
            fingerInputMode.state.template.placementEnd = this.state.pos;

            redraw();
        },
        mouseup: null
    },
    //
    NutLabelPlacement:{
        state:{
            template:{
                string : 0,
                label :"_"
            },            
        },
        keypress: function(code,evt){
            evt.preventDefault();

            this.state.template.label+=String.fromCharCode(code);

            if(this.state.template.label.length > 2)
                this.state.template.label = this.state.template.label.substring(this.state.template.label.length-2);

            longboardState.stringLabels[this.state.template.string] = this.state.template.label;

            evt.preventDefault();
            redraw();
        },
        render : function(w,h,ctx){

            longboardState.stringStates[this.state.template.string] = knownStringStates.customLabel;
            longboardState.stringLabels[this.state.template.string] = this.state.template.label;
        
            var pos = getFingerCenter(-0.8,this.state.template.string,w,h);

            ctx.strokeStyle = 'black';
            ctx.globalAlpha = 0.5;
            ctx.setLineDash([3, 1]);
    
            const padRad = ctx.measureText("M").width*0.7+2;
    
            ctx.beginPath();
            //left cap
            ctx.arc(pos.x-10, pos.y, padRad, Math.PI/2, -Math.PI/2, false);
            //right cap
            ctx.arc(pos.x, pos.y, padRad, -Math.PI/2, Math.PI/2, false);
            //connect
            ctx.closePath();
    
            ctx.stroke();
            ctx.setLineDash([1, 0]);
        },
        updateStringLabel:function(){
            longboardState.stringLabels[this.state.template.string] = this.state.template.label;
        },
        paste: function(evt){
            evt.preventDefault();
            this.state.template.label = evt.clipboardData.getData('text/plain').substring(0,2);
            this.updateStringLabel();
            redraw();
        },
        mousemove: (x, y, evt) => { redraw(); },
        mouseup: null,
        mousedown: function (x, y, evt) {
            evt.preventDefault();

            if (this.state.template.label.length < 1)
                longboardState.stringStates[this.state.template.string] = knownStringStates.open;

            longboardState.stringLabels[this.state.template.string] = longboardState.stringLabels[this.state.template.string].trim();
            fingerInputMode = FingerInputModes.Ghost;
            redraw();
            saveState();
        },
        keydown: function (code,evt) {

            switch(code){
                case _escKeycode:
                    longboardState.stringStates[this.state.template.string] = knownStringStates.open;
                    fingerInputMode = FingerInputModes.Ghost;
                    break;
                case _bckspKeycode:
                    this.state.template.label = "";                    
                    break; 
                default:                    
                    return;
            }

            evt.preventDefault();
            this.updateStringLabel();
            redraw();

        },
        keyup:  function (code) {
            if (code == _delKeycode)
            {
                this.state.template.label = "";
                this.updateStringLabel();
                redraw();
                return;
            }
        },
       },
    //
    FingerPlacement: {
        state:{
            template:{
                placementStart: null,
                placementEnd: null,
                label : "",
            },            
        },
        mousemove: function(x,y,evt) {
            
            var pos = mousePositionToFretPosition(x, y);            

            this.state.template.placementEnd = pos == null ? this.state.template.placementStart : pos;

            redraw();
        },
        keypress: function(code,evt){
            evt.preventDefault();
            this.state.template.label+=String.fromCharCode(code);

            if(this.state.template.label.length > 2)
                this.state.template.label = this.state.template.label.substring(this.state.template.label.length-2);

            redraw();
        },
        paste: function(evt){
            evt.preventDefault();
            this.state.template.label = evt.clipboardData.getData('text/plain').substring(0,2);
            redraw();
        },
        keydown: function (code,evt) {

            switch(code){
                case _escKeycode:
                    fingerInputMode = FingerInputModes.Ghost;
                    break;
                case _bckspKeycode:
                    this.state.template.label = "";                    
                    break; 
                case 187://add
                    longboardState.currentFingerSize = Math.min(longboardState.currentFingerSize +1 , 20);
                    break;
                case 189://subtract
                    longboardState.currentFingerSize = Math.max(longboardState.currentFingerSize -1 , 12);
                    break;
                default:                    
                    return;
            }

            evt.preventDefault();
            redraw();

        },
        keyup:  function (code) {
            if (code == _delKeycode)
            {
                this.state.template.label = "";
                redraw();
                return;
            }
        },
        mousedown: function(x,y,evt) {
            this.saveCurrentTemplate();
            this.state.template.label = "";
            fingerInputMode = FingerInputModes.Ghost;
            evt.preventDefault();
            redraw();
        },
        saveCurrentTemplate : function(){
            longboardState.fingers.push(this.getFingerDefinitionFromTemplate());
            saveState();
        },
        getFingerDefinitionFromTemplate: function(){
            var top = this.state.template.placementStart.string < this.state.template.placementEnd.string ? 
            this.state.template.placementStart.string : 
            this.state.template.placementEnd.string;

            var bot = this.state.template.placementStart.string < this.state.template.placementEnd.string ? 
            this.state.template.placementEnd.string : 
            this.state.template.placementStart.string;

            return{
                string1: top,
                string2: bot,
                label: this.state.template.label,
                fret: this.state.template.placementStart.fret,
                opacity :longboardState.opacity,
                fill : longboardState.currentFill,
                size:  longboardState.currentFingerSize
            };
        },
        render : function(w,h,ctx){

            renderFingerOrBarr(this.getFingerDefinitionFromTemplate(),w,h,ctx,true);
        
        },
        mouseup: null
    },
};

var fingerInputMode = FingerInputModes.Ghost;

function longboardEventHandler(px, py, canvas, evtype, keyCode,evt) {

    switch (evtype) {
        case 'mousedown':

            if (fingerInputMode.mousedown!= null)
                fingerInputMode.mousedown(px, py, evt);
            
            break;
            
        case 'mousemove':

            if (fingerInputMode.mousemove != null)
                fingerInputMode.mousemove(px, py, evt);

            break;
        case 'mouseup':
        case 'mouseleave':
            
            if (fingerInputMode.mouseup != null)
                fingerInputMode.mouseup(px, py, canvas, keyCode);

            break;
        case 'keydown':

            if (fingerInputMode.keydown != null)
                fingerInputMode.keydown(keyCode,evt);

            break;

        case 'keypress':

            if (fingerInputMode.keypress != null)
                fingerInputMode.keypress(keyCode,evt);

            break;

        case 'keyup':

            if (fingerInputMode.keyup != null)
                fingerInputMode.keyup(keyCode);

            break;

        case 'paste':

            if (fingerInputMode.paste != null)
                fingerInputMode.paste(evt);

            break;

        default:
            break;  
    }    
}