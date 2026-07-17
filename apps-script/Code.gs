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
 *
 * Rows are written/read by header name (not fixed column position), so
 * sheets created by older versions of this script can safely gain new
 * columns without breaking existing data.
 */

var EXPENSES_SHEET = 'Expenses';
var SAVINGS_SHEET = 'Savings';
var GOALS_SHEET = 'Goals';
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

// Adds any headers in requiredHeaders that the sheet doesn't already have,
// backfilling existing rows with a default value. Safe to call every time.
function ensureColumns_(sheet, requiredHeaders, defaults) {
  requiredHeaders.forEach(function (header) {
    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    if (headers.indexOf(header) !== -1) return;

    var newCol = lastCol + 1;
    sheet.getRange(1, newCol).setValue(header);
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var def = defaults && header in defaults ? defaults[header] : '';
      var vals = [];
      for (var i = 0; i < lastRow - 1; i++) vals.push([def]);
      sheet.getRange(2, newCol, lastRow - 1, 1).setValues(vals);
    }
  });
}

function getHeaders_(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function appendRowByHeaders_(sheet, valuesObj) {
  var headers = getHeaders_(sheet);
  var row = headers.map(function (h) {
    return Object.prototype.hasOwnProperty.call(valuesObj, h) ? valuesObj[h] : '';
  });
  sheet.appendRow(row);
}

function findRowIndexById_(sheet, id) {
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === id) return i + 1; // 1-based row number
  }
  return -1;
}

function setCellByHeader_(sheet, rowIndex, headerName, value) {
  var headers = getHeaders_(sheet);
  var col = headers.indexOf(headerName) + 1;
  if (col === 0) throw new Error('Header not found: ' + headerName);
  sheet.getRange(rowIndex, col).setValue(value);
}

// Updates only the headers present in valuesObj, leaving other columns (like
// ID or Paid) untouched. Returns false if no row with this ID exists.
function updateRowByHeaders_(sheet, id, valuesObj) {
  var rowIndex = findRowIndexById_(sheet, id);
  if (rowIndex === -1) return false;
  Object.keys(valuesObj).forEach(function (header) {
    setCellByHeader_(sheet, rowIndex, header, valuesObj[header]);
  });
  return true;
}

function ensureSheets_() {
  getOrCreateSheet_(EXPENSES_SHEET, ['ID', 'Date', 'Category', 'Amount', 'Note']);

  var savingsSheet = getOrCreateSheet_(SAVINGS_SHEET, ['ID', 'GoalID', 'Date', 'Amount', 'Note']);
  ensureColumns_(savingsSheet, ['GoalID'], {});

  var goalsSheet = getOrCreateSheet_(GOALS_SHEET, ['ID', 'Name', 'Type', 'TargetAmount', 'TargetDate', 'Note', 'Date']);

  var debtsSheet = getOrCreateSheet_(DEBTS_SHEET, ['ID', 'Name', 'Type', 'Amount', 'Note', 'Date', 'Paid']);
  ensureColumns_(debtsSheet, ['Paid'], { Paid: false });

  getOrCreateSheet_(DEBT_PAYMENTS_SHEET, ['ID', 'DebtID', 'Date', 'Amount', 'Note']);
  getOrCreateSheet_(TODOS_SHEET, ['ID', 'Month', 'Text', 'Done', 'Date']);
  getOrCreateSheet_(NOTES_SHEET, ['ID', 'Date', 'Title', 'Content']);

  var settings = getOrCreateSheet_(SETTINGS_SHEET, ['Key', 'Value']);
  var data = settings.getDataRange().getValues();
  var existing = {};
  for (var i = 1; i < data.length; i++) existing[data[i][0]] = true;
  if (!existing['OwnerPin']) settings.appendRow(['OwnerPin', '']);
  if (!existing['ViewerPin']) settings.appendRow(['ViewerPin', '']);

  migrateLegacyGoal_(goalsSheet, savingsSheet, settings);
}

