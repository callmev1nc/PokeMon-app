// ============================================================
// APPS SCRIPT 2: PASTE INTO "2026 Stock Pokemon" GOOGLE SHEET
// Sheet: Extensions → Apps Script → paste this into Code.gs
// Deploy → New Deployment → Web App (Execute as: Me, Access: Anyone)
// Copy the URL → set as GOOGLE_BUSINESS_URL env var
// ============================================================
//
// This sheet has 4 tabs:
//   MENU: Product catalog with sell/buy prices
//   ĐƠN HÀNG: Order tracking
//   THỐNG KÊ KINH DOANH: Business statistics / profit tracking
//   QUẢN LÝ THU CHI: Income & expense management
//
// Sheets layout:
//   MENU:      [0]code [1]group [2]series [3]name [4]type [5]sellPrice [6]buyPrice [7]stock [8]image
//   ĐƠN HÀNG:  [0]Dấu thời gian [1]Ngày đơn hàng [2]Mã đơn hàng(026XXX) [3]Sản phẩm-SL
//              [4]Tên Khách [5]SĐT [6]Địa chỉ nhận(new+old)
//   THỐNG KÊ:  [0]date [1]orderCode [2]customerName [3]sellPrice [4]buyPrice [5]shipCost [6]profit [7]paymentStatus [8]delivered
//   THU CHI:   [0]content [1]income [2]expense [3]balance

// Stock sheet ID (for reading stock data and reducing stock on order)
var STOCK_SS_ID = "1ViScta5Qa1eXWXUp5zkoBeFVkHj-BKS9Xi6pGyGea74";

function doGet(e) {
  try {
    // Handle write operations sent as GET with payload parameter
    if (e.parameter.payload) {
      var body = JSON.parse(e.parameter.payload);
      return handlePost(body);
    }

    var action = e.parameter.action;
    switch (action) {
      case "menu":
        return json(getMenu());
      case "orders":
        return json(getOrders());
      case "stats":
        return json(getStats());
      case "finance":
        return json(getFinance());
      case "customers":
        return json(getCustomers());
      case "allproducts":
        return json(getAllProducts());
      default:
        return json({ error: "Unknown action" });
    }
  } catch (err) {
    return json({ error: err.message });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    return handlePost(body);
  } catch (err) {
    return json({ error: err.message });
  }
}

function handlePost(body) {
  var action = body.action;
  switch (action) {
    case "addOrder":
      return json(addOrder(body));
    case "confirmOrder":
      return json(confirmOrder(body));
    case "updateOrder":
      return json(updateOrder(body));
    case "deleteOrder":
      return json(deleteOrder(body));
    case "updateMenu":
      return json(updateMenu(body));
    case "addCustomer":
      return json(addCustomer(body.customer));
    case "updateCustomer":
      return json(updateCustomer(body.row, body.data));
    case "addFinance":
      return json(addFinance(body));
    case "updateFinance":
      return json(updateFinance(body));
    case "addProduct":
      return json(addProductToMenu(body.product));
    default:
      return json({ error: "Unknown action" });
  }
}

// ============================================================
// MENU - Product catalog with sell/buy prices
// ============================================================

function getMenu() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("MENU");
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();

  var products = [];
  for (var i = 1; i < data.length; i++) {
    var code = String(data[i][0] || "").trim();
    var name = String(data[i][3] || "").trim();
    if (!code || !name) continue;

    products.push({
      _row: i + 1,
      code: code,
      group: String(data[i][1] || "").trim().toLowerCase(),
      series: String(data[i][2] || "").trim(),
      name: name,
      type: String(data[i][4] || "").trim().toLowerCase(),
      sellPrice: data[i][5] ? Number(data[i][5]) : null,
      buyPrice: data[i][6] ? Number(data[i][6]) : null,
      stock: data[i][7] ? Number(data[i][7]) : 0,
      image: String(data[i][8] || "").trim(),
    });
  }
  return products;
}

function updateMenu(body) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("MENU");
  if (!sheet) return { error: "MENU sheet not found" };

  var updates = body.products || [body];
  var updated = 0;

  for (var u = 0; u < updates.length; u++) {
    var item = updates[u];
    var rowNum = item._row;
    if (!rowNum) continue;
    if (item.sellPrice !== undefined) sheet.getRange(rowNum, 6).setValue(item.sellPrice);
    if (item.buyPrice !== undefined) sheet.getRange(rowNum, 7).setValue(item.buyPrice);
    if (item.stock !== undefined) sheet.getRange(rowNum, 8).setValue(item.stock);
    updated++;
  }
  return { success: true, updated: updated };
}

