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
    Underline: 5,
});

var ChordAlterationType = Object.freeze({
    None: 0,
    Sharp: 1,
    Flat: 2
});

var ModeDefinitions = Object.freeze({
    None: {color: ''},
    Ionian : {color: 'green'},
    Dorian : {color: 'orange'},
    Phrygian : {color: '#239dff'},
    Lydian  : {color: 'orange'},
    Mixolydian : {color: '#239dff'},
    Aeolian  : {color: '#6c00ff'},
    Locrian   : {color: 'cyan'},
});



var circleParameters = {
    marginPx: 5,
    outerRadiusPercents : 1,
    majorCircleThicknessPercents : 0.25,
    minorCircleThicknessPercents  : 0.25,

    inactiveColor : "#aaaaaa",
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


window.addEventListener('load', function () 
{
    main = document.getElementById('main');
    main.ctx = main.getContext('2d');

   
    main.addEventListener('mousedown',
    function (event) {
        activeModeFunction(event.pageX - main.offsetLeft, event.pageY - main.offsetTop, main,'mousedown');
        return false;
    },false);

    main.addEventListener('mousemove',
    function (event) {
        activeModeFunction(event.pageX - main.offsetLeft, event.pageY - main.offsetTop, main,'mousemove');
        return false;
    },false);

    main.addEventListener('mouseup',
     function (event) {
         activeModeFunction(event.pageX - main.offsetLeft, event.pageY - main.offsetTop, main,'mouseup');
         return false;
     },false);

    main.addEventListener('mouseleave',
     function (event) {
         activeModeFunction(event.pageX - main.offsetLeft, event.pageY - main.offsetTop, main,'mouseleave');
         return false;
     },false);


    window.addEventListener('keydown',
     function (event) {
         activeModeFunction(0, 0, main,'keydown',event.keyCode);
         return false;
     },false);

    window.addEventListener('keyup',
 function (event) {
     activeModeFunction(0, 0, main,'keyup',event.keyCode);
     return false;
 },false);

    redraw();
});

/**
 * Downloads image from canvas
 * @returns {} 
 */
function downloadImage() {
    main.toBlob(function(blob) {
        saveAs(blob, "COF_"+Date.now()+".png");
    }, "image/png");
}

//*****//
//MODE SELECTION - RELATED
//*****//

//

var activeModeFunction = setTonic;
var activeChordHighlight = ChordHighlightType.Sector;
var activeChordHighlightId = 'chordmode-sector';

var availableModeFunctions = {
    'mode-basetone':setTonic,
    'mode-alttone':setAltTonic,
    'mode-chords':toggleSectorHighlight,
    'mode-arrows':createArrowsHandler,
    'mode-labels':createLabelsHandler,
    'mode-fill':setTonic,
    
};

var availableChordHighlights = {
    'chordmode-sector': ChordHighlightType.Sector,
    'chordmode-fog': ChordHighlightType.Fog,
    'chordmode-circle': ChordHighlightType.Circle,
    'chordmode-circle-double': ChordHighlightType.DoubleCircle,
};

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

        activeModeFunction = availableModeFunctions[source.id];
    });
}

function restoreModeBlockState(id) {
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

    var xc = canvas.clientWidth / 2;
    var yc = canvas.clientHeight / 2;
    var rmax = Math.min(xc, yc) - circleParameters.marginPx;

    x -= xc;
    y -= yc;
    var r = Math.sqrt(x * x + y * y) / rmax;

    var angle = Math.atan2(y , x),
        tonic = Math.round(angle / circleParameters.sectorRadians) + 3;

    circleParameters.selectedTonic = tonic;
    circleParameters.tonicShown = true;
    circleParameters.isTonicMinor = r < circleParameters.outerRadiusPercents - circleParameters.majorCircleThicknessPercents;

    document.getElementById("tonic-enabled").checked = true;

    redraw();
}

function setAltTonic(x, y, canvas,evtype) {

    if (evtype != 'mousedown')
        return;

    var xc = canvas.clientWidth / 2;
    var yc = canvas.clientHeight / 2;
    var rmax = Math.min(xc, yc) - circleParameters.marginPx;

    x -= xc;
    y -= yc;
    var r = Math.sqrt(x * x + y * y)  / rmax;
    var angle = Math.atan2(y, x),
        tonic = Math.round(angle / circleParameters.sectorRadians) + 3;

    circleParameters.altTonic = tonic;
    circleParameters.altTonicShown = true;
    circleParameters.isAltTonicMinor = r < circleParameters.outerRadiusPercents - circleParameters.majorCircleThicknessPercents;

    document.getElementById("alt-enabled").checked = true;

    redraw();
}

function highlightModes() {

    circleParameters.isTonicMinor = false;

    var tonic = chordDefinitions.find(_t => _t.isTonicChord(circleParameters.selectedTonic,
        circleParameters.isTonicMinor));

    //chord.isTonicChord(circleParameters.selectedTonic, circleParameters.isTonicMinor))

    for (let chord of chordDefinitions) {
        var relmode = chord.getRelativeMode(tonic);

        if (relmode == ModeDefinitions.None) {
            chord.highlight = ChordHighlightType.None;
            continue;
        }

        chord.highlight = ChordHighlightType.Underline;
        chord.highlightColor = relmode.color;
    }

    redraw();
}

