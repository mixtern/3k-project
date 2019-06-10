var main = {};
/*
 Co5 chord definitions 
*/

var ChordHighlightType =  Object.freeze({
    None : 0,
    Sector: 1,
    Fog: 2,
    Circle: 3,
    DoubleCircle: 4,
    UnderlineModeQuality: 5,
});

var ChordAlterationType = Object.freeze({
    None: 0,
    Sharp: 1,
    Flat: 2
});


var HarmonicQualityMode = Object.freeze({
    None: 0,
    Linear: 1,
    PsychAffective: 2, //DOI: 10.1037/pmu0000029
    Modes: 3,
});

var UiRenderingModeMode = Object.freeze({
    ClassicThin: 0,
    Bold: 1,    //Small screen-friendly version
});


var ModeDefinitions = Object.freeze({
    None: {color: ''},
    Ionian : {color: 'green'},
    Dorian : {color: '#FF1744'},
    Phrygian : {color: '#FFEE58'},
    Lydian  : {color: 'orange'},
    Mixolydian : {color: '#239dff'},
    Aeolian  : {color: '#6c00ff'},
    Locrian   : {color: 'cyan'},
});



var circleParameters = {
    marginPx: 5,
    outerRadiusPercents : 1,
    majorCircleThicknessPercents : 0.3,
    minorCircleThicknessPercents  : 0.3,

    inactiveColor : function(){ 
        switch(this.renderMode)
        {
            case UiRenderingModeMode.Bold:
            return "#555";
            case UiRenderingModeMode.ClassicThin:
            return "#aaaaaa";
        }
        this.renderMode 
    },

    originalWidth :  600,
    scalingFactor: function() {
        return document.querySelector("#circleOfFifths").width / this.originalWidth;
    },

    activeColor: "black",
    highlightColor: "orange",

    sectorCount: 12,
    sectorRadians: Math.PI * 2 / 12,

    isTonicMinor : false,
    isAltTonicMinor : false,

    selectedTonic: 0,
    altTonic: 3,
    tonicShown : true,
    altTonicShown : false,
    renderMode: UiRenderingModeMode.ClassicThin,
    tonicHighlightHarmonicQualityMode : HarmonicQualityMode.None,
    tonicDegreeEnabled: true,
    tonicColor: "red",
    altColor:"yellow"
};

/**
 * Creates chord defition given its name / alternate name and position on circle of 5ths
 * 
 * @param {number} co5Position - chord index on circle of fifths, starting from 0 to 11, clockwise
 * @param {boolean} isMinor - whether chord is minor. Affects positioning
 * @param {string} basename - base chord name.
 * @param {number} baseModeration - is base chord sharp or flat (#/b)
 * @param {string} altName - alternate chord name. Optional
 * @param {number} altAlteration - is alternate chord sharp or flat (#/b)
 * 
 * @return {Object<>} Chord definition object
 */