// ============================================================
// COMBINED PRODUCTS - Merge MENU data with Stock sheet data
// ============================================================

function getAllProducts() {
  var menuProducts = getMenu();

  // Try to get stock data from Stock sheet
  var stockMap = {};
  try {
    var stockSS = SpreadsheetApp.openById(STOCK_SS_ID);
    var stockSheet = stockSS.getSheetByName("Tồn Kho t3");
    if (stockSheet) {
      var stockData = stockSheet.getDataRange().getValues();
      for (var i = 2; i < stockData.length; i++) {
        var code = String(stockData[i][0] || "").trim();
        var series = String(stockData[i][3] || "").trim();
        if (!code) continue;
        var key = code + "|" + series.toUpperCase();
        stockMap[key] = {
          kho: String(stockData[i][5] || "").trim(),
          stock: stockData[i][10] ? Number(stockData[i][10]) : 0,
          dauKy: stockData[i][7] ? Number(stockData[i][7]) : 0,
        };
      }
    }
  } catch (err) {
    // Stock sheet not accessible
  }

  // Merge stock data into menu products
  for (var j = 0; j < menuProducts.length; j++) {
    var p = menuProducts[j];
    var menuKey = p.code + "|" + p.series.toUpperCase();
    if (stockMap[menuKey]) {
      if (!p.stock || p.stock === 0) {
        p.stock = stockMap[menuKey].stock;
      }
      p.kho = stockMap[menuKey].kho;
    }
  }

  return menuProducts;
}

// ============================================================
// ORDERS - ĐƠN HÀNG sheet (Google Form responses)
// Columns (7 total):
//   [0] Dấu thời gian    [1] Ngày đơn hàng  [2] Mã đơn hàng (026XXX)
//   [3] Sản phẩm - SL    [4] Tên Khách      [5] Số điện thoại
//   [6] Địa chỉ nhận hàng
// ============================================================

function getOrders() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ĐƠN HÀNG");
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();

  var orders = [];
  for (var i = 1; i < data.length; i++) {
    // Skip completely empty rows
    if (!data[i][0] && !data[i][1] && !data[i][2] && !data[i][3] && !data[i][4]) continue;

    orders.push({
      _row: i + 1,
      timestamp: String(data[i][0] || ""),
      orderDate: String(data[i][1] || ""),
      orderCode: String(data[i][2] || "").trim(),
      products: String(data[i][3] || ""),
      customerName: String(data[i][4] || ""),
      phone: String(data[i][5] || ""),
      address: String(data[i][6] || ""),
    });
  }
  return orders;
}

