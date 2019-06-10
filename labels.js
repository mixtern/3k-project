function createLabel(xstart, ystart, ctx) {
   
    var colFill = null;
    var tpFilltype = ChordHighlightType.None;

    //If circle-of-fifths-specific 'sector highlight' checkbox is ticked

    if(document.querySelector("#label-background-highlight").checked)
    {
        colFill = document.querySelector("#chord-color").value; //set in 'chord highlight' section
        tpFilltype = ChordHighlightType.Sector;
    }
    
    return {
        header: document.querySelector("#label-text").value,
        color: document.querySelector("#label-color").value,
        size: document.querySelector("#label-size").value,
        fill : colFill,
        filltype : tpFilltype,
        x: xstart,
        y: ystart,
        angle: 0,
        _drawRotationHandle : null,
    }
}

var _rotationModeKeycode = 16;
var _arbitraryAngleKeycode = 17;

/**
 * Kinda state machine for switching betwee moving/rotating modes
 */
var LabelEditModes = Object.freeze({
    None: {
        mousemove: null,
        mousedown: function (x, y, canvas) {

            if (document.querySelector("#label-text").value.length < 1) {
                document.querySelector("#label-text-validation").style.display = 'block';
                redraw();
                return;
            }

            document.querySelector("#label-text-validation").style.display = 'none';

            labelMode = LabelEditModes.Moving;

            activeLabels.push(createLabel(x, y, canvas));

            redraw();
        },
        mouseup: null
    },
    Moving: {
        mousemove: function(x,y,canvas) {
            if (activeLabels.length < 1)
                labelMode = LabelEditModes.None;

            activeLabels[activeLabels.length - 1].x = x;
            activeLabels[activeLabels.length - 1].y = y;

            redraw();
        },
        keydown: function (code) {
            if (code == _rotationModeKeycode)
                labelMode = LabelEditModes.Rotating;
        },
        mousedown: function(x,y,c) {
            labelMode = LabelEditModes.None;
            redraw();
        },
        mouseup: null
    },
    Rotating: {
        snap45 : true,
        mousemove: function (x, y, canvas) {
            if (activeLabels.length < 1)
                labelMode = LabelEditModes.None;

            var dx = x - activeLabels[activeLabels.length - 1].x;
            var dy = y - activeLabels[activeLabels.length - 1].y;
            
            var angle = Math.atan2(dy, dx);

            if (this.snap45)
                angle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);

            activeLabels[activeLabels.length - 1].angle = angle

            activeLabels[activeLabels.length - 1]._drawRotationHandle = {x:x,y:y};

            redraw();
        },
        keydown: function (code) {
            if (code == _arbitraryAngleKeycode)
                this.snap45 = false;
        },
        keyup: function (code) {
            if (code == _arbitraryAngleKeycode)
                this.snap45 = true;
        },
        mousedown: function (x, y, c) {
            this.snap45 = true;
            labelMode = LabelEditModes.Moving;
            activeLabels[activeLabels.length - 1]._drawRotationHandle = null;
            redraw();
        },
        mouseup: null
    }
});


var activeLabels = [];

var labelMode = LabelEditModes.None;

/***/
function createLabelsHandler(px, py, canvas, evtype, keyCode) {
    switch (evtype) {
        case 'mousedown':

            if(labelMode.mousedown!=null)
                labelMode.mousedown(px, py, canvas, keyCode);
            
            break;
            
        case 'mousemove':

            if (labelMode.mousemove != null)
                labelMode.mousemove(px, py, canvas, keyCode);


            break;
        case 'mouseup':
        case 'mouseleave':
            
            if (labelMode.mouseup != null)
                labelMode.mouseup(px, py, canvas, keyCode);

            break;
        case 'keydown':

            if (typeof labelMode.keydown != 'undefined')
                labelMode.keydown(keyCode);

            break;

        case 'keyup':

            if (typeof labelMode.keyup != 'undefined')
                labelMode.keyup(keyCode);

            break;

        default:
            break;  
    }
}

