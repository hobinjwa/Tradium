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

function updateGraph(newPrice) {
    const change = newPrice - price;
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

setInterval(() => {
    fetch(`/api/stock/${stockId}/price/`)
        .then(res => res.json())
        .then(data => {
            updateGraph(data.price);
        });
}, 1000);

buyButton.addEventListener('click', () => {
    const quantity = parseInt(prompt("몇 주 매수할까요?"));
    if (isNaN(quantity) || quantity <= 0) {
        alert("올바른 수량을 입력하세요");
        return;
    }
    trade('buy', quantity);
});

sellButton.addEventListener('click', () => {
    const quantity = parseInt(prompt("몇 주 매도할까요?"));
    if (isNaN(quantity) || quantity <= 0) {
        alert("올바른 수량을 입력하세요");
        return;
    }
    trade('sell', quantity);
});

function trade(action, quantity) {
    fetch(`/api/stock/${stockId}/trade/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': getCSRFToken()
        },
        body: `action=${action}&quantity=${quantity}`
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert(`${action === 'buy' ? '매수' : '매도'} 성공`);
            refreshAccount();
        } else {
            alert(data.error);
        }
    });
}

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

function getCSRFToken() {
    const cookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
    return cookie ? cookie.split('=')[1] : '';
}
