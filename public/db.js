let db;
// Budget database in browser to be used while online service is out
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function(event) {
   // "Pending" object will store the values
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function(event) {
  db = event.target.result;
  if (navigator.onLine) {
    checkDatabase();
  }
};

//Error shown below:
request.onerror = function(event) {
  console.log("Error logged: " + event.target.errorCode);
};

function saveRecord(record) {
  //Create a transaction
  const transaction = db.transaction(["pending"], "readwrite");

  const store = transaction.objectStore("pending");

  store.add(record);
}

function checkDatabase() {
  //Open a transaction on your pending db
  const transaction = db.transaction(["pending"], "readwrite");
  //Access your pending object store
  const store = transaction.objectStore("pending");
  //Get all records stored
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => response.json())
      .then(() => {
        //Open a transaction
        const transaction = db.transaction(["pending"], "readwrite");

        //Access your pending
        const store = transaction.objectStore("pending");

        //Clear your object store
        store.clear();
      });
    }
  };
}

//Listen for online service
window.addEventListener("online", checkDatabase);