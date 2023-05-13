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

  // dialog.showOpenDialog(
  //   {
  //     properties: ["openDirectory"],
  //   },
  //   (outputDirectory) => {
  //     if (outputDirectory) {
  //       const result = ipcRenderer.sendSync("wangjun-wechat-handle", {
  //         wechat: wangjunWechatTextarea.value,
  //         outputDirectory,
  //       });
  //       if (result === "success") {
  //         outputDirectoryElement.textContent = outputDirectory;
  //         outputDirectoryElement.parentElement.style.display = "block";
  //         errorElement.style.display = "none";

  //         alert("处理成功！");
  //       } else {
  //         errorElement.textContent = result;
  //         errorElement.style.display = "block";
  //         outputDirectoryElement.parentElement.style.display = "none";

  //         alert(`处理失败：${result}`);
  //       }
  //     } else {
  //       errorElement.textContent = "请选择输出目录";
  //       errorElement.style.display = "block";
  //       outputDirectoryElement.parentElement.style.display = "none";
  //     }
  //   }
  // );
});
