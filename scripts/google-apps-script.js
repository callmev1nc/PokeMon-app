// === COMBINED SCRIPT - PASTE INTO EITHER GOOGLE SHEET ===
// Deploy from either sheet → Extensions → Apps Script → paste this
//
// Pokemon Stock sheet:
//   https://docs.google.com/spreadsheets/d/1ViScta5Qa1eXWXUp5zkoBeFVkHj-BKS9Xi6pGyGea74/edit
// Customer Information sheet:
//   https://docs.google.com/spreadsheets/d/1iaIlu-TZg6UbH-5keqBh7YFJO-kqKX7C8i4hBNOkU38/edit
//
// Setup:
// 1. Open EITHER sheet → Extensions → Apps Script
// 2. Paste this entire file into Code.gs (replace everything)
// 3. Deploy → New Deployment → Web App (Execute as: Me, Access: Anyone)
// 4. Copy the Web App URL → set as NEXT_PUBLIC_SHEETS_URL env var in Vercel

const PRODUCTS_SS_ID = "1ViScta5Qa1eXWXUp5zkoBeFVkHj-BKS9Xi6pGyGea74";
const CUSTOMERS_SS_ID = "1iaIlu-TZg6UbH-5keqBh7YFJO-kqKX7C8i4hBNOkU38";

function doGet(e) {
  try {
    const action = e.parameter.action;
    switch (action) {
      case "products":
        return json(getProducts());
      case "orders":
        return json(getOrders());
      case "customers":
        return json(getCustomers());
      default:
        return json({ error: "Unknown action" });
    }
  } catch (err) {
    return json({ error: err.message });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    switch (action) {
      case "updateProducts":
        return json(updateProducts(body.products));
      case "addOrder":
        return json(addOrder(body.order));
      case "updateOrder":
        return json(updateOrder(body.row, body.data));
      case "addCustomer":
        return json(addCustomer(body.customer));
      case "updateCustomer":
        return json(updateCustomer(body.row, body.data));
      default:
        return json({ error: "Unknown action" });
    }
  } catch (err) {
    return json({ error: err.message });
  }
}

// ============================================================
// PRODUCTS (Pokemon Stock sheet)
// ============================================================

function getProducts() {
  const sheet = SpreadsheetApp.openById(PRODUCTS_SS_ID).getSheetByName("Products");
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 3) return [];

  const products = [];
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (!row[0] && !row[2]) continue;

    const code = String(row[0] || "").trim();
    const group = String(row[1] || "").trim().toLowerCase();
    const name = String(row[2] || "").trim();
    const series = String(row[3] || "").trim();
    const rawType = String(row[4] || "").trim().toLowerCase();
    const kho = String(row[5] || "").trim();
    const price = row[6] ? Number(row[6]) : null;
    const dauKy = row[7] ? Number(row[7]) : 0;
    const xuat = row[8] ? Number(row[8]) : 0;
    const nhap = row[9] ? Number(row[9]) : 0;
    const ton = row[10] ? Number(row[10]) : 0;

    products.push({
      _row: i + 1,
      code,
      group,
      name,
      series,
      type: rawType,
      displayType: mapDisplayType(rawType),
      kho,
      price: price !== null && !isNaN(price) ? price : null,
      dauKy,
      xuat,
      nhap,
      stock: Math.round(ton),
    });
  }
  return products;
}

function updateProducts(products) {
  const sheet = SpreadsheetApp.openById(PRODUCTS_SS_ID).getSheetByName("Products");
  if (!sheet) return { error: "Products sheet not found" };
  const existingData = sheet.getDataRange().getValues();

  const rowMap = {};
  for (let i = 2; i < existingData.length; i++) {
    const code = String(existingData[i][0] || "").trim();
    const rawType = String(existingData[i][4] || "").trim().toLowerCase();
    rowMap[`${code}-${rawType}`] = i + 1;
  }

  let updated = 0;
  for (const p of products) {
    const rowNum = p._row || rowMap[`${p.code}-${p.type}`];
    if (!rowNum) continue;
    if (p.price !== undefined) sheet.getRange(rowNum, 7).setValue(p.price);
    if (p.stock !== undefined) sheet.getRange(rowNum, 11).setValue(p.stock);
    if (p.xuat !== undefined) sheet.getRange(rowNum, 9).setValue(p.xuat);
    if (p.nhap !== undefined) sheet.getRange(rowNum, 10).setValue(p.nhap);
    updated++;
  }
  return { success: true, updated };
}

