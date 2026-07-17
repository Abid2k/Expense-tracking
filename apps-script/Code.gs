/**
 * Expense Tracker backend — Google Apps Script Web App.
 * Paste this whole file into Extensions > Apps Script for your Google Sheet,
 * then deploy as a Web App (Execute as: Me, Who has access: Anyone).
 * See README.md in the project root for full setup steps.
 *
 * Access control: every request must include a `pin` value. If no OwnerPin
 * has been set yet in the Settings sheet, all requests are treated as the
 * owner (so first-time setup works). Once OwnerPin is set, a request must
 * match OwnerPin (full read/write) or ViewerPin (read-only) to be allowed.
 * Pin values themselves are never included in any JSON response.
 */

var EXPENSES_SHEET = 'Expenses';
var SAVINGS_SHEET = 'Savings';
var SETTINGS_SHEET = 'Settings';
var DEBTS_SHEET = 'Debts';
var DEBT_PAYMENTS_SHEET = 'DebtPayments';
var TODOS_SHEET = 'Todos';
var NOTES_SHEET = 'Notes';

function getSpreadsheet_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet_(name, headers) {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function ensureSheets_() {
  getOrCreateSheet_(EXPENSES_SHEET, ['ID', 'Date', 'Category', 'Amount', 'Note']);
  getOrCreateSheet_(SAVINGS_SHEET, ['ID', 'Date', 'Amount', 'Note']);
  getOrCreateSheet_(DEBTS_SHEET, ['ID', 'Name', 'Type', 'Amount', 'Note', 'Date']);
  getOrCreateSheet_(DEBT_PAYMENTS_SHEET, ['ID', 'DebtID', 'Date', 'Amount', 'Note']);
  getOrCreateSheet_(TODOS_SHEET, ['ID', 'Month', 'Text', 'Done', 'Date']);
  getOrCreateSheet_(NOTES_SHEET, ['ID', 'Date', 'Title', 'Content']);

  var settings = getOrCreateSheet_(SETTINGS_SHEET, ['Key', 'Value']);
  var data = settings.getDataRange().getValues();
  var existing = {};
  for (var i = 1; i < data.length; i++) existing[data[i][0]] = true;
  if (!existing['GoalName']) settings.appendRow(['GoalName', 'My Savings Goal']);
  if (!existing['GoalAmount']) settings.appendRow(['GoalAmount', 0]);
  if (!existing['OwnerPin']) settings.appendRow(['OwnerPin', '']);
  if (!existing['ViewerPin']) settings.appendRow(['ViewerPin', '']);
}

function sheetToObjects_(sheet) {
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (row.join('') === '') continue;
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = formatCellValue_(row[j]);
    }
    obj._row = i + 1;
    rows.push(obj);
  }
  return rows;
}

function formatCellValue_(value) {
  // Sheets auto-converts date-like strings (e.g. "2026-07-17") into real Date
  // objects. JSON.stringify then serializes Dates via toISOString() (UTC),
  // which rolls the calendar date back a day in UTC+ timezones. Reformat
  // using the spreadsheet's own timezone so the date round-trips correctly.
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return value;
}

function jsonOutput_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- Access control ----

function getPins_() {
  var sheet = getOrCreateSheet_(SETTINGS_SHEET, ['Key', 'Value']);
  var values = sheet.getDataRange().getValues();
  var pins = { owner: '', viewer: '' };
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === 'OwnerPin') pins.owner = String(values[i][1] || '');
    if (values[i][0] === 'ViewerPin') pins.viewer = String(values[i][1] || '');
  }
  return pins;
}

function resolveRole_(providedPin) {
  var pins = getPins_();
  if (!pins.owner) return 'owner'; // not configured yet -> open, acts as owner
  var pin = String(providedPin || '');
  if (pin && pin === pins.owner) return 'owner';
  if (pin && pins.viewer && pin === pins.viewer) return 'viewer';
  return null;
}

function getSettings_() {
  var sheet = getOrCreateSheet_(SETTINGS_SHEET, ['Key', 'Value']);
  var values = sheet.getDataRange().getValues();
  var settings = {};
  for (var i = 1; i < values.length; i++) {
    var key = values[i][0];
    if (key === 'OwnerPin' || key === 'ViewerPin') continue; // never expose pins
    settings[key] = values[i][1];
  }
  return settings;
}

// ---- doGet ----

function doGet(e) {
  ensureSheets_();
  var role = resolveRole_(e.parameter.pin);
  if (!role) {
    return jsonOutput_({ ok: false, needsPin: true, error: 'Invalid or missing PIN' });
  }

  return jsonOutput_({
    ok: true,
    role: role,
    expenses: sheetToObjects_(getOrCreateSheet_(EXPENSES_SHEET, [])),
    savings: sheetToObjects_(getOrCreateSheet_(SAVINGS_SHEET, [])),
    debts: sheetToObjects_(getOrCreateSheet_(DEBTS_SHEET, [])),
    debtPayments: sheetToObjects_(getOrCreateSheet_(DEBT_PAYMENTS_SHEET, [])),
    todos: sheetToObjects_(getOrCreateSheet_(TODOS_SHEET, [])),
    notes: sheetToObjects_(getOrCreateSheet_(NOTES_SHEET, [])),
    settings: getSettings_(),
  });
}

// ---- doPost ----

