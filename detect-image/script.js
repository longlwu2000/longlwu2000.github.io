// Lưu trữ danh sách các file đã chọn
const selectedFiles = new Map();

// Danh sách người dùng mặc định
const defaultUserList = [];

// Cấu hình API
const API_ENDPOINT =
  "https://webvideo-caster-longlwu2000-bd6ce391.koyeb.app/analyze-image";
const API_KEY = "AIzaSyBeo4NGA__U6Xxy-aBE6yFm19pgq8TY-TM";
const ConfigTableIndex = {
  name: 1,
  money: 2,
  tip: 3,
};
let MoneyDatas;
let userList = [...defaultUserList]; // Khởi tạo từ danh sách mặc định

// Hàm cập nhật select với danh sách người dùng
function updateUserSelect() {
  const userSelect = document.getElementById("userName");
  userSelect.innerHTML = '<option value="">-- Chọn tên của bạn --</option>';
  if (MoneyDatas) {
    userList = [];
    for (const [name, data] of MoneyDatas) {
      userList.push(name.toUpperCase());
    }
    console.log("Danh sách người dùng:", userList);
  }
  userList.sort().forEach((user) => {
    const checkNameRegex = /^[a-zA-Z\s]+$/g; // Regex để kiểm tra tên hợp lệ
    if (!checkNameRegex.test(user)) {
      return;
    }
    const option = document.createElement("option");
    option.value = user;
    option.textContent = user;
    userSelect.appendChild(option);
  });
}
// Thiết lập các sự kiện cho trang
function setupDragAndDrop() {
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const analyzeButton = document.getElementById("analyzeButton");
  const createSalaryButton = document.getElementById("createSalaryButton");
  const userNameInput = document.getElementById("userName");
  const clearAllButton = document.getElementById("clearAllButton");
  // Xử lý sự kiện xóa tất cả
  clearAllButton.addEventListener("click", () => {
    if (confirm("Bạn có chắc chắn muốn xóa tất cả hình ảnh?")) {
      selectedFiles.clear();
      const fileList = document.getElementById("fileList");
      fileList.innerHTML = "";
      analyzeButton.disabled = true;
      clearAllButton.disabled = true;
      // clear input
      fileInput.value = "";
    }
  });

  // Xử lý sự kiện chọn tên
  userNameInput.addEventListener("change", () => {
    createSalaryButton.disabled = !userNameInput.value;
  });

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    handleFiles(e.dataTransfer.files);
  });

  fileInput.addEventListener("change", (e) => {
    handleFiles(e.target.files);
  });

  analyzeButton.addEventListener("click", processAllImages);
}

