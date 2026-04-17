// ============================================================
// APPS SCRIPT 1: PASTE INTO "2026 Stock Pokemon extra" GOOGLE SHEET
// Sheet: Extensions → Apps Script → paste this into Code.gs
// Deploy → New Deployment → Web App (Execute as: Me, Access: Anyone)
// Copy the URL → set as GOOGLE_STOCK_URL env var
// ============================================================

// Business sheet ID (for looking up buy prices from MENU)
var BUSINESS_SS_ID = "1iaIlu-TZg6UbH-5keqBh7YFJO-kqKX7C8i4hBNOkU38";

function doGet(e) {
  try {
    var action = e.parameter.action;
    switch (action) {
      case "products":
        return json(getProducts());
      case "stats":
        return json(getStats());
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
    var action = body.action;
    switch (action) {
      case "updateProducts":
        return json(updateProducts(body.products));
      case "updateStock":
        return json(updateStock(body.code, body.type, body.quantity));
      case "addProduct":
        return json(addProduct(body.product));
      default:
        return json({ error: "Unknown action" });
    }
  } catch (err) {
    return json({ error: err.message });
  }
}

// ============================================================
// PRODUCTS - Read from "Tồn Kho t3" sheet
// Row 0-1: title/headers, Row 2: column headers, Row 3+: data
// Columns: [0]No/code, [1]Stype/group, [2]Good desc/name,
//          [3]Series, [4]Type, [5]KHO, [6]Unit Price,
//          [7]ĐẦU KỲ, [8]XUẤT, [9]NHẬP, [10]TỒN, [11]SUM
// ============================================================

function getProducts() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Tồn Kho t3");
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 3) return [];

  // Try to get buy prices from Business sheet MENU
  var menuMap = {};
  try {
    var bizSS = SpreadsheetApp.openById(BUSINESS_SS_ID);
    var menuSheet = bizSS.getSheetByName("MENU");
    if (menuSheet) {
      var menuData = menuSheet.getDataRange().getValues();
      for (var m = 1; m < menuData.length; m++) {
        var menuCode = String(menuData[m][0] || "").trim();
        var menuSeries = String(menuData[m][2] || "").trim().toUpperCase();
        var buyPrice = menuData[m][6];
        if (menuCode && buyPrice) {
          // Key by code+series for matching
          var key = menuCode + "|" + menuSeries;
          menuMap[key] = Number(buyPrice);
        }
      }
    }
  } catch (err) {
    // Business sheet not accessible, continue without buy prices
  }

  var products = [];
  for (var i = 2; i < data.length; i++) {
    var row = data[i];
    var code = String(row[0] || "").trim();
    var name = String(row[2] || "").trim();
    if (!code || !name) continue;

    var group = String(row[1] || "").trim().toLowerCase();
    var series = String(row[3] || "").trim();
    var rawType = String(row[4] || "").trim().toLowerCase();
    var kho = String(row[5] || "").trim();
    var price = row[6] ? Number(row[6]) : null;
    var stock = row[10] ? Number(row[10]) : 0;

    // Look up buy price from MENU
    var menuKey = code + "|" + series.toUpperCase();
    var buyPrice = menuMap[menuKey] || null;

    products.push({
      _row: i + 1,
      code: code,
      group: group,
      name: name,
      series: series,
      type: rawType,
      displayType: mapDisplayType(rawType),
      kho: kho,
      price: price !== null && !isNaN(price) ? price : null,
      buyPrice: buyPrice,
      stock: Math.round(stock),
    });
  }
  return products;
}