// Users who set up this app before multi-goal support had a single goal
// stored as GoalName/GoalAmount in Settings. Move that into a real Goal row
// once, and attach any existing contributions (which had no GoalID) to it.
function migrateLegacyGoal_(goalsSheet, savingsSheet, settingsSheet) {
  var goalsData = goalsSheet.getDataRange().getValues();
  if (goalsData.length > 1) return; // goals already exist, nothing to migrate

  var values = settingsSheet.getDataRange().getValues();
  var goalName, goalAmount;
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === 'GoalName') goalName = values[i][1];
    if (values[i][0] === 'GoalAmount') goalAmount = values[i][1];
  }
  if (!goalName && !goalAmount) return; // nothing to migrate

  var newId = Utilities.getUuid();
  appendRowByHeaders_(goalsSheet, {
    ID: newId,
    Name: goalName || 'My Savings Goal',
    Type: 'Custom',
    TargetAmount: Number(goalAmount) || 0,
    TargetDate: '',
    Note: '',
    Date: new Date(),
  });

  var goalIdCol = getHeaders_(savingsSheet).indexOf('GoalID') + 1;
  var sValues = savingsSheet.getDataRange().getValues();
  for (var r = 1; r < sValues.length; r++) {
    if (!sValues[r][goalIdCol - 1]) {
      savingsSheet.getRange(r + 1, goalIdCol).setValue(newId);
    }
  }
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
    goals: sheetToObjects_(getOrCreateSheet_(GOALS_SHEET, [])),
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

    if (action === 'addGoal') return addGoal_(body);
    if (action === 'updateGoal') return updateGoal_(body);
    if (action === 'deleteGoal') return deleteGoal_(body);
    if (action === 'addSaving') return addSaving_(body);
    if (action === 'deleteSaving') return deleteRowById_(SAVINGS_SHEET, body.id);

    if (action === 'setPins') return setPins_(body);

    if (action === 'addDebt') return addDebt_(body);
    if (action === 'updateDebt') return updateDebt_(body);
    if (action === 'deleteDebt') return deleteDebt_(body);
    if (action === 'toggleDebtPaid') return toggleDebtPaid_(body);
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
  appendRowByHeaders_(sheet, {
    ID: id,
    Date: body.date,
    Category: body.category,
    Amount: Number(body.amount),
    Note: body.note || '',
  });
  return jsonOutput_({ ok: true, id: id });
}

// ---- Savings goals ----

function addGoal_(body) {
  var sheet = getOrCreateSheet_(GOALS_SHEET, ['ID', 'Name', 'Type', 'TargetAmount', 'TargetDate', 'Note', 'Date']);
  var id = Utilities.getUuid();
  appendRowByHeaders_(sheet, {
    ID: id,
    Name: body.name,
    Type: body.type,
    TargetAmount: Number(body.targetAmount) || 0,
    TargetDate: body.targetDate || '',
    Note: body.note || '',
    Date: new Date(),
  });
  return jsonOutput_({ ok: true, id: id });
}

function updateGoal_(body) {
  var sheet = getOrCreateSheet_(GOALS_SHEET, ['ID', 'Name', 'Type', 'TargetAmount', 'TargetDate', 'Note', 'Date']);
  var fields = {};
  if (typeof body.name !== 'undefined') fields.Name = body.name;
  if (typeof body.type !== 'undefined') fields.Type = body.type;
  if (typeof body.targetAmount !== 'undefined') fields.TargetAmount = Number(body.targetAmount) || 0;
  if (typeof body.targetDate !== 'undefined') fields.TargetDate = body.targetDate || '';
  if (typeof body.note !== 'undefined') fields.Note = body.note || '';
  var found = updateRowByHeaders_(sheet, body.id, fields);
  if (!found) return jsonOutput_({ ok: false, error: 'Goal not found' });
  return jsonOutput_({ ok: true });
}

function deleteGoal_(body) {
  deleteRowById_(GOALS_SHEET, body.id);
  var savingsSheet = getOrCreateSheet_(SAVINGS_SHEET, ['ID', 'GoalID', 'Date', 'Amount', 'Note']);
  var goalIdCol = getHeaders_(savingsSheet).indexOf('GoalID');
  var values = savingsSheet.getDataRange().getValues();
  for (var i = values.length - 1; i >= 1; i--) {
    if (values[i][goalIdCol] === body.id) savingsSheet.deleteRow(i + 1);
  }
  return jsonOutput_({ ok: true });
}

