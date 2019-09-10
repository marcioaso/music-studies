const tunning = ["E","A","D","B","E"];
const notesAbs = ["C","D","E","F","G","A","B"];
const notesBemol = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
const notesSust = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const toneDistanceTable = {
    '1':0,
    '2':2,
    '3':4,
    '4':5,
    '5':7,
    '6':9,
    '7':10,
    '9':13,
    '11':16,
    '13': 20
};

const formulas = {
    scales:[
        ["t","t","s","t","t","t","s"], // major natural
        ["t","s","t","t","s","t","t"]  // minor natural
    ],
    triad:["1","3","5"],
    rules: [
        { reg:/\/(\d{1,2})/g, 
            rep: function(triad,_,g) {
                triad[2] = utils.voice(triad[0],g);
                return `|`
            } 
        },
        { reg:/(\d{1,2})M/, rep:'|#$1|'},
        { reg:/maj(\d{1,2})/ig, rep:'|#$1|'},
        { reg:/(\d{1,2})\+/ig, rep:'|#$1|'},
        { reg:/add(\d{1,2})/ig, rep:'|$1|'},
        { reg:/^([A-G](#|b)?)m(in)?/,
            rep: function(triad,_,g) {
                triad[1] = utils.voice(triad[0],'b3');
                return g+"|";
            }
        },
        { reg:/^([A-G](#|b)?)(half-dim)/,
            rep: function(triad,_,g) {
                triad[1] = utils.voice(triad[0],'b3');
                triad[2] = utils.voice(triad[0],'b5');
                triad[3] = utils.voice(triad[0],'b7');
                return g+"|"
            }
        },
        { reg:/^([A-G](#|b)?)(°|o|dim)(\d{1,2})/,
            rep: function(triad,a,b,c,d,e) {
                triad[1] = utils.voice(triad[0],'b3');
                triad[2] = utils.voice(triad[0],'b5');
                if(e) triad[3] = utils.voice(triad[0],`bb{${e}}`)
                return b+"|"
            }
        },
        { reg:/^([A-G](b|#)?)/, rep:'$1|' },
        { reg: /(\|+)/g, rep:'|'},
        { reg:/\|$/, rep:''}
    ]
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
    voice: function(note,variation) {
        let string = this.string(note,60);
        let transpiled = variation.match(/\D/);
        let distance;
        if(!transpiled) {
            distance = toneDistanceTable[variation];
            return string[distance];
        }
        distance = variation.split(/(\d+)/).filter(each => each).sort((a,b) => a.match(/\d/)?-1:1);
        distance[1] = distance[1] != '#'? distance[1] != 'bb'? -1: -2: +1;
        let index = toneDistanceTable[distance[0]] + distance[1];
        return string[index];
    }
}

const services = {
    note: (str) => {
        let firstNote = str.match(/^([A-G])(b|#)?/)[0];
        let triad = formulas.triad.map(variation => utils.voice(firstNote,variation,true));
        if(str.replace(/(#|b)/g,'').length > 1) {
            let noteArr = str;
            formulas.rules.forEach(each => {
                if(typeof each.rep == 'string') {
                    noteArr = noteArr.replace(each.reg,each.rep)
                } else {
                    noteArr = noteArr.replace(each.reg,function() {
                        let args = [].slice.call(arguments);
                        return each.rep.apply(null,[triad].concat(args));
                    })
                }
            })
            noteArr = noteArr.split("|");
            noteArr.shift(); // dominant note
            triad = triad.concat(noteArr.map(variation => utils.voice(triad[0],variation)));
        }
        return triad;
    },
    scale: function(init="C", bemol=false) {
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
console.log(services.note("Cdim7"))