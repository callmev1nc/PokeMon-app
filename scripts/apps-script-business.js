// ============================================================
// APPS SCRIPT 2: PASTE INTO BUSINESS GOOGLE SHEET
// Sheet: Extensions → Apps Script → paste this into Code.gs
// Deploy → New Deployment → Web App (Execute as: Me, Access: Anyone)
// Copy the URL → set as GOOGLE_BUSINESS_URL env var
// ============================================================
//
// This sheet has tabs:
//   ĐƠN HÀNG: Order tracking (14 columns)
//   Customers: Customer info
//   THỐNG KÊ KINH DOANH: Business statistics (optional)
//   QUẢN LÝ THU CHI: Income & expense management (optional)
//   MENU: Product catalog (optional)
//
// ĐƠN HÀNG layout (14 columns):
//   [0]  Dấu thời gian           - timestamp
//   [1]  Ngày đơn hàng           - order date
//   [2]  Mã đơn hàng (nếu có)   - order code
//   [3]  Sản phẩm - Số lượng    - products & quantity
//   [4]  Tên Khách              - customer name
//   [5]  Số điện thoại          - phone
//   [6]  Địa chỉ nhận hàng      - address
//   [7]  Ghi chú (Nếu có)       - notes
//   [8]  GIÁ BÁN                - sell price
//   [9]  GIÁ MUA                - buy price
//   [10] GIÁ SHIP + ĐÓNG GÓI   - shipping + packaging
//   [11] LỢI NHUẬN              - profit (formula)
//   [12] TIẾN ĐỘ THANH TOÁN    - payment status
//   [13] ĐÃ GIAO                - delivery status

// Business spreadsheet (where ĐƠN HÀNG, Customers, MENU, etc. tabs live)
var BIZ_SS_ID = "1iaIlu-TZg6UbH-5keqBh7YFJO-kqKX7C8i4hBNOkU38";
// Stock sheet ID (for reading stock data and reducing stock on order)
var STOCK_SS_ID = "1ViScta5Qa1eXWXUp5zkoBeFVkHj-BKS9Xi6pGyGea74";

// Get the business spreadsheet by ID (works regardless of where script is deployed)
function getBizSS() {
  return SpreadsheetApp.openById(BIZ_SS_ID);
}

function doGet(e) {
  try {
    if (e.parameter.payload) {
      var body = JSON.parse(e.parameter.payload);
      return handlePost(body);
    }

    var action = e.parameter.action;
    switch (action) {
      case "orders":
        return json(getOrders());
      case "customers":
        return json(getCustomers());
      case "stats":
        return json(getStats());
      case "finance":
        return json(getFinance());
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
    case "addCustomer":
      return json(addCustomer(body.customer));
    case "updateCustomer":
      return json(updateCustomer(body.row, body.data));
    case "addProduct":
      return json(addProductToMenu(body.product));
    case "addFinance":
      return json(addFinance(body));
    case "updateFinance":
      return json(updateFinance(body));
    default:
      return json({ error: "Unknown action" });
  }
}

// ============================================================
// ORDERS - ĐƠN HÀNG sheet (14 columns)
// ============================================================

function getOrders() {
  var sheet = getBizSS().getSheetByName("ĐƠN HÀNG");
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();

  var orders = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0] && !data[i][2] && !data[i][3] && !data[i][4]) continue;

    orders.push({
      _row: i + 1,
      timestamp: String(data[i][0] || ""),
      orderDate: String(data[i][1] || ""),
      orderCode: String(data[i][2] || "").trim(),
      products: String(data[i][3] || ""),
      customerName: String(data[i][4] || ""),
      phone: String(data[i][5] || ""),
      address: String(data[i][6] || ""),
      notes: String(data[i][7] || ""),
      sellPrice: Number(data[i][8]) || 0,
      buyPrice: Number(data[i][9]) || 0,
      shippingCost: Number(data[i][10]) || 0,
      profit: data[i][11],
      paymentStatus: String(data[i][12] || ""),
      deliveryStatus: String(data[i][13] || ""),
    });
  }
  return orders;
}