function mapDisplayType(rawType) {
  const t = rawType.toLowerCase().trim();
  if (t === "holo") return "Holo";
  if (t.includes("ex")) return "EX";
  if (t.includes("prize")) return "Prize Card";
  return "Normal";
}

// ============================================================
// ORDERS (Customer Information sheet)
// ============================================================

function getOrders() {
  const sheet = SpreadsheetApp.openById(CUSTOMERS_SS_ID).getSheetByName("Orders");
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const orders = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0] && !row[4]) continue;
    orders.push({
      _row: i + 1,
      timestamp: String(row[0] || ""),
      orderDate: String(row[1] || ""),
      orderCode: String(row[2] || ""),
      products: String(row[3] || ""),
      customerName: String(row[4] || ""),
      phone: String(row[5] || ""),
      address: String(row[6] || ""),
      notes: String(row[7] || ""),
      sellPrice: Number(row[8]) || 0,
      buyPrice: Number(row[9]) || 0,
      shippingCost: Number(row[10]) || 0,
      profit: Number(row[11]) || 0,
      paymentStatus: String(row[12] || "Chưa thanh toán"),
    });
  }
  return orders;
}

function addOrder(order) {
  const ss = SpreadsheetApp.openById(CUSTOMERS_SS_ID);
  let sheet = ss.getSheetByName("Orders");
  if (!sheet) {
    sheet = ss.insertSheet("Orders");
    sheet.appendRow([
      "Dấu thời gian",
      "Ngày đơn hàng",
      "Mã đơn hàng (nếu có)",
      "Sản phẩm - Số lượng",
      "Tên Khách",
      "Số điện thoại",
      "Địa chỉ nhận hàng",
      "Ghi chú (Nếu có)",
      "GIÁ BÁN",
      "GIÁ MUA",
      "GIÁ SHIP + ĐÓNG GÓI",
      "LỢI NHUẬN",
      "TIẾN ĐỘ THANH TOÁN",
    ]);
  }
  sheet.appendRow([
    new Date().toISOString(),
    order.orderDate || new Date().toLocaleDateString("vi-VN"),
    order.orderCode || "",
    order.products || "",
    order.customerName || "",
    order.phone || "",
    order.address || "",
    order.notes || "",
    order.sellPrice || 0,
    order.buyPrice || 0,
    order.shippingCost || 0,
    order.profit || 0,
    order.paymentStatus || "Chưa thanh toán",
  ]);
  return { success: true };
}

function updateOrder(row, data) {
  const sheet = SpreadsheetApp.openById(CUSTOMERS_SS_ID).getSheetByName("Orders");
  if (!sheet) return { error: "Orders sheet not found" };
  if (data.buyPrice !== undefined) sheet.getRange(row, 10).setValue(data.buyPrice);
  if (data.shippingCost !== undefined) sheet.getRange(row, 11).setValue(data.shippingCost);
  if (data.profit !== undefined) sheet.getRange(row, 12).setValue(data.profit);
  if (data.paymentStatus !== undefined) sheet.getRange(row, 13).setValue(data.paymentStatus);
  if (data.notes !== undefined) sheet.getRange(row, 8).setValue(data.notes);
  if (data.orderCode !== undefined) sheet.getRange(row, 3).setValue(data.orderCode);
  return { success: true };
}

// ===========================================  =================
// CUSTOMERS (Customer Information sheet)
// ============================================================

function getCustomers() {
  const sheet = SpreadsheetApp.openById(CUSTOMERS_SS_ID).getSheetByName("Customers");
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const customers = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    customers.push({
      _row: i + 1,
      name: String(row[0] || ""),
      phone: String(row[1] || ""),
      newAddress: String(row[2] || ""),
      oldAddress: String(row[3] || ""),
    });
  }
  return customers;
}

function addCustomer(customer) {
  const ss = SpreadsheetApp.openById(CUSTOMERS_SS_ID);
  let sheet = ss.getSheetByName("Customers");
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
  const sheet = SpreadsheetApp.openById(CUSTOMERS_SS_ID).getSheetByName("Customers");
  if (!sheet) return { error: "Customers sheet not found" };
  if (data.name !== undefined) sheet.getRange(row, 1).setValue(data.name);
  if (data.phone !== undefined) sheet.getRange(row, 2).setValue(data.phone);
  if (data.newAddress !== undefined) sheet.getRange(row, 3).setValue(data.newAddress);
  if (data.oldAddress !== undefined) sheet.getRange(row, 4).setValue(data.oldAddress);
  return { success: true };
}

// ============================================================
// HELPER
// ============================================================

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}
