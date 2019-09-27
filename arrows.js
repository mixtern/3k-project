window.addEventListener('load', function () 
{
    //add arrow renderer to mode-independent callback list
    modeIndependentRenderers.push(drawArrows);
});


function createArrow(arrowColor,arrowThickness,arrowOpacity,xstart,ystart) {
    return {
        header: '', //still WIP
        color: arrowColor,
        thickness: arrowThickness,
        opacity:arrowOpacity,
        stroke : false,
        points:[
            {x: xstart,y:ystart},
        ]
    }
}

var activeArrows = [];

var arrowSettings = {
    arrowColor: "#00AAFF",
    arrowThickness: 3,
    arrowSimplification: 500,
    arrowSnap: false,
    snapPoints : [],

    drawingArrow: null,
    alternateDrawingMode : false
};

/**
 * Builds arrow snappoints depending on active mode (chords in circle of 5ths or keys)
 */
function buildSnapPoints(){

    switch(activeCanvasName){
        case 'keyboard':
            arrowSettings.snapPoints=[];

            keys.forEach(key => {

                var keymidx = key.hitX1*0.5 + key.hitX2*0.5;
                var nVerticalSnapsPerKey = 5;
                
                // Create 5 evenly spaced snap points per each key

                for (let nstep = 0; nstep < nVerticalSnapsPerKey; nstep++) {

                    var t =  nstep / nVerticalSnapsPerKey;

                    // On white keys, snap only to the lower 40% of key

                    if(key.isWhite)
                        t = t*0.4  + 0.6;                     

                    arrowSettings.snapPoints.push({x:keymidx,y:key.hitY1 * (1-t) + key.hitY2*(t) });
                }
               
                
            });

            break;
        default:
            arrowSettings.snapPoints = chordDefinitions.map((ch) => {
                return {
                    x: ch.actualPx,
                    y: ch.actualPy};
            });
            break;
    }
}

/**
 * Main arrow drawing function
 * @param {Object<>} ctx context
 * @param {number} width 
 * @param {number} height 
 * @returns {} 
 */
