// src/utils/creditBridge.js

let updateCreditsFn = null;
let pendingCredits = null;

export const registerUpdateCredits = (fn) => {
  updateCreditsFn = fn;

  // apply pending value if exists
  if (pendingCredits !== null) {
    updateCreditsFn(pendingCredits);
    pendingCredits = null;
  }
};

export const pushCredits = (value) => {
  console.log("Pushing credits:", value);

  if (updateCreditsFn) {
    updateCreditsFn(value);
  } else {
    pendingCredits = value;
  }
};