function addOrder(body) {
  var order = body.order || body;
  var ss = getBizSS();

  var orderSheet = ss.getSheetByName("ĐƠN HÀNG");
  if (!orderSheet) return { error: "ĐƠN HÀNG sheet not found" };

  var orderData = orderSheet.getDataRange().getValues();
  var nextRow = orderData.length;
  while (nextRow > 1 && !String(orderData[nextRow - 1][0] || "").trim() && !String(orderData[nextRow - 1][2] || "").trim()) {
    nextRow--;
  }
  nextRow++;

  var orderCount = nextRow - 1;
  var orderCode = order.orderCode || ("026" + String(orderCount).padStart(3, "0"));
  var timestamp = order.timestamp || new Date().toLocaleString("vi-VN");
  var date = order.orderDate || new Date().toLocaleDateString("vi-VN");

  // Write all columns to ĐƠN HÀNG
  orderSheet.getRange(nextRow, 1).setValue(timestamp);                    // [0] Dấu thời gian
  orderSheet.getRange(nextRow, 2).setValue(date);                         // [1] Ngày đơn hàng
  orderSheet.getRange(nextRow, 3).setValue(orderCode);                    // [2] Mã đơn hàng
  orderSheet.getRange(nextRow, 4).setValue(order.products || "");         // [3] Sản phẩm - SL
  orderSheet.getRange(nextRow, 5).setValue(order.customerName || "");     // [4] Tên Khách
  orderSheet.getRange(nextRow, 6).setValue(String(order.phone || ""));    // [5] SĐT (as string)
  orderSheet.getRange(nextRow, 7).setValue(order.address || "");          // [6] Địa chỉ
  orderSheet.getRange(nextRow, 8).setValue(order.notes || "");            // [7] Ghi chú
  orderSheet.getRange(nextRow, 9).setValue(Number(order.sellPrice) || 0); // [8] GIÁ BÁN
  // [9] GIÁ MUA - left empty for admin to fill
  // [10] GIÁ SHIP - left empty for admin to fill
  // [11] LỢI NHUẬN - formula column, auto-calculates
  orderSheet.getRange(nextRow, 13).setValue(order.paymentStatus || "Chưa thanh toán"); // [12] Payment status
  orderSheet.getRange(nextRow, 14).setValue("Chưa giao");                 // [13] Delivery status

  return { success: true, orderCode: orderCode };
}

function updateOrder(body) {
  var row = body.row;
  var data = body.data;
  var ss = getBizSS();

  var orderSheet = ss.getSheetByName("ĐƠN HÀNG");
  if (!orderSheet || !row) return { success: true };

  if (data.orderCode !== undefined) orderSheet.getRange(row, 3).setValue(data.orderCode);
  if (data.products !== undefined) orderSheet.getRange(row, 4).setValue(data.products);
  if (data.customerName !== undefined) orderSheet.getRange(row, 5).setValue(data.customerName);
  if (data.phone !== undefined) orderSheet.getRange(row, 6).setValue(String(data.phone));
  if (data.address !== undefined) orderSheet.getRange(row, 7).setValue(data.address);
  if (data.notes !== undefined) orderSheet.getRange(row, 8).setValue(data.notes);
  if (data.sellPrice !== undefined) orderSheet.getRange(row, 9).setValue(data.sellPrice);
  if (data.buyPrice !== undefined) orderSheet.getRange(row, 10).setValue(data.buyPrice);
  if (data.shippingCost !== undefined) orderSheet.getRange(row, 11).setValue(data.shippingCost);
  if (data.deliveryStatus !== undefined) orderSheet.getRange(row, 14).setValue(data.deliveryStatus);

  return { success: true };
}

/**
 * Confirm order: update payment status in ĐƠN HÀNG and adjust inventory.
 * When confirming to "Đã thanh toán" → minus stock.
 * When canceling to "Chưa thanh toán" → restore stock.
 */