function createChord(co5Position, isMinor, basename, baseModeration, altName = "", altAlteration = 0) {
    return {
        minor: isMinor,
        position: co5Position,

        base: basename,
        baseMod: baseModeration,

        actualPx : null,
        actualPy : null,

        hasAlternateName: altName !== "",
        altName: altName,
        altMod: !!altName.length? altAlteration : ChordAlterationType.None,

        active: false,
        highlight: ChordHighlightType.None,
        highlightColor: circleParameters.highlightColor,
        highlightPower : 1,

        //Returns true if this chord is in tonality
        inTonic: function (tonality) {
            var tonal12 = (tonality + 6) % 12;
            var pos12 = (this.position+6) % 12;

            return Math.min(Math.abs(tonal12 - pos12), 12 - Math.abs(tonal12 - pos12)) < 2;
        },

        //Returns true if this chord is tonic chord
        isTonicChord: function (tonic,selMinor) {
        var tonic12 = (tonic + 6) % 12;
        var pos12 = (this.position+6) % 12;

        return Math.min(Math.abs(tonic12 - pos12), 12 - Math.abs(tonic12 - pos12)) == 0 && this.minor == selMinor;
        },

        getRelativePosition : function(target) {
            var delta = this.position - target.position;

            while (delta < -6)
                delta += 12;
            while (delta > 6)
                delta -= 12;
            return delta;
        },



        getFont : function(){

            var fontSelector = {
                minorFont : function(chord){



                    if (circleParameters.tonicShown && chord.isTonicChord(circleParameters.selectedTonic, circleParameters.isTonicMinor)) 
                    {
                        if(circleParameters.renderMode == UiRenderingModeMode.Bold)
                            return "bold "+(30*circleParameters.scalingFactor())+"px Arial";

                        return "bold "+(20*circleParameters.scalingFactor())+"px Arial";
                    }

                    if(circleParameters.renderMode == UiRenderingModeMode.Bold && chord.active)
                        return "bold "+(25*circleParameters.scalingFactor())+"px Arial";
                                    
                    return (20*circleParameters.scalingFactor())+"px Arial";
                },

                majorFont : function(chord){

                    if (circleParameters.tonicShown && chord.isTonicChord(circleParameters.selectedTonic, circleParameters.isTonicMinor)) 
                    {    
                        if(circleParameters.renderMode == UiRenderingModeMode.Bold)
                            return "bold "+(35*circleParameters.scalingFactor())+"px Arial";

                        return "bold "+(30*circleParameters.scalingFactor())+"px Arial";
                    }

                    if(circleParameters.renderMode == UiRenderingModeMode.Bold && chord.active)
                        return "bold "+(33*circleParameters.scalingFactor())+"px Arial";
                                    
                    return (30*circleParameters.scalingFactor())+"px Arial";
                },
            }          
            
            return this.minor ? fontSelector.minorFont(this) : fontSelector.majorFont(this);
        },

        getRelativeMode : function(target) {
            var delta = this.getRelativePosition(target);

            if(this.minor)
                return ModeDefinitions.None;

            switch (delta) {
            case 0:
                return ModeDefinitions.Ionian;
            case 1:
                return ModeDefinitions.Mixolydian;
            case 2:
                return ModeDefinitions.Dorian;
            case 3:
                return ModeDefinitions.Aeolian;
            case 4:
                return ModeDefinitions.Phrygian;
            case 5:
                return ModeDefinitions.Locrian;
            case -1:
                return ModeDefinitions.Lydian;
                
                default:
                    return ModeDefinitions.None;
            }

            return ModeDefinitions.None;
        },


        //Returns chord degree in given tonality
        getDegree: function (tonality, isMinor) {
            var tonic12 = (tonality + 6 ) % 12;
            var pos12 = (this.position+6) % 12;

            if (!this.inTonic(tonality))
                return "";

            var mod = (tonic12 - pos12 + 12) % 12;

            switch (mod) {
                case 1:
                    
                    if(isMinor)
                        return this.minor ? "iv" : "VI";

                    return this.minor ? "ii" : "IV";
                case 0:

                    if(isMinor)
                        return this.minor ? "i" : "III";

                    return this.minor ? "vi" : "I";                
                case 11:

                    if(isMinor)
                        return this.minor ? "v" : "VII";

                    return this.minor ? "iii" : "V";                
                default:
                    return mod;
            }            
        },
    }
}

var chordDefinitions = [
  
  //Major chords

  createChord(0, false, "C", ChordAlterationType.None),
  createChord(1, false, "G", ChordAlterationType.None),
  createChord(2, false, "D", ChordAlterationType.None),
  createChord(3, false, "A", ChordAlterationType.None),
  createChord(4, false, "E", ChordAlterationType.None),
  createChord(5, false, "C", ChordAlterationType.Flat, "B", ChordAlterationType.None),
  createChord(6, false, "G", ChordAlterationType.Flat, "F", ChordAlterationType.Sharp),
  createChord(7, false, "D", ChordAlterationType.Flat),
  createChord(8, false, "A", ChordAlterationType.Flat),
  createChord(9, false, "E", ChordAlterationType.Flat),
  createChord(10, false, "B", ChordAlterationType.Flat),
  createChord(11, false, "F", ChordAlterationType.None),

  //Minor chords
  
  createChord(0, true, "A", ChordAlterationType.None),
  createChord(1, true, "E", ChordAlterationType.None),
  createChord(2, true, "B", ChordAlterationType.None),
  createChord(3, true, "F", ChordAlterationType.Sharp),
  createChord(4, true, "C", ChordAlterationType.Sharp),
  createChord(5, true, "G", ChordAlterationType.Sharp),
  createChord(6, true, "E", ChordAlterationType.Flat),
  createChord(7, true, "B", ChordAlterationType.Flat),
  createChord(8, true, "F", ChordAlterationType.None),
  createChord(9, true, "C", ChordAlterationType.None),
  createChord(10, true, "G", ChordAlterationType.None),
  createChord(11, true, "D", ChordAlterationType.None)
];


function marshalModeAction(x, y, canvas,evtype, code) {
    availableModeFunctions[canvas.id][activeModeName](x,y,canvas,evtype, code);
}

function redraw() {

    availableRenderers[activeCanvasName]();    
}

