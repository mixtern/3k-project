/*
Keyboard drawing
*/


window.addEventListener('load', function () 
{
    document.getElementById('mode-keyboard').addEventListener('change',
    function (event) {

        if (document.getElementById('mode-keyboard').checked) {

            document.getElementById('keyboard-show').checked = true;

            setKeyboardVisibility(document.getElementById('keyboard-show'));
        }
        return false;
    },false);

    avaliableContainerIds.push('keyboard');

});


var keyboardParameters = {
    keyWidth: 0.6,
    blackKeyWidth: 0.45,

    blackKeyHeight: 0.6,
    blackCOffset: 33 / 60.0,

    background: 'black',

    bottomPadding: 0.1,
    topPadding: 0.1,

    keyMargin : 1,

    isCompressed : false,

    keyboardDefaultHeight : 500,
    keyboardCompressedHeight: 250,

    blackKeyHeightDefault: 0.6,
    blackKeyHeightCompressed: 0.5,

    keyWidthToHeightRatioDefault: 0.22779922779922779922779922779923,
    keyWidthToHeightRatioCompressed: 0.4,

    keyWidthToHeightRatio: 0.22779922779922779922779922779923,
};

var KeyPosition = Object.freeze({
    Left: 0,
    Mid: 1,
    Right: 2,
    BlackLeft: 3,
    BlackMid: 4,
    BlackRight: 5,
});

function createKeyItem(keyname, keypos) {
    var key = {
        name: keyname,
        position: keypos,
        isPressed : false,
        draw : drawKey,
        highlight : ChordHighlightType.None,
        hitX1 : 0,
        hitY1 : 0,
        hitX2 : 0,
        hitY2:0,
        labels: [null,null],
    };

    switch (keypos) {
        case KeyPosition.Left:
        case KeyPosition.Mid:
        case KeyPosition.Right:
            key.isWhite = true;
            key.width = keyboardParameters.keyWidth;
            key.height = 1;
            break;
        case KeyPosition.BlackLeft:
        case KeyPosition.BlackMid:
        case KeyPosition.BlackRight:
            key.isWhite = false;
            key.height = keyboardParameters.blackKeyHeight;
            key.width = keyboardParameters.blackKeyWidth;
            break;
    }

    return key;
}

var keys = [
    createKeyItem("C", KeyPosition.Left),
    createKeyItem("C#", KeyPosition.BlackLeft),
    createKeyItem("D", KeyPosition.Mid),
    createKeyItem("D#", KeyPosition.BlackRight),
    createKeyItem("E", KeyPosition.Right),
    createKeyItem("F", KeyPosition.Left),
    createKeyItem("F#", KeyPosition.BlackLeft),
    createKeyItem("G", KeyPosition.Mid),
    createKeyItem("G#", KeyPosition.BlackMid),
    createKeyItem("A", KeyPosition.Mid),
    createKeyItem("A#", KeyPosition.BlackRight),
    createKeyItem("B", KeyPosition.Right),
    createKeyItem("C", KeyPosition.Left),
    createKeyItem("C#", KeyPosition.BlackLeft),
    createKeyItem("D", KeyPosition.Mid),
    createKeyItem("D#", KeyPosition.BlackRight),
    createKeyItem("E", KeyPosition.Right),
    createKeyItem("F", KeyPosition.Left),
    createKeyItem("F#", KeyPosition.BlackLeft),
    createKeyItem("G", KeyPosition.Mid),
    createKeyItem("G#", KeyPosition.BlackMid),
    createKeyItem("A", KeyPosition.Mid),
    createKeyItem("A#", KeyPosition.BlackRight),
    createKeyItem("B", KeyPosition.Right),
];