function addOrder(body) {
  var order = body.order || body;
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Add to ĐƠN HÀNG sheet (7 columns: timestamp, date, code, products, name, phone, address)
  var orderSheet = ss.getSheetByName("ĐƠN HÀNG");
  if (!orderSheet) return { error: "ĐƠN HÀNG sheet not found" };

  var orderData = orderSheet.getDataRange().getValues();
  var nextOrderRow = orderData.length;
  while (nextOrderRow > 1 && !String(orderData[nextOrderRow - 1][0] || "").trim() && !String(orderData[nextOrderRow - 1][2] || "").trim()) {
    nextOrderRow--;
  }
  nextOrderRow++;

  // Generate order code: 026XXX format (e.g. 026001, 026023)
  var orderCount = nextOrderRow - 1; // number of data rows
  var orderCode = order.orderCode || ("026" + String(orderCount).padStart(3, "0"));
  var timestamp = order.timestamp || new Date().toLocaleString("vi-VN");
  var date = order.orderDate || new Date().toLocaleDateString("vi-VN");

  orderSheet.getRange(nextOrderRow, 1).setValue(timestamp);                     // Dấu thời gian
  orderSheet.getRange(nextOrderRow, 2).setValue(date);                          // Ngày đơn hàng
  orderSheet.getRange(nextOrderRow, 3).setValue(orderCode);                     // Mã đơn hàng (026XXX)
  orderSheet.getRange(nextOrderRow, 4).setValue(order.products || "");          // Sản phẩm - Số lượng
  orderSheet.getRange(nextOrderRow, 5).setValue(order.customerName || "");      // Tên Khách
  orderSheet.getRange(nextOrderRow, 6).setValue(order.phone || "");             // SĐT
  orderSheet.getRange(nextOrderRow, 7).setValue(order.address || "");           // Địa chỉ nhận hàng

  // Add financial details to THỐNG KÊ KINH DOANH sheet
  var statsSheet = ss.getSheetByName("THỐNG KÊ KINH DOANH");
  if (statsSheet) {
    var statsData = statsSheet.getDataRange().getValues();
    var nextStatsRow = statsData.length;
    while (nextStatsRow > 1 && !String(statsData[nextStatsRow - 1][1] || "").trim()) {
      nextStatsRow--;
    }
    nextStatsRow++;

    statsSheet.getRange(nextStatsRow, 1).setValue(date);                           // Ngày
    statsSheet.getRange(nextStatsRow, 2).setValue(orderCode);                      // Mã đơn
    statsSheet.getRange(nextStatsRow, 3).setValue(order.customerName || "");       // Tên khách
    statsSheet.getRange(nextStatsRow, 4).setValue(Number(order.sellPrice) || 0);   // Giá bán
    statsSheet.getRange(nextStatsRow, 5).setValue(Number(order.buyPrice) || 0);    // Giá mua
    statsSheet.getRange(nextStatsRow, 6).setValue(Number(order.shippingCost) || 0); // Phí ship
    // Col 7 (LỢI NHUẬN) has formula =GIÁ BÁN - GIÁ MUA - GIÁ SHIP, auto-calculates
    statsSheet.getRange(nextStatsRow, 8).setValue(order.paymentStatus || "Chưa thanh toán");
  }

  // Update stock in Stock sheet (reduce quantity)
  if (order.products && STOCK_SS_ID) {
    try {
      var stockSS = SpreadsheetApp.openById(STOCK_SS_ID);
      var stockSheet = stockSS.getSheetByName("Tồn Kho t3");
      if (stockSheet) {
        var stockData = stockSheet.getDataRange().getValues();
        for (var s = 2; s < stockData.length; s++) {
          var stockName = String(stockData[s][2] || "").trim().toUpperCase();
          var orderProd = (order.products || "").toUpperCase();
          if (stockName && orderProd.includes(stockName)) {
            var currentStock = Number(stockData[s][10]) || 0;
            var qty = order.quantity || 1;
            var newStock = Math.max(0, currentStock - qty);
            stockSheet.getRange(s + 1, 11).setValue(newStock); // TỒN
            var currentXuat = Number(stockData[s][8]) || 0;
            stockSheet.getRange(s + 1, 9).setValue(currentXuat + qty); // XUẤT
          }
        }
      }
    } catch (err) {
      // Stock update failed, order still saved
    }
  }

  return { success: true, orderCode: orderCode };
}

function updateOrder(body) {
  var row = body.row;
  var data = body.data;
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Update ĐƠN HÀNG sheet (7 columns only)
  var orderSheet = ss.getSheetByName("ĐƠN HÀNG");
  if (orderSheet && row) {
    if (data.orderCode !== undefined) orderSheet.getRange(row, 3).setValue(data.orderCode);
    if (data.products !== undefined) orderSheet.getRange(row, 4).setValue(data.products);
    if (data.customerName !== undefined) orderSheet.getRange(row, 5).setValue(data.customerName);
    if (data.phone !== undefined) orderSheet.getRange(row, 6).setValue(data.phone);
    if (data.address !== undefined) orderSheet.getRange(row, 7).setValue(data.address);
  }

  // Update THỐNG KÊ KINH DOANH sheet (financial details)
  var statsSheet = ss.getSheetByName("THỐNG KÊ KINH DOANH");
  if (statsSheet && row) {
    if (data.buyPrice !== undefined) statsSheet.getRange(row, 5).setValue(data.buyPrice);
    if (data.shippingCost !== undefined) statsSheet.getRange(row, 6).setValue(data.shippingCost);
    if (data.paymentStatus !== undefined) statsSheet.getRange(row, 8).setValue(data.paymentStatus);
    if (data.deliveryStatus !== undefined) statsSheet.getRange(row, 9).setValue(data.deliveryStatus);
  }

  return { success: true };
}

/**
 * Confirm order: adjust inventory when payment status changes.
 * Reduces stock when confirming to paid, restores when canceling to unpaid.
 */
