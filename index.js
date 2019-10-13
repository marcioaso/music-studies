const tunning = ["E","A","D","B","E"];
const notesAbs = ["C","D","E","F","G","A","B"];
const notesBemol = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
const notesSust = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const toneDistanceTable = {'1':0,'2':2,'3':4,'4':5,'5':7,'6':9,'7':10,'9':13,'11':16,'13': 20};

const formulas = {
    scales:{
        dict: { 's':1, 't':2, 'st':3 },
        forms: [
            ["t","t","s","t","t","t","s"], //   0 major natural
            ["t","s","t","t","s","t","t"],  //  1 minor natural

            ["t","t","s","t","s","st","s"], //  2 major harmonic
            ["t","s","t","t","s","st","s"],  // 3 minor harmonic

            ["t","s","t","t","t","t","s"], //   4 melodic minor
            
            ["t","t","s","t","t","t","s"], //   5 diatonic ionian
            ["t","s","t","t","t","s","t"], //   6 diatonic dorian

            ["s","t","t","t","s","t","t"], //   7 diatonic phrygian
            ["t","t","s","t","t","t","s"], //   8 diatonic lydian

            ["t","t","s","t","t","s","t"], //   9 diatonic mixolydian
            ["t","s","t","t","s","t","t"], //  10 diatonic aeolian
            ["s","t","t","s","t","t","t"], //  11 diatonic locrian

            ["t","s","t","t","t","t","s"], //  12 jazz melodic minor ascending
            ["s","t","t","t","t","s","t"], //  13 jazz dorian b2
            ["t","t","t","t","s","t","s"], //  14 jazz lydian augmented
            ["t","t","t","s","t","s","t"], //  15 jazz lydian dominant
            ["t","t","s","t","s","t","t"], //  16 jazz mixolydian b6
            ["t","s","t","s","t","t","t"], //  17 jazz locrian
            ["s","t","s","t","s","t","t"], //  18 jazz altered
        ]
    },
    triad:[1,3,5],
    tetrad:[1,3,5,7],
    rules: [
        { reg:/\/(\d{1,2})/, rep: '|$1|'},
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
        { reg:/^([A-G](#|b)?)(half-dim)(\d{1,2})?/,
            rep: function(triad,a,b) {
                triad[1] = utils.voice(triad[0],'b3');
                triad[2] = utils.voice(triad[0],'b5');
                triad[3] = utils.voice(triad[0],`7`);
                return b+"|"
            }
        },
        { reg:/^([A-G](#|b)?)(°|o|dim)(\d{1,2})?/,
            rep: function(triad,a,b,c,d,e) {
                triad[1] = utils.voice(triad[0],'b3');
                triad[2] = utils.voice(triad[0],'b5');
                if(e) triad[3] = utils.voice(triad[0],`bb${e}`)
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
        for(var i = 0; i < number; i++) ret = ret.concat(arr.slice());
        return ret;
    },
    string: function(init, size=12 , bemol=false) {
        init = init.toUpperCase();
        let output = [];
        let arr = bemol? notesBemol : notesSust ;
        let index = arr.indexOf(init), count = 0;
        while(output.length < size) {
            if(!arr[index+count]) count = index = 0;
            output.push(arr[index+count]);
            count++;
        }
        return output;
    },
    notation: function(note, toBemol=false) {
        let isBemol = !!note.match(/b/);
        if( isBemol && toBemol || !isBemol && !toBemol ) return note;
        let from, to;
        if( toBemol ) {
            from = notesSust;
            to = notesBemol
        } else {
            from = notesBemol
            to = notesSust
        }
        return to[from.indexOf(note)];
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
    chord: (raw) => { 
        let str = raw
            .replace(/\s/g,'')
            .replace(/(([A-Ga-b])(b|#)?)m7\/5(-|b)/,function(_,a) {
                return a+"half-dim";
            })
            .replace(/(([A-Ga-b])(b|#)?)m7\(b5\)/,function(_,a) {
                return a+"half-dim";
            })

        let basenote, scale, scaleNumber = 0;
        str = str.replace(/^([A-Ga-g](b|#)?)(.*)+/,function(a,chord,b,rest) {
            basenote = chord.toUpperCase();
            return rest;
        });
        str = str.replace(/^(maj|m)(.*)?/,function(_,minor,rest) {
            rest = rest || '';
            if(minor == 'maj') return minor+rest;
            if(minor == 'm') scaleNumber = 1;
            return rest;
        });
        scale = services.scale(basenote,scaleNumber);

        let basechord = formulas.triad.slice().map(k => scale[k-1]);

        if (!str.length) return basechord;
        switch(str) {
            case '7':
                basechord.push(utils.voice(basenote,str));
                return basechord;
            case '7+':
            case '7M':
                basechord.push(utils.voice(basenote,"7#"));
                return basechord;
            default: 
                if(str.length) {
                    str = str
                        .replace(/(\/(\d+)(-|\+)?)/g,function(a,b,c,d) {
                            let voice = (d?d=="-"?"b":"#":"")+c;
                            basechord.push(utils.voice(basenote,voice))
                            return '';
                        })
                        .replace(/(\/([A-Ga-g](#|b)?))/g,function(a,b,c) {
                            basechord.unshift(c)
                            return '';
                        })
                        .replace(/(half-dim)/g,function() {
                            basechord = [
                                basenote,
                                utils.voice(basenote,"b3"),
                                utils.voice(basenote,"b5"),
                                utils.voice(basenote,"7")
                            ];
                            return '';
                        })
                        .replace(/(º|dim)/g,function() {
                            let first = basechord.shift();
                            basechord = [
                                first,
                                utils.voice(first,"b3"),
                                utils.voice(first,"b5"),
                                utils.voice(first,"b7")
                            ];
                            return '';
                        })
                        .replace(/(^\||\|\||\|$)/g,'')
                }
        }
        if(str.length > 0) {
            basechord.push(utils.voice(basenote,str))
        }

        let cleaner = {};
        basechord = basechord.filter(k => {
            let w = !cleaner[k]
            cleaner[k] = true;
            return w;
        });
        return basechord;
    },
    scale: function(init="C", scaleType=0, bemol=false) {
        const string = utils.string(init,14,bemol)
        let ret = [init], semitones = formulas.scales.forms[scaleType].slice();
        let i = 0,count = 0;
        while(ret.length < 8) {
            i += formulas.scales.dict[semitones[count]]
            ret.push(string[i]);
            count++;
        }
        return ret;
    },
    tabs: () => tunning.slice().map(init => utils.string(init))
}

let sql = [ "Am",
"B/A",
"E",
"A7/G",
"Am7/G",
"A6",
"A6/9",
"Dm7",
"G",
"G#º",
"E7/9+",
"F#m7/5-",
"Bm7(b5)"
]
sql.map(chord => {
    console.log(chord+": ",services.chord(chord).join(" "));
})
