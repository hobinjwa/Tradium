let price = initialPrice;

// 1초마다 가격 업데이트
setInterval(() => {
    fetch(`/api/stock/${stockId}/price/`)
    .then(res => res.json())
    .then(data => {
        price = data.price;
        document.getElementById("stock-price").innerText = `현재 가격: ${price}₩`;
    });
}, 1000);

// 매수
function buyStock() {
    const quantity = prompt("몇 주 매수할까요?");
    trade('buy', quantity);
}

// 매도
function sellStock() {
    const quantity = prompt("몇 주 매도할까요?");
    trade('sell', quantity);
}

// 거래 공통 처리
function trade(action, quantity) {
    fetch(`/api/stock/${stockId}/trade/`, {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: `action=${action}&quantity=${quantity}`
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert(`${action === 'buy' ? '매수' : '매도'} 성공`);
            location.reload();  // 새로고침으로 잔고/보유량 갱신
        } else {
            alert(data.error);
        }
    });
}
