var main = {}, temp = {};

/*
 Co5 chord definitions 
*/

var ChordHighlightType =  Object.freeze({
    None : 0,
    Sector: 1,
    Fog: 2,
});

var ChordAlterationType = Object.freeze({
    None: null,
    Sharp: 1,
    Flat: 2,
});

var circleParameters = {
    majorCicrcleThicknessPercents : 0.25,   
    minorCicrcleThicknessPercents  : 0.25,  

    inactiveColor : "lightgray",
    activeColor: "black",
    highlightColor: "orange",

    sectorCount: 12,
    sectorRadians: Math.PI * 2 / 12,

    selectedTonic: null,
    tonicColor: "red",
    selectedAlt: null
};

/**
 * Creates chord defition given its name / alternate name and position on circle of 5ths
 * 
 * @param {number} co5Position - chord index on circle of fifths, starting from 0 to 11, clockwise
 * @param {boolean} isMinor - whether chord is minor. Affects positioning
 * @param {string} basename - base chord name.
 * @param {boolean} baseModeration - is base chord sharp or flat (#/b)
 * @param {string} altname - alternate chord name. Optional
 * @param {boolean} altAlteration - is alternate chord sharp or flat (#/b)
 * 
 * @return {Object<>} Chord definition object
 */
function createChord(co5Position, isMinor, basename, baseModeration, altname, altAlteration) {
    return {
        minor: isMinor,
        position: co5Position,

        base: basename,
        baseMod: baseModeration,

        hasAlternateName: typeof altname !== 'undefined',
        altname: altname,
        altMod: typeof altname !== 'undefined' ? altAlteration : ChordAlterationType.None,

        active: false,
        highlight: ChordHighlightType.None,
        highlightColor: circleParameters.highlightColor,

        inTonic: function (tonic) {
            var tonic12 = (tonic + 6) % 12;
            var pos12 = (this.position+6) % 12;

            return Math.min(Math.abs(tonic12 - pos12), 12 - Math.abs(tonic12 - pos12)) < 2;
        }
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
  createChord(7, true, "B", ChordAlterationType.Sharp),
  createChord(8, true, "F", ChordAlterationType.None),
  createChord(9, true, "C", ChordAlterationType.None),
  createChord(10, true, "G", ChordAlterationType.None),
  createChord(11, true, "D", ChordAlterationType.None)
];


window.addEventListener('load', function () {
    main = document.getElementById('main');
    main.ctx = main.getContext('2d');
    temp = document.getElementById('temp');
    temp.ctx = temp.getContext('2d');

    main.addEventListener('mouseup',
        function (event) {
            if (pressTimer != null)
                toggleSectorHighlight(event.pageX - main.offsetLeft, event.pageY - main.offsetTop, main);

            clearTimeout(pressTimer);
            pressTimer = null;
        },
        false);

    main.addEventListener('mousedown',
    function (event) {
        pressTimer = window.setTimeout(function () {
            setTonic(event.pageX - main.offsetLeft, event.pageY - main.offsetTop, main);
            clearTimeout(pressTimer);
            pressTimer = null;
        }, 300);
        return false;
    },
    false);
    
    clear = document.getElementById("clear");
    redraw();
});

function redraw() {
    tonic();
    drawCo5(main.ctx, main.clientWidth, main.clientHeight);
}
function tonic() {

    var tonic = parseInt(document.getElementById("tonic").value),
    tonicColor = document.getElementById("tonic-color").value,
    tEnabled = document.getElementById("tonic-enabled").checked;


    var alt = parseInt(document.getElementById("alt").value),
    altColor = document.getElementById("alt-color").value,
    altEnabled = document.getElementById("alt-enabled").checked;

    if (altEnabled) {
        for (let chord of chordDefinitions)
            chord.active|= chord.inTonic(alt);
    }

    circleParameters.tonicColor = tonicColor;
    circleParameters.selectedTonic = tEnabled ? tonic : null;
    circleParameters.selectedAlt = altEnabled ? alt : null;
}

function setTonic(x, y, cavnas) {
    var xc = cavnas.clientWidth / 2;
    var yc = cavnas.clientHeight / 2;
    var angle = Math.atan2(y - yc, x - xc);

    var tonic = Math.round(angle / circleParameters.sectorRadians) + 3;
    document.getElementById("tonic").value = tonic;
    redraw();
}

function toggleSectorHighlight(x, y, cavnas, ctrl) {

    var xc = cavnas.clientWidth / 2;
    var yc = cavnas.clientHeight / 2;

    x -= xc;
    y -= yc;

    var rmax = Math.min(xc, yc);
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

        hit.highlight = ++hit.highlight % 3;
    }
    
    redraw();
}