// Xử lý các file được chọn
function handleFiles(files) {
  const fileList = document.getElementById("fileList");
  const analyzeButton = document.getElementById("analyzeButton");
  const clearAllButton = document.getElementById("clearAllButton");

  Array.from(files).forEach((file) => {
    if (file.type.startsWith("image/")) {
      const fileId = Date.now() + "-" + Math.random().toString(36).substr(2, 9);
      selectedFiles.set(fileId, file);

      const fileItem = document.createElement("div");
      fileItem.className = "file-item";
      fileItem.id = `file-${fileId}`;

      // Tạo preview ảnh
      const reader = new FileReader();
      reader.onload = (e) => {
        fileItem.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <div class="file-info">
                        <div>${file.name}</div>
                        <div class="progress-bar">
                            <div class="progress" id="progress-${fileId}"></div>
                        </div>
                    </div>
                    <button class="remove-file" onclick="removeFile('${fileId}')">×</button>
                `;
      };
      reader.readAsDataURL(file);

      fileList.appendChild(fileItem);
    }
  });

  const hasFiles = selectedFiles.size > 0;
  analyzeButton.disabled = !hasFiles;
  clearAllButton.disabled = !hasFiles;
}

// Xóa file khỏi danh sách
function removeFile(fileId) {
  selectedFiles.delete(fileId);
  document.getElementById(`file-${fileId}`).remove();
  const hasFiles = selectedFiles.size > 0;
  document.getElementById("analyzeButton").disabled = !hasFiles;
  document.getElementById("clearAllButton").disabled = !hasFiles;
}

// tìm row col chứa ngày tháng trong bảng
function findDatesInTable(tableData) {
  const datePatterns = [/(\d{1,2}-\d{1,2}-\d{4})/, /(\d{1,2}\/\d{1,2}\/\d{4})/];
  const datePattern = new RegExp(
    datePatterns.map((p) => p.source).join("|"),
    "g"
  );

  for (let row = 0; row < tableData.length; row++) {
    for (let col = 0; col < tableData[row].length; col++) {
      const cellText = tableData[row][col];
      if (datePattern.test(cellText)) {
        console.log(`Tìm thấy ô ngày tháng tại hàng ${row}, cột ${col}`);
        return { row, col };
      }
    }
  }
  console.log("Không tìm thấy ô ngày tháng trong bảng.");
  return { row: -1, col: -1 };
}

// Xử lý và phân tích tất cả ảnh
async function processAllImages() {
  MoneyDatas = undefined;
  const analyzeButton = document.getElementById("analyzeButton");
  const createSalaryButton = document.getElementById("createSalaryButton");
  analyzeButton.disabled = true;
  const base64Images = [];
  try {
    for (const [fileId, file] of selectedFiles) {
      const progressBar = document.getElementById(`progress-${fileId}`);
      progressBar.style.width = "30%";

      // Chuyển ảnh thành base64
      const base64Image = await convertToBase64(file);
      progressBar.style.width = "50%";

      base64Images.push(base64Image);
      // Cập nhật tiến độ
      progressBar.style.width = "80%";
    }

    // Gọi API Vision
    const result = await analyzeImage(base64Images);

    // Xử lý và hiển thị kết quả
    console.log(result);
    if (result?.data?.responses?.length) {
      const listRes = result.data.responses.map((res) => res.textAnnotations);
      console.log(listRes);
      let index = 0;
      let tables = [];
      let moneyDatas;
      for (const [fileId, file] of selectedFiles) {
        const progressBar = document.getElementById(`progress-${fileId}`);
        progressBar.style.width = "100%";
        let { tableData, maxColumns } = analyzeAndDisplayTable(
          listRes[index],
          fileId
        );
        console.log("rawtable", tableData[0]);

        console.log("cleanTableData", cleanTableData(tableData));

        if (tableData)
          tables.push({
            tableData: cleanTableData(tableData),
            maxColumns,
          });
        index++;
      }

      // sort table by first row second col (type date, so use momentjs)
      tables.sort((a, b) => {
        const { row: rowA, col: colA } = findDatesInTable(a.tableData);
        const { row: rowB, col: colB } = findDatesInTable(b.tableData);
        if (rowA === -1 || rowB === -1) return 0;
        const dateA = a.tableData[rowA][colA];
        const dateB = b.tableData[rowB][colB];

        return moment(dateA, "DD-MM-YYYY").isBefore(moment(dateB, "DD-MM-YYYY"))
          ? -1
          : 1;
      });
      resetModal();
      tables.forEach(({ tableData, maxColumns }, index) => {
        const splitData = splitDataByName(structuredClone(tableData));
        const { row: dateRow, col: dateCol } = findDatesInTable(tableData);
        const dateKey =
          dateRow !== -1 ? tableData[dateRow][dateCol] : `File ${index + 1}`;
        addTableToResults({ tableData, maxColumns }, dateKey);

        moneyDatas = analyzeDataForCharge(splitData, dateKey, moneyDatas);
        console.log("moneyDatas", moneyDatas);
      });
      MoneyDatas = moneyDatas;
      updateUserSelect();
      return moneyDatas;
    }
    resultsContainer.innerHTML = "<p>Không có dữ liệu để hiển thị.</p>";
    return;
  } catch (error) {
    console.error("Error processing images:", error);
    alert("Có lỗi xảy ra khi xử lý ảnh. Vui lòng thử lại.");
  } finally {
    analyzeButton.disabled = false;
  }
}

// Chuyển file ảnh thành base64
function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result.split(",")[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Gọi API Vision để phân tích ảnh
async function analyzeImage(base64Images) {
  const response = await fetch(`${API_ENDPOINT}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
    },
    body: JSON.stringify({
      base64: base64Images,
      type: "DOCUMENT_TEXT_DETECTION",
    }),
  });

  if (!response.ok) {
    throw new Error("API request failed");
  }

  return await response.json();
}

// Phân tích và hiển thị bảng từ kết quả
function analyzeAndDisplayTable(textAnnotations, fileId) {
  console.log("Phân tích kết quả cho file:", textAnnotations);
  let table = [];
  textAnnotations = textAnnotations.slice(1);
  const words = prepareOcrWords(textAnnotations);
  return groupAndMergeRows(words, 10, 5);
}

// Create table HTML
function createTableHTML(table) {
  let html = "<table>";
  table.forEach((row) => {
    html += "<tr>";
    row.forEach((cell) => {
      html += `<td class="text-cell">${cell}</td>`;
    });
    html += "</tr>";
  });
  html += "</table>";
  return html;
}

function showModal(show = true) {
  const modal = document.getElementById("review-data");
  modal.style.display = show ? "block" : "none";
}

// Modal handling functions
function setupModal() {
  const modal = document.getElementById("review-data");
  const closeBtn = modal.querySelector(".close-modal");
  const cancelBtn = document.getElementById("cancel-data");
  const confirmBtn = document.getElementById("confirm-data");
  const openReviewDataButton = document.getElementById("openReviewDataButton");

  openReviewDataButton.onclick = () => {
    showModal(true);
  };

  closeBtn.onclick = () => showModal(false);
  cancelBtn.onclick = () => showModal(false);
  window.onclick = (event) => {
    if (event.target === modal) {
      showModal(false);
    }
  };

  confirmBtn.onclick = () => {
    showModal(false);
  };

  // Initially disable the review button since there's no data
  openReviewDataButton.disabled = true;
}

function addTableToResults({ tableData, maxColumns }, name) {
  const modalTitle = document.getElementById("modal-title");
  const tableContent = `
    <h3>${name}</h3>
    ${generateHtmlTable(tableData, maxColumns)}
  `;

  modalTitle.textContent = `Kết quả phân tích`;
  const modalTableContainer = document.getElementById("modal-table-container");
  modalTableContainer.appendChild(document.createElement("div"));
  modalTableContainer.lastChild.innerHTML = tableContent;
  // Enable/disable the review button based on whether there's data
  const openReviewDataButton = document.getElementById("openReviewDataButton");
  openReviewDataButton.disabled = !modalTableContainer.innerHTML;
}

function resetModal() {
  const modalTableContainer = document.getElementById("modal-table-container");
  modalTableContainer.innerHTML = "";
}

// Chia data theo name của từng người
// Rule:
// Sau khi gặp hàng có label "name/tên", mỗi hàng tiếp theo sẽ được xem xét:
// - Nếu ô đầu tiên (hoặc ô chứa tên) không có số và có độ dài hợp lệ -> đó là tên mới
// - Hàng đó và các hàng tiếp theo (cho đến khi gặp tên mới hoặc hàng trống) thuộc về người đó
function splitDataByName(table) {
  const dataByName = new Map();
  let currentName = null;
  let isAfterNameLabel = false;

  for (let i = 0; i < table.length; i++) {
    const rawRow = Array.isArray(table[i]) ? table[i] : [];
    const row = rawRow.map((c) => (c ?? "").toString().trim());
    const rowText = row.join(" ").trim();

    // empty row => end current name block
    if (!rowText) {
      currentName = null;
      continue;
    }

    // detect a "name" label in any cell (e.g. "name", "tên")
    const hasNameLabel = row.some((cell) =>
      /\b(name|tên)\b/i.test(cell.toLowerCase())
    );

    if (hasNameLabel) {
      isAfterNameLabel = true;
      currentName = null;
      continue;
    }

    // Nếu đã qua hàng label "name/tên"
    if (isAfterNameLabel) {
      // Kiểm tra ô đầu tiên có trống không
      const firstCell = row[0];

      // Nếu ô đầu tiên trống, dừng vòng lặp
      if (!firstCell || firstCell.trim() === "") {
        break;
      }

      // Kiểm tra xem có phải là hàng tổng kết không (chứa từ khóa như TONG, TOTAL, SUM, v.v.)
      const isSummaryRow =
        /^(tong|total|sum|tổng|huione|aba|in|bill|tiền|mặt)/i.test(firstCell);
      if (isSummaryRow) {
        break;
      }

      const isNewName =
        !/\d/.test(firstCell) && firstCell.length > 1 && firstCell.length <= 30;

      if (isNewName) {
        // Đây là một tên mới
        currentName = firstCell.trim().toLowerCase();
        if (currentName.includes("chính")) {
          currentName = "chinh";
        }
        if (!dataByName.has(currentName)) {
          dataByName.set(currentName, []);
        }
        // Thêm hàng này vào data của người đó
        dataByName.get(currentName).push(row);
      } else if (currentName && dataByName.has(currentName)) {
        // Không phải tên mới, thêm vào data của người hiện tại
        dataByName.get(currentName).push(row);
      }
    }
  }

  return dataByName;
}

// analyze data to get money in data (ví dụ: 50$ ( boss888 / huione ) + 50$ ( boss222 / inbill ) + 50$ ( boss222 / tm )
// Chỉ lấy các giá trị đi kèm với ký tự $ (hoặc có thể là S)
//Data truyền vào có kiểu dữ liệu như dataByName
// function analyzeDataForMoney(data, dataKey, moneyDatas) {
//   const moneyData = moneyDatas ?? new Map();
//   // số có chứa dấu phẩy là số thập phân, dấu chấm là để phân cách hàng nghìn
//   const parsedMoneyRegex = /(\d{1,3}(?:\.\d{3})*(?:,\d+)?\s*[$S])/g;

//   data.forEach((rows) => {
//     rows.forEach((row) => {
//       const name = row[ConfigTableIndex.name - 1];
//       const money = row[ConfigTableIndex.money - 1];
//       const tip = row[ConfigTableIndex.tip - 1];
//       if (name && money) {
//         const trimName = name.trim().toLowerCase();
//         const moneyMatch = money
//           .match(parsedMoneyRegex)
//           ?.map((m) =>
//             parseFloat(
//               m.replace(/[$S]/, "").replace(/\./, "").replace(/\,/, ".")
//             )
//           );
//         const tipMatch = tip
//           ? tip
//               .match(parsedMoneyRegex)
//               ?.map((m) =>
//                 parseFloat(
//                   m.replace(/[$S]/, "").replace(/\./, "").replace(/\,/, ".")
//                 )
//               )
//           : [];
//         // console.log("tipMatch", tipMatch);

//         if (moneyMatch) {
//           if (!moneyData.has(trimName)) {
//             moneyData.set(trimName, []);
//           }
//           let totalMoney = moneyMatch.reduce(
//             (sum, m) => sum + parseFloat(m),
//             0
//           );
//           let restMoney = totalMoney % 50;
//           totalMoney -= restMoney;
//           let totalTip = tipMatch
//             ? tipMatch.reduce((sum, t) => sum + parseFloat(t), 0)
//             : 0;
//           totalTip += restMoney;
//           moneyData.get(trimName).push({
//             dataKey: dataKey,
//             money: moneyMatch,
//             tip: tipMatch || [],
//             totalMoney: totalMoney,
//             totalTip: totalTip,
//             isDayOff: false,
//             message: "",
//           });
//         } else {
//           if (!moneyData.has(trimName)) {
//             moneyData.set(trimName, []);
//           }
//           moneyData.get(trimName).push({
//             dataKey: dataKey,
//             money: [],
//             tip: [],
//             totalMoney: 0,
//             totalTip: 0,
//             isDayOff: money.toLowerCase().includes("off"),
//             message: money,
//           });
//         }
//       }
//     });
//   });

//   return moneyData;
// }

function analyzeDataForCharge(data, dataKey, moneyDatas) {
  const moneyData = moneyDatas ?? new Map();
  // Regex để tìm số tiền (có dấu $ hoặc S)
  const moneyRegex = /(\d{1,3}(?:\.\d{3})*(?:,\d+)?)\s*[$S]/gi;
  // Regex để tìm tên bảng (nằm trong dấu ngoặc đơn)
  const tableNameRegex = /\(([^)]+)\)/g;

  // Lặp qua từng entry trong splitData Map
  data.forEach((rows, name) => {
    // Khởi tạo mảng cho người này nếu chưa có
    if (!moneyData.has(name)) {
      moneyData.set(name, []);
    }

    // Map để nhóm charges theo tableName
    const chargesByTable = new Map();
    let hasData = false;
    let isDayOff = false;

    // Lặp qua từng row của người này
    rows.forEach((row) => {
      // Bỏ qua hàng đầu tiên (tên)
      const dataColumns = row.slice(1); // Lấy các cột từ cột thứ 2 trở đi

      // Kiểm tra xem có dữ liệu không
      const rowText = dataColumns.join(" ").trim().toLowerCase();

      // Kiểm tra day off
      if (rowText.includes("off")) {
        isDayOff = true;
        return;
      }

      // Xử lý từng cột dữ liệu
      dataColumns.forEach((cell) => {
        if (!cell || cell.trim() === "") return;

        const cellText = cell.trim();

        // Tìm tất cả số tiền trong cell
        const moneyMatches = [...cellText.matchAll(moneyRegex)];
        // Tìm tất cả tên bảng trong cell
        const tableNameMatches = [...cellText.matchAll(tableNameRegex)];

        // Nếu có số tiền
        if (moneyMatches.length > 0) {
          hasData = true;

          moneyMatches.forEach((moneyMatch, index) => {
            const moneyStr = moneyMatch[1];
            // Chuyển đổi số tiền: dấu chấm là phân cách nghìn, dấu phẩy là thập phân
            const money = parseFloat(
              moneyStr.replace(/\./g, "").replace(/,/g, ".")
            );

            // Lấy tên bảng tương ứng (nếu có)
            const tableName = tableNameMatches[index]
              ? tableNameMatches[index][1].trim()
              : "Unknown";

            // Nhóm theo tableName
            if (!chargesByTable.has(tableName)) {
              chargesByTable.set(tableName, []);
            }
            chargesByTable.get(tableName).push(money);
          });
        }
      });
    });

    // Tạo object cho dataKey này
    const dayData = {
      dataKey: dataKey,
      charges: [],
      totalMoney: 0,
      totalTip: 0,
      isDayOff: false,
    };

    // Nếu là ngày off hoặc không có data
    if (isDayOff) {
      dayData.isDayOff = true;
    } else {
      // Tính toán cho từng bảng
      let grandTotalMoney = 0;
      let grandTotalTip = 0;

      chargesByTable.forEach((moneyList, tableName) => {
        // Tổng tiền của bảng này
        const tableTotal = moneyList.reduce((sum, m) => sum + m, 0);

        // Tính phần money (chia cho 50, lấy phần nguyên nhân 50)
        const tableMoney = Math.floor(tableTotal / 50) * 50;

        // Phần dư chuyển sang tip
        const tableTip = tableTotal - tableMoney;

        // Thêm vào charges
        dayData.charges.push({
          tableName: tableName,
          money: tableMoney,
          tip: tableTip,
          total: tableTotal,
        });

        // Cộng vào tổng
        grandTotalMoney += tableMoney;
        grandTotalTip += tableTip;
      });

      dayData.totalMoney = grandTotalMoney;
      dayData.totalTip = grandTotalTip;
    }

    // Thêm dữ liệu ngày này vào mảng của người
    moneyData.get(name).push(dayData);
  });

  return moneyData;
}