function setKeyboardVisibility(source) {

    showCanvasAccordingToMode(source.checked ? 'keyboard' : null);

    if (!source.checked)
    {
        redraw();
        return;
    }

    //Install handlers for keyboard mode
    availableModeFunctions['keyboard-canvas'] =
    {
        'mode-basetone': function (x, y, canvas, evtype) { },
        'mode-alttone': function (x, y, canvas, evtype) { },
        'mode-chords': toggleKeyHighlight,
        'mode-arrows': createArrowsHandler,
        'mode-labels': createLabelsHandler,
        'mode-fill': function (x, y, canvas, evtype) { },
        'mode-highlight': function (x, y, canvas, evtype) { },
        'mode-keyboard': toggleKeyLabel
    };

    removeAllLabels();

    drawKeyboard();
}

function drawKeyShapedRectangle(ctx,x,y,width,height, radius){
    ctx.beginPath();
    ctx.moveTo(x + 0, y);
    ctx.lineTo(x + width - 0, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + 0);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y);
    ctx.quadraticCurveTo(x, y, x, y);
    ctx.closePath();
}

function drawKey(key,ctx,x,y){

    if(key.isWhite){
        //Drawing WHITE key, (x,y) topleft

        var grd = ctx.createRadialGradient(
            keyboard.clientWidth/2, 0, 130,
            keyboard.clientWidth/2, 0, 430);
        
        grd.addColorStop(0, 'rgb(255,255,255)');
        grd.addColorStop(1, "#bbb");

        ctx.globalAlpha = 1;
        ctx.fillStyle = grd;

        drawKeyShapedRectangle(ctx,x + keyboardParameters.keyMargin,
            y+keyboardParameters.keyMargin,
            key.width * keyboard.clientHeight * keyboardParameters.keyWidthToHeightRatio - keyboardParameters.keyMargin * 2,  
            keyboard.clientHeight-keyboardParameters.keyMargin * 2,5);

        ctx.fill();

        key.hitX1 = x;
        key.hitX2 = x +key.width * keyboard.clientHeight * keyboardParameters.keyWidthToHeightRatio;
        key.hitY1 = 0;
        key.hitY2 = keyboard.clientHeight;

        if(key.highlight != ChordHighlightType.None)
            drawKeyHighlight(key,ctx,x,y);
    }
    else{
        //Drawing BLACK key, (x,y) topleft
        ctx.fillStyle = 'black';
        ctx.globalAlpha = 1;

        var blackWidth = key.width * keyboard.clientHeight * keyboardParameters.keyWidthToHeightRatio;

        drawKeyShapedRectangle(ctx,x - blackWidth/2,
            y,
            blackWidth,
            keyboard.clientHeight * keyboardParameters.blackKeyHeight,6);

        ctx.fill();

        if(key.highlight != ChordHighlightType.None)
            drawKeyHighlight(key,ctx,x,y);
        
        var grd = ctx.createRadialGradient(
            keyboard.clientWidth/2, 0, 230, 
            keyboard.clientWidth/2, 0, 530);
        
        grd.addColorStop(0, 'rgb(255,255,255)');
        grd.addColorStop(1, "rgba(255,255,255,0)");

        ctx.globalAlpha = 0.5;
        ctx.fillStyle = grd;
        
        var blackGlossOffsetX = 7;
        var blackGlossOffsetY = 25;

        drawKeyShapedRectangle(ctx,x - blackWidth/2 + blackGlossOffsetX,
            y+ 5,
            blackWidth - blackGlossOffsetX*2,
            keyboard.clientHeight * keyboardParameters.blackKeyHeight - blackGlossOffsetY,6);

        ctx.fill();

        key.hitX1 = x - blackWidth/2;
        key.hitX2 = x  + blackWidth/2;
        key.hitY1 = 0;
        key.hitY2 = keyboard.clientHeight * keyboardParameters.blackKeyHeight;
    }

    drawKeyLabels(key,ctx,x,y);
    
}