function doPost(e) {
  ensureSheets_();
  var body = {};
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOutput_({ ok: false, error: 'Invalid JSON body' });
  }

  var role = resolveRole_(body.pin);
  if (!role) {
    return jsonOutput_({ ok: false, needsPin: true, error: 'Invalid or missing PIN' });
  }
  if (role === 'viewer') {
    return jsonOutput_({ ok: false, error: 'Read-only access — this PIN cannot make changes' });
  }

  var action = body.action;

  try {
    if (action === 'addExpense') return addExpense_(body);
    if (action === 'deleteExpense') return deleteRowById_(EXPENSES_SHEET, body.id);
    if (action === 'addSaving') return addSaving_(body);
    if (action === 'deleteSaving') return deleteRowById_(SAVINGS_SHEET, body.id);
    if (action === 'setGoal') return setGoal_(body);
    if (action === 'setPins') return setPins_(body);
    if (action === 'addDebt') return addDebt_(body);
    if (action === 'deleteDebt') return deleteDebt_(body);
    if (action === 'addDebtPayment') return addDebtPayment_(body);
    if (action === 'deleteDebtPayment') return deleteRowById_(DEBT_PAYMENTS_SHEET, body.id);
    if (action === 'addTodo') return addTodo_(body);
    if (action === 'updateTodo') return updateTodo_(body);
    if (action === 'deleteTodo') return deleteRowById_(TODOS_SHEET, body.id);
    if (action === 'addNote') return addNote_(body);
    if (action === 'deleteNote') return deleteRowById_(NOTES_SHEET, body.id);
    return jsonOutput_({ ok: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err) });
  }
}

// ---- Expenses ----

function addExpense_(body) {
  var sheet = getOrCreateSheet_(EXPENSES_SHEET, ['ID', 'Date', 'Category', 'Amount', 'Note']);
  var id = Utilities.getUuid();
  sheet.appendRow([id, body.date, body.category, Number(body.amount), body.note || '']);
  return jsonOutput_({ ok: true, id: id });
}

// ---- Savings ----

function addSaving_(body) {
  var sheet = getOrCreateSheet_(SAVINGS_SHEET, ['ID', 'Date', 'Amount', 'Note']);
  var id = Utilities.getUuid();
  sheet.appendRow([id, body.date, Number(body.amount), body.note || '']);
  return jsonOutput_({ ok: true, id: id });
}

function setGoal_(body) {
  setSettingValue_('GoalName', typeof body.goalName !== 'undefined' ? body.goalName : null);
  setSettingValue_('GoalAmount', typeof body.goalAmount !== 'undefined' ? Number(body.goalAmount) : null);
  return jsonOutput_({ ok: true });
}

// ---- Pins ----

function setPins_(body) {
  if (typeof body.ownerPin !== 'undefined') setSettingValue_('OwnerPin', String(body.ownerPin));
  if (typeof body.viewerPin !== 'undefined') setSettingValue_('ViewerPin', String(body.viewerPin));
  return jsonOutput_({ ok: true });
}

function setSettingValue_(key, value) {
  if (value === null) return;
  var sheet = getOrCreateSheet_(SETTINGS_SHEET, ['Key', 'Value']);
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  sheet.appendRow([key, value]);
}

// ---- Debts ----

function addDebt_(body) {
  var sheet = getOrCreateSheet_(DEBTS_SHEET, ['ID', 'Name', 'Type', 'Amount', 'Note', 'Date']);
  var id = Utilities.getUuid();
  sheet.appendRow([id, body.name, body.type, Number(body.amount), body.note || '', body.date]);
  return jsonOutput_({ ok: true, id: id });
}

function deleteDebt_(body) {
  deleteRowById_(DEBTS_SHEET, body.id);
  var paymentsSheet = getOrCreateSheet_(DEBT_PAYMENTS_SHEET, ['ID', 'DebtID', 'Date', 'Amount', 'Note']);
  var values = paymentsSheet.getDataRange().getValues();
  for (var i = values.length - 1; i >= 1; i--) {
    if (values[i][1] === body.id) paymentsSheet.deleteRow(i + 1);
  }
  return jsonOutput_({ ok: true });
}

function addDebtPayment_(body) {
  var sheet = getOrCreateSheet_(DEBT_PAYMENTS_SHEET, ['ID', 'DebtID', 'Date', 'Amount', 'Note']);
  var id = Utilities.getUuid();
  sheet.appendRow([id, body.debtId, body.date, Number(body.amount), body.note || '']);
  return jsonOutput_({ ok: true, id: id });
}

// ---- Todos ----

function addTodo_(body) {
  var sheet = getOrCreateSheet_(TODOS_SHEET, ['ID', 'Month', 'Text', 'Done', 'Date']);
  var id = Utilities.getUuid();
  sheet.appendRow([id, body.month, body.text, false, new Date()]);
  return jsonOutput_({ ok: true, id: id });
}

function updateTodo_(body) {
  var sheet = getOrCreateSheet_(TODOS_SHEET, ['ID', 'Month', 'Text', 'Done', 'Date']);
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === body.id) {
      sheet.getRange(i + 1, 4).setValue(Boolean(body.done));
      return jsonOutput_({ ok: true });
    }
  }
  return jsonOutput_({ ok: false, error: 'Todo not found' });
}

// ---- Notes ----

function addNote_(body) {
  var sheet = getOrCreateSheet_(NOTES_SHEET, ['ID', 'Date', 'Title', 'Content']);
  var id = Utilities.getUuid();
  sheet.appendRow([id, body.date, body.title || '', body.content || '']);
  return jsonOutput_({ ok: true, id: id });
}

// ---- Shared ----

function deleteRowById_(sheetName, id) {
  var sheet = getOrCreateSheet_(sheetName, []);
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === id) {
      sheet.deleteRow(i + 1);
      return jsonOutput_({ ok: true });
    }
  }
  return jsonOutput_({ ok: false, error: 'ID not found' });
}
