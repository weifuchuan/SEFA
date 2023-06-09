const { app, ipcMain, BrowserWindow, shell, dialog } = require("electron");
// const remoteMain = require("@electron/remote/main");
const fs = require("fs");
const xlsx = require("node-xlsx");
const XLSX = require("xlsx");
const csv = require('csv-parser');
// remoteMain.initialize();
// if (require('electron-squirrel-startup')) app.quit();
const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      plugins: true,
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
      nativeWindowOpen: false,
      webSecurity: false,
    },
  });
  // remoteMain.enable(win.webContents);
  win.loadFile("index.html");
};

app.on("ready", async () => {
  createWindow();
});
// app.whenReady().then(() => {
//   createWindow();
// });ssd

ipcMain.on("form-aggregate-files-selected", (event, data) => {
  const { windfireFiles, pinduoduoFiles } = data;
  console.log(data);
  const date = new Date();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const md = `${date.getMonth() + 1}月${date.getDate()}日`;
  const filename = `${app.getPath("desktop")}/${md}电商发货单.xlsx`;

  dialog.showSaveDialog({ defaultPath: filename }, (filename) => {
    const newHeaders =
      `日期	订单编号	店铺	收货人	快递公司	快递单号	商品数量	发货件数	实收	商品名称/简称	规格编码	备注`.split(
        "\t"
      );
    let newWorkSheet = [newHeaders];
    windfireFiles.forEach((file) => {
      const workSheets = xlsx.parse(file);
      const headers = workSheets[0].data[0];
      const headersMap = {};
      headers.forEach((x, i) => (headersMap[x] = i));
      const data = workSheets[0].data.slice(1);
      const orderID_rows = {};
      data.forEach((row) => {
        if (!!!orderID_rows[row[headersMap["主订单编号"]]]) {
          orderID_rows[row[headersMap["主订单编号"]]] = [];
        }
        orderID_rows[row[headersMap["主订单编号"]]].push(row);
      });
      Object.entries(orderID_rows).forEach(([orderID, rows]) => {
        const row = rows[0];
        const newRow = [
          md,
          row[headersMap["寄件人姓名"]].includes("王君")
            ? ""
            : row[headersMap["主订单编号"]],
          row[headersMap["寄件人姓名"]].includes("王君") ? "微信" : "淘宝",
          row[headersMap["收件人姓名"]],
          row[headersMap["快递公司"]],
          row[headersMap["运单号"]],
          row[headersMap["商品总数量"]],
          rows.length,
          row[headersMap["实付价格"]],
          productName(row[headersMap["商品信息"]], row[headersMap["卖家备注"]]),
          productCode(row[headersMap["商品信息"]], row[headersMap["卖家备注"]]),
          row[headersMap["卖家备注"]],
        ];
        newWorkSheet.push(newRow);
      });
    });

    pinduoduoFiles.forEach((file) => {
      const workSheets = xlsx.parse(file);
      const headers = workSheets[0].data[0];
      const headersMap = {};
      headers.forEach((x, i) => (headersMap[x] = i));
      const data = workSheets[0].data.slice(1);
      const orderID_rows = {};
      data.forEach((row) => {
        if (!!!orderID_rows[row[headersMap["订单号"]]]) {
          orderID_rows[row[headersMap["订单号"]]] = [];
        }
        orderID_rows[row[headersMap["订单号"]]].push(row);
      });
      Object.entries(orderID_rows).forEach(([orderID, rows]) => {
        const row = rows[0];
        const newRow = [
          md,
          row[headersMap["订单号"]],
          row[headersMap["店铺名称"]],
          row[headersMap["收件人"]],
          row[headersMap["快递"]],
          row[headersMap["运单号"]],
          row[headersMap["数量"]],
          rows.length,
          row[headersMap["支付金额"]],
          productName(row[headersMap["规格编码"]]),
          row[headersMap["规格编码"]],
          row[headersMap["备注"]],
        ];
        newWorkSheet.push(newRow);
      });
    });

    newWorkSheet = [
      newHeaders,
      ...groupSortArrayOfArraysByIndexes(newWorkSheet.slice(1), [2, 10, 11, 6]),
    ];

    const buffer = xlsx.build(
      [
        {
          name: "Sheet1",
          data: newWorkSheet.map((row, i) => {
            row[6] = parseNumber(row[6]);
            row[7] = parseNumber(row[7]);
            row[8] = parseNumber(row[8]);
            if ((row[10] || "").includes("YZ-2500")) {
              row[6] = row[6] * 5;
              row[9] = "1斤装油炸腐竹";
            }
            return row;
          }),
        },
      ],
      {
        sheetOptions: {
          "!cols": [
            { wch: 9.64 },
            { wch: 25.98 },
            { wch: 12.64 },
            { wch: 9.81 },
            { wch: 11.64 },
            { wch: 21.31 },
            { wch: 11.64 },
            { wch: 11.64 },
            { wch: 10.98 },
            { wch: 16.14 },
            { wch: 13.64 },
            { wch: 50 },
          ],
        },
      }
    );
    try {
      fs.writeFileSync(filename, buffer);

      shell.openItem(filename);

      event.returnValue = { result: "success", outputFile: filename };
    } catch (err) {
      console.error(err);
      event.returnValue = {
        result: "程序出错，检查" + filename + "是否被占用",
      };
    }
  });
});
function groupSortArrayOfArraysByIndexes(arrayOfArrays, orderByIndexes) {
  if (orderByIndexes.length === 0) {
    return arrayOfArrays.slice();
  }

  const [currentIndex, ...remainingIndexes] = orderByIndexes;

  // 先根据当前索引排序
  const sortedArrayOfArrays = arrayOfArrays.slice().sort((a, b) => {
    return a[currentIndex] < b[currentIndex]
      ? -1
      : a[currentIndex] > b[currentIndex]
      ? 1
      : 0;
  });

  // 进行分组
  const groups = sortedArrayOfArrays.reduce((acc, item) => {
    const key = item[currentIndex];
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

  // 对每个分组递归地应用分组排序
  const sortedGroups = Object.values(groups).map((group) => {
    return groupSortArrayOfArraysByIndexes(group, remainingIndexes);
  });

  // 合并排序后的分组并返回结果
  return [].concat(...sortedGroups);
}

function sortArrayOfArraysByIndex(arrayOfArrays, index) {
  // 创建一个原数组的副本
  const arrayOfArraysCopy = arrayOfArrays.slice();

  // 在副本上进行排序并返回结果
  return arrayOfArraysCopy.sort((a, b) => {
    return a[index] < b[index] ? -1 : a[index] > b[index] ? 1 : 0;
  });
}

function parseNumber(str) {
  if (typeof str === "number") return str;
  const regex = /[+-]?\d+(\.\d+)?/;
  const match = regex.exec(str);
  return match ? Number(match[0]) : str;
}

function productName(info, remark) {
  if (
    (info.includes("未油炸") && info.includes("5斤")) ||
    info.includes("可油炸") ||
    (remark || "").includes("切片竹")
  ) {
    return "5斤装切片竹";
  }
  if (info.toLowerCase().includes("YZ-500g".toLowerCase())) {
    return "1斤装油炸腐竹";
  }
  if (info.toLowerCase().includes("YZ-2500g".toLowerCase())) {
    return "5斤装油炸腐竹";
  }
  if (info.toLowerCase().includes("YZ-100g".toLowerCase())) {
    return "100G油炸腐竹";
  }
  return "1斤装油炸腐竹";
}

function productCode(info, remark) {
  if (
    (info.includes("未油炸") && info.includes("5斤")) ||
    info.includes("可油炸") ||
    (remark || "").includes("切片竹")
  ) {
    return "QPZ-2500";
  }
  if (info.toLowerCase().includes("YZ-100g".toLowerCase())) {
    return "YZ-100G";
  }
  return "YZ-500G";
}

ipcMain.on("wangjun-form-aggregate-files-selected", (event, _data) => {
  const date = new Date();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const filename = `${app.getPath("desktop")}/王君-${m}月${d}日.xlsx`;

  dialog.showSaveDialog({ defaultPath: filename }, (filename) => {
    const { wangjunFile } = _data;

    const workSheets = xlsx.parse(wangjunFile);
    const headers = workSheets[0].data[0];
    const headersMap = {};
    headers.forEach((x, i) => (headersMap[x] = i));
    const data = workSheets[0].data.slice(1);

    const newHeaders =
      `收件人姓名	收件人手机	收件人电话	所在省份	所在城市	所在地区	详细地址	寄件人姓名	寄件人电话	寄件人地址	快递公司	运单号	商品总数量	实付价格	卖家备注`.split(
        "\t"
      );
    const newWorkSheet = [newHeaders];
    data.forEach((row) => {
      if (row[headersMap["寄件人姓名"]].includes("王君"))
        newWorkSheet.push(newHeaders.map((k) => row[headersMap[k]] || ""));
    });
    const buffer = xlsx.build([{ name: "Sheet1", data: newWorkSheet }]);
    try {
      fs.writeFileSync(filename, buffer);
      shell.openItem(filename);
      event.returnValue = { result: "success", outputFile: filename };
    } catch (err) {
      console.error(err);
      event.returnValue = {
        result: "程序出错，检查" + filename + "是否被占用",
      };
    }
  });
});

ipcMain.on("wangjun-wechat-handle", (event, data) => {
  const date = new Date();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const filename = `${app.getPath(
    "desktop"
  )}/王君-快递信息表-${m}月${d}日.xlsx`;

  dialog.showSaveDialog({ defaultPath: filename }, (filename) => {
    const { wechat } = data;
    const newHeaders =
      `收件人姓名（必填）	收件人手机（二选一）	收件人电话（二选一）	收件人地址（必填）	备注`.split(
        "\t"
      );
    const newWorkSheet = [newHeaders];

    const rows = wechat.split("\n");
    rows.forEach((row, i) => {
      // 长度大于20则大概率是快递地址
      if (row.length > 20) {
        const { mobile, name, addr } = decompose(row);
        if (mobile && name && addr) {
          try {
            let jing = 1;
            let bao = 1;
            let qpz = false;
            const matchJing = /(\d+)斤/.exec(rows[i + 1]);
            const matchBao = /(\d+)包/.exec(rows[i + 1]);
            const matchQPZ = /切片竹/.exec(rows[i + 1]);
            if (matchJing) {
              jing = Number.parseInt(matchJing[1]);
            }
            if (matchBao) {
              bao = Number.parseInt(matchBao[1]);
            }
            if (matchQPZ) {
              qpz = true;
            }
            let info = `${500 * jing}g * ${bao}`;
            if (qpz) {
              info = `切片竹 ${bao}包`;
            }
            newWorkSheet.push([
              name,
              mobile.length === 11 ? mobile : "",
              mobile.length !== 11 ? mobile : "",
              addr,
              info,
            ]);
          } catch (err) {}
        }
      }
    });

    try {
      const buffer = xlsx.build([{ name: "Sheet1", data: newWorkSheet }]);

      fs.writeFileSync(filename, buffer);
      shell.openItem(filename);
      event.returnValue = { result: "success", outputFile: filename };
    } catch (err) {
      console.error(err);
      event.returnValue = {
        result: "程序出错，检查" + filename + "是否被占用",
      };
    }
  });
});
function decompose(string) {
  let compose = {};

  let search = [
    "收货地址",
    "详细地址",
    "地址",
    "收货人",
    "收件人",
    "收货",
    "所在地区",
    "邮编",
    "电话",
    "手机号码",
    "身份证号码",
    "身份证号",
    "身份证",
    "：",
    ":",
    "；",
    ";",
    "，",
    ",",
    "。",
  ];
  let replace = [
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
  ];
  string = string.replace(search, replace);

  string = string.replace(/\s{1,}/g, " ");

  string = string.replace(/0?(\d{3})-(\d{4})-(\d{4})([-_]\d{1,})/g, "$1$2$3$4");

  let match = string.match(/\d{18}|\d{17}X/i);
  if (match && match[0]) {
    compose.idn = match[0].toUpperCase();
    string = string.replace(match[0], "");
  }

  match = string.match(/\d{7,11}[\-_]\d{2,6}|\d{7,11}|\d{3,4}-\d{6,8}/);
  if (match && match[0]) {
    compose.mobile = match[0];
    string = string.replace(match[0], "");
  }

  match = string.match(/\d{6}/);
  if (match && match[0]) {
    compose.postcode = match[0];
    string = string.replace(match[0], "");
  }

  string = string.trim().replace(/ {2,}/g, " ");

  let split_arr = string.split(" ");
  if (split_arr.length > 1) {
    compose.name = split_arr[0];
    for (let value of split_arr) {
      if (value.length < compose.name.length) {
        compose.name = value;
      }
    }
    string = string.trim().replace(compose.name, "");
  }

  compose.addr = string;

  return compose;
}
ipcMain.on("shouhou-handle", async (event, _data) => {
  const { shouhouOrder, shouhouFileList, shouhouFanxianFileList } = _data;
  const filename = shouhouOrder;

  const orderID_shouhou = {};
  // xlsx
  //   .parse(shouhou)[0]
  //   .data.slice(1)
  //   .reduce((map, row) => {
  //     map[row[1]] = row;
  //   }, {});
  const orderID_fanxian = {};
  // xlsx
  //   .parse(shouhouFanxian)[0]
  //   .data.slice(1)
  //   .reduce((map, row) => {
  //     map[row[0]] = row;
  //   }, {});

  shouhouFileList.forEach((file) => {
    const workSheets = xlsx.parse(file);
    const workSheet = workSheets[0].data;
    workSheet.slice(1).forEach((row, i) => {
      orderID_shouhou[row[1]] = row;
    });
  });

  // for (let i = 0; i < shouhouFanxianFileList.length; i++) {
  //   const file = shouhouFanxianFileList[i];
  //   const workSheet = await readCsvFile(file);
  //   workSheet.slice(5).forEach((row, i) => {
  //     orderID_fanxian[row[0]] = row;
  //   });
  // }

  // console.log(orderID_fanxian)

  shouhouFanxianFileList.forEach((file) => {
    const workSheets = xlsx.parse(file);
    const workSheet = workSheets[0].data;
    workSheet.slice(5).forEach((row, i) => {
      orderID_fanxian[row[0]] = row;
    });
  });

  dialog.showSaveDialog({ defaultPath: filename }, (filename) => {
    // const workbook = XLSX.readFile(shouhouOrder);
    // const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const workSheets = xlsx.parse(shouhouOrder);
    const data = workSheets[0].data;

    let maxLength = Math.max(...data.map((row) => row.length));
    data.forEach((row) => {
      while (row.length < maxLength) {
        row.push("");
      }
    });

    data.forEach((row, i) => {
      if (i === 0) {
        row.push("售后", "返现");
        // sheet[XLSX.utils.encode_cell({ c: row.length, r: i })] = {
        //   t: "s",
        //   v: "售后",
        // };
        // sheet[XLSX.utils.encode_cell({ c: row.length + 1, r: i })] = {
        //   t: "s",
        //   v: "返现",
        // };
      } else {
        if (orderID_shouhou[row[1]]) {
          row.push(
            `退款金额：${orderID_shouhou[row[1]][7]}；原因：；售后状态：${
              orderID_shouhou[row[1]][15]
            }`
          );
          // sheet[XLSX.utils.encode_cell({ c: row.length, r: i })] = {
          //   t: "s",
          //   v: `退款金额：${orderID_shouhou[row[1]][7]}；原因：；售后状态：${
          //     orderID_shouhou[row[1]][15]
          //   }`,
          // };
        } else {
          row.push("");
          // sheet[XLSX.utils.encode_cell({ c: row.length, r: i })] = {
          //   t: "s",
          //   v: "",
          // };
        }
        if (orderID_fanxian[row[1]]) {
          row.push(orderID_fanxian[row[1]][3]);
          // sheet[XLSX.utils.encode_cell({ c: row.length + 1, r: i })] = {
          //   t: "n",
          //   v: orderID_fanxian[row[1]][3],
          // };
        } else {
          row.push("");
          // sheet[XLSX.utils.encode_cell({ c: row.length + 1, r: i })] = {
          //   t: "s",
          //   v: "",
          // };
        }
      }
    });

    try {
      // XLSX.writeFile(workbook, filename);
      const buffer = xlsx.build(workSheets);
      fs.writeFileSync(filename, buffer);
      shell.openItem(filename);
      event.returnValue = { result: "success", outputFile: filename };
    } catch (err) {
      console.error(err);
      event.returnValue = {
        result: "程序出错，检查" + filename + "是否被占用",
      };
    }
  });
});

async function readCsvFile(filePath) {
  const results = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(Object.values(data)))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
}
