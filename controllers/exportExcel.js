const path = require('path');
const xl = require('excel4node');

//Rows
const columnTitles=1

//Columns
const rowTitles=1

const days = {
  'M':2,
  'T':4,
  'W':6,
  'R':8,
  'F':10,
  'S':12
}

//'key':column
const dataColumns = {
  'key': {
    label: 'Key',
    column: 1,
    width: 4.0  //Multiply by 10 and it is the width in pixels
  },
  'courseTitle': {
    label: 'Course Title',
    column: 2,
    width: 32.0
  },
  'instructor': {
    label: 'Instructor',
    column: 3,
    width: 25.0
  },
  'meetingPattern': {
    label: 'Meeting Time(s)',
    column: 4,
    width: 25.0
  },
  'location': {
    label: 'Location',
    column: 5,
    width: 23.0
  },
  'block': {
    label: 'Block',
    column: 6,
    width: 10.8
  },
  'creditHours': {
    label: 'Credit Hours',
    column: 7,
    width: 10.8
  },
  'classId': {
    label: 'Class ID',
    column: 8,
    width: 7.0
  },
  'course': {
    label: 'Course',
    column: 9,
    width: 11.0
  }
}

const cellsPerHour = 12;
const startTime24Hour = 6;  //6am
const endTime24Hour = 23; //11pm
const columnDayGap = 1.3; //Gap between days
const cellHeight = 3; //Height of the cells making up the calendar
let charCode = 65;  //Start with ascii 'A' for labeling calendar items
let scheduleEntryRow=1;

exports.postExcel = (req, res, next) => {
  const classData = JSON.parse(req.body.displaydata); //Data provided by the front end
  
  let workBook = new xl.Workbook(); //Create new workbook
  let calendarWorkSheet = workBook.addWorksheet('Calendar');  //Create Calendar sheet
  let scheduleWorkSheet = workBook.addWorksheet('Schedule');  //Create Schedule sheet

  //Build Calendar spreadsheet
  buildCalendarHeading(calendarWorkSheet, workBook);
  buildCalendarLeftHeading(calendarWorkSheet, workBook);
  setCalendarCellSpacing(calendarWorkSheet, workBook);
  
  charCode = 65;  //Reset calendar item label counter
  scheduleEntryRow = 1; //Reset schdule entry row
  //Add Schedule sheet class item headings
  buildScheduleHeading(scheduleWorkSheet, workBook);

  classData.map(item=>{
    setCalendarItem(item, calendarWorkSheet, scheduleWorkSheet, workBook);  //Add row with class data
    return item;
  })

  //Write excel file and send it back to the front end
  workBook.write('excelFiles/Excel.xlsx', function(err, stats) {
    if(err) {
      return res.status(500).json(err)
    } else {
      return res.sendFile(path.join(__dirname, '../excelFiles/Excel.xlsx'));
    }
  });
};

function buildCalendarHeading(ws, wb) {
  //Add days of the week
  ws.cell(columnTitles, days['M']).string('Monday')
  ws.cell(columnTitles, days['T']).string('Tuesday')
  ws.cell(columnTitles, days['W']).string('Wednesday')
  ws.cell(columnTitles, days['R']).string('Thursday')
  ws.cell(columnTitles, days['F']).string('Friday')
  ws.cell(columnTitles, days['S']).string('Saterday')

  //Style header
  const dayHeaderStyle = wb.createStyle({
    alignment: {
      horizontal: 'center'
    },
    font: {
      bold: true,
      color: "FFFFFF"
    },
    fill: {
      type: "pattern",
      patternType: "solid",
      fgColor: "00843d"
    }
  });

  ws.cell(columnTitles, days['M'], columnTitles, days['S']).style(dayHeaderStyle);
}

//Returns row associated with a given time
function timeToRow(hour, minute) {
  const calendarStartRow = 2;
  return parseInt( calendarStartRow+(hour-startTime24Hour)*cellsPerHour+(minute/5) );
}

//Converts 24 hour to 12 hour format for hours only
function hour24ToHour12(hour) {
  let meridian = 'pm';
  if(hour<12)
    meridian = 'am';

  if(hour>12)
    hour-=12;
  
  return hour+":00 "+meridian; 
}

function buildCalendarLeftHeading(ws, wb) {
  const timeStyle = wb.createStyle({
    alignment: {
      horizontal: 'center',
      vertical: 'center'
    },
    font: {
      bold: true
    }
  });

  //Populate times
  for(let hour=startTime24Hour;hour<endTime24Hour;hour++) {
    let startCell = timeToRow(hour,0);
    let endCell = startCell+cellsPerHour-1;
    ws.cell(startCell, rowTitles, endCell, rowTitles, true)
      .string(hour24ToHour12(hour))
      .style(timeStyle);
  }
}

