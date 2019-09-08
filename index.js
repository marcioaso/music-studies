const notesAbs = ["C","D","E","F","G","A","B"];
const notesSemi = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const tunning = ["E","A","D","B","E"];

function scale(first,isMinor) {
    const naturalScales = {M:[2,7],m:[1,4], };
    let notes = notesSemi.slice();
    let full = notes.slice().concat(notes), init = full.indexOf(first.replace("#",''));
    let ret = [], count = 0;
    let semitones = naturalScales[isMinor?"m":"M"];
    for (var i = 0; i < 7; i++) {
        ret.push(full[init+count]);
        if(!semitones.includes(i)) count++;
        count++;
    }
    return ret.concat(first).join(" ");
}
function tabs() {
    let full = notesSemi.slice().concat(notesSemi).concat(notesSemi);

    let arm = [], string = [];

    for (var a = 0; a < tunning.length; a++) {
        let start = full.indexOf(tunning[a]);
        for( var s = 0; s < 12; s++) {
            string.push(full[start+s]);
        }
        arm.push(string);
        string = [];
    }
    return arm;
}

const noteFormulas = {
    T:[0,2,4],

}

function note(str) {
    let full = notesSemi.slice().concat(notesSemi).concat(notesSemi);
    const input = str.replace(/[^0-9A-ZdimM+-]/g,'').split('');
    console.log(input);
}

//console.log(scale("C"))
note("C")