function addSaving_(body) {
  var sheet = getOrCreateSheet_(SAVINGS_SHEET, ['ID', 'GoalID', 'Date', 'Amount', 'Note']);
  var id = Utilities.getUuid();
  appendRowByHeaders_(sheet, {
    ID: id,
    GoalID: body.goalId,
    Date: body.date,
    Amount: Number(body.amount),
    Note: body.note || '',
  });
  return jsonOutput_({ ok: true, id: id });
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
  var sheet = getOrCreateSheet_(DEBTS_SHEET, ['ID', 'Name', 'Type', 'Amount', 'Note', 'Date', 'Paid']);
  var id = Utilities.getUuid();
  appendRowByHeaders_(sheet, {
    ID: id,
    Name: body.name,
    Type: body.type,
    Amount: Number(body.amount),
    Note: body.note || '',
    Date: body.date,
    Paid: false,
  });
  return jsonOutput_({ ok: true, id: id });
}

function updateDebt_(body) {
  var sheet = getOrCreateSheet_(DEBTS_SHEET, ['ID', 'Name', 'Type', 'Amount', 'Note', 'Date', 'Paid']);
  var fields = {};
  if (typeof body.name !== 'undefined') fields.Name = body.name;
  if (typeof body.type !== 'undefined') fields.Type = body.type;
  if (typeof body.amount !== 'undefined') fields.Amount = Number(body.amount);
  if (typeof body.note !== 'undefined') fields.Note = body.note || '';
  if (typeof body.date !== 'undefined') fields.Date = body.date;
  var found = updateRowByHeaders_(sheet, body.id, fields);
  if (!found) return jsonOutput_({ ok: false, error: 'Debt not found' });
  return jsonOutput_({ ok: true });
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

function toggleDebtPaid_(body) {
  var sheet = getOrCreateSheet_(DEBTS_SHEET, ['ID', 'Name', 'Type', 'Amount', 'Note', 'Date', 'Paid']);
  var rowIndex = findRowIndexById_(sheet, body.id);
  if (rowIndex === -1) return jsonOutput_({ ok: false, error: 'Debt not found' });
  setCellByHeader_(sheet, rowIndex, 'Paid', Boolean(body.paid));
  return jsonOutput_({ ok: true });
}

function addDebtPayment_(body) {
  var sheet = getOrCreateSheet_(DEBT_PAYMENTS_SHEET, ['ID', 'DebtID', 'Date', 'Amount', 'Note']);
  var id = Utilities.getUuid();
  appendRowByHeaders_(sheet, {
    ID: id,
    DebtID: body.debtId,
    Date: body.date,
    Amount: Number(body.amount),
    Note: body.note || '',
  });
  return jsonOutput_({ ok: true, id: id });
}

// ---- Todos ----

function addTodo_(body) {
  var sheet = getOrCreateSheet_(TODOS_SHEET, ['ID', 'Month', 'Text', 'Done', 'Date']);
  var id = Utilities.getUuid();
  appendRowByHeaders_(sheet, {
    ID: id,
    Month: body.month,
    Text: body.text,
    Done: false,
    Date: new Date(),
  });
  return jsonOutput_({ ok: true, id: id });
}

function updateTodo_(body) {
  var sheet = getOrCreateSheet_(TODOS_SHEET, ['ID', 'Month', 'Text', 'Done', 'Date']);
  var rowIndex = findRowIndexById_(sheet, body.id);
  if (rowIndex === -1) return jsonOutput_({ ok: false, error: 'Todo not found' });
  setCellByHeader_(sheet, rowIndex, 'Done', Boolean(body.done));
  return jsonOutput_({ ok: true });
}

// ---- Notes ----

function addNote_(body) {
  var sheet = getOrCreateSheet_(NOTES_SHEET, ['ID', 'Date', 'Title', 'Content']);
  var id = Utilities.getUuid();
  appendRowByHeaders_(sheet, {
    ID: id,
    Date: body.date,
    Title: body.title || '',
    Content: body.content || '',
  });
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