function removeLastLabel() {
    activeLabels.splice(activeLabels.length - 1, 1);
    redraw();
}


function removeAllLabels() {
    activeLabels = [];
    redraw();
}

function normalizeAngle(a){

    while(a < -Math.PI)
        a+=Math.PI*2;

    while(a > Math.PI)
        a-=Math.PI*2;

    return a;
}


function getAngleDifference(a1,a2){
    
    return normalizeAngle(normalizeAngle(a1)-normalizeAngle(a2));
}

/**
 * Main label drawing function
 * @param {Object<>} ctx context
 * @param {number} width 
 * @param {number} height 
 * @returns {} 
 */
function drawLabels(ctx, width, height) {

    for (let label of activeLabels) {

        ctx.font = label.size + "px Arial";

        var dim = {
            x: ctx.measureText(label.header).width,
            y: ctx.measureText("M").width
        }

        if(label.filltype == ChordHighlightType.Sector){

            var sector = getSectorNumberAndRadiusFromPixelPosition(label.x,label.y,width,height);
            var bounds = getChordBoundsFromChordPosition(sector.sector,2);

            var xc = width/2;
            var yc = height/2;

            var r = Math.min(xc, yc) - circleParameters.marginPx;

            var sectorSpan = circleParameters.sectorRadians / 2;
    
            var maxDeltaAngle = 0;

            //Check all four bounding-box (AABB) corners for angle violations

            for(var ix = 0;ix!=2;++ix)
            {
                for(var iy =0;iy!=2;++iy)
                {
                    var probe = Math.atan2(
                        label.y - yc + (iy*2-1)*dim.y/2,
                        label.x - xc + (ix*2-1)*dim.x/2);

                    maxDeltaAngle = Math.max(maxDeltaAngle,
                        Math.abs(getAngleDifference(bounds.angle,probe)));
                }
            }

            //Limit sector expansion to 3 sectors

            var maxDeltaAngle = Math.min(maxDeltaAngle, circleParameters.sectorRadians*3/2);           
            
            sectorSpan = Math.max(sectorSpan,maxDeltaAngle);

            var amin = bounds.angle - sectorSpan;
            var amax = bounds.angle + sectorSpan;

            //Fill sector
        
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = label.fill;

            ctx.beginPath();

            ctx.arc(xc,yc,bounds.offmax * r,amin,amax);    
            ctx.arc(xc,yc,bounds.offmin * r,amax,amin,true);
    
            ctx.fill();
        }

        if (label._drawRotationHandle!=null) {
            ctx.globalAlpha = 1;
            ctx.strokeStyle = 'rgb(200,200,200)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(label.x, label.y);
            ctx.lineTo(label._drawRotationHandle.x, label._drawRotationHandle.y);
            ctx.stroke();

            ctx.fillStyle = 'rgb(200,200,200)';
            ctx.beginPath();
            ctx.arc(label._drawRotationHandle.x, label._drawRotationHandle.y, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(label.x, label.y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        


        ctx.save();
        ctx.translate(label.x, label.y);
        ctx.rotate(label.angle);
        ctx.translate(-dim.x / 2, dim.y / 2);

        //Only stroke if no fill is active
        if(label.filltype == ChordHighlightType.None)
        {
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = 'white';

            var strokeSize = 4;

            for (var offx = -strokeSize; offx < strokeSize; ++offx)
                for (var offy = -strokeSize; offy < strokeSize; ++offy)
            ctx.fillText(label.header, offx,  offy);
        }

        ctx.globalAlpha = 1;
        ctx.fillStyle = label.color;
        
       // ctx.fillText(label.header, label.x - dim.x / 2, label.y + dim.y / 2);
        ctx.fillText(label.header, 0, 0);
        ctx.restore();


    }
}