function confirmOrder(body) {
  var row = body.row;
  var data = body.data;
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Get current products from ĐƠN HÀNG sheet for inventory adjustment
  var orderSheet = ss.getSheetByName("ĐƠN HÀNG");
  if (orderSheet && row && data.paymentStatus !== undefined) {
    var currentProducts = String(orderSheet.getRange(row, 4).getValue() || ""); // col 4 = products

    if (data.paymentStatus === "Đã thanh toán" || data.paymentStatus === "DA THANH TOAN") {
      // Confirming payment -> reduce inventory
      adjustInventory(currentProducts, 1, -1);
    } else {
      // Canceling payment -> restore inventory
      adjustInventory(currentProducts, 1, 1);
    }
  }

  // Update payment status in THỐNG KÊ KINH DOANH (not in ĐƠN HÀNG)
  var statsSheet = ss.getSheetByName("THỐNG KÊ KINH DOANH");
  if (statsSheet && row) {
    if (data.buyPrice !== undefined) statsSheet.getRange(row, 5).setValue(data.buyPrice);
    if (data.shippingCost !== undefined) statsSheet.getRange(row, 6).setValue(data.shippingCost);
    if (data.paymentStatus !== undefined) statsSheet.getRange(row, 8).setValue(data.paymentStatus);
  }

  return { success: true };
}

/**
 * Delete order: restore inventory if paid, then delete rows.
 */
function deleteOrder(body) {
  var row = body.row;
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Get products for inventory restore; check THỐNG KÊ for payment status
  var orderSheet = ss.getSheetByName("ĐƠN HÀNG");
  var statsSheet = ss.getSheetByName("THỐNG KÊ KINH DOANH");

  if (orderSheet && row) {
    var products = String(orderSheet.getRange(row, 4).getValue() || ""); // col 4 = products

    // Check payment status from THỐNG KÊ sheet (col 8)
    var paymentStatus = "";
    if (statsSheet && row <= statsSheet.getLastRow()) {
      paymentStatus = String(statsSheet.getRange(row, 8).getValue() || "");
    }

    // Restore inventory if order was paid
    if (paymentStatus.indexOf("Đã") >= 0 || paymentStatus.indexOf("DA") >= 0 || paymentStatus.indexOf("ĐÃ") >= 0) {
      adjustInventory(products, 1, 1);
    }

    // Delete from ĐƠN HÀNG sheet
    if (row <= orderSheet.getLastRow()) {
      orderSheet.deleteRow(row);
    }
  }

  // Delete from THỐNG KÊ sheet
  if (statsSheet && row && row <= statsSheet.getLastRow()) {
    statsSheet.deleteRow(row);
  }

  return { success: true };
}

/**
 * Adjust inventory in Stock sheet.
 * delta: -1 to reduce stock, +1 to restore stock
 */
function adjustInventory(productsString, quantity, delta) {
  if (!productsString || !STOCK_SS_ID) return;
  try {
    var stockSS = SpreadsheetApp.openById(STOCK_SS_ID);
    var stockSheet = stockSS.getSheetByName("Tồn Kho t3");
    if (!stockSheet) return;
    var stockData = stockSheet.getDataRange().getValues();

    for (var s = 2; s < stockData.length; s++) {
      var stockName = String(stockData[s][2] || "").trim().toUpperCase();
      if (stockName && productsString.toUpperCase().indexOf(stockName) >= 0) {
        var currentStock = Number(stockData[s][10]) || 0;
        var currentXuat = Number(stockData[s][8]) || 0;
        var qty = quantity * delta;

        stockSheet.getRange(s + 1, 11).setValue(Math.max(0, currentStock + qty));
        if (delta < 0) {
          stockSheet.getRange(s + 1, 9).setValue(currentXuat + quantity);
        } else {
          stockSheet.getRange(s + 1, 9).setValue(Math.max(0, currentXuat - quantity));
        }
      }
    }
  } catch (err) {
    // Stock update failed silently
  }
}

// ============================================================
// STATS - THỐNG KÊ KINH DOANH (Business Statistics)
// ============================================================

function getStats() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("THỐNG KÊ KINH DOANH");
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();

  var stats = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][1]) continue;
    stats.push({
      _row: i + 1,
      date: String(data[i][0] || ""),
      orderCode: String(data[i][1] || ""),
      customerName: String(data[i][2] || ""),
      sellPrice: Number(data[i][3]) || 0,
      buyPrice: Number(data[i][4]) || 0,
      shippingCost: Number(data[i][5]) || 0,
      profit: Number(data[i][6]) || 0,
      paymentStatus: String(data[i][7] || ""),
      delivered: String(data[i][8] || ""),
    });
  }
  return stats;
}

