const stock_window = document.getElementById("stock-window");
const stockPrice = document.getElementById("stock-price");
const buyButton = document.getElementById("buy-button");
const sellButton = document.getElementById("sell-button");
const balanceElement = document.getElementById("balance");
const sharesElement = document.getElementById("shares");
const hoverBox = document.getElementById("hover-price");
const zoomIn = document.getElementById("zoom-in");
const zoomOut = document.getElementById("zoom-out");

let price = parseFloat(initialPrice);
let userBalance = parseFloat(balance);
let userShares = parseInt(quantity);

const blocks = [];
let lastTop = 200;
let scaleFactor = 1;

let publicTrades = [];
const shownTrades = new Set();

const inputWindow = document.getElementById("input-window");
const inputWindowClose = document.getElementById("input-window-close");
const tradingTitle = document.getElementById("trading-title");
const availableAmount = document.getElementById("available-amount");
const ownedShares = document.getElementById("owned-shares");
const inputAmount = document.getElementById("input-amount");
const decreaseQuantity = document.getElementById("decrease-quantity");
const increaseQuantity = document.getElementById("increase-quantity");
const quantityInput = document.getElementById("quantity-input");
const quantitySlider = document.getElementById("quantity-slider");
const sliderDisplay = document.getElementById("slider-display");
const confirm = document.getElementById("confirm");
const cancel = document.getElementById("cancel");
const noticeWindow = document.getElementById("notice-window");
const noticeWindowClose = document.getElementById("notice-window-close");
const noticeTitle = document.getElementById("notice-title");
const noticeContent = document.getElementById("notice-content");
const noticeConfirm = document.getElementById("notice-confirm");

let inputQuantity = 0;
let buttonType;

// 최초 히스토리 불러오기
fetch(`/api/stock/${stockId}/history/`)
  .then((res) => res.json())
  .then((data) => {
    for (let item of data.history) {
      let oldPrice = price;
      price = item.price;
      const change = price - oldPrice;

      if (change > 0) {
        createBlock("red", true, change);
      } else {
        createBlock("blue", false, change);
      }
    }
    adjustBlocks();
  });

setInterval(() => {
  fetch(`/api/stock/${stockId}/price/`)
    .then((res) => res.json())
    .then((data) => {
      updateGraph(data.price);
    });
}, 5000);

setInterval(() => {
  fetch(`/api/stock/${stockId}/trades/`)
    .then(res => res.json())
    .then(data => {
      publicTrades = data.trades;
    });
}, 5000);

function updateGraph(newPrice) {
  const change = newPrice - price;
  if (change === 0) return;
  price = newPrice;
  const variance = (change / price) * 100;

  if (change > 0) {
    createBlock("red", true, change);
  } else {
    createBlock("blue", false, change);
  }

  adjustBlocks();

  stockPrice.innerHTML = `현재 가격: $${price.toFixed(2)} <span style="color: ${variance > 0 ? 'red' : 'blue'};">${variance.toFixed(2)}%</span>`;
}

function createBlock(color, isUp, height) {
  const block = document.createElement("div");
  block.className = `block ${color}-block`;
  const width = 8;
  height = Math.abs(height);

  if (isUp) lastTop -= height;
  const top = lastTop;

  block.dataset.price = price.toFixed(2);
  block.dataset.originalTop = top;
  block.dataset.originalHeight = height;
  block.dataset.originalWidth = width;

  block.addEventListener("mouseenter", () => {
    hoverBox.style.display = "block";
    const index = blocks.indexOf(block);
    const openPrice = index > 0 ? blocks[index - 1].dataset.price : block.dataset.price;
    hoverBox.innerText = `Open: $${openPrice}\nClose: $${block.dataset.price}`;
    block.addEventListener("mousemove", (e) => {
      hoverBox.style.left = e.pageX + 10 + "px";
      hoverBox.style.top = e.pageY - 80 + "px";
    });
    block.style.transform = "scale(1.1)";
    block.style.opacity = "0.5";

    publicTrades.forEach(trade => {
      const key = `${trade.user}-${trade.price}-${trade.quantity}-${trade.type}`;
      if (!shownTrades.has(key) && Math.abs(trade.price - price) < 0.01) {
        const dot = document.createElement("div");
        dot.className = "trade-dot";
        dot.style.backgroundColor = trade.type === "buy" ? "#66bb6a" : "#ef5350";
        dot.title = `${trade.user} ${trade.type === "buy" ? "매수" : "매도"} ${trade.quantity}주`;
        dot.style.left = block.style.left;
        dot.style.top = `${parseFloat(block.style.top) - 10}px`;
        stock_window.appendChild(dot);
        shownTrades.add(key);
      }
    });
  });

  block.addEventListener("mouseleave", () => {
    hoverBox.style.display = "none";
    block.style.transform = "scale(1)";
    block.style.opacity = "1";
  });

  stock_window.appendChild(block);
  blocks.push(block);

  if (!isUp) lastTop += height;
}