function addModeListeners(source)
{
    source.ctx = source.getContext('2d');
   
    source.addEventListener('mousedown',
    function (event) {
        marshalModeAction(event.pageX - source.offsetLeft, event.pageY - source.offsetTop, source,'mousedown');
        return false;
    },false);

    source.addEventListener('mousemove',
    function (event) {
        marshalModeAction(event.pageX - source.offsetLeft, event.pageY - source.offsetTop, source,'mousemove');
        return false;
    },false);

    source.addEventListener('mouseup',
     function (event) {
        marshalModeAction(event.pageX - source.offsetLeft, event.pageY - source.offsetTop, source,'mouseup');
         return false;
     },false);

    source.addEventListener('mouseleave',
     function (event) {
        marshalModeAction(event.pageX - source.offsetLeft, event.pageY - source.offsetTop, source,'mouseleave');
         return false;
     },false);


    window.addEventListener('keydown',
     function (event) {
        marshalModeAction(0, 0, source,'keydown',event.keyCode);
         return false;
     },false);

    window.addEventListener('keyup',
 function (event) {
    marshalModeAction(0, 0, source,'keyup',event.keyCode);
     return false;
 },false);   

 return source;
}

window.addEventListener('load', function () 
{
    main = addModeListeners(document.getElementById('circleOfFifths'));
    keyboard = addModeListeners(document.getElementById('keyboard-canvas'));

    availableRenderers['circle_of_fifths']= drawCircleOfFifths;
    availableRenderers['keyboard']= drawKeyboard;

    redraw();
});

/**
 * Downloads image from canvas
 * @returns {} 
 */
function downloadImage() {
    if(document.querySelector("#keyboard").style.display != 'none')
    {
        keyboard.toBlob(function(blob) {
            saveAs(blob, "KEYS_"+Date.now()+".png");
        }, "image/png");
        return;
    }

    main.toBlob(function(blob) {
        saveAs(blob, "COF_"+Date.now()+".png");
    }, "image/png");
}

//*****//
//MODE SELECTION - RELATED
//*****//

//

var activeModeName = 'mode-basetone';
var activeChordHighlight = ChordHighlightType.Sector;
var activeChordHighlightId = 'chordmode-sector';

var availableModeFunctions = {

    'circleOfFifths': {
        'mode-basetone': setTonic,
        'mode-alttone': setAltTonic,
        'mode-chords': toggleSectorHighlight,
        'mode-arrows': createArrowsHandler,
        'mode-labels': createLabelsHandler,
        'mode-fill': setTonic,
        'mode-highlight': setTonic,
        'mode-keyboard' : function (x, y, canvas,evtype) {}
    },

    'keyboard-canvas': {
        'mode-basetone': function (x, y, canvas,evtype) {},
        'mode-alttone': function (x, y, canvas,evtype) {},
        'mode-chords': function (x, y, canvas,evtype) {},
        'mode-arrows': function (x, y, canvas,evtype) {},
        'mode-labels': function (x, y, canvas,evtype) {},
        'mode-fill': function (x, y, canvas,evtype) {},
        'mode-highlight': function (x, y, canvas,evtype) {},
        'mode-keyboard' : function (x, y, canvas,evtype) {}
    },
};

var availableRenderers ={
    //initialized onload
};

var avaliableContainerIds = ['circle_of_fifths'];
var activeCanvasName = avaliableContainerIds[0];


var availableChordHighlights = {
    'chordmode-sector': ChordHighlightType.Sector,
    'chordmode-fog': ChordHighlightType.Fog,
    'chordmode-circle': ChordHighlightType.Circle,
    'chordmode-circle-double': ChordHighlightType.DoubleCircle,
};

function showCanvasAccordingToMode(mode){

    if(mode == null)
        mode = avaliableContainerIds[0];

    for(var i=0;i!=avaliableContainerIds.length;++i)
    {
        setCanvasVisibility(avaliableContainerIds[i], avaliableContainerIds[i] == mode);          

        if(avaliableContainerIds[i]== mode) 
            activeCanvasName = avaliableContainerIds[i];    //todo: multiple active containers
    }
}

function setCanvasVisibility(containerId,isVisible){

    document.querySelector('#'+containerId).style.display= isVisible ? 'flex' : 'none';

    var canvasId = document.querySelector('#'+containerId+' > canvas');
    var dependent = document.querySelectorAll('.canvas-dependent-'+canvasId.id);

    for(let item of dependent)
        item.style.display = isVisible ? 'inline-block' : 'none';

}

