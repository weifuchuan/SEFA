const FilterWord = [
  "身份证号",
  "地址",
  "收货人",
  "收件人",
  "收货",
  "邮编",
  "电话",
  "手机",
  "手机号",
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
  ".",
];
function decompose(info, str) {
  //1. 过滤掉收货地址中的常用说明字符，排除干扰词
  for (let i = 0; i < filterWord.length; i++) {
    str = str.replace(new RegExp(filterWord[i], "g"), " ");
  }

  //2. 多个空白字符(包括空格\r\n\t)换成一个空格
  str = str.replace(/\s+/g, " ").trim();

  //3. 去除手机号码中的短横线 如0136-3333-6666 主要针对苹果手机
  str = str.replace(/0?(\d{3})-(\d{4})-(\d{4})([-_]\d{2,})/g, "$1$2$3$4");

  //4. 提取中国境内身份证号码
  const idReg = /(?i)\d{18}|\d{17}X/g;
  const idNumber = str.match(idReg);
  str = str.replace(idReg, "");
  info.IdNumber = idNumber ? idNumber[0].toUpperCase() : "";

  //5. 提取11位手机号码或者7位以上座机号，支持虚拟号的提取
  const phoneReg = /\d{7,11}[\-_]\d{2,6}|\d{7,11}|\d{3,4}-\d{6,8}/g;
  const mobile = str.match(phoneReg);
  str = str.replace(phoneReg, "");
  info.Mobile = mobile ? mobile[0] : "";

  //6. 提取6位邮编 邮编也可用后面解析出的省市区地址从数据库匹配出
  const postcodeReg = /\d{6}/g;
  const postcode = str.match(postcodeReg);
  str = str.replace(postcodeReg, "");
  info.PostCode = postcode ? postcode[0] : "";

  //再次把2个及其以上的空格合并成一个，并首位TRIM
  str = str.replace(/ {2,}/g, " ").trim();

  //7. 按照空格切分 长度长的为地址 短的为姓名 因为不是基于自然语言分析，所以采取统计学上高概率的方案
  const splitStr = str.split(" ");
  let name = splitStr[0];
  for (let i = 0; i < splitStr.length; i++) {
    if (splitStr[i].length < name.length) {
      name = splitStr[i];
    }
  }

  if (splitStr.length <= 1) {
    info.Address = splitStr[0];
    return info;
  }

  info.Name = name;
  const address = str.replace(name, "").trim();
  info.Address = address;

  return info;
}
function parse(address) {
  const areaMap = {
    // Define your area map here
  };

  // 匹配所有省级
  const pReg = /.+?(省|市|自治区|特别行政区|区)/g;
  const pArr = address.match(pReg) || [];

  // 匹配所有市级
  // 由于该匹配可能会遗漏部分，所以合并省级匹配
  const cReg = /.+?(省|市|自治州|州|地区|盟|县|自治县|区|林区)/g;
  const cArr = (address.match(cReg) || []).concat(pArr);

  // 匹配所有区县级
  // 由于该匹配可能会遗漏部分(如：东乡区)所以合并市级匹配
  const rReg = /.+?(市|县|自治县|旗|自治旗|区|林区|特区|街道|镇|乡)/g;
  const rArr = (address.match(rReg) || []).concat(cArr);

  // 处理区县级
  for (const r of rArr) {
    if (r in areaMap.RegionByName && areaMap.RegionByName[r].length === 1) {
      const region = areaMap.RegionByName[r][0];
      address.Region = region.Name;
      address.PostCode = String(region.Zipcode);
      getAddressById(address, region.Pid, city);
      break;
    } else if (r in areaMap.RegionByName) {
      for (const r2 of areaMap.RegionByName[r]) {
        address.Region = r2.Name;
        address.PostCode = String(r2.Zipcode);
        getAddressById(address, r2.Pid, city);
        for (const v of cArr) {
          if (address.City === v) {
            break;
          }
        }
      }
    }
  }

  // 处理市级
  if (!address.City) {
    for (const c of cArr) {
      if (c in areaMap.CityByName) {
        const city = areaMap.CityByName[c][0];
        address.City = city.Name;
        address.PostCode = String(city.Zipcode);
        getAddressById(address, city.Pid, province);
        getAddressByPid(address, city.Id, region, rArr);
        break;
      }
    }
  }

  // 处理省级
  if (!address.Province) {
    for (const p of pArr) {
      if (p in areaMap.ProvinceByName) {
        const province = areaMap.ProvinceByName[p][0];
        address.Province = province.Name;
        getAddressByPid(address, province.Id, city, cArr);
        getAddressByPid(address, province.Id, region, rArr);
        break;
      }
    }
  }

  return address;
}