function drawKeyLabels(key,ctx,x,y){

    var keyWidth = key.width * keyboard.clientHeight * keyboardParameters.keyWidthToHeightRatio;
    var keyHeight = keyboard.clientHeight * key.height;

    var step = keyHeight / 6;
    var offsetY = keyHeight * 0.7;
   
    if(keyboardParameters.isCompressed)
    {
        offsetY = key.isWhite ? keyHeight * 0.65 : keyHeight * 0.3;
        step = key.isWhite ? (keyHeight / 4.5) : (keyHeight / 4);
    }

    for(var i = 0;i!=key.labels.length;++i){
        if(key.labels[i] == null)
            continue;

        ctx.font = "25px Arial";

        drawCircledLabel(key.labels[i],
            ctx,
            key.isWhite ? x + keyWidth/2 : x,
            y + offsetY + step*i,
            key.isWhite ? keyWidth * 0.9 :  keyWidth * 0.7,
            key.isWhite ? 'black' : 'white',
            key.isWhite ? 'white' : 'black');
    }

}

function drawCircledLabel(label,ctx,x,y,w, bg, fg){
    
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(x, y, w/2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = fg;
    ctx.globalAlpha = 1;

    var dim = ctx.measureText(label);

    dim.height = ctx.measureText("M").width;    

    // ctx.fillText(label.header, label.x - dim.x / 2, label.y + dim.y / 2);
    ctx.fillText(label, x - dim.width/2, y + dim.height*0.4);

}


function drawKeyHighlight(key,ctx,x,y){

    var keyWidth = key.width * keyboard.clientHeight * keyboardParameters.keyWidthToHeightRatio;

    if (key.highlight == ChordHighlightType.Fog) {
        // Create gradient
        
        var grd = ctx.createRadialGradient(
            x + keyWidth/2 , keyboard.clientHeight * key.height, keyboard.clientHeight* key.height * 0.3, 
            x + keyWidth/2, keyboard.clientHeight* key.height, keyboard.clientHeight* key.height * 0.5);
        grd.addColorStop(0, key.highlightColor);
        grd.addColorStop(1, "rgba(255,255,255,0)");

        ctx.globalAlpha = 0.65;
        ctx.fillStyle = grd;
    }
    else{
        //Just solid

        ctx.globalAlpha = 0.5;
        ctx.fillStyle = key.highlightColor;
    }

    drawKeyOutlines(key,ctx,x,y);
    ctx.fill();

    drawKeyHighlightAccentOverlay(key,ctx,x,y);

}

function drawKeyHighlightAccentOverlay(key,ctx,x,y){

    //sharp countour

    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = key.highlightColor;
    ctx.lineWidth = 5;

    drawKeyOutlines(key,ctx,x,y);
    ctx.stroke();     

    //hairline

    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = 'rgb(255,255,255)';
    ctx.lineWidth = 2;

    drawKeyOutlines(key,ctx,x,y);
    ctx.stroke();

}

function drawKeyOutlines(key,ctx,x,y){

    if(key.isWhite){
        //Drawing WHITE key, (x,y) topleft

        drawKeyShapedRectangle(ctx,x + keyboardParameters.keyMargin,
            y+keyboardParameters.keyMargin,
            key.width * keyboard.clientHeight * keyboardParameters.keyWidthToHeightRatio - keyboardParameters.keyMargin * 2,  
            keyboard.clientHeight-keyboardParameters.keyMargin * 2,5);

        
    }
    else{
        //Drawing BLACK key, (x,y) topleft
        var blackWidth = key.width * keyboard.clientHeight * keyboardParameters.keyWidthToHeightRatio;

        drawKeyShapedRectangle(ctx,x - blackWidth/2,
            y,
            blackWidth,
            keyboard.clientHeight * keyboardParameters.blackKeyHeight,6);

        
    }
}

function drawKeyboard() {

    updateKeySize();
    keyboardDrawBase(keyboard.ctx, keyboard.clientWidth, keyboard.clientHeight);

    //arrows, labels, etc
    invokeModeIndependentRendereres(main.ctx, main.clientWidth, main.clientHeight);
}

function updateKeySize() {
    
    if(keyboardParameters.isCompressed!=document.querySelector("#keys-compressed").checked)
    {
        keyboardParameters.isCompressed = document.querySelector("#keys-compressed").checked;
        
        //remove arrows & labels, because they dont get too well with rescaling :(

        activeArrows = [];
        activeLabels = [];
    }


    keyboard.height = keyboardParameters.isCompressed ? keyboardParameters.keyboardCompressedHeight : keyboardParameters.keyboardDefaultHeight;
    keyboardParameters.keyWidthToHeightRatio = keyboardParameters.isCompressed ? keyboardParameters.keyWidthToHeightRatioCompressed : keyboardParameters.keyWidthToHeightRatioDefault; 
    keyboardParameters.blackKeyHeight = keyboardParameters.isCompressed ? keyboardParameters.blackKeyHeightCompressed : keyboardParameters.blackKeyHeightDefault; 

    var height = keyboard.clientHeight;
    var width = 0;

    for (let key of keys)
        width += (key.isWhite ? key.width : 0);

    var width = width * height * keyboardParameters.keyWidthToHeightRatio;

    document.querySelector("#keyboard-canvas").width = width + keyboardParameters.keyMargin * 2;
}

function keyboardDrawBase(ctx, w, h) {

    ctx.fillStyle = keyboardParameters.background;
    ctx.fillRect(0, 0, w, h);

    var xpos =0;

    //Drawing WHITE keys first

    for (let key of keys)
    {
        if(!key.isWhite)
            continue;

        key.draw(key,ctx,xpos,0);

        xpos += key.width * h * keyboardParameters.keyWidthToHeightRatio;
    }

    //Drawing BLACK keys on top

    xpos =0;
    
    for (let key of keys)
    {
        if(key.isWhite)
        {
            xpos += key.width * h * keyboardParameters.keyWidthToHeightRatio;
            continue;
        }

        key.draw(key,ctx,xpos,0);
    }

}

function toggleKeyHighlight(x, y, cavnas,evtype) {

    if (evtype != 'mousedown')
        return;

    //Guess what key was clicked

    var hit = keys.find(key => {
        return !key.isWhite &&
        key.hitX1 < x &&
        key.hitX2 > x &&
        key.hitY1 < y &&
        key.hitY2 > y;            
    });

    if (hit == null) 
        hit = keys.find(key => {
            return key.isWhite &&
            key.hitX1 < x &&
            key.hitX2 > x &&
            key.hitY1 < y &&
            key.hitY2 > y;            
        });

    var highlightColor = document.getElementById("chord-color").value;

    //Cycle highlihgt types

    if (hit != null) {
        hit.highlight = hit.highlight == activeChordHighlight ? ChordHighlightType.None: activeChordHighlight;
        hit.highlightColor = highlightColor; 
    }
    
    drawKeyboard();
}


function removeKeyLabels()
{
    for (let key of keys)
    {
        key.labels = [null,null];
    }
    
    redraw();
}


function toggleKeyLabel(x, y, cavnas,evtype) {

    if (evtype != 'mousedown')
        return;

    //Guess what key was clicked

    var hit = keys.find(key => {
        return !key.isWhite &&
        key.hitX1 < x &&
        key.hitX2 > x &&
        key.hitY1 < y &&
        key.hitY2 > y;            
    });

    if (hit == null) 
        hit = keys.find(key => {
            return key.isWhite &&
            key.hitX1 < x &&
            key.hitX2 > x &&
            key.hitY1 < y &&
            key.hitY2 > y;            
        });

        if (document.querySelector("#label-text-for-key").value.length < 1) {
        document.querySelector("#label-text-for-key-validation").style.display = 'block';
        drawKeyboard();
        return;
    }

    document.querySelector("#label-text-validation").style.display = 'none';

    var text = document.querySelector("#label-text-for-key").value;

    //Cycle highlihgt types

    if (hit != null) {

        var labelIndex = Math.abs(hit.hitY1*0.5 + hit.hitY2*0.5 - y) < Math.abs(hit.hitY2 - y) ? 0 : 1;
        hit.labels[labelIndex] = hit.labels[labelIndex] == text ? null: text;
    }
    
    drawKeyboard();
}