console.log(
  self_decompose(
    "曹彤 15632608594-2353 河北省廊坊市三河市燕郊经济技术开发区潮白人家星光公管，10-1-1104"
  )
);

function self_smart(string, user = true) {
  let re;
  if (user) {
    let decompose = self_decompose(string);
    console.log("decompose", decompose);
    re = decompose;
  } else {
    re = { addr: string };
  }

  let fuzz = self_fuzz(re.addr);
  let parse = self_parse(fuzz.a1, fuzz.a2, fuzz.a3);

  re.province = parse.province;
  re.city = parse.city;
  re.region = parse.region;

  re.street = fuzz.street || "";
  re.street = re.street.replace(
    [re.region, re.city, re.province],
    ["", "", ""]
  );

  return re;
}

exports.self_decompose = function self_decompose(string) {
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
};

function self_fuzz(addr) {
  let addr_origin = addr;
  addr = addr.replace([" ", ","], ["", ""]);
  addr = addr.replace("自治区", "省");
  addr = addr.replace("自治州", "州");

  addr = addr.replace("小区", "");
  addr = addr.replace("校区", "");

  let a1 = "";
  let a2 = "";
  let a3 = "";
  let street = "";

  if (
    (addr.includes("县") &&
      addr.indexOf("县") < Math.floor((addr.length / 3) * 2)) ||
    (addr.includes("区") &&
      addr.indexOf("区") < Math.floor((addr.length / 3) * 2)) ||
    (addr.includes("旗") &&
      addr.indexOf("旗") < Math.floor((addr.length / 3) * 2))
  ) {
    let deep3_keyword_pos;
    if (addr.includes("旗")) {
      deep3_keyword_pos = addr.indexOf("旗");
      a3 = addr.substr(deep3_keyword_pos - 1, 2);
    }
    if (addr.includes("区")) {
      deep3_keyword_pos = addr.indexOf("区");

      if (addr.includes("市")) {
        let city_pos = addr.indexOf("市");
        let zone_pos = addr.indexOf("区");
        a3 = addr.substr(city_pos + 1, zone_pos - city_pos);
      } else {
        a3 = addr.substr(deep3_keyword_pos - 2, 3);
      }
    }
    if (addr.includes("县")) {
      deep3_keyword_pos = addr.indexOf("县");

      if (addr.includes("市")) {
        let city_pos = addr.indexOf("市");
        let zone_pos = addr.indexOf("县");
        a3 = addr.substr(city_pos + 1, zone_pos - city_pos);
      } else {
        if (addr.includes("自治县")) {
          a3 = addr.substr(deep3_keyword_pos - 6, 7);
          if (["省", "市", "州"].includes(a3[0])) {
            a3 = a3.substr(1);
          }
        } else {
          a3 = addr.substr(deep3_keyword_pos - 2, 3);
        }
      }
    }
    street = addr_origin.substr(deep3_keyword_pos + 1);
  } else {
    if (addr.lastIndexOf("市")) {
      if (addr.split("市").length == 2) {
        deep3_keyword_pos = addr.lastIndexOf("市");
        a3 = addr.substr(deep3_keyword_pos - 2, 3);
        street = addr_origin.substr(deep3_keyword_pos + 1);
      } else if (addr.split("市").length >= 3) {
        deep3_keyword_pos = addr.lastIndexOf("市");
        a3 = addr.substr(deep3_keyword_pos - 2, 3);
        street = addr_origin.substr(deep3_keyword_pos + 1);
      }
    } else {
      a3 = "";
      street = addr;
    }
  }

  if (addr.includes("市") || addr.includes("盟") || addr.includes("州")) {
    let tmp_pos;
    if ((tmp_pos = addr.indexOf("市"))) {
      a2 = addr.substr(tmp_pos - 2, 3);
    } else if ((tmp_pos = addr.indexOf("盟"))) {
      a2 = addr.substr(tmp_pos - 2, 3);
    } else if ((tmp_pos = addr.indexOf("州"))) {
      if ((tmp_pos = addr.indexOf("自治州"))) {
        a2 = addr.substr(tmp_pos - 4, 5);
      } else {
        a2 = addr.substr(tmp_pos - 2, 3);
      }
    }
  } else {
    a2 = "";
  }

  return { a1: a1, a2: a2, a3: a3, street: street };
}

function self_parse(a1, a2, a3) {
  let a3_data = require("./data/a3.js");
  let a2_data = require("./data/a2.js");
  let a1_data = require("./data/a1.js");

  let r = {};

  if (a3 != "") {
    let area3_matches = {};
    for (let id in a3_data) {
      let v = a3_data[id];
      if (v.name.includes(a3)) {
        area3_matches[id] = v;
      }
    }

    if (area3_matches && Object.keys(area3_matches).length > 1) {
      if (a2) {
        let area2_matches = {};
        for (let id in a2_data) {
          let v = a2_data[id];
          if (v.name.includes(a2)) {
            area2_matches[id] = v;
          }
        }

        if (area2_matches) {
          for (let id in area3_matches) {
            let v = area3_matches[id];

            if (area2_matches[v.pid]) {
              r.city = area2_matches[v.pid].name;
              r.region = v.name;
              let sheng_id = area2_matches[v.pid].pid;
              r.province = a1_data[sheng_id].name;
            }
          }
        }
      } else {
        r.province = "";
        r.city = "";
        r.region = a3;
      }
    } else if (area3_matches && Object.keys(area3_matches).length == 1) {
      for (let id in area3_matches) {
        let v = area3_matches[id];
        let city_id = v.pid;
        r.region = v.name;
      }
      let city = a2_data[city_id];
      let province = a1_data[city.pid];

      r.province = province.name;
      r.city = city.name;
    } else if (Object.keys(area3_matches).length == 0 && a2 == a3) {
      let area2_matches = {};
      for (let id in a2_data) {
        let v = a2_data[id];
        if (v.name.includes(a2)) {
          area2_matches[id] = v;
          let sheng_id = v.pid;
          r.city = v.name;
        }
      }

      r.province = a1_data[sheng_id].name;
      r.region = "";
    }
  }

  return r;
}
