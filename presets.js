const presetsStorageKey = "presets";

window.addEventListener('load', function () {
    restorePresetList();
});

var presets = new Object();

function createNewPreset(){
    var name = prompt('Введите название нового пресета');

    if(name == null)
        return;

    presets[name] = createStateSnapshot();
    presets[name].modeSelectorId = activeModeName;
    presets[name].containerId = activeCanvasName;
 
    savePresetList();
    restorePresetList();
}

function deletePreset(name){
    delete presets[name];

    savePresetList();
    restorePresetList();
}

function restorePreset(name){

    var stor = document.querySelector('#'+presets[name].modeSelectorId);
    stor.checked = true;

    changemode(stor);   

    showCanvasAccordingToMode(presets[name].containerId);

    //Simulate event fire to trigger dependent selectors

    if ("createEvent" in document) {
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent("change", false, true);
        stor.dispatchEvent(evt);
    }
    else
        stor.fireEvent("onchange");        
    
    restoreStateSnapshot(presets[name]);
    saveState();
    redraw();
}   

function savePresetList()
{
    localStorage.setItem(presetsStorageKey,JSON.stringify(presets));
}

function restorePresetList()
{    
    presets = JSON.parse(localStorage.getItem(presetsStorageKey));

    if(null == presets)
        presets = new Object();

    var parentElement = document.querySelector('#presets-list');

    parentElement.innerHTML = ""; //remove children

    for (const presetName in presets) {

        var wrapper = parentElement.appendChild(document.createElement('div'));
        wrapper.className  = 'preset-wrapper';

        var loadPresetButton = wrapper.appendChild(document.createElement('button'));
        loadPresetButton.className  = 'preset-button ';
        loadPresetButton.innerText = `[ ${presetName} ]`;
        loadPresetButton.onclick = n=>restorePreset(presetName);

        var deletePresetButton = wrapper.appendChild(document.createElement('button'));
        deletePresetButton.className  = 'preset-button button-delete';
        deletePresetButton.innerText = `x`;
        deletePresetButton.onclick = n=>deletePreset(presetName);
    }
}