const context = new AudioContext();
const pianoEl = document.querySelector('.visual-piano');

let keyNotes = [];
//keyboard keys for every note
const keysMap = 'zsxdcvgbhnjm,l.;/q2w3e4rt6y7ui9o0p-[]'.split('');

//mapping of the black keys positions per octave
const blackKeysMap = new Set("1 3 6 8 10".split(" ").map(Number));

//for calculating each note's frequency - starts with C3 Note
let currFreq = 130.81;

keysMap.forEach((key, index) => {

    //add keys to the visual piano keyboard
    const newKeyButton = pianoEl.appendChild(document.createElement("button"));
   
    newKeyButton.setAttribute('data-keyval', key)
    newKeyButton.setAttribute('data-playing', 'false')
    newKeyButton.classList.add("piano-key")
    newKeyButton.style.setProperty('--val', `'` + key + `'`);
    
    //if the key is a black one
    if (blackKeysMap.has(index % 12)){
        newKeyButton.classList.add("piano-key_black")
    } else {
        newKeyButton.classList.add("piano-key_white")
    }

    newKeyButton.addEventListener('touchstart', e => play(key))
    newKeyButton.addEventListener('mousedown', e => play(key))
    newKeyButton.addEventListener('transitionstart', e => play(key))

    newKeyButton.addEventListener('touchend', e => stop(key))
    newKeyButton.addEventListener('mouseup', e => stop(key))
    newKeyButton.addEventListener('mouseleave', e => stop(key))
    newKeyButton.addEventListener('touchmove', e => stop(key))
    newKeyButton.addEventListener('touchcancel', e => stop(key))

    newKeyButton.addEventListener('contextmenu', e => {
        e.preventDefault();
        e.stopPropagation()
    })

    const wave = context.createOscillator();
    wave.type = "triangle";
    wave.frequency.value = currFreq;
    wave.start();
    keyNotes.push({
        keyName:key,
        wave: wave,
    })
    currFreq *= (Math.pow(2, 1/12))
    
});

function play(eventKey){
    if (context.state === "suspended") context.resume();
    const key = keyNotes.find(key => key.keyName === eventKey)
    if (key){
        key.wave.connect(context.destination);
        document.querySelector(`[data-keyval='${key.keyName}']`).dataset.playing = 'true';
    } 
}

function stop(eventKey){
    const key = keyNotes.find(key => key.keyName === eventKey)
    if (key){
        key.wave.disconnect();
        document.querySelector(`[data-keyval='${key.keyName}']`).dataset.playing = 'false';
    } 
}

document.body.addEventListener('keydown', e => play(e.key.toLowerCase()));
document.body.addEventListener('keyup',   e => stop(e.key.toLowerCase()));
