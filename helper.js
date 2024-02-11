export function getRightPathByName(path) {
  const pathName = ["piscine-js", "piscine-go", "div-01"];

  for (const segment of pathName) {
    if (path.includes(segment)) {
      return segment;
    }
  }

  return "default";
}

export function groupByPathName(xpTransactions) {
  const grouped = {};

  xpTransactions.forEach((trans) => {
    const segment = getRightPathByName(trans.path);

    if (!grouped[segment]) {
      grouped[segment] = [];
    }

    grouped[segment].push(trans);
  });

  return grouped;
}

export function formatDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function groupByDateAndSum(xpTransactions) {
  const grouped = xpTransactions.reduce((acc, trans) => {
    const date = formatDate(new Date(trans.createdAt));
    acc[date] = (acc[date] || 0) + trans.amount;
    return acc;
  }, {});

  return Object.keys(grouped).map((date) => ({
    createdAt: date,
    amount: grouped[date],
  }));
}

export function roundToDecimal(value) {
  return Math.round(value * 10) / 10;
}

export function roundToMB(value) {
  return (value / 1000000).toFixed(2) + " MB";
}

export function roundToKB(value) {
  return Math.round(value / 1000) + " KB";
}
