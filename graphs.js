import { groupByDateAndSum, roundToKB } from "./helper.js";

export function auditGraph(auditData) {
  const svgWidth = 200;
  const svgHeight = 200;
  const radius = Math.min(svgWidth, svgHeight) / 2;
  const auditSVG = document.getElementById("auditSVG");
  const legendSVG = document.getElementById("legendSVG");

  let totalAudits = 0;
  for (const data of auditData) {
    totalAudits += data.count;
  }

  let startAngle = 0;
  let endAngle = 0;

  const colors = ["#D9F2DF", "#BE419F"];
  const labels = ["Audits not done", "Audits done"];

  let legendX = 10;
  let legendY = 40;

  for (let i = 0; i < labels.length; i++) {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", legendX);
    rect.setAttribute("y", legendY);
    rect.setAttribute("width", 20);
    rect.setAttribute("height", 20);
    rect.setAttribute("fill", colors[i]);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", legendX + 30);
    text.setAttribute("y", legendY + 15);
    text.textContent = labels[i];

    legendSVG.appendChild(rect);
    legendSVG.appendChild(text);

    legendY -= 30;
  }

  for (const [index, data] of auditData.entries()) {
    startAngle = endAngle;
    endAngle = startAngle + (data.count / totalAudits) * Math.PI * 2;

    const x1 = radius + radius * Math.sin(startAngle);
    const y1 = radius - radius * Math.cos(startAngle);

    const x2 = radius + radius * Math.sin(endAngle);
    const y2 = radius - radius * Math.cos(endAngle);

    const largeArcFlag = endAngle - startAngle <= Math.PI ? 0 : 1;

    const pathData = [
      `M ${radius},${radius}`,
      `L ${x1},${y1}`,
      `A ${radius},${radius} 0 ${largeArcFlag},1 ${x2},${y2}`,
      "Z",
    ].join(" ");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    path.setAttribute("fill", colors[index]);

    auditSVG.appendChild(path);
  }
}

function xpTransactionGraph(xpTransactions, svgElement) {
  const marginLeft = 0;
  const marginBottom = 0;
  const width = 900;
  const height = 450;

  createLine(
    svgElement,
    marginLeft,
    height - marginBottom,
    marginLeft,
    10,
    "black"
  );
  createArrow(
    svgElement,
    `${marginLeft - 10},10 ${marginLeft},0 ${marginLeft + 10},10`,
    "black"
  );
  createLine(
    svgElement,
    marginLeft,
    height - marginBottom,
    width - 10,
    height - marginBottom,
    "black"
  );
  createArrow(
    svgElement,
    `${width - 10},${height - marginBottom - 10} ${width - 0},${
      height - marginBottom
    } ${width - 10},${height - marginBottom + 10}`,
    "black"
  );

  xpTransactions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  xpTransactions = groupByDateAndSum(xpTransactions);

  const svgWidth = width - marginBottom;
  const svgHeight = height - marginLeft;
  const barWidth = svgWidth / xpTransactions.length;

  let xpAmount = 0;
  const allXpAmount = xpTransactions.map((trans) => {
    xpAmount += trans.amount;
    return xpAmount;
  });

  const maxXpSum = Math.max(...allXpAmount);
  allXpAmount.forEach((amount, index) => {
    if (index < allXpAmount.length - 1) {
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );

      const x1 = barWidth * index;
      const y1 = svgHeight - (amount / maxXpSum) * svgHeight;
      const x2 = barWidth * (index + 1);
      const y2 = svgHeight - (allXpAmount[index + 1] / maxXpSum) * svgHeight;

      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.setAttribute("stroke", "#3498db");
      line.setAttribute("stroke-width", "2");

      svgElement.appendChild(line);

      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );

      const cx = barWidth * (index + 1);
      const cy = svgHeight - (allXpAmount[index + 1] / maxXpSum) * svgHeight;

      circle.setAttribute("cx", cx);
      circle.setAttribute("cy", cy);
      circle.setAttribute("r", "3");
      circle.setAttribute("fill", "#3498db");

      svgElement.appendChild(circle);

      circle.addEventListener("mouseover", (e) => {
        const tooltip = document.getElementById("tooltip");

        const date = new Date(
          xpTransactions[index + 1].createdAt
        ).toLocaleDateString();
        const xp = roundToKB(allXpAmount[index + 1]);

        tooltip.innerHTML = `Date: ${date} <br> XP: ${xp}`;

        const x = e.clientX;
        const y = e.clientY;

        tooltip.style.left = x - 10 + "px";
        tooltip.style.top = y + 250 + "px";
        tooltip.style.display = "block";
      });

      circle.addEventListener("mouseout", () => {
        const tooltip = document.getElementById("tooltip");
        tooltip.style.display = "none";
      });
    }
  });

  return maxXpSum;
}

function createLine(svg, x1, y1, x2, y2, color) {
  let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.setAttribute("stroke", color);
  svg.appendChild(line);
}

function createArrow(svg, points, color) {
  let polygon = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polygon"
  );
  polygon.setAttribute("points", points);
  polygon.setAttribute("fill", color);
  svg.appendChild(polygon);
}

export function prepareAuditData(audits) {
  const filterAuditsById = audits.filter((audit) => audit.auditorId === 5645);
  const doneAudits = filterAuditsById.filter(
    (audit) => audit.grade !== null
  ).length;
  const receivedAudits = filterAuditsById.length;

  return [
    { count: receivedAudits - doneAudits }, //not completed audits
    { count: doneAudits }, //completed audits
  ];
}

export function renderTransactionGraphs(groupedXpTransactions) {
  let maxXpByPath = {};
  for (const [path, xpTransactions] of Object.entries(groupedXpTransactions)) {
    let svgElement;
    switch (path) {
      case "div-01":
        svgElement = document.getElementById("div-01SVG");
        break;
      case "piscine-js":
        svgElement = document.getElementById("piscine-jsSVG");
        break;
      case "piscine-go":
        svgElement = document.getElementById("piscine-goSVG");
        break;
    }
    maxXpByPath[path] = xpTransactionGraph(xpTransactions, svgElement);
  }

  for (const [path, maxXp] of Object.entries(maxXpByPath)) {
    document.getElementById(`${path}XP`).innerText = roundToKB(maxXp);
  }
}
