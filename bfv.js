const DEFAULT_MEMORY_SIZE = 30000;

const byteToHex = [];

for (let n = 0; n <= 0xff; ++n) {
  const hexOctet = n.toString(16).padStart(2, "0");
  byteToHex.push(hexOctet);
}

let programWorker = new Worker("bfvWorker.js");
programWorker.onmessage = function (e) {
  self[e.data.command](...e.data.args);
};

function initializeMemoryTable(size = DEFAULT_MEMORY_SIZE) {
  console.time("initializeMemoryTable");
  let memoryTable = $("#memory");
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

  memoryTable.html("");
  memoryTable.append(table);
  console.timeEnd("initializeMemoryTable");
}

function clearProgram() {
  $("#tape").html("");
  $("#output").html("");
}

function updateOutput(output) {
  $("#output").html(output);
}

function refreshTape(programPointer) {
  $("#tape a").css("backgroundColor", "#fdc1c6");
  $(`#tape a:nth-child(${programPointer})`).css("backgroundColor", "#54c791");
}

function refreshTableCell(pointer, memory) {
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

function loadTape(program) {
  program.forEach((value) => $("#tape").append(`<a>${value}</a>`));
  $("#tape a").css("backgroundColor", "#fdc1c6").css("fontColor", "white");
}

function stepButton() {
  programWorker.postMessage({
    command: "executeStep",
    args: [],
  });
}

function executeButton() {
  programWorker.postMessage({
    command: "run",
    args: [
      $("#instant").is(":checked"),
      true,
      $("#code").val(),
      $("#input").val(),
    ],
  });
}

function startStopButton() {
  let button = $("#startstop");
  if (running) {
    button.addClass("btn-success").removeClass("btn-danger").html("Start");
    programWorker.postMessage({
      command: "run",
      args: [$("#instant").is(":checked")],
    });
  } else {
    button.removeClass("btn-success").addClass("btn-danger").html("Stop");
    programWorker.postMessage({
      command: "stop",
      args: [],
    });
  }
}

function setStep() {
  programWorker.postMessage({
    command: "setStep",
    args: [$("#stepduration").val()],
  });
}
