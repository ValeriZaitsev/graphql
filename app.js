import {
  auditGraph,
  renderTransactionGraphs,
  prepareAuditData,
} from "./graphs.js";
import {
  formatDate,
  groupByPathName,
  roundToDecimal,
  roundToMB,
} from "./helper.js";

const loginForm = document.getElementById("loginForm");
const userInput = document.getElementById("userInput");
const passwordInput = document.getElementById("password");
const logoutButton = document.getElementById("logoutButton");
const userProfileContainer = document.getElementById("userProfileContainer");
const graphSelector = document.getElementById("graphSelector");
const div01Graph = document.getElementById("div-01Graph");
const piscineJsGraph = document.getElementById("piscine-jsGraph");
const piscineGoGraph = document.getElementById("piscine-goGraph");

document.addEventListener("DOMContentLoaded", function () {
  authState();
});

function authState() {
  const JWT = sessionStorage.getItem("JWT");
  if (JWT) {
    loginForm.style.display = "none";
    logoutButton.style.display = "block";
    userProfileContainer.style.display = "block";
    loadUser();
  } else {
    loginForm.style.display = "block";
    logoutButton.style.display = "none";
    userProfileContainer.style.display = "none";
  }
}

async function fetchData(query) {
  const JWT = sessionStorage.getItem("JWT");
  if (!JWT) {
    console.error("User is not authenticated");
  }

  const headers = new Headers({
    Authorization: "Bearer " + JWT,
    "Content-Type": "application/json",
  });

  const response = await fetch(
    `https://01.kood.tech/api/graphql-engine/v1/graphql`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ query: query }),
    }
  );

  const data = await response.json();
  return data;
}

async function signIn(userInput, password) {
  const base64 = btoa(userInput + ":" + password);
  const headers = new Headers({
    Authorization: "Basic " + base64,
    "Content-Type": "application/json",
  });

  const response = await fetch(`https://01.kood.tech/api/auth/signin`, {
    method: "POST",
    headers: headers,
  });

  if (!response.ok) {
    throw Error("Wrong email or password");
  }

  const data = await response.json();
  return data;
}

async function loadUser() {
  const userQuery = `
        query {
            user {
                id
                login
                attrs
                auditRatio
                totalDown
                totalUp
            }
        }
    `;

  const userData = await fetchData(userQuery);
  const userDataInfo = userData.data.user[0];
  const userDataAttrs = userDataInfo.attrs;
  document.getElementById("userLogin").innerText = userDataInfo.login;
  document.getElementById("name").innerText =
    userDataAttrs.firstName + " " + userDataAttrs.lastName;
  document.getElementById("birthday").innerText = new Date(
    userDataAttrs.dateOfBirth
  ).toLocaleDateString();
  document.getElementById("email").innerText = userDataAttrs.email;
  document.getElementById("phoneNumber").innerText = userDataAttrs.tel;
  document.getElementById("address").innerText =
    userDataAttrs.addressStreet +
    ", " +
    userDataAttrs.addressCity +
    ", " +
    userDataAttrs.addressCountry;

  let auditRatio = roundToDecimal(userDataInfo.auditRatio);
  let auditsDone = roundToMB(userDataInfo.totalUp);
  let auditsReceived = roundToMB(userDataInfo.totalDown);
  document.getElementById("auditRatio").innerText = auditRatio;
  document.getElementById("auditsDone").innerText = auditsDone;
  document.getElementById("auditsReceived").innerText = auditsReceived;
  loadUserProfile();
}

async function loadUserProfile() {
  const userProfileQuery = `
        query {
            xpTransactions: transaction(where: {type: {_like: "%xp%"}}) {
                id
                type
                amount
                objectId
                userId
                createdAt
                path
            }
            audit {
                id
                auditorId
                grade
                resultId
            }
        }
    `;

  const userDetails = await fetchData(userProfileQuery);
  const groupedXpTransactions = groupByPathName(
    userDetails.data.xpTransactions
  );
  const auditData = prepareAuditData(userDetails.data.audit);

  renderTransactionGraphs(groupedXpTransactions);
  auditGraph(auditData);
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = userInput.value;
  const password = passwordInput.value;

  try {
    const JWT = await signIn(user, password);
    sessionStorage.setItem("JWT", JWT);
    authState();
  } catch (error) {
    alert(error);
  }
});

logoutButton.addEventListener("click", () => {
  sessionStorage.removeItem("JWT");
  userInput.value = "";
  passwordInput.value = "";
  authState();
});

graphSelector.addEventListener("change", function () {
  div01Graph.style.display = "none";
  piscineJsGraph.style.display = "none";
  piscineGoGraph.style.display = "none";

  switch (graphSelector.value) {
    case "div-01":
      div01Graph.style.display = "block";
      break;
    case "piscine-js":
      piscineJsGraph.style.display = "block";
      break;
    case "piscine-go":
      piscineGoGraph.style.display = "block";
      break;
  }
});