function adjustBlocks() {
  blocks.forEach((block, index) => {
    const top = parseFloat(block.dataset.originalTop);
    const height = parseFloat(block.dataset.originalHeight);
    const width = parseFloat(block.dataset.originalWidth);

    block.style.left = `${index * width * scaleFactor}px`;
    block.style.width = `${width * scaleFactor}px`;
    block.style.top = `${top * scaleFactor}px`;
    block.style.height = `${height * scaleFactor}px`;
  });

  stock_window.scrollTo(blocks[blocks.length-1].offsetLeft, 0);
}

zoomIn.addEventListener("click", () => {
  scaleFactor *= 1.2;
  adjustBlocks();
});

zoomOut.addEventListener("click", () => {
  scaleFactor /= 1.2;
  adjustBlocks();
});

// 거래 관련 코드 동일하게 유지
buyButton.addEventListener("click", () => {
  buttonType = "매수";
  openInputWindow();
});

sellButton.addEventListener("click", () => {
  buttonType = "매도";
  openInputWindow();
});

function openInputWindow() {
  inputWindow.style.display = "flex";
  tradingTitle.innerText = buttonType;
  availableAmount.innerText = `${userBalance.toFixed(2)}원`;
  ownedShares.innerText = `${userShares}주`;
  inputAmount.innerText = `${buttonType} 금액: ${(price * inputQuantity).toFixed(2)}원`;
  inputQuantity = 0;
  quantityInput.value = inputQuantity;
  quantitySlider.value = 0;
  sliderDisplay.innerText = "0%";
}

inputWindowClose.addEventListener("click", () => inputWindow.style.display = "none");
cancel.addEventListener("click", () => inputWindow.style.display = "none");

decreaseQuantity.addEventListener("click", () => {
  if (inputQuantity > 0) inputQuantity--;
  checkLimit();
  updateInput();
});

increaseQuantity.addEventListener("click", () => {
  inputQuantity++;
  checkLimit();
  updateInput();
});

quantityInput.addEventListener("input", () => {
  inputQuantity = parseInt(quantityInput.value) || 0;
  checkLimit();
  updateInput();
});

quantitySlider.addEventListener("input", () => {
  const percentage = quantitySlider.value;
  sliderDisplay.innerText = `${percentage}%`;
  inputQuantity = buttonType === "매수"
    ? Math.floor((userBalance / price) * (percentage / 100))
    : Math.floor(userShares * (percentage / 100));
  checkLimit();
  updateInput();
});

function checkLimit() {
  if (buttonType === "매수" && inputQuantity * price > userBalance)
    inputQuantity = Math.floor(userBalance / price);
  if (buttonType === "매도" && inputQuantity > userShares)
    inputQuantity = userShares;
}

function updateInput() {
  quantityInput.value = inputQuantity;
  inputAmount.innerText = `${buttonType} 금액: ${(price * inputQuantity).toFixed(2)}원`;
}

confirm.addEventListener("click", () => {
  fetch(`/api/stock/${stockId}/trade/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-CSRFToken": getCSRFToken(),
    },
    body: `action=${buttonType === "매수" ? "buy" : "sell"}&quantity=${inputQuantity}`,
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        inputWindow.style.display = "flex";
        reloadAccount();
        openNotice("거래 성공", "거래가 완료되었습니다");
      } else {
        openNotice("거래 실패", data.error);
      }
    });
});

function reloadAccount() {
  fetch(`/api/stock/${stockId}/account/`)
    .then(res => res.json())
    .then(data => {
      userBalance = data.balance;
      userShares = data.quantity;
      balanceElement.innerText = `잔고: $${userBalance.toFixed(2)}`;
      sharesElement.innerText = `보유 주식: ${userShares}`;
    });
}

function openNotice(title, content) {
  noticeWindow.style.display = "flex";
  noticeTitle.innerText = title;
  noticeContent.innerText = content;
}

noticeWindowClose.addEventListener("click", () => noticeWindow.style.display = "none");
noticeConfirm.addEventListener("click", () => noticeWindow.style.display = "none");

function getCSRFToken() {
  return document.querySelector('meta[name="csrf-token"]').getAttribute("content");
}