function setCalendarCellSpacing(ws, wb) {
  //Set columns between days
  ws.column(days['M']+1).setWidth(columnDayGap);
  ws.column(days['T']+1).setWidth(columnDayGap);
  ws.column(days['W']+1).setWidth(columnDayGap);
  ws.column(days['R']+1).setWidth(columnDayGap);
  ws.column(days['F']+1).setWidth(columnDayGap);

  const hourSpan = endTime24Hour-startTime24Hour;

  const rowToStartCalendar = 2;
  const cellSpan = rowToStartCalendar+hourSpan*cellsPerHour;
  for(let row=columnTitles+1;row<cellSpan;row++) {
    ws.row(row).setHeight(cellHeight);
  }
}

//Returns JSON {hour, minute} with 24 hour time
function convertTime(time12Hour) {
  const meridian = time12Hour.slice(-2);
  const numbers = time12Hour.slice(0,-2);
  let [hour, minute] = numbers.split(':');
  if(minute==undefined)
    minute = '00';
  hour = parseInt(hour);
  minute = parseInt(minute);
  if(hour===12)
    hour = 0;
  if(meridian==='pm')
    hour+=12;
  return {hour, minute};
}

//returns meeting pattern as json with {days, startTime, endTime}
function convertMeetingPattern(mtgPat) {
  let [days,timeSpan] = mtgPat.split(' ');
  days = days.replace('a', '').split('');

  const [startTime, endTime] = timeSpan.split('-');

  return {days: days, startTime: convertTime( startTime ), endTime: convertTime( endTime ) }
}

//Returns hex value between minHex and maxHex as a two digit string
function generateShade(minHex, maxHex) {
  const min = parseInt(minHex, 16);
  const max = parseInt(maxHex, 16);

  let value = Math.floor( Math.random() * (max - min) + min ).toString(16);
  if(value.length < 2)
    value = '0'+value;
  return value;
}

//returns RRGGBB color randomly generated
function generateColor() {
  const r = generateShade('00', 'a0');
  const g = generateShade('00', 'a0');
  const b = generateShade('00', 'a0');

  return r+g+b;
}

function buildScheduleHeading(ws, wb) {
  const scheduleHeadingStyle = wb.createStyle({
    font: {
      bold: true,
      color: "FFFFFF"
    },
    fill: {
      type: "pattern",
      patternType: "solid",
      fgColor: "333333"
    }
    
  });
  Object.entries(dataColumns).forEach(([key,value])=>{
    ws.column(value.column).setWidth(value.width);
    ws.cell(scheduleEntryRow,value.column)  //Add heading to column
      .string(value.label)
      .style(scheduleHeadingStyle);
  });
  scheduleEntryRow++;
}

//Sets scheduled items onto calendar
function setCalendarItem(item, calendar_ws, schedule_ws, wb) {
  let keyValueChar = String.fromCharCode(charCode);   //Converts number representing ascii character to character

  Object.entries(item).forEach(([key, value])=>{
    schedule_ws.cell(scheduleEntryRow,dataColumns[key].column).string(value)  //Sets schedule item on schedule worksheet
  })
  
  if(item.meetingPattern==='Does Not Meet') {
    scheduleEntryRow++;  
    return; 
  }
  schedule_ws.cell(scheduleEntryRow,dataColumns['key'].column).string(keyValueChar);  //Set schedule key for item in schedule worksheet
  scheduleEntryRow++;
  
  const calendarItemStyle = wb.createStyle({
    alignment: {
      horizontal: 'center',
      vertical: 'center'
    },
    font: {
      bold: true,
      color: "FFFFFF"
    },
    fill: {
      type: "pattern",
      patternType: "solid",
      fgColor: generateColor()  //Generate color to be used on calendar item
    }
  });

  console.log("ITEM:", item);
  const meetingTime = convertMeetingPattern( item.meetingPattern ); //Get meeting pattern as JSON
  
  meetingTime.days.map(day=>{
    //Define cells representing calendar item
    calendar_ws.cell(
      timeToRow(meetingTime.startTime.hour, meetingTime.startTime.minute), 
      days[day], 
      timeToRow(meetingTime.endTime.hour, meetingTime.endTime.minute)-1, 
      days[day], 
      true
    ).string(keyValueChar)
    .style(calendarItemStyle)
  });

  charCode++; //Advance character key to the next letter
}