function _restrictToOneCheckbox(needle, source, iterator) {

    if (!source.checked)
        return;

    //Deselect other checkboxes

    var checkboxes = document.getElementsByTagName('input');

    for (var i = 0; i != checkboxes.length; ++i) {
        
        if (checkboxes[i].id.indexOf(needle) == -1)
            continue;

        if (checkboxes[i].id != source.id)
            checkboxes[i].checked = false;

        iterator(checkboxes[i]);
    }
}

function changemode(source) {

    _restrictToOneCheckbox("mode",source,function(cb) {
        
        // Display controls for selected mode
        
        var dependentBlock = document.getElementById(cb.id+"-controls");

        if (dependentBlock != null) {
            dependentBlock.style.display=cb.checked?"block":"none";

            if (cb.checked) {
                window.setTimeout(function() {
                        restoreModeBlockState(cb.id);
                        return false;
                    },100); //hack
            }
                
        }

        activeModeName = source.id;
    });
}

function restoreModeBlockState(id) {
    document.getElementById(activeTonalHighlightId).checked = true;
    document.getElementById(activeChordHighlightId).checked = true;
}

function setChordmode(source) {
    _restrictToOneCheckbox("chordmode",source,function(cb) {
        
        // Set chord mode
        if (cb.checked) {
            activeChordHighlight = availableChordHighlights[cb.id];
            activeChordHighlightId = cb.id;
        }
    });
}

/////////////////////////////////////////////////////////////////

function setTonic(x, y, canvas,evtype) {

    if (evtype != 'mousedown')
        return;

    var clickpos = getSectorNumberAndRadiusFromPixelPosition(x,y,canvas.clientWidth, canvas.clientHeight);

    circleParameters.selectedTonic = clickpos.sector;
    circleParameters.tonicShown = true;
    circleParameters.isTonicMinor = clickpos.radius < circleParameters.outerRadiusPercents - circleParameters.majorCircleThicknessPercents;

    document.getElementById("tonic-enabled").checked = true;

    redraw();
}

function setAltTonic(x, y, canvas,evtype) {

    if (evtype != 'mousedown')
        return;

    var clickpos = getSectorNumberAndRadiusFromPixelPosition(x,y,canvas.clientWidth, canvas.clientHeight);
    
    circleParameters.altTonic = clickpos.sector;
    circleParameters.altTonicShown = true;
    circleParameters.isAltTonicMinor = clickpos.radius < circleParameters.outerRadiusPercents - circleParameters.majorCircleThicknessPercents;

    document.getElementById("alt-enabled").checked = true;

    redraw();
}






function toggleSectorHighlight(x, y, cavnas,evtype) {

    if (evtype != 'mousedown')
        return;

    var xc = cavnas.clientWidth / 2;
    var yc = cavnas.clientHeight / 2;

    var highlightColor = document.getElementById("chord-color").value;

    x -= xc;
    y -= yc;

    var rmax = Math.min(xc, yc) - circleParameters.marginPx;
    var r = Math.sqrt(x * x + y * y) / rmax;

    var angle = Math.atan2(y, x);

    //Guess what sector was clicked

    var hit = chordDefinitions.find(chrd => {

        var bounds = getChordBoundsFromDefinition(chrd);
        var diff = bounds.angle - angle;

        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        diff -= circleParameters.sectorRadians / 2;

        return diff < 0 &&
            diff > -circleParameters.sectorRadians &&
            r > bounds.offmin &&
            r < bounds.offmax;
    });

    //Cycle highlihgt types

    if (hit != null) {
        hit.highlight = hit.highlight == activeChordHighlight ? null : activeChordHighlight;
        hit.highlightColor = highlightColor;
    }
    
    redraw();
}

    /////////////////////////////////////////////////////////////////

 /**
 * Draws all items (circle of fifths & arrows)
 * @returns {} 
 */


function drawCircleOfFifths(){
    setCanvasWidthFromUi();

    //Get parameters from UI
    circleParameters.marginPx = document.getElementById("fill-margin").value;
    circleParameters.tonicColor = document.getElementById("tonic-color").value;
    circleParameters.altColor = document.getElementById("alt-color").value;
    circleParameters.tonicDegreeEnabled = document.getElementById("tonic-degree-enabled").checked;
    circleParameters.tonicShown = document.getElementById("tonic-enabled").checked;
    circleParameters.altTonicShown = document.getElementById("alt-enabled").checked;
    circleParameters.renderMode = document.querySelector("#ui-bold").checked ? UiRenderingModeMode.Bold : UiRenderingModeMode.ClassicThin;

    //Draw cicrcle
    fillBackground(main.ctx, main.clientWidth, main.clientHeight);
    drawCo5(main.ctx, main.clientWidth, main.clientHeight);
    drawArrows(main.ctx, main.clientWidth, main.clientHeight);
    drawLabels(main.ctx, main.clientWidth, main.clientHeight);
}

