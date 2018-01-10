var main={},temp = {},clear=new Image();
window.addEventListener('load',function(){
    main = document.getElementById('main');
    main.ctx = main.getContext('2d');
    temp = document.getElementById('temp');
    temp.ctx = temp.getContext('2d');
    clear = document.getElementById("clear");
    clrscr();
    tonic()
});
function redraw(){
    clrscr();
    tonic();
}
function tonic(){
    var tonic = document.getElementById("tonic").value,
        tonicColor = document.getElementById("tonic-color").value,
        tEnabled =document.getElementById("tonic-enabled").checked;
    if (tEnabled) {
        var offset = tonic / 6 * Math.PI - 3 * Math.PI / 4;
        temp.ctx.clearRect(0, 0, 600, 600);
        temp.ctx.strokeStyle = tonicColor;
        temp.ctx.lineWidth = 9;
        temp.ctx.beginPath();
        temp.ctx.arc(300, 298, 102, offset, offset);
        temp.ctx.arc(300, 298, 291, offset, offset + Math.PI / 2);
        temp.ctx.arc(300, 298, 102, offset + Math.PI / 2, offset + Math.PI / 2);
        temp.ctx.stroke();
        main.ctx.drawImage(temp, 0, 0);
    }
    var alt = document.getElementById("alt").value,
        altColor = document.getElementById("alt-color").value,
        altEnabled = document.getElementById("alt-enabled").checked;
    if (altEnabled) {
        var offset = alt / 6 * Math.PI - 3 * Math.PI / 4;
        temp.ctx.clearRect(0, 0, 600, 600);
        temp.ctx.strokeStyle = altColor;
        temp.ctx.lineWidth = 7;
        temp.ctx.beginPath();
        temp.ctx.arc(300, 298, 102, offset, offset);
        temp.ctx.arc(300, 298, 291, offset, offset + Math.PI / 2);
        temp.ctx.arc(300, 298, 102, offset + Math.PI / 2, offset + Math.PI / 2);
        temp.ctx.stroke();
        main.ctx.drawImage(temp, 0, 0);
    }
}
function clrscr(){
    main.ctx.drawImage(clear,0,0);
}