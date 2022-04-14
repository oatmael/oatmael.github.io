const DEFAULT_MEMORY_SIZE = 30000;
const HELLO_WORLD =
  "++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.";
const VALID_CHARS = [">", "<", "+", "-", ".", ",", "[", "]"];
let memory, jump, program, input, output, pointer, programPointer, inputPointer;

const byteToHex = [];

for (let n = 0; n <= 0xff; ++n) {
  const hexOctet = n.toString(16).padStart(2, "0");
  byteToHex.push(hexOctet);
}

function clearMemory(size = DEFAULT_MEMORY_SIZE) {
  console.time("clearMemory");
  memory = new Uint8Array(size);
  jump = program = [];
  pointer = programPointer = inputPointer = 0;
  input = output = "";
  console.timeEnd("clearMemory");

  postMessage({
    command: "clearProgram",
    args: [],
  });

  postMessage({
    command: "initializeMemoryTable",
    args: [size],
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

  postMessage({
    command: "loadTape",
    args: [program],
  });
}

let commands = {
  ">": () => ++pointer,
  "<": () => --pointer,
  "+": (skipUI) => {
    ++memory[pointer];
    if (!skipUI) {
      postMessage({
        command: "refreshTableCell",
        args: [pointer, memory],
      });
    }
  },
  "-": (skipUI) => {
    --memory[pointer];
    if (!skipUI) {
      postMessage({
        command: "refreshTableCell",
        args: [pointer, memory],
      });
    }
  },
  ",": (skipUI) => {
    memory[pointer] = input.charCodeAt(inputPointer++);
    if (!skipUI) {
      postMessage({
        command: "refreshTableCell",
        args: [pointer, memory],
      });
    }
  },
  ".": (skipUI) => {
    output += String.fromCharCode(memory[pointer]);
    if (!skipUI) {
      postMessage({
        command: "updateOutput",
        args: [output],
      });
    }
  },
  "[": () => {
    if (!memory[pointer]) programPointer = jump[programPointer];
  },
  "]": () => {
    if (memory[pointer]) programPointer = jump[programPointer];
  },
};

let running = false;
let stepDuration = 1;
function run(instant = true, refreshMemory = false, code, input) {
  if (refreshMemory) {
    stop();
    loadMemory(code, input);
  }
  running = true;
  if (instant) {
    executeInstantly();
    return;
  }

  execute();
}

function stop() {
  running = false;
  clearInterval(executeInterval);
}

function stepOnce() {
  running = false;
  executeStep();
}

let executeInterval;
function setStep(duration) {
  stepDuration = duration;
  clearInterval(executeInterval);
  executeInterval = setInterval(executeStep, stepDuration);
}

function execute() {
  executeInterval = setInterval(executeStep, stepDuration);
}

function executeStep(skipUI) {
  if (program[programPointer] === undefined) {
    clearInterval(executeInterval);
    return;
  }
  commands[program[programPointer]](skipUI);
  programPointer++;

  if (!skipUI) {
    postMessage({
      command: "refreshTape",
      args: [programPointer],
    });
  }
}

function executeInstantly() {
  while (program[programPointer] !== undefined && running) {
    executeStep(true);
  }

  postMessage({
    command: "refreshTape",
    args: [programPointer],
  });
  postMessage({
    command: "updateOutput",
    args: [output],
  });
  for (var i = 0; i < memory.length; i += 12) {
    postMessage({
      command: "refreshTableCell",
      args: [i, memory],
    });
  }

  running = false;
}

loadMemory(HELLO_WORLD);

onmessage = function (e) {
  self[e.data.command](...e.data.args);
};