function setCanvasWidthFromUi()
{
    var co5widthToHeightRatio = 1;

    if(document.querySelector("#settings-width").value.length < 1)
    {
        if(localStorage["co5width"])
            document.querySelector("#settings-width").value =localStorage["co5width"];
        else
            document.querySelector("#settings-width").value = circleParameters.originalWidth;
    }

    var width = parseInt(document.querySelector("#settings-width").value);

    if(isNaN(width))
        width = 200;
    if(width < 200)
        width = 200;
    if(width > 1000)
        width = 1000;

    localStorage["co5width"] =width

    document.querySelector("#settings-width").value = width;

    document.querySelector("#circleOfFifths").width = width;
    document.querySelector("#circleOfFifths").height = width * co5widthToHeightRatio;
}



function fillBackground(ctx,w,h) {

    ctx.clearRect(0, 0, w, h);

    var col = document.querySelector("#fill-bgcolor").value;

    if (document.querySelector("#fill-whiten").checked) {

        col = col.replace("#","");

        var r = parseInt(col.substr(0, 2),16);
        var g = parseInt(col.substr(2, 2),16);
        var b = parseInt(col.substr(4, 2),16);
        var k = 0.9;

        r = Math.round(255 * k + (1 - k) * r);
        g = Math.round(255 * k + (1 - k) * g);
        b = Math.round(255 * k + (1 - k) * b);

        col = "rgb(" + r.toString() + "," + g.toString() + "," + b.toString() + ")";
    }
        
    ctx.fillStyle = col;

    if (!document.querySelector("#fill-circlefill").checked)
        ctx.fillRect(0, 0, w, h);
    else {
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, Math.min(w / 2, h / 2), 0, Math.PI * 2);
        ctx.fill();
    }

}

function lerp(t, c1, c2) {
    if (t < 0) t = 0;
    if (t > 1) t = 1;

    return c1*t + c2*(1-t);
}


/**
 * Parse color selector as rgb value
 * @param {string} text 
 * @returns {color}
 */

function text2rgb(text)
{
    text = text.replace("#","");

    return { 
        r:parseInt(text.substr(0, 2),16),
        g:parseInt(text.substr(2, 2),16),
        b:parseInt(text.substr(4, 2),16)
    };
}

function lerpcolor(t, c1, c2) {
    
    if (t < 0) t = 0;
    if (t > 1) t = 1;

    var mixR = Math.round(c1.r * t + c2.r * (1 - t));
    var mixG = Math.round(c1.g * t + c2.g * (1 - t));
    var mixB = Math.round(c1.b * t + c2.b * (1 - t));

    return {
        r: mixR,
        g: mixG,
        b: mixB
    };
}

function smoothstep(k, power) {
    for(var i=0;i<power;++i)
        k = k * k * (3 - 2 * k);

    return k;
}

function highlightChords() {

    if (highlightChordsTonal())
        return;
    
    for (let chord of chordDefinitions) {
        chord.active = circleParameters.tonicShown ? chord.inTonic(circleParameters.selectedTonic) : false;
    }

    if (circleParameters.altTonicShown) {
        for (let chord of chordDefinitions)
            chord.active|= chord.inTonic(circleParameters.altTonic);
    }
    

}

//
// Draws stylish circle of fifths
//

