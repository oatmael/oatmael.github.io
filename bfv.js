const DEFAULT_MEMORY_SIZE = 30000;
const HELLO_WORLD =
  "++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.";
const VALID_CHARS = [">", "<", "+", "-", ".", ",", "[", "]"];
let memory, jump, program, input, output, pointer, programPointer, inputPointer;

let memoryTable = $("#memory");
let running = false;

const byteToHex = [];

for (let n = 0; n <= 0xff; ++n) {
  const hexOctet = n.toString(16).padStart(2, "0");
  byteToHex.push(hexOctet);
}

function initializeMemoryTable(size = DEFAULT_MEMORY_SIZE) {
  return new Promise((resolve, reject) => {
    console.time("initializeMemoryTable");
    let table = $("<table/>");

    let tableString = ``;
    for (var i = 0; i < size; i += 12) {
      tableString += `
        <tr>
            <td>${(i + 12).toString(16).toUpperCase().padStart(4, "0")}</td>
            <td id="cell${i}">00 00 00 00 00 00 00 00 00 00 00 00</td>
            <td id="formattedCell${i}">............</td>
        </tr>
      `;
    }
    table.html(tableString);
    console.timeEnd("initializeMemoryTable");
    resolve(table);
  });
}

function refreshTableCell(pointer) {
  let blockStart = pointer - (pointer % 12);
  let blockEnd = pointer + 12 - (pointer % 12);
  let memoryBlock = [...memory.slice(blockStart, blockEnd)];
  let memoryBlockString = memoryBlock
    .map((byte) => `<a>${byteToHex[byte]}</a>`)
    .join(" ");

  let nthElement = pointer - blockStart + 1;

  $(`#cell${blockStart}`).html(memoryBlockString);
  $(`#cell${blockStart} a:nth-child(${nthElement})`)
    .css("backgroundColor", "orange")
    .animate({ backgroundColor: "white" }, 300);
  $(`#formattedCell${blockStart}`).html(
    memoryBlock
      .map((byte) => String.fromCharCode(byte < 32 ? 0x2e : byte))
      .join("")
  );
}

function clearMemory(size = DEFAULT_MEMORY_SIZE) {
  console.time("clearMemory");
  memory = new Uint8Array(size);
  jump = program = [];
  pointer = programPointer = inputPointer = 0;
  input = output = "";

  $("#tape").html("");
  $("#output").html(output);
  memoryTable.html("Clearing memory table...");
  console.timeEnd("clearMemory");
  initializeMemoryTable(size).then((table) => {
    memoryTable.html("");
    memoryTable.append(table);
  });
}

function loadMemory(programVal, inputVal, size) {
  clearMemory(size);
  programVal = programVal.split("");
  program = programVal.filter((element) => VALID_CHARS.includes(element));
  input = inputVal;

  let stack = [];
  for (var i = 0; i < program.length; i++) {
    if (program[i] === "[") {
      stack.push(i);
    } else if (program[i] === "]") {
      jump[i] = stack.pop();
      jump[jump[i]] = i;
    }
  }

  program.forEach((value) => $("#tape").append(`<a>${value}</a>`));
  $("#tape a").css("backgroundColor", "#fdc1c6").css("fontColor", "white");
}

let commands = {
  ">": () => ++pointer,
  "<": () => --pointer,
  "+": () => {
    ++memory[pointer];
    refreshTableCell(pointer);
  },
  "-": () => {
    --memory[pointer];
    refreshTableCell(pointer);
  },
  ",": () => {
    memory[pointer] = input.charCodeAt(inputPointer++);
    refreshTableCell(pointer);
  },
  ".": () => {
    output += String.fromCharCode(memory[pointer]);
  },
  "[": () => {
    if (!memory[pointer]) programPointer = jump[programPointer];
  },
  "]": () => {
    if (memory[pointer]) programPointer = jump[programPointer];
  },
};

let stepDuration = 1;
let executeInterval;
function execute(refreshMemory, restart = true) {
  let instant = $("#instant").is(":checked");
  if (running) {
    running = false;
    clearInterval(executeInterval);
  }

  if (restart) {
    running = true;
    if (refreshMemory) {
      loadMemory($("#code").val(), $("#input").val());
    }
    if (instant) {
      executeInstantly();
    } else {
      executeInterval = setInterval(executeStep, stepDuration);
    }
  }
}

function executeInstantly() {
  return new Promise((resolve, reject) => {
    running = true;
    while (program[programPointer] !== undefined) {
      executeStep();
    }
    running = false;
    resolve();
  });
}

function setStep() {
  clearInterval(executeInterval);
  stepDuration = $("#stepduration").val();
  executeInterval = setInterval(executeStep, stepDuration);
}

function executeStep() {
  if (program[programPointer] === undefined) {
    clearInterval(executeInterval);
    running = false;
    $("#startstop")
      .removeClass("btn-success")
      .addClass("btn-danger")
      .html("Stop");
    return;
  }
  commands[program[programPointer]]();
  programPointer++;
  $("#tape a").css("backgroundColor", "#fdc1c6");
  $(`#tape a:nth-child(${programPointer})`).css("backgroundColor", "#54c791");
  $("#output").html(output);
}

function executeButton() {
  execute(true);
}

function toggleStartStop() {
  let button = $("#startstop");
  if (running) {
    button.addClass("btn-success").removeClass("btn-danger").html("Start");
  } else {
    button.removeClass("btn-success").addClass("btn-danger").html("Stop");
  }
  execute(false, !running);
}

loadMemory(HELLO_WORLD);