function confirmOrder(body) {
  var row = body.row;
  var data = body.data;
  var ss = getBizSS();

  var orderSheet = ss.getSheetByName("ĐƠN HÀNG");
  if (!orderSheet || !row) return { success: true };

  // Get current products from ĐƠN HÀNG col 4
  var currentProducts = String(orderSheet.getRange(row, 4).getValue() || "");

  // Update payment status in ĐƠN HÀNG col 13
  if (data.paymentStatus !== undefined) {
    orderSheet.getRange(row, 13).setValue(data.paymentStatus);

    // Adjust inventory based on payment status change
    if (data.paymentStatus === "Đã thanh toán") {
      adjustInventory(currentProducts, -1);
    } else if (data.paymentStatus === "Chưa thanh toán") {
      adjustInventory(currentProducts, 1);
    }
  }

  // Also update buy price and shipping if provided
  if (data.buyPrice !== undefined) orderSheet.getRange(row, 10).setValue(data.buyPrice);
  if (data.shippingCost !== undefined) orderSheet.getRange(row, 11).setValue(data.shippingCost);

  return { success: true };
}

/**
 * Delete order: restore inventory if paid, then delete row.
 */
function deleteOrder(body) {
  var row = body.row;
  var ss = getBizSS();

  var orderSheet = ss.getSheetByName("ĐƠN HÀNG");
  if (!orderSheet || !row) return { success: true };

  // Get products and payment status before deleting
  var products = String(orderSheet.getRange(row, 4).getValue() || "");
  var paymentStatus = String(orderSheet.getRange(row, 13).getValue() || "");

  // Restore inventory if order was paid (stock was reduced)
  if (paymentStatus.indexOf("Đã") >= 0 || paymentStatus.indexOf("DA") >= 0) {
    adjustInventory(products, 1);
  }

  // Delete the row
  if (row <= orderSheet.getLastRow()) {
    orderSheet.deleteRow(row);
  }

  return { success: true };
}

/**
 * Adjust inventory in Stock sheet.
 * delta: -1 to reduce stock (confirm), +1 to restore stock (cancel/delete)
 */
function adjustInventory(productsString, delta) {
  if (!productsString || !STOCK_SS_ID) return;
  try {
    var stockSS = SpreadsheetApp.openById(STOCK_SS_ID);
    var stockSheet = stockSS.getSheetByName("Tồn Kho t3");
    if (!stockSheet) return;
    var stockData = stockSheet.getDataRange().getValues();

    // Parse order products: "2x ABRA - PO-P-01, 1x CHARIZARD - PC-PO-001"
    var items = productsString.split(", ");
    for (var idx = 0; idx < items.length; idx++) {
      var match = items[idx].match(/^(\d+)x\s+(.+?)\s+-\s+(\S+)$/);
      if (!match) continue;
      var quantity = parseInt(match[1]) * delta;

      // Find matching product by code in stock sheet
      for (var s = 2; s < stockData.length; s++) {
        var stockCode = String(stockData[s][0] || "").trim();
        if (stockCode === match[3]) {
          var currentStock = Number(stockData[s][10]) || 0;
          var newStock = Math.max(0, currentStock + quantity);
          stockSheet.getRange(s + 1, 11).setValue(newStock); // TỒN

          // Update XUẤT column
          var currentXuat = Number(stockData[s][8]) || 0;
          if (delta < 0) {
            stockSheet.getRange(s + 1, 9).setValue(currentXuat + Math.abs(quantity));
          } else {
            stockSheet.getRange(s + 1, 9).setValue(Math.max(0, currentXuat - Math.abs(quantity)));
          }
          break;
        }
      }
    }
  } catch (err) {
    // Stock update failed silently
  }
}

// ============================================================
// CUSTOMERS
// ============================================================

function getCustomers() {
  var sheet = getBizSS().getSheetByName("Customers");
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
  var ss = getBizSS();
  var sheet = ss.getSheetByName("Customers");
  if (!sheet) {
    sheet = ss.insertSheet("Customers");
    sheet.appendRow(["Tên", "Số Điện Thoại", "Địa Chỉ mới", "Địa chỉ cũ"]);
  }
  sheet.appendRow([
    customer.name || "",
    String(customer.phone || ""),
    customer.newAddress || "",
    customer.oldAddress || "",
  ]);
  return { success: true };
}