function drawCo5(ctx, witdh, height) {

    // Determine context center & radius

    var xc = witdh / 2;
    var yc = height / 2;

    var r = Math.min(xc, yc) - circleParameters.marginPx;

    var rstart = r * (circleParameters.outerRadiusPercents - circleParameters.majorCircleThicknessPercents - circleParameters.minorCircleThicknessPercents);

    //Select chords in tonic/alt
    highlightChords();

    //Draw chords with decoration (active/highlighted/...)

    for (let chord of chordDefinitions)
        drawChord(chord, ctx, xc, yc, r);
    
    //Draw outer & inner circles

    ctx.strokeStyle = circleParameters.inactiveColor();
    ctx.lineWidth = circleParameters.renderMode == UiRenderingModeMode.ClassicThin ? 1 : 4;
    ctx.beginPath();
    ctx.arc(xc, yc, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(xc, yc, r * (circleParameters.outerRadiusPercents- circleParameters.majorCircleThicknessPercents), 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(xc, yc, rstart, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 1;

    //Draw separators
    
    for (var i = 0; i != circleParameters.sectorCount; ++i) {        
        ctx.beginPath();
        var angle = circleParameters.sectorRadians * (i-0.5);

        ctx.moveTo(xc + rstart * Math.sin(angle), yc + rstart * Math.cos(angle));
        ctx.lineTo(xc + r * Math.sin(angle), yc + r * Math.cos(angle));

        ctx.stroke();
    }

    
    //Draw tonic selections

    var rmin = r *
        (circleParameters.outerRadiusPercents - circleParameters.majorCircleThicknessPercents - circleParameters.minorCircleThicknessPercents
        );
    //Alternative tonic
    if (circleParameters.altTonicShown) {

        var angles = _getTonicAngles(circleParameters.altTonic);

        ctx.strokeStyle = circleParameters.altColor;
        ctx.lineWidth = circleParameters.renderMode == UiRenderingModeMode.ClassicThin ? 3 : 7;
        ctx.beginPath();

        ctx.moveTo(xc + rmin * Math.cos(angles.amin), yc + rmin * Math.sin(angles.amin));
        ctx.lineTo(xc + r * Math.cos(angles.amin), yc + r * Math.sin(angles.amin));
        
        if(!circleParameters.isAltTonicMinor)
            ctx.arc(xc, yc, r, angles.amin, angles.amax);
        else
            ctx.moveTo(xc + r * Math.cos(angles.amax), yc + r * Math.sin(angles.amax));

        ctx.lineTo(xc + rmin * Math.cos(angles.amax), yc + rmin * Math.sin(angles.amax));

        if(circleParameters.isAltTonicMinor)
            ctx.arc(xc, yc, rmin, angles.amax, angles.amin,true);

        ctx.stroke();
    }
    //Main tonic
    if (circleParameters.tonicShown) {

        var angles = _getTonicAngles(circleParameters.selectedTonic);

        ctx.strokeStyle = circleParameters.tonicColor;
        ctx.lineWidth = circleParameters.renderMode == UiRenderingModeMode.ClassicThin ? 3 : 7;
        ctx.beginPath();

        ctx.moveTo(xc + rmin * Math.cos(angles.amin), yc + rmin * Math.sin(angles.amin));
        ctx.lineTo(xc + r * Math.cos(angles.amin), yc + r * Math.sin(angles.amin));
        
        if(!circleParameters.isTonicMinor)
            ctx.arc(xc, yc, r, angles.amin, angles.amax);
        else
            ctx.moveTo(xc + r * Math.cos(angles.amax), yc + r * Math.sin(angles.amax));

        ctx.lineTo(xc + rmin * Math.cos(angles.amax), yc + rmin * Math.sin(angles.amax));

        if(circleParameters.isTonicMinor)
            ctx.arc(xc, yc, rmin, angles.amax, angles.amin,true);

        ctx.stroke();
    }
}

function _getTonicAngles(ntonic) {
    var angle = circleParameters.sectorRadians * ntonic - Math.PI/2;
    return {
        amin: angle - circleParameters.sectorRadians*1.5,
        amax: angle + circleParameters.sectorRadians*1.5,
    };
}

function _getChordAlterationText(alt) {
    switch (alt) {
        case ChordAlterationType.Sharp:
            return "♯";
        case ChordAlterationType.Flat:
            return "♭";
        default:
            return "";
    }
}

function getSectorNumberAndRadiusFromPixelPosition(x,y, canvasWidth, canvasHeight){
    var xc = canvasWidth / 2;
    var yc = canvasHeight / 2;
    var rmax = Math.min(xc, yc) - circleParameters.marginPx;

    x -= xc;
    y -= yc;
    var r = Math.sqrt(x * x + y * y) / rmax;

    var angle = Math.atan2(y , x);
        
    return {
        sector:Math.round(angle / circleParameters.sectorRadians) + 3,
        radius: r
    }
}


/**
 * 
 * @param {Integer} co5Position Chord position on circle of fifths (0 - 11)
 * @param {Integer} radialSectorNumber Circular slice number (0 - outer circle for major chords, 1 - inner for minor, 2 - center for aux chord labels)
 */
function getChordBoundsFromChordPosition(co5Position, radialSectorNumber) {
    var angle2pi = (co5Position) * circleParameters.sectorRadians + Math.PI * 3 / 2;

    while (angle2pi > Math.PI * 2) {
        angle2pi -= Math.PI * 2;
    }

    var minperc = 0;
    var maxperc = 1;

    switch(radialSectorNumber)
    {
        case 0:
            //outer circle for major chords
            minperc = circleParameters.outerRadiusPercents - circleParameters.majorCircleThicknessPercents;
            maxperc = circleParameters.outerRadiusPercents;
            break;
        case 1:
            //inner slice for minor
            minperc = circleParameters.outerRadiusPercents - circleParameters.majorCircleThicknessPercents - circleParameters.minorCircleThicknessPercents;
            maxperc = circleParameters.outerRadiusPercents - circleParameters.majorCircleThicknessPercents;   
            break;
        case 2:
            //central slice for aux chords
            minperc = 0.1;
            maxperc = circleParameters.outerRadiusPercents - circleParameters.majorCircleThicknessPercents - circleParameters.minorCircleThicknessPercents;   
            break;
        default:
            break;
    }

    return {
        angle: angle2pi,
        startAngle: angle2pi - circleParameters.sectorRadians/2,
        endAngle: angle2pi + circleParameters.sectorRadians/2,
        offmax: maxperc,
        offmin: minperc,
    };
}

function getChordBoundsFromDefinition(chord) {

    return getChordBoundsFromChordPosition(chord.position, chord.minor ? 1:0);
}

/**
 * Draws a chord on QQ circle
 * @param {Object<>} chord structure, created with {@link #createChord(int, int) createChord}
 * @param {number} ctx - canvas context to draw at
 * @param {number} xc - QQ circle center X
 * @param {number} yc - QQ circle center Y
 * @param {number} r - QQ circle radius
 * @returns {} 
 */
function drawChord(chord,ctx,xc,yc,r) {

    var bounds = getChordBoundsFromDefinition(chord);

    //Label center

    var rmid = r * (bounds.offmax + bounds.offmin) / 2;

    var x = xc + rmid * Math.cos(bounds.angle);
    var y = yc + rmid * Math.sin(bounds.angle);

    var origAlpha = ctx.globalAlpha;

    //Draw background highlight

    if (chord.highlight == ChordHighlightType.Sector || chord.highlight == ChordHighlightType.Fog) {
        
        if (chord.highlight == ChordHighlightType.Fog) {
            // Create gradient
            
            var grd = ctx.createRadialGradient(x, y, 0, x, y, 50);
            grd.addColorStop(0, chord.highlightColor);
            grd.addColorStop(1, "rgba(255,255,255,0)");

	    ctx.globalAlpha = 0.65;
            ctx.fillStyle = grd;
        }
        else{
	    ctx.globalAlpha = 0.4;
            ctx.fillStyle = chord.highlightColor;
	}
        
        ctx.beginPath();

        ctx.arc(xc,
            yc,
            bounds.offmax * r,
            bounds.angle - circleParameters.sectorRadians / 2,
            bounds.angle + circleParameters.sectorRadians / 2);

        ctx.arc(xc,
            yc,
            bounds.offmin * r,
            bounds.angle + circleParameters.sectorRadians / 2,
            bounds.angle - circleParameters.sectorRadians / 2,true);

        ctx.fill();
        
    }

    if (chord.highlight == ChordHighlightType.Circle || chord.highlight == ChordHighlightType.DoubleCircle) {
        
        ctx.fillStyle = chord.highlightColor;
        ctx.strokeStyle = chord.highlightColor;
        ctx.lineWidth = 2;

        var circlerad = r * 0.1;
        var linecount = chord.highlight == ChordHighlightType.DoubleCircle ? 2 : 1;

        ctx.globalAlpha = 0.05;

        ctx.beginPath();

        ctx.arc(x,y, circlerad,0,Math.PI*2);

        ctx.fill();

        ctx.globalAlpha = 0.4;

        for (var i = 0; i != linecount; ++i) {

            var offset = i * 6;

            ctx.beginPath();
            ctx.arc(x,y, circlerad - offset,0,Math.PI*2);
            ctx.stroke();
        }        
    }

    if (chord.highlight == ChordHighlightType.UnderlineModeQuality) {

        var offset = 0.1;
        var span = 1 - offset*2;
        var midpoint = offset + span/2;
        var power = span / 2 * (1-Math.pow(chord.highlightPower,3));

        var rmin = bounds.offmin * r;
        var rmax = rmin + (bounds.offmax-bounds.offmin)*chord.highlightPower * r;


        // Create gradient

        var grd = ctx.createRadialGradient(xc, yc, rmin, xc, yc,rmax);

        grd.addColorStop(0, chord.highlightColor);
        grd.addColorStop(0.6, chord.highlightColor);
        grd.addColorStop(1, "rgba(255,255,255,0)");

        ctx.globalAlpha = 1;
        ctx.fillStyle = grd;

        ctx.beginPath();

        
        ctx.arc(xc,
            yc,
            rmax,
            bounds.angle - circleParameters.sectorRadians / 2,
            bounds.angle + circleParameters.sectorRadians / 2);

        ctx.arc(xc,
            yc,
            rmin,
            bounds.angle + circleParameters.sectorRadians / 2,
            bounds.angle - circleParameters.sectorRadians / 2,true);

        ctx.fill();
    }

    //Show chord degree (alt)
    if (circleParameters.tonicDegreeEnabled && circleParameters.tonicShown && 
        circleParameters.renderMode == UiRenderingModeMode.Bold &&
        chord.active && 
        chord.inTonic(circleParameters.selectedTonic)) {

        var degree = chord.getDegree(circleParameters.selectedTonic, circleParameters.isTonicMinor);

        ctx.save();

        //Create clipping path

        ctx.beginPath();

        ctx.arc(xc,
            yc,
            bounds.offmax * r,
            bounds.angle - circleParameters.sectorRadians / 2,
            bounds.angle + circleParameters.sectorRadians / 2);

        ctx.arc(xc,
            yc,
            bounds.offmin * r,
            bounds.angle + circleParameters.sectorRadians / 2,
            bounds.angle - circleParameters.sectorRadians / 2,true);

        ctx.clip();      

        ctx.globalAlpha = 0.2;
        ctx.fillStyle = circleParameters.tonicColor;

        ctx.beginPath();
        ctx.arc(
            xc + (r*bounds.offmax) * Math.cos(bounds.startAngle),
            yc + (r*bounds.offmax) * Math.sin(bounds.startAngle), 
            r*0.11  ,0,Math.PI*2);
        ctx.fill();

        ctx.globalAlpha = 1;

        ctx.font = "20px Arial";
        ctx.textAlign = "center";

        var angle = lerp(0.9,bounds.startAngle,bounds.endAngle);
        var rx = r * lerp(0.85,bounds.offmax,bounds.offmin);

        
        ctx.fillStyle = "white"
        ctx.fillText(degree, 
            xc + rx * Math.cos(angle), 
            yc + rx * Math.sin(angle)+9);
    
        ctx.restore();
    }


    //Show chord degree (standard mode)
    if (circleParameters.tonicDegreeEnabled && circleParameters.renderMode == UiRenderingModeMode.ClassicThin) {

        ctx.globalAlpha = 0.4;

        ctx.font = "20px Arial";

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(circleParameters.sectorRadians / 2.7);
        ctx.translate(xc - x, yc - y);
        ctx.rotate(-circleParameters.sectorRadians / 2.7);
        ctx.translate(-xc, -yc);

        ctx.textAlign = "center";

        if (circleParameters.tonicShown && chord.active) {
            var degree = chord.getDegree(circleParameters.selectedTonic, circleParameters.isTonicMinor);
            ctx.fillStyle = circleParameters.tonicColor;
            ctx.fillText(degree, x, y);
        }

        ctx.restore();
    }

    ctx.fillStyle = chord.active ? circleParameters.activeColor : circleParameters.inactiveColor();
    ctx.font = chord.getFont();

    //Highlight tonic chord

    if (circleParameters.tonicShown && chord.isTonicChord(circleParameters.selectedTonic, circleParameters.isTonicMinor))
        ctx.fillStyle = circleParameters.tonicColor;
    else if(circleParameters.altTonicShown && chord.isTonicChord(circleParameters.altTonic, circleParameters.isAltTonicMinor))
        ctx.fillStyle = circleParameters.altColor;
    
    ctx.globalAlpha = origAlpha;

    //Calculate actual chord text to draw

    var combinedText = chord.base + _getChordAlterationText(chord.baseMod);

    if (chord.minor)
        combinedText += "m";

    if (chord.hasAlternateName)
        combinedText += "  " + chord.altName + _getChordAlterationText(chord.altMod);

    var dim = ctx.measureText(combinedText);
    var lineHeight = ctx.measureText('M').width; //hack

    chord.actualPx = x;
    chord.actualPy = y;

    ctx.fillText(combinedText, x - dim.width / 2, y + lineHeight / 2);

    
    if (typeof chord.hint != 'undefined' && chord.hint.length > 0) {
        
        ctx.font = "bold 12px Arial";
        ctx.fillStyle = 'white'
        ctx.fillText(chord.hint, x - dim.width / 2-1, y + lineHeight*1.1-1);
        
        ctx.fillStyle = 'black';
        ctx.fillText(chord.hint, x - dim.width / 2, y + lineHeight*1.1);
    }


}
