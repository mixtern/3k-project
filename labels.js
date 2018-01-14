function createLabel(xstart, ystart, ctx) {
    return {
        header: document.querySelector("#label-text").value,
        color: document.querySelector("#label-color").value,
        size: document.querySelector("#label-size").value,
        x: xstart,
        y: ystart,
    }
}

var activeLabels = [];

var _movingLabel = false;
/***/
function createLabelsHandler(px, py, canvas, evtype, keyCode) {
    switch (evtype) {
        case 'mousedown':

            if (document.querySelector("#label-text").value.length < 1)
            {
                document.querySelector("#label-text-validation").style.display = 'block';               
                redraw();
                return;
            }

            document.querySelector("#label-text-validation").style.display = 'none';

            activeLabels.push(createLabel(px, py,canvas));
            redraw();

            _movingLabel = true;

            break;
            
        case 'mousemove':

            if(_movingLabel)
                moveLastLabel(px, py, canvas);

            break;
        case 'mouseup':
        case 'mouseleave':

            _movingLabel = false;

            break;

        default:
            break;  
    }
}

function moveLastLabel(x, y, canvas) {
    if (activeLabels.length < 1)
        return;

    activeLabels[activeLabels.length - 1].x = x;
    activeLabels[activeLabels.length - 1].y = y;

    redraw();

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

        ctx.font = label.size + "px Arial";

        var dim = {
            x: ctx.measureText(label.header).width,
            y: ctx.measureText("M").width
        }
        
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'white';

        var strokeSize = 4;

        for (var offx = -strokeSize; offx < strokeSize; ++offx)
            for (var offy = -strokeSize; offy < strokeSize; ++offy)
        ctx.fillText(label.header, label.x - dim.x / 2 + offx, label.y + dim.y / 2 + offy);

        ctx.globalAlpha = 1;
        ctx.fillStyle = label.color;
        ctx.fillText(label.header, label.x - dim.x/2, label.y+dim.y/2);
    }
}