function drawArrows(ctx, width, height) {
        
    //Draw saved arrow as curve

    for (let arrow of activeArrows) {
        
        if(arrow.stroke)
        {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = arrow.thickness*2;
            ctx.globalAlpha = 0.9;

            drawCurve(ctx, arrow.points, 0.5);
        }

        ctx.strokeStyle = arrow.color;
        ctx.lineWidth = arrow.thickness;
        ctx.globalAlpha = arrow.opacity;

        var curve = drawCurve(ctx, arrow.points, 0.5);

        if(arrow.header && arrow.header.length > 0)
        {
            ctx.fillStyle = arrow.color;

            var prevAngle = null;

            var symbolNum = 0;
            var startPoint = 0;

            var header = arrow.header;

            var textDim = ctx.measureText(header).width;

            //Find midpoint

            var totlen = getCurveLength(curve, 0, curve.length - 1);

            while (getCurveLength(curve, 0, startPoint)+textDim/2 < totlen / 2)
                startPoint++;

            //Check whenter text is RTL and flip it
            
            var endPoint = startPoint;
            var nRtl = 0;
            var nLtr = 0;

            while (endPoint < curve.length - 1 && getCurveLength(curve, startPoint, endPoint) < textDim) {

                if (curve[endPoint].x < curve[endPoint + 1].x)
                    nLtr++;
                else
                    nRtl++;

                ++endPoint;
            }

            //TODO: more specific LTR check
            if (nRtl > nLtr)
                header = header.split("").reverse().join("");
            
            while (symbolNum < header.length) {

                var nextPoint = startPoint;

                var step = symbolNum==0? 0 : ctx.measureText(header[symbolNum-1]).width;

                while (nextPoint < curve.length - 1 && getCurveLength(curve,startPoint,nextPoint) < step) {
                    ++nextPoint;
                }

                if (startPoint == nextPoint && startPoint < curve.length-1)
                    nextPoint++;

                var angle = Math.atan2(curve[startPoint].y - curve[nextPoint].y, curve[startPoint].x - curve[nextPoint].x);

                while (angle > Math.PI / 2)
                    angle -= Math.PI;

                while (angle < -Math.PI / 2)
                    angle += Math.PI;

                if (null == prevAngle)
                    prevAngle = angle;

                while (prevAngle - angle > Math.PI / 2)
                    angle += Math.PI;

                while (prevAngle - angle < -Math.PI / 2)
                    angle -= Math.PI;

                prevAngle = angle;
                startPoint = nextPoint;

                drawSymbolRotated(ctx, curve[startPoint].x, curve[startPoint].y, angle, header.charAt(symbolNum));

                symbolNum++;
            }

        }

    }

    //Draw currently created arrow as linelist, if any

    if (arrowSettings.drawingArrow != null) {

        if (arrowSettings.alternateDrawingMode) {
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = arrowSettings.drawingArrow.color;            

            for (let pt of arrowSettings.drawingArrow.points)
            {
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.beginPath();

        ctx.globalAlpha = arrowSettings.drawingArrow.opacity;
        ctx.strokeStyle = arrowSettings.drawingArrow.color;
        ctx.lineWidth = arrowSettings.drawingArrow.thickness;

        drawLines(ctx, arrowSettings.drawingArrow.points);
        ctx.stroke();
    }

    ctx.globalAlpha = 1;
}

function removeLastArrow() {
    activeArrows.splice(activeArrows.length - 1, 1);
    redraw();
}


function removeAllArrows() {
    activeArrows = [];
    redraw();
}


/**
 * Called from main.js on mouse move/up/down
 * @param {} px cursor x
 * @param {} py cursor y
 * @param {} cavnas 
 * @param {string} evtype event type : 'mousedown'/'mousemove'/'mouseup'
 * @returns {} 
 */
function createArrowsHandler(px, py, cavnas, evtype,keyCode) {
    switch (evtype) {
        case 'mousedown':

            if (arrowSettings.alternateDrawingMode){
                if (arrowSettings.drawingArrow == null)
                    startArrow(px,py);
                else{
                    arrowSettings.drawingArrow.points.push({ x: px, y: py });
                    redraw();
                }
            }
            else {
                startArrow(px,py);
            }

            break;
        case 'mousemove':
            if (arrowSettings.drawingArrow != null && !arrowSettings.alternateDrawingMode) {

                arrowSettings.drawingArrow.points.push({ x: px, y: py });

                redraw();
            }
            break;
        case 'mouseup':

            if (arrowSettings.drawingArrow != null && !arrowSettings.alternateDrawingMode) {
                finishArrow();
            }

            break;

        case 'mouseleave':

            if (arrowSettings.drawingArrow != null) {
                finishArrow();
                arrowSettings.alternateDrawingMode = false;
            }

            break;

        case 'keydown':

            //Ctrl
            if (keyCode == 17) 
                arrowSettings.alternateDrawingMode = true;            

            break;

        case 'keyup':

            //Ctrl
            if (keyCode == 17 && arrowSettings.alternateDrawingMode) {
                if(arrowSettings.drawingArrow != null)
                    finishArrow(true);

                arrowSettings.alternateDrawingMode = false;
            }

            break;

        default:
    }
}

function startArrow(px,py)
{
    arrowSettings.arrowColor = document.querySelector("#arrow-color").value;
    arrowSettings.arrowThickness = document.querySelector("#arrow-thickness").value;
    arrowSettings.arrowOpacity = 1.0 - document.querySelector("#arrow-transparency").value / 100.0;
    arrowSettings.arrowSimplification = document.querySelector("#arrow-simplification").value;
    arrowSettings.arrowSnap = document.querySelector("#arrow-snap").checked;

    arrowSettings.drawingArrow = createArrow(arrowSettings.arrowColor, arrowSettings.arrowThickness, arrowSettings.arrowOpacity, px, py);   

    redraw();
}

function finishArrow(minimalistic)
{
    if(activeCanvasName == 'keyboard')
        arrowSettings.drawingArrow.stroke = true;

    activeArrows.push(cleanupArrow(arrowSettings.drawingArrow, minimalistic));
    arrowSettings.drawingArrow = null;
    redraw();
}

/**
 * Takes point list and reduces its count using Ramer-Douglas-Peucker algo
 * @param {Object} arrow 
 * @param {Boolean} minimalistic
 * @returns {Object}
 */
function cleanupArrow(arrow, minimalistic) {

    buildSnapPoints();

    if (arrowSettings.arrowSnap && !minimalistic) {

        var start = arrow.points[0];
        var end = arrow.points[arrow.points.length-1];

        var snappoints = arrowSettings.snapPoints.map((snap) => {
            return {
                x: snap.x,
                y: snap.y,
                ds:(snap.x - start.x) * (snap.x - start.x) +
                    (snap.y - start.y) * (snap.y - start.y),
                de: (snap.x - end.x) * (snap.x - end.x) +
                    (snap.y - end.y) * (snap.y - end.y)};
        });

        var startsnap = snappoints.sort(function(d1, d2) {
            return d1.ds - d2.ds;
        })[0];

        var endsnap = snappoints.sort(function (d1, d2) {
            return d1.de - d2.de;
        })[0];

        //Step off center to give chord name some space

        var gracedistance = 20;
        var filterdistance = gracedistance*1.5;

        arrow.points = arrow.points.filter(function(pt) {
            return getSqDist(pt, startsnap) > filterdistance * filterdistance &&
                getSqDist(pt, endsnap) > filterdistance * filterdistance;
        });


        if (arrow.points.length < 2)
            arrow.points = [startsnap, endsnap];

        var first = arrow.points[0];
        var last = arrow.points[arrow.points.length - 1];

        var lenstart = Math.sqrt(getSqDist(startsnap, first));
        var lenend = Math.sqrt(getSqDist(endsnap, last));

        var ns = {
            x: (startsnap.x - first.x) / lenstart,
            y: (startsnap.y - first.y) / lenstart,
        };
        var ne = {
            x: (endsnap.x - last.x) / lenend,
            y: (endsnap.y - last.y) / lenend,
        };

        startsnap.x -= ns.x * gracedistance;
        startsnap.y -= ns.y * gracedistance;

        endsnap.x -= ne.x * gracedistance;
        endsnap.y -= ne.y * gracedistance;

        //Replace start-end
        
        arrow.points[0] = { x: startsnap.x, y: startsnap.y };
        arrow.points[arrow.points.length - 1] = { x: endsnap.x, y: endsnap.y };
    }

    if (!minimalistic)
        arrow.points = simplifyDouglasPeucker(arrow.points, arrowSettings.arrowSimplification);

    return arrow;
}

/**
 * Calculate square distance from a point to a segment
 * @param {} p test point 
 * @param {} p1 segment start
 * @param {} p2 segment end
 * @returns {number} Squared distance from point p to segment p1-p2
 */
function getSqSegDist(p, p1, p2) {

    var x = p1.x,
        y = p1.y,
        dx = p2.x - x,
        dy = p2.y - y;

    if (dx !== 0 || dy !== 0) {

        var t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);

        if (t > 1) {
            x = p2.x;
            y = p2.y;

        } else if (t > 0) {
            x += dx * t;
            y += dy * t;
        }
    }

    dx = p.x - x;
    dy = p.y - y;

    return dx * dx + dy * dy;
}

function getSqDist(p1,p2) {
    return (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y);
}

function getCurveLength(curve, i1, i2) {
    var dist = 0;

    if (i1 == i2 || i1 >= curve.length || i2 >= curve.length || i1 < 0 || i2 < 0)
        return 0;

    if (i1 > i2) {
        var t = i1;
        i1 = i2;
        i2 = t;
    }
    
    for (var i = i1; i < i2-1; ++i)
        dist += Math.sqrt(getSqDist(curve[i], curve[i + 1]));

    return dist;
}

function simplifyDPStep(points, first, last, sqTolerance, simplified) {
    var maxSqDist = sqTolerance,
        index;

    for (var i = first + 1; i < last; i++) {
        var sqDist = getSqSegDist(points[i], points[first], points[last]);

        if (sqDist > maxSqDist) {
            index = i;
            maxSqDist = sqDist;
        }
    }

    if (maxSqDist > sqTolerance) {
        if (index - first > 1) simplifyDPStep(points, first, index, sqTolerance, simplified);
        simplified.push(points[index]);
        if (last - index > 1) simplifyDPStep(points, index, last, sqTolerance, simplified);
    }
}

// simplification using Ramer-Douglas-Peucker algorithm
function simplifyDouglasPeucker(points, sqTolerance) {
    var last = points.length - 1;

    var simplified = [points[0]];
    simplifyDPStep(points, 0, last, sqTolerance, simplified);
    simplified.push(points[last]);

    return simplified;
}

/**
 * Given control points list, creates intermediate points using cardinal splines
 * @param {} pts 
 * @param {} tension 
 * @returns {} 
 */
function getCurvePoints(pts, tension) {

    // use input value if provided, or use a default value	 
    tension = (typeof tension != 'undefined') ? tension : 0.5;
    numOfSegments = 32;

    var ptsCopy = [], result = [],	// clone array
        x, y,			// our x,y coords
        t1x, t2x, t1y, t2y,	// tension vectors
        c1, c2, c3, c4,		// cardinal points
        st, t, i;		// steps based on num. of segments

    // clone array so we don't change the original    
    ptsCopy = pts.slice(0);

    // The algorithm requires a previous and next point to the actual point array.
    // Duplicate first & last points
    ptsCopy.unshift(pts[0]);
    ptsCopy.push(pts[pts.length - 1]);
    
    for (i = 1; i < (ptsCopy.length - 2) ; i ++) {
        for (t = 0; t <= numOfSegments; t++) {

            // calc tension vectors
            t1x = (ptsCopy[i + 1].x - ptsCopy[i - 1].x) * tension;
            t2x = (ptsCopy[i + 2].x - ptsCopy[i].x) * tension;

            t1y = (ptsCopy[i + 1].y - ptsCopy[i - 1].y) * tension;
            t2y = (ptsCopy[i + 2].y- ptsCopy[i].y) * tension;

            // calc step
            st = t / numOfSegments;

            // calc cardinals
            c1 = 2 * Math.pow(st, 3) - 3 * Math.pow(st, 2) + 1;
            c2 = -(2 * Math.pow(st, 3)) + 3 * Math.pow(st, 2);
            c3 = Math.pow(st, 3) - 2 * Math.pow(st, 2) + st;
            c4 = Math.pow(st, 3) - Math.pow(st, 2);

            // calc x and y cords with common control vectors
            x = c1 * ptsCopy[i].x + c2 * ptsCopy[i + 1].x + c3 * t1x + c4 * t2x;
            y = c1 * ptsCopy[i].y + c2 * ptsCopy[i + 1].y + c3 * t1y + c4 * t2y;

            //store points in array
            result.push({x:x,y:y});
        }
    }

    return result;
}


function drawCurve(ctx, ptsa, tension) {

    var points = getCurvePoints(ptsa, tension);
    ctx.beginPath();

    ctx.lineCap = "round";

    //Draw curve body
    drawLines(ctx, points);

    //Draw arrow cap
    var headlen = 15;   // length of head in pixels
    var weldlen = 0; //aux offset to make arrow fin to end nicely

    var last = points[points.length - 1];
    var prev = points[points.length - 2];
    var angle = Math.atan2(last.y - prev.y, last.x - prev.x);

    for (var leg = 0; leg < 2; leg++) {

        var legAngle = leg == 0 ? -Math.PI / 6 : Math.PI / 6;

        var dx = Math.cos(angle + legAngle);
        var dy = Math.sin(angle + legAngle);

        ctx.moveTo(last.x + weldlen * dx, last.y + weldlen * dy);
        ctx.lineTo(last.x - headlen * dx, last.y - headlen * dy);

    }

    ctx.stroke();

    return points;
}

function drawLines(ctx, pts) {

    if (pts.length < 2)
        return;

    ctx.moveTo(pts[0].x, pts[0].y);

    for (i = 1; i < pts.length; i++)
        ctx.lineTo(pts[i].x, pts[i].y);
}

function drawSymbolRotated(ctx,x,y,angle,symbol)
{
    ctx.save();
    
    var meas = {
        x: ctx.measureText(symbol).width,
        y: ctx.measureText('M').width
    };

    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.translate(-meas.x / 2, -meas.y / 2);

    ctx.fillText(symbol, 0, 0);
    ctx.restore();
}