//
// Draws stylish circle of fifths
//

function drawCo5(ctx, witdh, height) {

    // Determine context center & radius

    var xc = witdh / 2;
    var yc = height / 2;

    var r = Math.min(xc, yc);

    var rstart = r * (1 - circleParameters.majorCicrcleThicknessPercents - circleParameters.minorCicrcleThicknessPercents);

    ctx.clearRect(0, 0, witdh, height);

    //Select chords in tonic/alt

    if (circleParameters.selectedTonic!=null) {
        for (let chord of chordDefinitions)
            chord.active = chord.inTonic(circleParameters.selectedTonic);
    }

    if (circleParameters.selectedAlt!=null) {
        for (let chord of chordDefinitions)
            chord.active|= chord.inTonic(circleParameters.selectedAlt);
    }

    //Draw outer & inner circles

    ctx.strokeStyle = circleParameters.inactiveColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(xc, yc, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(xc, yc, r * (1- circleParameters.majorCicrcleThicknessPercents), 0, Math.PI * 2);
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

    //Draw tonic selection

    var rmin = r *
    (1 - circleParameters.majorCicrcleThicknessPercents - circleParameters.minorCicrcleThicknessPercents
    );

    if (circleParameters.selectedTonic != null) {

        var angles = _getTonicAngles(circleParameters.selectedTonic);

        ctx.strokeStyle = circleParameters.tonicColor;
        ctx.lineWidth = 3;
        ctx.beginPath();

        ctx.moveTo(xc + rmin * Math.cos(angles.amin), yc + rmin * Math.sin(angles.amin));
        ctx.lineTo(xc + r * Math.cos(angles.amin), yc + r * Math.sin(angles.amin));
        ctx.arc(xc, yc, r, angles.amin, angles.amax);
        ctx.lineTo(xc + rmin * Math.cos(angles.amax), yc + rmin * Math.sin(angles.amax));
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
        offmax: chord.minor ? 1 - circleParameters.majorCicrcleThicknessPercents : 1,
        offmin: chord.minor ? 1 - circleParameters.majorCicrcleThicknessPercents - circleParameters.minorCicrcleThicknessPercents : 1 - circleParameters.majorCicrcleThicknessPercents,
    };
}

function drawChord(chord,ctx,xc,yc,r) {

    var bounds = getChordBoundsFromDefinition(chord);

    //Label center

    var rmid = r * (bounds.offmax + bounds.offmin) / 2;

    var x = xc + rmid * Math.cos(bounds.angle);
    var y = yc + rmid * Math.sin(bounds.angle);

    //Draw background highlight

    if (chord.highlight == ChordHighlightType.Sector || chord.highlight == ChordHighlightType.Fog) {

        var a = ctx.globalAlpha;
        ctx.globalAlpha = 0.4;

        if (chord.highlight == ChordHighlightType.Fog) {
            // Create gradient
            var grd = ctx.createRadialGradient(x, y, 0, x, y, 50);
            grd.addColorStop(0, chord.highlightColor);
            grd.addColorStop(1, "rgba(255,255,255,0)");

            ctx.fillStyle = grd;

        }
        else
            ctx.fillStyle = chord.highlightColor;

        
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
        ctx.globalAlpha = a;
    }
        
    ctx.font = chord.minor ? "20px Arial" : "30px Arial";
    ctx.fillStyle = chord.active ? circleParameters.activeColor : circleParameters.inactiveColor;


    //Calculate actual chord text to draw

    var combinedText = chord.base + _getChordAlterationText(chord.baseMod);

    if (chord.minor)
        combinedText += "m";

    if (chord.hasAlternateName)
        combinedText += "  " + chord.altname + _getChordAlterationText(chord.altMod);

    var dim = ctx.measureText(combinedText);
    var lineHeight = ctx.measureText('M').width; //hack

    ctx.fillText(combinedText, x - dim.width / 2, y + lineHeight / 2);

}