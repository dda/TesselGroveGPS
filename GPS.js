#!/usr/local/bin/tessel run

tessel = require('tessel');

var port = tessel.port['A'];
var uart = new port.UART({
  baudrate: 9600
})

var inString="";
var haveValidInput=false;
var updates=[];

var fixValidity=new Array(9);
fixValidity[0]="invalid"
fixValidity[1]="GPS fix (SPS)"
fixValidity[2]="DGPS fix"
fixValidity[3]="PPS fix"
fixValidity[4]="Real Time Kinematic"
fixValidity[5]="Float RTK"
fixValidity[6]="estimated (dead reckoning) (2.3 feature)"
fixValidity[7]="Manual input mode"
fixValidity[8]="Simulation mode"

uart.on('data', function (data) {
  var s=data.toString();
  inString+=s;
//  console.log(s);
});

function processInput() {
  var buf=new Buffer(inString);
  var x=inString.indexOf("$");
  if(x==-1) {
    inString="";
    return;
  }
  buf=buf.slice(x);
  inString=buf.toString();
  var y=inString.indexOf('\n');
  var z=inString.indexOf('\r');
  if(y==-1&&z==-1) {
    return;
  }
  if(y==-1) y=z;
  var s=buf.slice(0, y).toString();
  inString=buf.slice(y+1).toString();
  updates.push(s);
}

function displayInfo() {
  while(updates.length>0) {
    var s=updates.shift();
    var fields=s.split(",");
    var cmd=fields[0];
//    console.log("\n> "+cmd);
    if(cmd=="$GPGGA") {
      console.log("--------------------------");
      // Date Time
      if(fields[6]!="0") {
        console.log("Date: 20"+fields[9].substr(4,2)+"/"+fields[9].substr(2,2)+"/"+fields[9].substr(0,2));
        console.log("Fix taken at "+fields[1].substr(0,2)+":"+fields[1].substr(2,2)+":"+fields[1].substr(4,2)+" UTC");
        console.log("Fix validity: "+fixValidity[Number(fields[6])]+" ["+fields[6]+"]");
        console.log("Latitude "+fields[2].substr(0,2)+"° "+fields[2].substr(2)+"' "+fields[3]);
        console.log("Longitude "+fields[4].substr(0,2)+"° "+fields[4].substr(2)+"' "+fields[5]);
        console.log("Number of satellites: "+fields[7]);
        console.log("Altitude: "+fields[9]+" "+fields[10]);
        console.log("Altitude of geoid: "+fields[11]+" "+fields[12]);
      }
    } else if(cmd=="$GPRMC") {
      console.log("--------------------------");
      // Date Time
      console.log("Date: 20"+fields[9].substr(4,2)+"/"+fields[9].substr(2,2)+"/"+fields[9].substr(0,2));
      console.log("Fix taken at "+fields[1].substr(0,2)+":"+fields[1].substr(2,2)+":"+fields[1].substr(4,2)+" UTC");
      if(fields[2]=="A") {
        console.log("Latitude "+fields[3].substr(0,2)+"° "+fields[3].substr(2)+"' "+fields[4]);
        console.log("Longitude "+fields[5].substr(0,2)+"° "+fields[5].substr(2)+"' "+fields[6]);
      }
    } else if (cmd=="$GPGSV") {
      console.log("--------------------------");
      console.log(fields[3]+" satellites in view.");
    } else if (cmd=="$GPGLL") {
      if(fields[6]=="A") {
        console.log("--------------------------");
        console.log("Fix taken at "+fields[5].substr(0,2)+":"+fields[5].substr(2,2)+":"+fields[5].substr(4,2)+" UTC");
        console.log("Latitude "+fields[1].substr(0,2)+"° "+fields[1].substr(2)+"' "+fields[2]);
        console.log("Longitude "+fields[3].substr(0,2)+"° "+fields[3].substr(2)+"' "+fields[4]);
      }
    } else if (cmd=="$GPVTG") {
      console.log("--------------------------");
    // $GPVTG,,T,,M,0.120,N,0.223,K,A*23
      console.log("True track: "+fields[1]);
      console.log("Magnetic track: "+fields[3]);
      console.log("Speed: "+fields[7]+" kph");
    }
  }
}

setInterval(processInput, 500);
setInterval(displayInfo, 800);
