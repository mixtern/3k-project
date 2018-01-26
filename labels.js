function createLabel(xstart, ystart, ctx) {
    return {
        header: document.querySelector("#label-text").value,
        color: document.querySelector("#label-color").value,
        size: document.querySelector("#label-size").value,
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
            
            var angle = Math.atan2(dy, dx);;

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


/**
 * Main label drawing function
 * @param {Object<>} ctx context
 * @param {number} width 
 * @param {number} height 
 * @returns {} 
 */
function drawLabels(ctx, width, height) {
    for (let label of activeLabels) {

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
        
        ctx.font = label.size + "px Arial";

        var dim = {
            x: ctx.measureText(label.header).width,
            y: ctx.measureText("M").width
        }
        

        ctx.save();
        ctx.translate(label.x, label.y);
        ctx.rotate(label.angle);
        ctx.translate(-dim.x / 2, dim.y / 2);

        ctx.globalAlpha = 0.15;
        ctx.fillStyle = 'white';

        var strokeSize = 4;

        for (var offx = -strokeSize; offx < strokeSize; ++offx)
            for (var offy = -strokeSize; offy < strokeSize; ++offy)
        ctx.fillText(label.header, offx,  offy);

        ctx.globalAlpha = 1;
        ctx.fillStyle = label.color;
        
       // ctx.fillText(label.header, label.x - dim.x / 2, label.y + dim.y / 2);
        ctx.fillText(label.header, 0, 0);
        ctx.restore();
    }
}