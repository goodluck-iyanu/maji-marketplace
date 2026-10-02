const crypto = require('crypto');
async function run() {
  const payload = {
    state: "Lagos",
    pickupState: "Abuja",
    locker: false,
    recipientAddress: "123 Main St",
    recipientState: "Lagos",
    recipientName: "John Doe",
    recipientPhone: "08012345678",
    recipientEmail: "john@example.com",
    uniqueID: "TEST-" + Date.now(),
    BatchID: "BATCH-" + Date.now(),
    weight: 1
  };
  
  const res = await fetch("https://apisandbox.fezdelivery.co/v1/order/cost", {
    method: "POST",
    headers: {
      "Authorization": "Bearer dummy",
      "secret-key": "dummy_secret",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Body:", text);
}
run();
