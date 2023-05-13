// const remote = require("@electron/remote");

const { ipcRenderer, remote } = require("electron");
const dialog = remote.dialog;
const dailyForm = document.getElementById("daily-form");
const windfireFilesInput = document.getElementById("windfire-files");
const pinduoduoFilesInput = document.getElementById("pinduoduo-files");
const wangjunForm = document.getElementById("wangjun-form");
const wangjunFileInput = document.getElementById("wangjun-file");
const outputDirectoryElement = document.getElementById("output-directory");
const errorElement = document.querySelector(".error-message");
const wangjunWechatForm = document.getElementById("wangjun-wechat-form");
const wangjunWechatTextarea = document.getElementById("wangjun-wechat");
const shouhouForm = document.getElementById("shouhou-form");
const shouhouOrderFile = document.getElementById("shouhou-order-file");
const shouhouFile = document.getElementById("shouhou-file");
const shouhouFanXianFile = document.getElementById("shouhou-fanxian-file");

dailyForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const windfireFiles = Array.from(windfireFilesInput.files).map(
    (file) => file.path
  );
  const pinduoduoFiles = Array.from(pinduoduoFilesInput.files).map(
    (file) => file.path
  );

  const { result, outputFile } = ipcRenderer.sendSync(
    "form-aggregate-files-selected",
    {
      windfireFiles,
      pinduoduoFiles,
    }
  );

  if (result === "success") {
    outputDirectoryElement.textContent = outputFile;
    outputDirectoryElement.parentElement.style.display = "block";
    errorElement.style.display = "none";

    alert("处理成功！");
  } else {
    errorElement.textContent = result;
    errorElement.style.display = "block";
    outputDirectoryElement.parentElement.style.display = "none";

    alert(`处理失败：${result}`);
  }
});

wangjunForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const wangjunFile = wangjunFileInput.files[0].path;

  const { result, outputFile } = ipcRenderer.sendSync(
    "wangjun-form-aggregate-files-selected",
    {
      wangjunFile,
    }
  );
  if (result === "success") {
    outputDirectoryElement.textContent = outputFile;
    outputDirectoryElement.parentElement.style.display = "block";
    errorElement.style.display = "none";

    alert("处理成功！");
  } else {
    errorElement.textContent = result;
    errorElement.style.display = "block";
    outputDirectoryElement.parentElement.style.display = "none";

    alert(`处理失败：${result}`);
  }
});

wangjunWechatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const { result, outputFile } = ipcRenderer.sendSync("wangjun-wechat-handle", {
    wechat: wangjunWechatTextarea.value,
  });
  if (result === "success") {
    outputDirectoryElement.textContent = outputFile;
    outputDirectoryElement.parentElement.style.display = "block";
    errorElement.style.display = "none";

    alert("处理成功！");
  } else {
    errorElement.textContent = result;
    errorElement.style.display = "block";
    outputDirectoryElement.parentElement.style.display = "none";

    alert(`处理失败：${result}`);
  }
});

shouhouForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const shouhouOrder = shouhouOrderFile.files[0].path;
  const shouhouFileList = Array.from(shouhouFile.files).map(
    (file) => file.path
  );
  const shouhouFanxianFileList = Array.from(shouhouFanXianFile).map(
    (file) => file.path
  );

  const { result, outputFile } = ipcRenderer.sendSync("shouhou-handle", {
    shouhouOrder,
    shouhouFileList,
    shouhouFanxianFileList,
  });
  if (result === "success") {
    outputDirectoryElement.textContent = outputFile;
    outputDirectoryElement.parentElement.style.display = "block";
    errorElement.style.display = "none";

    alert("处理成功！");
  } else {
    errorElement.textContent = result;
    errorElement.style.display = "block";
    outputDirectoryElement.parentElement.style.display = "none";

    alert(`处理失败：${result}`);
  }
});
