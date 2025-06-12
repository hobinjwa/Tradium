const stock_window = document.getElementById('stock-window');
const stockPrice = document.getElementById('stock-price');
const buyButton = document.getElementById('buy-button');
const sellButton = document.getElementById('sell-button');
const balanceElement = document.getElementById('balance');
const sharesElement = document.getElementById('shares');

let price = parseFloat(initialPrice);
let userBalance = parseFloat(balance);
let userShares = parseInt(quantity);

const blocks = [];
let lastTop = 200;
let to_right = 0;
let variance = 0;

// 팝업 관련 요소
const inputWindow = document.getElementById('input-window');
const inputWindowClose = document.getElementById('input-window-close');
const tradingTitle = document.getElementById('trading-title');
const availableAmount = document.getElementById('available-amount');
const ownedShares = document.getElementById('owned-shares');
const inputAmount = document.getElementById('input-amount');
const decreaseQuantity = document.getElementById('decrease-quantity');
const increaseQuantity = document.getElementById('increase-quantity');
const quantityInput = document.getElementById('quantity-input');
const quantitySlider = document.getElementById('quantity-slider');
const sliderDisplay = document.getElementById('slider-display');
const confirm = document.getElementById('confirm');
const cancel = document.getElementById('cancel');
const noticeWindow = document.getElementById('notice-window');
const noticeWindowClose = document.getElementById('notice-window-close');
const noticeTitle = document.getElementById('notice-title');
const noticeContent = document.getElementById('notice-content');
const noticeConfirm = document.getElementById('notice-confirm');

let inputQuantity = 0;
let buttonType;

// 처음 입장시 기존 히스토리 가져오기
fetch(`/api/stock/${stockId}/history/`)
    .then(res => res.json())
    .then(data => {
        for (let item of data.history) {
            let oldPrice = price;
            price = item.price;
            const change = price - oldPrice;

            if (change > 0) {
                createBlock('red', true, change);
            } else {
                createBlock('blue', false, change);
            }
        }
    });

// 실시간 가격 갱신
setInterval(() => {
    fetch(`/api/stock/${stockId}/price/`)
        .then(res => res.json())
        .then(data => {
            updateGraph(data.price);
        });
}, 1000);

function updateGraph(newPrice) {
    const change = newPrice - price;
    if (change === 0) return;
    price = newPrice;
    variance = (change / price) * 100;

    if (change > 0) {
        createBlock('red', true, change);
    } else {
        createBlock('blue', false, change);
    }

    adjustBlocks();

    if (variance > 0) {
        stockPrice.innerHTML = `현재 가격: $${price.toFixed(2)} <span style="color: red;">+${variance.toFixed(2)}%</span>`;
    } else {
        stockPrice.innerHTML = `현재 가격: $${price.toFixed(2)} <span style="color: blue;">${variance.toFixed(2)}%</span>`;
    }
}

function createBlock(color, isUp, height) {
    const block = document.createElement('div');
    block.className = `block ${color}-block`;
    block.style.width = '8px';
    height = Math.abs(height);

    if (isUp) lastTop -= height;

    block.style.top = `${lastTop}px`;
    block.style.height = `${height}px`;
    block.style.left = `${to_right}px`;
    stock_window.appendChild(block);
    blocks.push(block);

    if (!isUp) lastTop += height;

    if (to_right > 400) {
        adjustBlocks();
    } else {
        to_right += 8;
    }
}

function adjustBlocks() {
    const offset = 200 - parseInt(blocks[blocks.length - 1].style.top);
    blocks.forEach(block => block.style.top = `${parseInt(block.style.top) + offset}px`);
    lastTop += offset;

    if (to_right > 400) {
        blocks.forEach(block => block.style.left = `${parseInt(block.style.left) - 8}px`);
        to_right -= 8;
    }
}

// 거래 팝업창
buyButton.addEventListener('click', () => {
    buttonType = "매수";
    openInputWindow();
});

sellButton.addEventListener('click', () => {
    buttonType = "매도";
    openInputWindow();
});

function openInputWindow() {
    inputWindow.style.display = "block";
    tradingTitle.innerText = buttonType;
    availableAmount.innerText = `${userBalance.toFixed(2)}원`;
    ownedShares.innerText = `${userShares}주`;
    inputAmount.innerText = `${buttonType} 금액: ${(price * inputQuantity).toFixed(2)}원`;
    inputQuantity = 0;
    quantityInput.value = inputQuantity;
    quantitySlider.value = 0;
    sliderDisplay.innerText = "0%";
}

inputWindowClose.addEventListener('click', () => inputWindow.style.display = "none");
cancel.addEventListener('click', () => inputWindow.style.display = "none");

decreaseQuantity.addEventListener('click', () => {
    if (inputQuantity > 0) inputQuantity--;
    checkLimit(); updateInput();
});

increaseQuantity.addEventListener('click', () => {
    inputQuantity++;
    checkLimit(); updateInput();
});

quantityInput.addEventListener('input', () => {
    inputQuantity = parseInt(quantityInput.value) || 0;
    checkLimit(); updateInput();
});

quantitySlider.addEventListener('input', () => {
    const percentage = quantitySlider.value;
    sliderDisplay.innerText = `${percentage}%`;
    if (buttonType === '매수') {
        inputQuantity = Math.floor((userBalance / price) * (percentage / 100));
    } else {
        inputQuantity = Math.floor(userShares * (percentage / 100));
    }
    checkLimit(); updateInput();
});

function checkLimit() {
    if (buttonType === '매수' && inputQuantity * price > userBalance)
        inputQuantity = Math.floor(userBalance / price);
    if (buttonType === '매도' && inputQuantity > userShares)
        inputQuantity = userShares;
}

function updateInput() {
    quantityInput.value = inputQuantity;
    inputAmount.innerText = `${buttonType} 금액: ${(price * inputQuantity).toFixed(2)}원`;
}

confirm.addEventListener('click', () => {
    fetch(`/api/stock/${stockId}/trade/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': getCSRFToken()
        },
        body: `action=${buttonType === '매수' ? 'buy' : 'sell'}&quantity=${inputQuantity}`
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            inputWindow.style.display = "none";
            refreshAccount();
            openNotice("거래 성공", "거래가 완료되었습니다");
        } else {
            openNotice("거래 실패", data.error);
        }
    });
});

function refreshAccount() {
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
    noticeWindow.style.display = "block";
    noticeTitle.innerText = title;
    noticeContent.innerText = content;
}

noticeWindowClose.addEventListener('click', () => noticeWindow.style.display = "none");
noticeConfirm.addEventListener('click', () => noticeWindow.style.display = "none");

function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}
