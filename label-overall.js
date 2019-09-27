/*
Overall label around whole image
*/

var overallLabelSettngs = {
    show: false,
    size:60,
    padding: 6,
    padfixVertical: -4
};

const showOverallLabelId = 'show-overall-label-check';

/**
 * Create fretboard-related HTML controls
 */

window.addEventListener('load', function () {

    document.getElementById('overall-label-text').addEventListener('input',updateOverallLabelSettingsFromUI,false);
    document.getElementById('overall-label-placement').addEventListener('input',updateOverallLabelSettingsFromUI,false);
    document.getElementById('overall-label-size').addEventListener('input',updateOverallLabelSettingsFromUI,false);

    //add label renderer to mode-independent callback list
    modeIndependentRenderers.push(drawOverallLabel);

});

function updateOverallLabelSettingsFromUI(){

    overallLabelSettngs.text = document.getElementById('overall-label-text').value;
    overallLabelSettngs.placement = document.getElementById('overall-label-placement').value;
    overallLabelSettngs.size = document.getElementById('overall-label-size').value;
    overallLabelSettngs.show = overallLabelSettngs.text.length > 0;

    redraw();
}

function drawOverallLabel(ctx, w, h) {

    if(!overallLabelSettngs.show)
        return;

    ctx.font = overallLabelSettngs.size + "px Arial";

    var dim = {
        x: ctx.measureText(overallLabelSettngs.text).width,
        y: ctx.measureText("M").width
    }

    var location ={
        x1: w/2 - dim.x/2 - overallLabelSettngs.padding,
        x2: w/2 + dim.x/2 + overallLabelSettngs.padding,
        y1: overallLabelSettngs.placement == 'top'? 0 : h - dim.y - overallLabelSettngs.padding*2,
        y2: overallLabelSettngs.placement == 'top'? dim.y + overallLabelSettngs.padding*2 : h,
    }
    
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = 'black';
    ctx.fillRect(location.x1,
         location.y1,
         location.x2 - location.x1,
         location.y2 - location.y1);

    ctx.globalAlpha = 1;
    ctx.fillStyle = "white"
    ctx.fillText(overallLabelSettngs.text,location.x1+overallLabelSettngs.padding,location.y2-overallLabelSettngs.padding + overallLabelSettngs.padfixVertical);

}
