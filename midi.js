/*

Midi Device functionality

*/


var midiSettings ={
    active : false,
    notes : {},
    chords :[],
    c4Code:60,
    animationSpeed: 1,

    animate:function(from, to, time, k){
        var delta = this.animationSpeed * k * (Date.now() - time)/1000.0;

        if(delta > 1)
            delta = 1;
            
        if(delta < 0)
            delta = 0;

        return from * (1 - delta) + to * delta;
    }
};

/**
 * Append HTML controls
 */

window.addEventListener('load', function () 
{
    var container = document.querySelector("#main-container > header");
    
    var element = document.createElement('template');

    element.innerHTML = "<div style='position: fixed; top: 0; left: 0;width:34px; padding:5px; background:#eee'><label class='switch'><input type='checkbox' id='midi-switch' onchange='hookMidi(this)'>"+
    "<img class='slider' src='img/midi.svg' style='width:40px;height:40px;padding:2px;'></span></label>"+
    "</div>";

    container.insertBefore(element.content.firstChild, document.querySelector("#circle_of_fifths"));

    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

    window.requestAnimationFrame = requestAnimationFrame;
});


function renderMidi(step)
{        
    renderCo5Chords();

    if(midiSettings.active)
        window.requestAnimationFrame(renderMidi);
}

function renderCo5Chords()
{   
    var path = [];

    if(midiSettings.chords.length ==0)       
        return;

    var xc = main.clientWidth / 2;
    var yc = main.clientHeight / 2;

    var r = Math.min(xc, yc) - circleParameters.marginPx;

    for (let chord of chordDefinitions)
    {
        chord.highlight = ChordHighlightType.None;

        for (let midiChord of midiSettings.chords)
        {
            if(co5PosToChromaticTonic(chord.position,chord.minor) == midiChord.tonic && chord.minor == midiChord.minor)
            {
                //Label center
            
                var bounds = getChordBoundsFromDefinition(chord);

                var rmid = r * (bounds.offmax + bounds.offmin) / 2;
            
                path.push({
                    time: midiChord.addedTime,
                    x : xc + rmid * Math.cos(bounds.angle),
                    y : yc + rmid * Math.sin(bounds.angle)
                });

                var hl = midiSettings.animate(1,0,midiChord.refreshedTime,1);
                
                if(hl == 0)
                    continue;

                var col = lerpcolor(hl,{r:255,g:125,b:10},{r:255,g:255,b:255});

                chord.highlight = ChordHighlightType.Sector;
                chord.highlightColor = 'rgb('+col.r+','+col.g+','+col.b+')';
            }
        }
    }

    redraw();

    path.sort(function(a, b) {
        return a.time - b.time;
      });      

    if(path.length >1)
    {
        var linespeed = 3;
        var chord = path[path.length - 1];
        var line = path.slice(-2);

        var w = midiSettings.animate(1,12,chord.time,linespeed);
        var t = midiSettings.animate(1,0.1,chord.time,linespeed);

        if(t < 0.101)
            return;

        line[0].x = lerp(t*t*t,line[0].x,line[1].x);
        line[0].y = lerp(t*t*t,line[0].y,line[1].y);

        main.ctx.globalAlpha = midiSettings.animate(1,0,chord.time,linespeed);
        main.ctx.strokeStyle = circleParameters.highlightColor;
        main.ctx.lineWidth = w;

        drawCurve(main.ctx,line,0.5);
    }


}

function co5PosToChromaticTonic(co5pos, isMinor){
    var result =  limitToOctave(-co5pos * 5);

    if(isMinor)
        result-=3;

    return limitToOctave(result);
}

function hookMidi(cb)
{
    midiSettings.active = cb.checked;

    if(!midiSettings.active)
        return;

    if (navigator.requestMIDIAccess) 
        navigator.requestMIDIAccess().then(success, failure);
    
    function success (midi) {
        window.requestAnimationFrame(renderMidi);
        var inputs = midi.inputs.values();

        for (var input = inputs.next(); input && !input.done; input = inputs.next()) 
            input.value.onmidimessage = onMIDIMessage;        
    }
     
    function failure () {
        console.error('No access to your midi devices.')
    }
     
    function onMIDIMessage (message) {
        if (message.data[0] === 144 && message.data[2] > 0) 
            registerNote(message.data[1]);         
        if (message.data[0] === 128 || message.data[2] === 0)
            clearNote(message.data[1]);        
    }

}

function registerNote(code){
    midiSettings.notes[code] = Date.now();

    maybeRegisterChord(midiSettings.notes);
}

function clearNote(code){
    delete midiSettings.notes[code];
}

function maybeRegisterChord(notes){

    var notevalues = Object.keys(notes);

    var baseNote = Math.min.apply(null, notevalues);
    var major = false, minor = false;

    if(notevalues.length < 3)
        return;

    for(var i=0;i!=notevalues.length;++i)
    {
        var delta = limitToOctave(notevalues[i] - baseNote);

        if(delta == 4)
            major = true;
        if(delta == 3)
            minor = true;            
    }

    //Undeciphered
    if(major == minor)
        return;
    
    var lastchord = midiSettings.chords.length > 0 ? midiSettings.chords[midiSettings.chords.length-1] : createMidiChord(666 /*dummy*/,false);
    var newchord = createMidiChord(limitToOctave(baseNote - midiSettings.c4Code),minor);

    if(lastchord.tonic != newchord.tonic || lastchord.minor != newchord.minor)
        midiSettings.chords.push(newchord);
    else
        midiSettings.chords[midiSettings.chords.length-1].refreshedTime = Date.now();
}

function createMidiChord(chordTonic, isMinor){
    return{
        addedTime: Date.now(),
        refreshedTime : Date.now(),
        tonic : chordTonic,
        minor : isMinor
    }
}

function limitToOctave(note){
    while(note < 0)
        note+=12;

    note = note % 12;

    return note;
}
