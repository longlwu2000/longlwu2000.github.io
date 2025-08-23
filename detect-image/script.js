// Lưu trữ danh sách các file đã chọn
const selectedFiles = new Map();

// Danh sách người dùng mặc định
const defaultUserList = [];

// Cấu hình API
const API_ENDPOINT = "https://webvideo-caster-longlwu2000-bd6ce391.koyeb.app/analyze-image";
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
        let table = analyzeAndDisplayTable(listRes[index], fileId);
        if (table) tables.push(table);
        index++;
      }
      // sort table by first row second col (type date, so use momentjs)
      tables.sort((a, b) => {
        const dateA = a[0][1] || a[0][0];
        const dateB = b[0][1] || b[0][0];
        return moment(dateA, "DD-MM-YYYY").isBefore(moment(dateB, "DD-MM-YYYY")) ? -1 : 1;
      });
      resetModal();
      tables.forEach((table, index) => {
        const splitData = splitDataByName(table);
        const dateKey = table[0][1] || table[0][0];
        const offset = table[0][1] ? 0 : -1;
        moneyDatas = analyzeDataForMoney(splitData, dateKey, offset, moneyDatas);

        addTableToResults(table, dateKey);
      });
      console.log(moneyDatas);
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

  // Tổ chức dữ liệu theo tọa độ y
  const yThreshold = 20; // Giảm ngưỡng để phân biệt dòng tốt hơn
  const rowGroups = new Map();

  // Bước 1: Nhóm dữ liệu theo dòng
  textAnnotations.forEach((anno) => {
    const text = anno.description;
    const y = anno.boundingPoly.vertices[0].y;
    const x = anno.boundingPoly.vertices[0].x || 0;
    const width = (anno.boundingPoly.vertices[1].x || 0) - x;

    let foundRow = false;
    for (let [baseY, items] of rowGroups) {
      if (Math.abs(y - baseY) <= yThreshold) {
        items.push({ text, x, y, width });
        foundRow = true;
        break;
      }
    }

    if (!foundRow) {
      rowGroups.set(y, [{ text, x, y, width }]);
    }
  });

  // Bước 2: Xử lý và gộp phần tử trong mỗi dòng
  const rows = Array.from(rowGroups.entries())
    .sort(([y1], [y2]) => y1 - y2)
    .map(([_, items]) => {
      const sortedItems = items.sort((a, b) => a.x - b.x);
      const mergedItems = [];
      let currentItem = null;

      sortedItems.forEach((item) => {
        if (!currentItem) {
          currentItem = { ...item };
        } else {
          const gap = item.x - (currentItem.x + currentItem.width);
          if (gap <= 18) {
            // Giảm ngưỡng gộp để tách các phần tử riêng biệt
            currentItem.text += item.text;
            currentItem.width = item.x + item.width - currentItem.x;
          } else {
            mergedItems.push(currentItem);
            currentItem = { ...item };
          }
        }
      });
      if (currentItem) {
        mergedItems.push(currentItem);
      }
      return mergedItems;
    });

  // Bước 3: Xác định các khoảng x và phân cụm cột
  const allXPositions = [];
  rows.forEach((row) => {
    row.forEach((item) => {
      allXPositions.push(item.x);
    });
  });

  // Sắp xếp và loại bỏ trùng lặp
  const uniqueXPositions = [...new Set(allXPositions)].sort((a, b) => a - b);

  // Phân cụm các vị trí x gần nhau thành các cột
  const columnClusters = [];
  let currentCluster = [uniqueXPositions[0]];

  for (let i = 1; i < uniqueXPositions.length; i++) {
    const gap = uniqueXPositions[i] - uniqueXPositions[i - 1];
    if (gap <= 25) {
      // Ngưỡng để xác định các x thuộc cùng một cột
      currentCluster.push(uniqueXPositions[i]);
    } else {
      columnClusters.push(currentCluster);
      currentCluster = [uniqueXPositions[i]];
    }
  }
  columnClusters.push(currentCluster);

  // Tính giá trị trung bình cho mỗi cột
  const columnPositions = columnClusters.map((cluster) => {
    return Math.round(cluster.reduce((a, b) => a + b) / cluster.length);
  });

  // Bước 4: Xác định các cột có dữ liệu
  const columnsWithData = new Set();
  rows.forEach((rowItems) => {
    rowItems.forEach((item) => {
      const nearestColumn = columnPositions.reduce((prev, curr) => {
        return Math.abs(curr - item.x) < Math.abs(prev - item.x) ? curr : prev;
      });
      columnsWithData.add(nearestColumn);
    });
  });

  // Lọc chỉ giữ lại các cột có dữ liệu
  const activeColumns = columnPositions.filter((pos) => columnsWithData.has(pos));
  // Tạo các dòng và lưu vào mảng table
  rows.forEach((rowItems) => {
    const tableRow = [];
    // Map các item theo vị trí cột gần nhất
    const itemsByColumn = new Map();
    rowItems.forEach((item) => {
      const nearestColumn = columnPositions.reduce((prev, curr) => {
        return Math.abs(curr - item.x) < Math.abs(prev - item.x) ? curr : prev;
      });
      if (columnsWithData.has(nearestColumn)) {
        itemsByColumn.set(nearestColumn, item);
      }
    });

    // Tạo các ô chỉ cho các cột có dữ liệu và lưu vào mảng
    activeColumns.forEach((colPos) => {
      if (itemsByColumn.has(colPos)) {
        const item = itemsByColumn.get(colPos);
        tableRow.push(item.text);
      }
    });

    table.push(tableRow);
  });
  return table;
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