function highlightHarmonicQuality() {

    var tonic = chordDefinitions.find(_t => _t.isTonicChord(circleParameters.selectedTonic,
        circleParameters.isTonicMinor));

    //chord.isTonicChord(circleParameters.selectedTonic, circleParameters.isTonicMinor))

    for (let chord of chordDefinitions) {
        var relmode = chord.getRelativePosition(tonic);

        chord.highlight = ChordHighlightType.Underline;

        if (relmode > -2 && relmode < 2) {
            chord.highlightColor = 'green';
        }
        else if(relmode == 2)
            chord.highlightColor = '#FF9900';
        else if(relmode > 2 && relmode < 5)
            chord.highlightColor = '#FFD600';
        else if (relmode == 6)
            chord.highlightColor = '#ffff0000';
        else if (relmode >= 5)
            chord.highlightColor = '#ffff0033';
        else if(relmode == -2)
            chord.highlightColor = '#0099FF';
        else if(relmode < -2 && relmode > -5)
            chord.highlightColor = '#3333CC';
        else if(relmode <= -5)
            chord.highlightColor = '#6c00ff33';
        
        }
    
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
function redraw() {

    //Get parameters from UI

    circleParameters.marginPx = document.getElementById("fill-margin").value;
    circleParameters.tonicColor = document.getElementById("tonic-color").value;
    circleParameters.altColor = document.getElementById("alt-color").value;
    circleParameters.tonicDegreeEnabled = document.getElementById("tonic-degree-enabled").checked;
    circleParameters.tonicShown = document.getElementById("tonic-enabled").checked;
    circleParameters.altTonicShown = document.getElementById("alt-enabled").checked;

    //Draw cicrcle
    fillBackground(main.ctx, main.clientWidth, main.clientHeight);
    drawCo5(main.ctx, main.clientWidth, main.clientHeight);
    drawArrows(main.ctx, main.clientWidth, main.clientHeight);
    drawLabels(main.ctx, main.clientWidth, main.clientHeight);
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

    for (let chord of chordDefinitions) {
        chord.active = circleParameters.tonicShown ? chord.inTonic(circleParameters.selectedTonic) : false;
    }

    if (circleParameters.altTonicShown) {
        for (let chord of chordDefinitions)
            chord.active|= chord.inTonic(circleParameters.altTonic);
    }

    //Draw outer & inner circles

    ctx.strokeStyle = circleParameters.inactiveColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(xc, yc, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(xc, yc, r * (circleParameters.outerRadiusPercents- circleParameters.majorCircleThicknessPercents), 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(xc, yc, rstart, 0, Math.PI * 2);
    ctx.stroke();

    //Draw separators
    
    for (var i = 0; i != circleParameters.sectorCount; ++i) {        
        ctx.beginPath();
        var angle = circleParameters.sectorRadians * (i-0.5);

        ctx.moveTo(xc + rstart * Math.sin(angle), yc + rstart * Math.cos(angle));
        ctx.lineTo(xc + r * Math.sin(angle), yc + r * Math.cos(angle));

        ctx.stroke();
    }

    //Draw chords with decoration (active/highlighted/...)

    for (let chord of chordDefinitions)
        drawChord(chord, ctx, xc, yc, r);

    //Draw tonic selections

    var rmin = r *
        (circleParameters.outerRadiusPercents - circleParameters.majorCircleThicknessPercents - circleParameters.minorCircleThicknessPercents
        );
    //Alternative tonic
    if (circleParameters.altTonicShown) {

        var angles = _getTonicAngles(circleParameters.altTonic);

        ctx.strokeStyle = circleParameters.altColor;
        ctx.lineWidth = 3;
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
        ctx.lineWidth = 3;
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

function getChordBoundsFromDefinition(chord) {

    var angle2pi = (chord.position) * circleParameters.sectorRadians + Math.PI * 3 / 2;

    while (angle2pi > Math.PI * 2) {
        angle2pi -= Math.PI * 2;
    }

    return {
        angle: angle2pi,
        offmax: chord.minor ? circleParameters.outerRadiusPercents - circleParameters.majorCircleThicknessPercents : circleParameters.outerRadiusPercents,
        offmin: chord.minor ? circleParameters.outerRadiusPercents - circleParameters.majorCircleThicknessPercents - circleParameters.minorCircleThicknessPercents : circleParameters.outerRadiusPercents - circleParameters.majorCircleThicknessPercents,
    };
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

    if (chord.highlight == ChordHighlightType.Underline) {
        
            // Create gradient
        var grd = ctx.createRadialGradient(xc, yc, bounds.offmin * r, xc, yc, bounds.offmax*r);
            grd.addColorStop(0, chord.highlightColor);
            grd.addColorStop(1, "rgba(255,255,255,0)");

            ctx.globalAlpha = 0.45;
            ctx.fillStyle = grd;

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

    //Show chord degree
    if (circleParameters.tonicDegreeEnabled) {

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

    ctx.font = chord.minor ? "20px Arial" : "30px Arial";
    ctx.fillStyle = chord.active ? circleParameters.activeColor : circleParameters.inactiveColor;

    //Highlight tonic chord

    if (circleParameters.tonicShown && chord.isTonicChord(circleParameters.selectedTonic, circleParameters.isTonicMinor)) {
        ctx.fillStyle = circleParameters.tonicColor;
        ctx.font = chord.minor ?"bold 20px Arial":"bold 30px Arial";
    } else if(circleParameters.altTonicShown && chord.isTonicChord(circleParameters.altTonic, circleParameters.isAltTonicMinor)) {
        ctx.fillStyle = circleParameters.altColor;
        ctx.font = chord.minor ?"bold 20px Arial":"bold 30px Arial";
    }

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

}
