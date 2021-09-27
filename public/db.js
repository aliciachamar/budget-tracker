let db;
let budgetVersion;

const request = indexedDB.open("BudgetDB", budgetVersion || 1);

request.onupgradeneeded = function (e) {
  const { oldVersion } = e;
  const newVersion = e.newVersion || db.version;
  console.log(`DB version updated from ${oldVersion} to ${newVersion}.`);

  db = e.target.result;

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore("BudgetStore", { autoincrement: true });
  }
};

request.onerror = function (e) {
  console.log(`Oh dear! ${e.target.errorCode}`);
};

checkDB = () => {
  let transaction = db.transaction(["BudgetStore"], "readwrite");
  const store = transaction.objectStoreNames("BudgetStore");
  const getAll = store.getAll();

  getAll.onsuccess = () => {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        }
      })
        .then(response => response.json)
        .then(res => {
          if (res.length !== 0) {
            transaction = db.transaction(["BudgetStore"], "readwrite");
            const currentStore = transaction.objectStoreNames("BudgetStore");
            currentStore.clear();
            console.log("Store cleared.");
          }
        })
    }
  }
};

request.onsuccess = function (e) {
  db = e.target.result;
  if (navigator.onLine) {
    checkDB();
  }
};

saveRecord = function (rec) {
  let transaction = db.transaction(["BudgetStore"], "readwrite");
  const store = transaction.objectStoreNames("BudgetStore");
  store.add(rec);
};

window.addEventListener("online", checkDB);