function addTableToResults(table, name) {
  const modalTitle = document.getElementById("modal-title");
  const tableContent = `
    <h3>${name}</h3>
    ${createTableHTML(table)}
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

// Chia data theo name của từng người (lây từ hàng thứ 2 cho tới hàng không có tên thì k lấy nữa)
function splitDataByName(table) {
  const dataByName = new Map();

  table.forEach((row, index) => {
    const name = row[ConfigTableIndex.name]; // Giả sử tên nằm ở cột thứ 2
    if (name && index > 0 && name.toLowerCase() !== "name") {
      const trimName = name.trim();
      if (!dataByName.has(trimName)) {
        dataByName.set(trimName, []);
      }
      dataByName.get(trimName).push(row);
    }
  });

  return dataByName;
}

// analyze data to get money in data (ví dụ: 50$ ( boss888 / huione ) + 50$ ( boss222 / inbill ) + 50$ ( boss222 / tm )
// Chỉ lấy các giá trị đi kèm với ký tự $ (hoặc có thể là S)
//Data truyền vào có kiểu dữ liệu như dataByName
function analyzeDataForMoney(data, dataKey, offset, moneyDatas) {
  const moneyData = moneyDatas ?? new Map();
  const parsedMoneyRegex = /(\d+(\.\d+)?\s*[$S])/g; // Regex để tìm tiền

  data.forEach((rows) => {
    rows.forEach((row) => {
      const name = row[ConfigTableIndex.name + offset];
      const money = row[ConfigTableIndex.money + offset];
      const tip = row[ConfigTableIndex.tip + offset];
      if (name && money) {
        const trimName = name.trim().toLowerCase();
        const moneyMatch = money.match(parsedMoneyRegex);
        const tipMatch = tip ? tip.match(parsedMoneyRegex) : [];
        if (moneyMatch) {
          if (!moneyData.has(trimName)) {
            moneyData.set(trimName, []);
          }
          moneyData.get(trimName).push({
            dataKey: dataKey,
            money: moneyMatch,
            tip: tipMatch || [],
            totalMoney: moneyMatch.reduce((sum, m) => sum + parseFloat(m), 0),
            totalTip: tipMatch ? tipMatch.reduce((sum, t) => sum + parseFloat(t), 0) : 0,
          });
        }
      }
    });
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
          <td>${Math.round(item.totalMoney / 50)}</td>
          <td>${item.totalMoney / 2}$ <span class="detail-data">(${item.totalMoney}$ /2  )</span></td>
          <td>${item.totalTip / 2}$ <span class="detail-data">(${item.totalTip}$ /2  )</span></td>
          <td>${item.totalTip / 2 + item.totalMoney / 2}$ <span class="detail-data">(${item.totalTip + item.totalMoney}$ /2  )</span></td>
        </tr>
      `
        )
        .join("")}
      <tr>
        <th>Tổng</th>
        <th>${Math.round(totalMoney / 50)}</th>
        <th>${totalMoney / 2}$ <span class="detail-data">(${totalMoney}$ /2  )</span></th>
        <th>${totalTip / 2}$ <span class="detail-data">(${totalTip}$ /2  )</span></th>
        <th>${totalTip / 2 + totalMoney / 2}$ <span class="detail-data">(${totalTip + totalMoney}$ /2  )</span></th>
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
    const userName = document.getElementById("userName").value.trim().toLowerCase();
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