function updateCustomer(row, data) {
  var sheet = getBizSS().getSheetByName("Customers");
  if (!sheet) return { error: "Customers sheet not found" };
  if (data.name !== undefined) sheet.getRange(row, 1).setValue(data.name);
  if (data.phone !== undefined) sheet.getRange(row, 2).setValue(String(data.phone));
  if (data.newAddress !== undefined) sheet.getRange(row, 3).setValue(data.newAddress);
  if (data.oldAddress !== undefined) sheet.getRange(row, 4).setValue(data.oldAddress);
  return { success: true };
}

// ============================================================
// ALL PRODUCTS - Merge MENU + Stock sheet data
// ============================================================

function getAllProducts() {
  var menuProducts = [];
  var menuSheet = getBizSS().getSheetByName("MENU");
  if (menuSheet) {
    var menuData = menuSheet.getDataRange().getValues();
    for (var i = 1; i < menuData.length; i++) {
      var code = String(menuData[i][0] || "").trim();
      var name = String(menuData[i][3] || "").trim();
      if (!code || !name) continue;
      menuProducts.push({
        _row: i + 1,
        code: code,
        group: String(menuData[i][1] || "").trim().toLowerCase(),
        series: String(menuData[i][2] || "").trim(),
        name: name,
        type: String(menuData[i][4] || "").trim().toLowerCase(),
        sellPrice: menuData[i][5] ? Number(menuData[i][5]) : null,
        buyPrice: menuData[i][6] ? Number(menuData[i][6]) : null,
        stock: menuData[i][7] ? Number(menuData[i][7]) : 0,
        image: String(menuData[i][8] || "").trim(),
      });
    }
  }

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
        };
      }
    }
  } catch (err) {}

  for (var j = 0; j < menuProducts.length; j++) {
    var p = menuProducts[j];
    var menuKey = p.code + "|" + p.series.toUpperCase();
    if (stockMap[menuKey]) {
      if (!p.stock || p.stock === 0) p.stock = stockMap[menuKey].stock;
      p.kho = stockMap[menuKey].kho;
    }
  }

  return menuProducts;
}

// ============================================================
// ADD PRODUCT TO MENU
// ============================================================

function addProductToMenu(product) {
  var sheet = getBizSS().getSheetByName("MENU");
  if (!sheet) return { error: "MENU sheet not found" };

  var data = sheet.getDataRange().getValues();
  var nextRow = data.length;
  while (nextRow > 1 && !String(data[nextRow - 1][0] || "").trim() && !String(data[nextRow - 1][3] || "").trim()) {
    nextRow--;
  }
  nextRow++;

  sheet.getRange(nextRow, 1).setValue(product.code || "");
  sheet.getRange(nextRow, 2).setValue(product.group || "");
  sheet.getRange(nextRow, 3).setValue(product.series || "");
  sheet.getRange(nextRow, 4).setValue(product.name || "");
  sheet.getRange(nextRow, 5).setValue(product.type || "");
  sheet.getRange(nextRow, 6).setValue(product.price || "");
  sheet.getRange(nextRow, 7).setValue("");
  sheet.getRange(nextRow, 8).setValue(product.stock || 0);
  sheet.getRange(nextRow, 9).setValue("");

  return { success: true };
}

// ============================================================
// STATS - THỐNG KÊ KINH DOANH
// ============================================================

function getStats() {
  var sheet = getBizSS().getSheetByName("THỐNG KÊ KINH DOANH");
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
// FINANCE - QUẢN LÝ THU CHI
// ============================================================

function getFinance() {
  var sheet = getBizSS().getSheetByName("QUẢN LÝ THU CHI");
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
  var sheet = getBizSS().getSheetByName("QUẢN LÝ THU CHI");
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

  return { success: true };
}

function updateFinance(body) {
  var sheet = getBizSS().getSheetByName("QUẢN LÝ THU CHI");
  if (!sheet) return { error: "QUẢN LÝ THU CHI sheet not found" };
  var row = body.row;
  if (!row) return { error: "Row required" };

  if (body.content !== undefined) sheet.getRange(row, 1).setValue(body.content);
  if (body.income !== undefined) sheet.getRange(row, 2).setValue(body.income);
  if (body.expense !== undefined) sheet.getRange(row, 3).setValue(body.expense);

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
