var composer={
	getLastStaff:function(){return composer.staves[composer.staves.length-1]},
	getLastMeasure:function(staff){return staff.measures[staff.measures.length-1]},
	staves:[],
	utils:{
		changeDuration:function(duration,add){
			switch(duration){
				case "w":
				case "1":
				return add=="+"? "w" : "h"
				break;
				case "2":
				case "h":
				return add=="+"? "w" : "q"
				break;

				case "4":
				case "q":
				return add=="+"? "h" : "8"
				break;
				case "8":
				return add=="+"? "4" : "16"
				break;
				case "16":
				return add=="+"? "8" : "32"
				break;
				case "32":
				return add=="+"? "16" : "32"

				break;
			}
		},
		getHighestDurationPossible:function(measure){
			var tMeasure = Object.create(measure);

			while (!tMeasure.voice.isComplete()){
				var required  = tMeasure.voice.getTotalTicks().numerator - tMeasure.voice.getTicksUsed().numerator;
				console.log ("Required: "+required);
				if (required >= 16384){
					return 'w';
				}
				if (required >= 16384/2){
					return 'h';
				}
				if (required >= 16384/2/2){
					return 'q';
				}
				if (required >= 16384/2/2/2){
					return '8';
				}
				if (required >= 16384/2/2/2/2){
					return '16';
				}
				if (required >= 16384/2/2/2/2/2){
					return '32';
				}                
			}
		},
		fillWithRests:function(measure){
			if (measure.voice.isComplete()) {console.log("Filled with rests successfully");return;}

			while (!measure.voice.isComplete()){
				var required  = measure.voice.getTotalTicks().numerator - measure.voice.getTicksUsed().numerator;
				console.log ("Required: "+required);
				if (required >= 16384){
					measure.voice.addTickable(new VF.StaveNote({clef:measure.voice.clef,keys: [measure.voice.clef=="treble"? "b/4" : "d/3"],duration:'wr'}));
					continue;
				}
				if (required >= 16384/2){
					measure.voice.addTickable(new VF.StaveNote({clef:measure.voice.clef,keys: [measure.voice.clef=="treble"? "b/4" : "d/3"],duration:'hr'}));
					continue;
				}
				if (required >= 16384/2/2){
					measure.voice.addTickable(new VF.StaveNote({clef:measure.voice.clef,keys: [measure.voice.clef=="treble"? "b/4" : "d/3"],duration:'qr'}));
					continue;
				}
				if (required >= 16384/2/2/2){
					measure.voice.addTickable(new VF.StaveNote({clef:measure.voice.clef,keys: [measure.voice.clef=="treble"? "b/4" : "d/3"],duration:'8r'}));
					continue;
				}
				if (required >= 16384/2/2/2/2){
					measure.voice.addTickable(new VF.StaveNote({clef:measure.voice.clef,keys: [measure.voice.clef=="treble"? "b/4" : "d/3"],duration:'16r'}));
					continue;
				}
				if (required >= 16384/2/2/2/2/2){
					measure.voice.addTickable(new VF.StaveNote({clef:measure.voice.clef,keys: [measure.voice.clef=="treble"? "b/4" : "d/3"],duration:'32r'}));
					continue;
				}                
			}
		}
	},
	addStaff:function(){
		composer.staves.push({measures:[],currentOctave:1,currentDuration:"q",index:composer.staves.length})
	},
	addMeasure:function(staff,clef="treble"){
		var measure = new VF.Stave(10 + (400 * staff.measures.length), 40 + (staff.index * 80), 400);

		if (staff.measures.length==0 || ( staff.measures.length > 0 && composer.getLastMeasure(staff).clef != clef))
			measure.addClef(clef)
		measure.notes = [];
		staff.currentOctave = clef=="treble"? 4:3;
		measure.tempo = 120
		if (staff.measures.length == 0){
		measure.voice = new VF.Voice({num_beats:4,beat_value:4});
			staff.currentDuration = "q";
	}
		else
		measure.voice = new VF.Voice({num_beats:composer.getLastMeasure(staff).voice.time.num_beats,beat_value:composer.getLastMeasure(staff).voice.time.beat_value})
		staff.measures.push(measure);

	},
	renderAll:function(codes){
		for(var u = 0;u<codes.length;u++){
			composer.render(codes[u],u,function(){});
		}
	}
	,
	render:function(code,staffIndex=0,postRender){

		composer.data = [];

		composer.staves[staffIndex].measures = [];
		var staff = composer.staves[staffIndex];

		var inGroup = false;
		var group=[];
		var inTuplet = false;
		//storing tuplets to be rendered later
		var tuplets =[];

		for(var i = 0;i<code.split(" ").length;i++){
			var cmd = code.split(" ")[i].trim();

			if (cmd == '') continue;
			//creating a measure
			if (["treble","bass"/*,"alto","tenor","soprano","mezzo-soprano","baritone-c","baritone-f","subbass","percussion","french"*/].includes(cmd)){
				// Create a stave at position 10, 40 of width 400 on the canvas.
				if (staff.measures.length>0){
					if (composer.getLastMeasure(staff).clef != cmd)
						composer.getLastMeasure(staff).addClef(cmd)
				}
				else 
					composer.addMeasure(staff,cmd)

				// Connect it to the rendering context and draw!
				//stave.setContext(context).draw();
				continue;
			}
			//if current stave still doesn't exists, throw error
			//time signature
			if (cmd.includes("/")){
				if (staff.measures.length<0){console.error("Measure hasn't been created yet. Please create one."); return;}
				
				composer.getLastMeasure(staff).voice = new VF.Voice({num_beats:parseInt(cmd.split("/")[0]),beat_value:parseInt(cmd.split("/")[1])});
				
				composer.getLastMeasure(staff).addTimeSignature(composer.getLastMeasure(staff).voice.time.num_beats + "/"+composer.getLastMeasure(staff).voice.time.beat_value);
				
				console.log("Created time signature. Required duration: "+composer.getLastMeasure(staff).voice.getTotalTicks());

				continue;
			}

			//changed octave
			if ("0123456".includes(cmd) && cmd.length==1){
				staff.currentOctave = parseInt(cmd);
				composer.data.push({at:i,type:"i",message:"Changed octave",value:staff.currentOctave})
			}

			//octave goes up/down
			if(cmd[0] == "^" || cmd[0] == "v"){
				cmd.split("").forEach(function(char){
					if (char == "^" && staff.currentOctave<7)
						staff.currentOctave++;
					if (char == "v" && staff.currentOctave>0)
						staff.currentOctave--;
				})
				composer.data.push({at:i,type:"i",message:"Changed octave",value:staff.currentOctave})
			}

			//duration goes up/down
			if (cmd[0] == "+" || cmd[0] == "-"){
				var o = staff.currentDuration;
				cmd.split("").forEach(function(char){
					staff.currentDuration = composer.utils.changeDuration(staff.currentDuration,char)
				})
				console.log("Duration changed. old: "+o+" new: "+staff.currentDuration)
				composer.data.push({at:i,type:"i",message:"Changed duration",value:staff.currentDuration})

			}
			// key signature
			if (cmd.startsWith("key:")){
				var k = new Vex.Flow.KeySignature(cmd.split(":")[1]);
				k.addToStave(composer.getLastMeasure(staff));
				composer.data.push({at:i,type:"i",message:"Created new measure",value:""})

			}
			//tempo 
			if (cmd.startsWith("tempo:")){
				var tempo = cmd.split(":")[1];
				composer.getLastMeasure(staff).tempo = parseInt(tempo);
				composer.data.push({at:i,type:"i",message:"Set tempo",value:tempo})
			}
			//tuplets 
			if (cmd.startsWith("[")){
				var tInt = parseInt(cmd.split("[")[1].split("]")[0]);
				if (tInt < 6 && tInt > 2){
					console.log("Created a " + ["triplet","quintuplet"][tInt-3])
					expecting = "group";
					inTuplet = true;
				}
			}

			//expects
			if (cmd.startsWith("(")){
				console.log("Created group");
				inGroup = true;
				expecting = "";
			}
			
			// ending group
			if (cmd.startsWith(")") && inGroup){
				console.log("Ending group creation")
				inGroup = false;
				// if we were in a tuplet, create it
				if (inTuplet){
					tuplets.push(new Vex.Flow.Tuplet(group, {notes_occupied: 1,ratioed:false}));
					
					inTuplet = false;
					console.log("Ending the tuplet creation");
					composer.data.push({at:i,type:"i",message:"Created tuplet",value:""})

				}
				if ("123456789".includes(cmd[cmd.length-1])){
					console.log("Creating a group loop");
				}
				group=[];
			}
			//changed duration
			/*if ("qhw1/21/41/81/16/1/321/64".includes(cmd[0])){
 
				console.log("duration entered: "+cmd)
				switch(cmd){
					case "q":
					case "4":
						staff.currentDuration = "q";
					break;
					case "h":
					case "2":
						staff.currentDuration = "h";
					break;
					case "w":
					case "1":
						staff.currentDuration = "w";
					break;
					case "8":
						staff.currentDuration = "8";
					break;
					case "16":
						staff.currentDuration = "16";
					break;
					case "32":
						staff.currentDuration = "32";
					break;
					case "64":
						staff.currentDuration = "64";
					break;
				}
			}*/

			//entered a note
			if (cmd[0] != undefined && "abcdefg".includes(cmd[0].toLowerCase())){
				console.log ("Adding note: "+cmd);
				if (staff.measures.length == 0){
					composer.addMeasure(staff);
				}
				var keys = [];
				var d = staff.currentDuration;

				cmd.split("").forEach(function(note,index){
					//octave number entered
					if ("01234567".includes(note)){
						keys[keys.length-1] = keys[keys.length-1].split("/")[0] + "/" +note;
					}
					else if (note == "."){
						keys[keys.length-1].dotted=true;
					}
					else if (note=="#"){
						keys[keys.length-1].key = keys[keys.length-1].key.split("/")[0] +note+ "/" +(parseInt(keys[keys.length-1].key.split("/")[1]));
						keys[keys.length-1].accidental += "#";
					}else if (note=="p" && index!=0){
						keys[keys.length-1].key = keys[keys.length-1].key.split("/")[0] +"b"+ "/" +(parseInt(keys[keys.length-1].key.split("/")[1]));
						keys[keys.length-1].accidental += "b";
					}else if (note == "n" && index!=0){
						//getting the first char of old note
						keys[keys.length-1].key = keys[keys.length-1].key.split("/")[0][0] + "/" +(parseInt(keys[keys.length-1].key.split("/")[1]));
						keys[keys.length-1].accidental += "n";
					} else if (note == "+"){ //duration up
						d = composer.utils.changeDuration(staff.currentDuration,"+")
					}
					else if (note == "-"){ //duration up
						d = composer.utils.changeDuration(staff.currentDuration,"-")
					}
					else if (note == "^"){ // one octave up
						keys[keys.length-1].key = keys[keys.length-1].key.split("/")[0] + "/" +(parseInt(keys[keys.length-1].key.split("/")[1])+1);
					} 
					else if (note == "v"){ // one octave up
						keys[keys.length-1].key = keys[keys.length-1].key.split("/")[0] + "/" +(parseInt(keys[keys.length-1].key.split("/")[1])-1);
					} else if ("r".includes(note)){
						
					}
					else if ("abcdefg".includes(note)){
						keys.push({key:note+"/"+staff.currentOctave,accidental:"",dotted:false,duration:staff.currentDuration});
					}
				})

				var tmpK = [];
				var dotted = false;
				keys.forEach(function(e){
					tmpK.push(e.key);
					if (e.dotted == true){dotted = true;}
				})
				var vfNote = new VF.StaveNote({clef:composer.getLastMeasure(staff).clef,keys:tmpK,duration:d + (dotted? "d" : "")})
				
				if (keys.length>1){
					composer.data.push({at:i,type:"c",message:"Chord",value:keys.map(function(it){ return it.split("/")[0]}).join("")});
				}else{
					composer.data.push({at:i,type:"n",message:"Note",value:keys[0]});
				}
				
				keys.forEach(function(key,index){
					if (key.accidental!=""){
						vfNote.addAccidental(index,new VF.Accidental(key.accidental))
					}
					if (key.dotted){
						vfNote.addDotToAll();
					}
				})
				
				//add the notes to the group if in group
				if (inGroup){
					group.push(vfNote);
				}

				if (vfNote.intrinsicTicks + composer.getLastMeasure(staff).voice.getTicksUsed().numerator <= composer.getLastMeasure(staff).voice.getTotalTicks().numerator)
					composer.getLastMeasure(staff).voice.addTickable(vfNote);
					else{
						if (composer.getLastMeasure(staff).voice.isComplete()){
							composer.addMeasure(staff,composer.getLastMeasure(staff).clef)
							composer.getLastMeasure(staff).voice.addTickable(vfNote);
	
						}else{
							//currently won't create anything if note can't fit the measure
						/*console.log("largest duration " + composer.utils.getHighestDurationPossible(composer.getLastMeasure(staff)));
						var partialNote = new VF.StaveNote({clef:composer.getLastMeasure(staff).clef,keys:tmpK,duration:composer.utils.getHighestDurationPossible(composer.getLastMeasure(staff))})
						composer.getLastMeasure(staff).voice.addTickable(partialNote);
						composer.addMeasure(staff,composer.getLastMeasure(staff).clef)*/
						}
					}
				//composer.getLastMeasure(staff).notes.push(vfNote)
			}

			/// End the bar. This will fill all the empty space that left on the current measure, and add a new measure.
			if (cmd[0] == "l" || cmd[0] == "|"){
				//composer.utils.fillWithRests(composer.getLastMeasure(staff))
				console.log("Added new measure")
				composer.addMeasure(staff,composer.getLastMeasure(staff).clef)
				composer.data.push({at:i,type:"i",message:"Created new measure",value:""});

			}
			

			//rendering the stave in the end
		}
		if (composer.staves.length>0){

			context.clear();

			composer.staves.forEach(function(st){
				st.measures.forEach(function(measure,mIndex){
					measure.setContext(context).draw()


						//if (st.)

						//if (mIndex == 0) measure.addClef(measure.clef)
						

						measure.voice.clef = measure.clef;

						console.log("Rendering")
						composer.utils.fillWithRests(measure)
						var beams = VF.Beam.generateBeams(measure.voice.tickables);
						var formatter = new VF.Formatter().joinVoices([measure.voice]).format([measure.voice], 400);
						
						measure.voice.draw(context, measure);
						
						measure.voice.tickables.forEach(function(tickable){
							tickable.attrs.el.addEventListener("click",function(click){
								composer.visualizer.locate(tickable.stem.x_begin-12)
							})
						})


						beams.forEach(function(beam) {
							beam.setContext(context).draw();
						});
						tuplets.forEach(function(tuplet){
							tuplet.setContext(context).draw()
						})
						
				})
			})
			postRender()
		}
		


	},
	// holds the information
	data:[

	],
	// visulization for playback and interaction
	visualizer:{
		enabled:true,
		lineColor:"rgb(180,0,0)",
		lineThickness:2,
		locate:function(x,y){
			composer.visualizer.draw()

			composer.visualizer.line.x = x;
			composer.visualizer.line.setAttribute("x1",x)
			composer.visualizer.line.setAttribute("x2",x)
			
			if (y== undefined) return
			composer.visualizer.line.y = y;
			composer.visualizer.line.setAttribute("y1",y + 40)
			composer.visualizer.line.setAttribute("y2",y+composer.staves[0].measures[0].height-10)
		},
		resize:function(h){
			composer.visualizer.line.setAttribute("y2",h-10)
		},
		draw:function(){

			if (composer.staves.length == 0) return;
			if (composer.visualizer.line != undefined) return;
			//<line x1="0" y1="0" x2="200" y2="200" style="stroke:rgb(255,0,0);stroke-width:2" />

			composer.visualizer.line = document.createElementNS('http://www.w3.org/2000/svg','line');
			composer.visualizer.line.setAttribute("x1",50)
			composer.visualizer.line.setAttribute("x2",50)
			composer.visualizer.line.x = 50
			composer.visualizer.line.y = 25
			composer.visualizer.line.setAttribute("y1",composer.staves[0].measures[0].y + 40)
			composer.visualizer.line.setAttribute("y2",composer.staves[0].measures[0].y + composer.staves[0].measures[0].height - 10)
			composer.visualizer.line.style = "stroke:"+composer.visualizer.lineColor+";stroke-width:"+composer.visualizer.lineThickness;

			composer.visualizer.line.fitToStaves = function (){
				composer.visualizer.resize(composer.getLastMeasure(composer.getLastStaff()).y + composer.getLastMeasure(composer.getLastStaff()).height); 
			}

			document.querySelector("#music svg").appendChild(composer.visualizer.line);
			/*context.fillStyle = composer.visualizer.lineColor;
			context.fillRect(composer.visualizer.linePosition.x,composer.visualizer.linePosition.y,composer.visualizer.lineThickness,10);*/
		}
	}
	,
	//playback engine for composer. Requires tone.js
	playback:{
		countdown:2000,
		enabled:true,
		init:function(){
			composer.playback.synth = new Tone.PolySynth(6, Tone.Synth).toMaster();
			composer.playback.audioContext = Object.create(Tone.context);
			composer.playback.enabled = true
		},
		playNote:function(note){
			if (Array.isArray(note)){
				note.keys = note.keys.map(function(key){ return key.replace("/","")});
			}else{
				note = note.replace("/","");
			}
		},
		play:function(){
			if (!composer.playback.enabled) return;
			

			Tone.context = composer.playback.audioContext;


			var currentWait;
			composer.staves.forEach(function(staff,i){
				staff.measures.forEach(function(measure,a){
					var playedSoFar = Tone.Time(composer.playback.countdown / 1000);
					Tone.Transport.bpm.value = measure.tempo
					Tone.Transport.start("+0.1");
					console.log(measure.voice.tickables[0])
					measure.voice.tickables.forEach(function(note,noteIndex){
						if (note.noteType != "r"){

							console.log(Tone.Time(a+"m")+playedSoFar)
							

							setTimeout(function(){
								console.log("playnote")
								composer.visualizer.draw()
								composer.visualizer.locate(note.stem.x_begin-5)
							},(Tone.Time(a+"m") + playedSoFar)*Tone.Transport.bpm.value * 7.5)
							composer.playback.synth.triggerAttackRelease(note.keys.map(function(x){ return x.replace("/","")}),VF.durationToNumber(note.duration)+"n",Tone.Time(a+"m")+playedSoFar)
							
							playedSoFar+=Tone.Time(VF.durationToNumber(note.duration)+"n")


						}
						/*setTimeout(function(){
							composer.playback.synth.triggerAttackRelease(note.keys[0].replace("/",""),"4n")
							currentWait += note.intrinsicTicks;
						},currentWait * noteIndex);*/
					})
					console.log(playedSoFar*1000)

				})
			});
			//composer.playback.synth.triggerAttackRelease('C4', '8n')
		}
	}
}
