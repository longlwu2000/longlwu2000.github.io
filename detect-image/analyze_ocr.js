/**
 * Chuẩn bị dữ liệu từ textAnnotations (lọc, tính tọa độ trung bình,...)
 * Lưu ý: textAnnotations đã được slice(1) từ trước (bỏ phần tử đầu là full text)
 */
function prepareOcrWords(textAnnotations) {
  return textAnnotations
    .map((annotation) => {
      const vertices = annotation.boundingPoly.vertices;
      const text = annotation.description;
      const yAvg = (vertices[0].y + vertices[3].y) / 2;
      const xStart = vertices[0].x;
      const xEnd = vertices[1].x;
      return { text, yAvg, xStart, xEnd };
    })
    .sort((a, b) => a.yAvg - b.yAvg);
}

/**
 * Gộp các từ trong cùng một hàng dựa theo khoảng cách X
 */
function mergeRowCells(row, xMergeTolerance) {
  if (row.length === 0) return [];

  row.sort((a, b) => a.xStart - b.xStart);

  const mergedRow = [];
  let currentCell = row[0].text;
  let currentXEnd = row[0].xEnd;

  for (let i = 1; i < row.length; i++) {
    const nextWord = row[i];
    if (nextWord.xStart - currentXEnd <= xMergeTolerance) {
      currentCell += nextWord.text;
      currentXEnd = nextWord.xEnd;
    } else {
      mergedRow.push(currentCell);
      currentCell = nextWord.text;
      currentXEnd = nextWord.xEnd;
    }
  }
  mergedRow.push(currentCell);
  return mergedRow;
}

/**
 * Nhóm các từ thành từng hàng dựa theo tọa độ Y và gộp ô theo X
 * Cải thiện: xử lý tốt hơn các từ ở rìa và cho phép tolerance linh hoạt hơn
 */
function groupAndMergeRows(words, yTolerance, xMergeTolerance) {
  if (!words || words.length === 0) {
    return { tableData: [], maxColumns: 0 };
  }

  const tableData = [];
  let maxColumns = 0;

  // Sắp xếp lại theo Y trước (đảm bảo thứ tự từ trên xuống)
  const sortedWords = [...words].sort((a, b) => a.yAvg - b.yAvg);

  let i = 0;
  while (i < sortedWords.length) {
    const currentRow = [sortedWords[i]];
    const baseY = sortedWords[i].yAvg;
    let j = i + 1;

    // Thu thập tất cả các từ trong cùng một hàng
    while (j < sortedWords.length) {
      const nextWord = sortedWords[j];
      const yDiff = Math.abs(nextWord.yAvg - baseY);

      // Sử dụng tolerance động: nếu từ gần với base Y thì cho vào cùng hàng
      if (yDiff <= yTolerance) {
        currentRow.push(nextWord);
        j++;
      } else {
        // Nếu đã quá xa về Y, dừng lại
        break;
      }
    }

    // Gộp các ô trong hàng này
    const mergedRow = mergeRowCells(currentRow, xMergeTolerance);
    if (mergedRow.length > 0) {
      tableData.push(mergedRow);
      maxColumns = Math.max(maxColumns, mergedRow.length);
    }

    // Di chuyển đến nhóm tiếp theo
    i = j;
  }

  return { tableData, maxColumns };
}

/**
 * Tạo HTML bảng từ dữ liệu đã xử lý
 */
function generateHtmlTable(tableData, maxColumns) {
  let html =
    '<table border="1" style="width:100%; border-collapse: collapse;">\n';

  tableData.forEach((row, rowIndex) => {
    html += "  <tr>\n";
    for (let j = 0; j < maxColumns; j++) {
      const cellValue = row[j] || "&nbsp;";
      if (rowIndex === 0) {
        html += `    <th style="background-color: #f2f2f2; padding: 10px; text-align: left;">${cellValue}</th>\n`;
      } else {
        html += `    <td class="text-cell">${cellValue}</td>\n`;
      }
    }
    html += "  </tr>\n";
  });

  html += "</table>";
  return html;
}