// tạo bảng tiền lương (datakey,money, tip) của từng người và thêm vào results container
function createSalaryTable(moneyData, Name) {
  const resultsContainer = document.getElementById("results-container");
  // get money data for specific name
  const data = moneyData.get(Name);
  if (!data) return;
  const totalMoney = data.reduce((sum, item) => sum + item.totalMoney, 0);
  const totalTip = data.reduce((sum, item) => sum + item.totalTip, 0);
  const salaryTable = document.createElement("table");
  salaryTable.innerHTML = `
    <thead>
      <tr>
        <th>Ngày</th>
        <th>Phiếu</th>
        <th>Tiền</th>
        <th>Tip</th>
        <th>Tổng</th>
      </tr>
    </thead>
    <tbody>
      ${data
        .map(
          (item) => `
        <tr>
          <td>${item.dataKey}</td>
          <td ${ item.isDayOff ? 'colspan="4" style="background: #f8d7da;"' : ''}>${
            item.isDayOff ? '<b>OFF</b>' : Math.round(item.totalMoney / 50)
          }</td>
          <td style="display: ${item.isDayOff ? 'none' : 'table-cell'}">${item.totalMoney / 2}$ <span class="detail-data">(${
            item.totalMoney
          }$ /2  )</span></td>
          <td style="display: ${item.isDayOff ? 'none' : 'table-cell'}">${item.totalTip / 2}$ <span class="detail-data">(${
            item.totalTip
          }$ /2  )</span></td>
          <td style="display: ${item.isDayOff ? 'none' : 'table-cell'}">${
            item.totalTip / 2 + item.totalMoney / 2
          }$ <span class="detail-data">(${
            item.totalTip + item.totalMoney
          }$ /2  )</span></td>
        </tr>
      `
        )
        .join("")}
      <tr>
        <th>Tổng</th>
        <th>${Math.round(totalMoney / 50)}</th>
        <th>${
          totalMoney / 2
        }$ <span class="detail-data">(${totalMoney}$ /2  )</span></th>
        <th>${
          totalTip / 2
        }$ <span class="detail-data">(${totalTip}$ /2  )</span></th>
        <th>${totalTip / 2 + totalMoney / 2}$ <span class="detail-data">(${
    totalTip + totalMoney
  }$ /2  )</span></th>
      </tr>
    </tbody>
  `;
  resultsContainer.innerHTML = ""; // Xóa nội dung cũ
  resultsContainer.appendChild(
    document.createElement("b")
  ).innerHTML = `Bảng lương cho ${Name.toUpperCase()} (Đã chia) <button type="button" id="toggleDetails" class="btn btn-light"><i class="fad fa-exchange-alt"></i></button>`;
  resultsContainer.appendChild(salaryTable);
  const btnToggleDetailsButton = document.getElementById("toggleDetails");

  btnToggleDetailsButton.addEventListener("click", () => {
    const detailDatas = document.querySelectorAll(".detail-data");
    detailDatas.forEach((data) => {
      data.style.display = data.style.display === "none" ? "inline" : "none";
    });
  });
}

// Khởi tạo khi trang tải xong
document.addEventListener("DOMContentLoaded", () => {
  setupDragAndDrop();
  setupModal();
  // Thêm sự kiện cho nút tạo bảng lương
  const createSalaryButton = document.getElementById("createSalaryButton");
  createSalaryButton.addEventListener("click", () => {
    // get user name
    const userName = document
      .getElementById("userName")
      .value.trim()
      .toLowerCase();
    if (!userName) {
      alert("Vui lòng nhập tên của bạn");
      return;
    }
    if (!MoneyDatas) {
      // alert("Không có dữ liệu để tạo bảng lương.");
      return;
    }
    createSalaryTable(MoneyDatas, userName);
  });
});