// ============================================================
// FINANCE - QUẢN LÝ THU CHI (Income & Expense)
// ============================================================

function getFinance() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("QUẢN LÝ THU CHI");
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();

  var finance = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0] && !data[i][1] && !data[i][2]) continue;
    finance.push({
      _row: i + 1,
      content: String(data[i][0] || ""),
      income: Number(data[i][1]) || 0,
      expense: Number(data[i][2]) || 0,
      balance: data[i][3],
    });
  }
  return finance;
}

function addFinance(body) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("QUẢN LÝ THU CHI");
  if (!sheet) return { error: "QUẢN LÝ THU CHI sheet not found" };

  var data = sheet.getDataRange().getValues();
  var nextRow = data.length;
  while (nextRow > 1 && !data[nextRow - 1][0] && !data[nextRow - 1][1] && !data[nextRow - 1][2]) {
    nextRow--;
  }
  nextRow++;

  sheet.getRange(nextRow, 1).setValue(body.content || "");
  sheet.getRange(nextRow, 2).setValue(body.income || 0);
  sheet.getRange(nextRow, 3).setValue(body.expense || 0);
  // Col 4 (SỐ DƯ) has formula, auto-calculates

  return { success: true };
}

function updateFinance(body) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("QUẢN LÝ THU CHI");
  if (!sheet) return { error: "QUẢN LÝ THU CHI sheet not found" };
  var row = body.row;
  if (!row) return { error: "Row required" };

  if (body.content !== undefined) sheet.getRange(row, 1).setValue(body.content);
  if (body.income !== undefined) sheet.getRange(row, 2).setValue(body.income);
  if (body.expense !== undefined) sheet.getRange(row, 3).setValue(body.expense);

  return { success: true };
}

// ============================================================
// ADD PRODUCT TO MENU
// ============================================================

function addProductToMenu(product) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("MENU");
  if (!sheet) return { error: "MENU sheet not found" };

  var data = sheet.getDataRange().getValues();
  var nextRow = data.length;
  while (nextRow > 1 && !String(data[nextRow - 1][0] || "").trim() && !String(data[nextRow - 1][3] || "").trim()) {
    nextRow--;
  }
  nextRow++;

  sheet.getRange(nextRow, 1).setValue(product.code || "");        // Mã hàng
  sheet.getRange(nextRow, 2).setValue(product.group || "");        // Nhóm hàng
  sheet.getRange(nextRow, 3).setValue(product.series || "");       // Số seri
  sheet.getRange(nextRow, 4).setValue(product.name || "");         // Tên hàng
  sheet.getRange(nextRow, 5).setValue(product.type || "");         // Loại hàng
  sheet.getRange(nextRow, 6).setValue(product.price || "");        // Giá bán
  sheet.getRange(nextRow, 7).setValue("");                         // Giá mua
  sheet.getRange(nextRow, 8).setValue(product.stock || 0);        // Tồn
  sheet.getRange(nextRow, 9).setValue("");                         // Hình ảnh

  return { success: true };
}

// ============================================================
// CUSTOMERS (stored in this sheet as an extra tab)
// ============================================================

function getCustomers() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Customers");
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();

  var customers = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    customers.push({
      _row: i + 1,
      name: String(data[i][0] || ""),
      phone: String(data[i][1] || ""),
      newAddress: String(data[i][2] || ""),
      oldAddress: String(data[i][3] || ""),
    });
  }
  return customers;
}

function addCustomer(customer) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Customers");
  if (!sheet) {
    sheet = ss.insertSheet("Customers");
    sheet.appendRow(["Tên", "Số Điện Thoại", "Địa Chỉ mới", "Địa chỉ cũ"]);
  }
  sheet.appendRow([
    customer.name || "",
    customer.phone || "",
    customer.newAddress || "",
    customer.oldAddress || "",
  ]);
  return { success: true };
}

function updateCustomer(row, data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Customers");
  if (!sheet) return { error: "Customers sheet not found" };
  if (data.name !== undefined) sheet.getRange(row, 1).setValue(data.name);
  if (data.phone !== undefined) sheet.getRange(row, 2).setValue(data.phone);
  if (data.newAddress !== undefined) sheet.getRange(row, 3).setValue(data.newAddress);
  if (data.oldAddress !== undefined) sheet.getRange(row, 4).setValue(data.oldAddress);
  return { success: true };
}

// ============================================================
// HELPERS
// ============================================================

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}