function cleanTableData(tableData) {
  // 0️⃣ Hàm sửa ngày tháng bị lỗi do OCR
  function fixInvalidDate(dateStr) {
    if (!dateStr) return dateStr;
    
    const str = dateStr.toString().trim();
    
    // Log để debug
    if (str.includes('/') || str.includes('-')) {
      console.log(`Checking date: ${str}`);
    }
    
    // Pattern 1: 1dd/mm/yyyy hoặc 1dd-mm-yyyy (số 1 dính vào ngày - ngày có 2 chữ số)
    // Capture: 1dd (toàn bộ) và dd (phần sau số 1)
    const invalidDatePattern1 = /^(1\d{2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/;
    const match1 = str.match(invalidDatePattern1);
    
    if (match1) {
      const fullDay = match1[1]; // 1dd (toàn bộ, ví dụ: 129)
      const month = match1[2];
      const year = match1[3];
      
      console.log(`Pattern 1 matched! fullDay=${fullDay}, month=${month}, year=${year}`);
      
      // Nếu fullDay > 31 thì chắc chắn là lỗi (vì ngày max là 31)
      if (parseInt(fullDay) > 31) {
        const fixedDay = fullDay.substring(1); // Bỏ số 1 đầu
        const separator = str.includes('/') ? '/' : '-';
        const fixedDate = `${fixedDay}${separator}${month}${separator}${year}`;
        console.log(`✅ Fixed date: ${str} -> ${fixedDate}`);
        return fixedDate;
      } else {
        console.log(`Day ${fullDay} <= 31, might be valid (10-19)`);
      }
    }
    
    // Pattern 2: Không xử lý các ngày 10-19 vì đó là ngày hợp lệ
    // Chỉ xử lý khi có bằng chứng rõ ràng là lỗi OCR (ví dụ: tháng hoặc năm không hợp lệ)
    // Tạm thời disable pattern này để tránh xóa nhầm số 1 của ngày 10-19
    
    // KHÔNG CẦN Pattern 2 nữa vì:
    // - Ngày 10-19 là hợp lệ (không phải lỗi)
    // - Nếu OCR đọc sai "1" thành "11", "2" thành "12", v.v. thì cần logic khác
    // - Pattern 1 đã xử lý trường hợp số 1 dính vào ngày 2 chữ số (ví dụ: 129 -> 29)
    
    return str;
  }

  // 1️⃣ Loại bỏ hàng chỉ gồm chữ cái (A, B, C, D, …)
  const filteredRows = tableData.filter((row) => {
    const allLetters = row.every((cell) => /^[A-Z]$/i.test(cell));
    return !allLetters;
  });

  if (filteredRows.length === 0) return tableData;

  // 2️⃣ Fix tất cả các ô có ngày tháng bị lỗi TRƯỚC KHI xử lý các bước khác
  const fixedRows = filteredRows.map((row) => {
    if (!row || row.length === 0) return row;
    return row.map(cell => {
      const fixed = fixInvalidDate(cell);
      return fixed;
    });
  });

  // 3️⃣ Kiểm tra nếu cột đầu là số thứ tự
  const firstColumn = fixedRows.map((row) => row[0]);
  const numericCount = firstColumn.filter((c) => /^\d+$/.test((c || "").toString().trim())).length;

  // Nếu hơn 70% hàng có cột đầu là số => coi đó là cột chỉ mục
  const isIndexColumn = numericCount / fixedRows.length > 0.7;

  // Nếu là cột chỉ mục thì chỉ xóa phần tử đầu của những hàng có số thứ tự,
  // các hàng không có số thứ tự sẽ được giữ nguyên (không bị xóa).
  const numericRegex = /^\d+$/;
  const cleaned = isIndexColumn
    ? fixedRows.map((row) => {
        if (!row || row.length === 0) return row;
        const first = (row[0] || "").toString().trim();
        return numericRegex.test(first) ? row.slice(1) : row;
      })
    : fixedRows;

  // 4️⃣ Nếu ô ngày tháng nằm ở cột 0 thì chuyển nó qua cột tiếp theo, giữ nguyên hàng
  // Hỗ trợ các định dạng phổ biến: dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd, "1 Jan 2020", v.v.
  const dateRegex = /^(?:\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2}|\d{1,2}\s+[A-Za-z]{3,9}\.?\s+\d{2,4})$/i;

  const result = cleaned.map((row) => {
    if (!row || row.length === 0) return row;
    const first = (row[0] || "").toString().trim();
    if (dateRegex.test(first)) {
      // remove first element and insert it at index 1 (shifts others to the right)
      const dateVal = row.shift();
      row.splice(1, 0, dateVal);
    }
    return row;
  });

  return result;
}

/**
 * Hàm chính: Kết hợp các bước nhỏ để tạo HTML bảng từ OCR
 */
function generateHtmlTableFromOcrWithMerge(
  textAnnotations,
  yTolerance = 10,
  xMergeTolerance = 5
) {
  if (!textAnnotations || textAnnotations.length < 2) {
    return "<table><tr><td>Không có dữ liệu OCR hợp lệ.</td></tr></table>";
  }

  const words = prepareOcrWords(textAnnotations);
  const { tableData, maxColumns } = groupAndMergeRows(
    words,
    yTolerance,
    xMergeTolerance
  );
  return generateHtmlTable(tableData, maxColumns);
}