function updateProducts(products) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Tồn Kho t3");
  if (!sheet) return { error: "Sheet not found" };

  var existingData = sheet.getDataRange().getValues();
  var rowMap = {};
  for (var i = 2; i < existingData.length; i++) {
    var code = String(existingData[i][0] || "").trim();
    var rawType = String(existingData[i][4] || "").trim().toLowerCase();
    var series = String(existingData[i][3] || "").trim();
    rowMap[code + "|" + series + "|" + rawType] = i + 1;
  }

  var updated = 0;
  for (var p = 0; p < products.length; p++) {
    var prod = products[p];
    var rowNum = prod._row || rowMap[prod.code + "|" + prod.series + "|" + prod.type];
    if (!rowNum) continue;
    if (prod.price !== undefined) sheet.getRange(rowNum, 7).setValue(prod.price);  // Unit Price
    if (prod.stock !== undefined) sheet.getRange(rowNum, 11).setValue(prod.stock); // TỒN
    if (prod.xuat !== undefined) sheet.getRange(rowNum, 9).setValue(prod.xuat);   // XUẤT
    if (prod.nhap !== undefined) sheet.getRange(rowNum, 10).setValue(prod.nhap);   // NHẬP
    updated++;
  }
  return { success: true, updated: updated };
}

function updateStock(code, type, quantity) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Tồn Kho t3");
  if (!sheet) return { error: "Sheet not found" };

  var data = sheet.getDataRange().getValues();
  for (var i = 2; i < data.length; i++) {
    var rowCode = String(data[i][0] || "").trim();
    var rowType = String(data[i][4] || "").trim().toLowerCase();
    if (rowCode === code && rowType === type.toLowerCase()) {
      var currentStock = Number(data[i][10]) || 0;
      var newStock = Math.max(0, currentStock - quantity);
      sheet.getRange(i + 1, 11).setValue(newStock); // TỒN
      var currentXuat = Number(data[i][8]) || 0;
      sheet.getRange(i + 1, 9).setValue(currentXuat + quantity); // XUẤT
      return { success: true, stock: newStock };
    }
  }
  return { error: "Product not found" };
}

// ============================================================
// STATS - Summary
// ============================================================

function getStats() {
  var products = getProducts();
  var totalProducts = products.length;
  var totalStock = 0;
  var withPrice = 0;
  var totalValue = 0;
  var typeBreakdown = {};

  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    totalStock += p.stock;
    if (p.price !== null) {
      withPrice++;
      totalValue += p.price * p.stock;
    }
    typeBreakdown[p.displayType] = (typeBreakdown[p.displayType] || 0) + 1;
  }

  return {
    totalProducts: totalProducts,
    totalStock: totalStock,
    withPrice: withPrice,
    totalValue: totalValue,
    typeBreakdown: typeBreakdown
  };
}

// ============================================================
// ADD PRODUCT - Add new row to stock sheet
// ============================================================

function addProduct(product) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Tồn Kho t3");
  if (!sheet) return { error: "Sheet not found" };

  var data = sheet.getDataRange().getValues();
  var nextRow = data.length;
  // Find last row with data
  while (nextRow > 2 && !String(data[nextRow - 1][0] || "").trim() && !String(data[nextRow - 1][2] || "").trim()) {
    nextRow--;
  }
  nextRow++;

  sheet.getRange(nextRow, 1).setValue(product.code || "");        // No/code
  sheet.getRange(nextRow, 2).setValue(product.group || "");        // Stype/group
  sheet.getRange(nextRow, 3).setValue(product.name || "");         // Good description
  sheet.getRange(nextRow, 4).setValue(product.series || "");       // Series
  sheet.getRange(nextRow, 5).setValue(product.type || "");         // Type
  sheet.getRange(nextRow, 6).setValue("");                         // KHO
  sheet.getRange(nextRow, 7).setValue(product.price || "");        // Unit Price
  sheet.getRange(nextRow, 8).setValue("");                         // ĐẦU KỲ
  sheet.getRange(nextRow, 9).setValue("");                         // XUẤT
  sheet.getRange(nextRow, 10).setValue("");                        // NHẬP
  sheet.getRange(nextRow, 11).setValue(product.stock || 0);        // TỒN

  return { success: true };
}

// ============================================================
// HELPERS
// ============================================================

function mapDisplayType(rawType) {
  var t = rawType.toLowerCase().trim();
  if (t === "holo prize card") return "Holo Prize Card";
  if (t === "ex prize card") return "EX Prize Card";
  if (t === "holo") return "Holo";
  if (t.includes("ex")) return "EX";
  if (t.includes("prize")) return "Prize Card";
  return "Normal";
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}
