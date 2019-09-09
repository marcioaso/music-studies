const tunning = ["E","A","D","B","E"];
const notesAbs = ["C","D","E","F","G","A","B"];
const notesBemol = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
const notesSust = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const formulas = {
    scales:[
        ["t","t","s","t","t","t","s"], // major natural
        ["t","s","t","t","s","t","t"]  // minor natural
    ],
    triad:["1","3","5"],
};

var utils = {
    multiply: function(arr,number) {
        let ret = arr.slice();
        for(var i = 0; i < number; i++) {
            ret = ret.concat(arr.slice());
        }
        return ret;
    },
    string: function(init,size = 12,bemol = false) {
        init = init.toUpperCase();
        let output = [];
        let arr = bemol?notesBemol:notesSust;
        let index = arr.indexOf(init), count = 0;
        while(output.length < size) {
            if(!arr[index+count]) count = index = 0;
            output.push(arr[index+count]);
            count++;
        }
        return output;
    },
    sustAbs: function(bemolNote) {
        if(bemolNote.match(/#/)) return bemolNote;
        return notesSust[notesBemol.indexOf(bemolNote)];
    },
    tailhead: function(arr,start) {
        let index = arr.indexOf(start);
        let ret = arr.slice();
        let tail = ret.splice(index,arr.length)
        return tail.concat(ret);
    },
    voice: function(note,variation,isTriad) {
        let v = note.match(/[A-G](#|b)/);
        let string;
        if(v) { // # e b
            if(variation == '1') return this.sustAbs(note);
            string = this.string(this.sustAbs(note),24);
            let entry = v[1]+variation;
            entry = entry.replace(/(b#|#b)/,'')
            return this.voice(note.replace(/(b|#)/,''),entry);
        }

        let th = this.multiply(this.tailhead(notesAbs,note),10);
        let voice = parseInt(variation);
        let transpiled = isNaN(voice);
        let voiceAbs = !+variation?1:variation;
        if(!transpiled) return th[voiceAbs-1];
        
        voice = + variation.replace(/\D/g,'');

        string = this.string(note,24);
        string = this.tailhead(string,note)
        let sum = {"bb":-2,"b":-1,"#":+1}[variation.replace(/\d/g,'')];
        let variatedNote = th[voice-1];
        
        variatedNote = string.indexOf(variatedNote)+sum;
        return string[variatedNote];
    }
}

const services = {
    note: (str) => {
        let firstNote = str.match(/^([A-G])(b|#)?/)[0];
        let triad = formulas.triad.map(variation => utils.voice(firstNote,variation,true));
        if(str.length > 1) {
            let noteArr = str
                .replace(/\//g,'|')
                .replace(/(\d{1,2})M/,'|#$1|')
                .replace(/maj(\d{1,2})/ig,'|#$1|')
                .replace(/(\d{1,2})\+/ig,'|#$1|')
                .replace(/add(\d{1,2})/ig,'|$1|')
                .replace(/flat(\d{1,2})/ig,'|b$1|')
                .replace(/sharp(\d{1,2})/ig,'|#$1|')
                .replace(/^([A-G](#|b)?)m/,function(_,g) {
                    triad[1] = utils.voice(triad[0],'b3');
                    return g+"|";
                })
                .replace(/^([A-G](b|#)?)/,'$1|')
                
            noteArr = noteArr.replace(/(\|+)/g,'|').replace(/\|$/,'').split("|");

            
            noteArr.shift(); // major note
            triad = triad.concat(noteArr.map(variation => utils.voice(triad[0],variation)));
        }
        return triad;
    },
    scale: function(init = "C",bemol = false) {
        let scaleType = init.match(/([A-G])(m)?/);
        if(scaleType[2]) {
            init = scaleType[1];
            scaleType = 1;
        } else {
            scaleType = 0;
        }
        const string = utils.string(init,14,bemol)
        let ret = [init], semitones = formulas.scales[scaleType].slice();
        let i = 0,count = 0;
        while(ret.length < 7) {
            let sum = semitones[count] == 's'?1:2;
            i += sum
            ret.push(string[i]);
            count++;
        }
        return ret.concat(init.toUpperCase()).join(" ");
    },
    tabs: () => tunning.slice().map(init => utils.string(init))
}

console.log(services.note("D5"))
console.log(services.note("Dmaj7"))