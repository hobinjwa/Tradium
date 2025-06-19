from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET, require_POST
from .models import Stock, Portfolio, Account,Transaction,StockHistory
from django.contrib.auth.models import User

def stock_main(request, stock_id):
    stock = get_object_or_404(Stock, id=stock_id)
    account, _= Account.objects.get_or_create(user=request.user)
    portfolio, _ = Portfolio.objects.get_or_create(user=request.user, stock=stock)
    return render(request, 'simulator/stock_main.html', {'stock': stock , 'balance': round(account.balance,2), 'quantity': portfolio.quantity})


@login_required
def portfolio(request, user_id):
    target_user = get_object_or_404(User, id=user_id)

    portfolios = Portfolio.objects.filter(user=target_user)
    transactions = Transaction.objects.filter(user=target_user).order_by('-timestamp')

    # 보유 주식 데이터 구성
    portfolio_data = []
    for p in portfolios:
        if p.quantity == 0:
            continue

        buys = Transaction.objects.filter(user=target_user, stock=p.stock, quantity__gt=0)
        total_quantity = sum(t.quantity for t in buys)
        total_cost = sum(t.quantity * t.transaction_price for t in buys)

        avg_price = (total_cost / total_quantity) if total_quantity > 0 else 0
        profit_rate = ((p.stock.price - avg_price) / avg_price * 100) if avg_price > 0 else 0

        portfolio_data.append({
            'stock': p.stock,
            'quantity': p.quantity,
            'avg_price': round(avg_price, 2),
            'current_price': round(p.stock.price, 2),
            'profit_rate': round(profit_rate, 2),
        })

    # 거래 내역 데이터 구성 (템플릿에서 바로 출력 가능하도록 가공)
    transaction_data = []
    for t in transactions:
        transaction_data.append({
            'stock_name': t.stock.name,
            'action': '매수' if t.quantity > 0 else '매도',
            'quantity': abs(t.quantity),
            'price': round(t.transaction_price, 2),
            'total': round(abs(t.quantity) * t.transaction_price, 2),
            'timestamp': t.timestamp,  # 가공하지 않고 그대로 넘김
        })

    return render(request, 'simulator/portfolio.html', {
        'target_user': target_user,
        'portfolio_data': portfolio_data,
        'transactions': transaction_data,
    })



@login_required
def main(request):
    stocks = Stock.objects.all()
    account,created = Account.objects.get_or_create(user=request.user)
    return render(request, 'simulator/main.html', {
        'stocks': stocks,
        'balance': round(account.balance,2),
    })

@require_GET
@login_required
def get_stock_price(request, stock_id):
    stock = get_object_or_404(Stock, id=stock_id)
    return JsonResponse({'price': stock.price})

@require_GET
@login_required
def get_stock_history(request, stock_id):
    stock = get_object_or_404(Stock, id=stock_id)
    history = StockHistory.objects.filter(stock=stock).order_by('-timestamp')[:60]
    data = [{'price': h.price, 'timestamp': h.timestamp.isoformat()} for h in reversed(history)]
    return JsonResponse({'history': data})

# 거래 (매수/매도)
@require_POST
@login_required
def trade_stock(request, stock_id):
    stock = get_object_or_404(Stock, id=stock_id)
    account, _ = Account.objects.get_or_create(user=request.user)

    action = request.POST.get('action')
    quantity = int(request.POST.get('quantity'))
    price = stock.price

    if action == 'buy':
        total_price = price * quantity
        if account.balance >= total_price:
            account.balance -= total_price
            account.save()

            portfolio, _ = Portfolio.objects.get_or_create(user=request.user, stock=stock)
            portfolio.quantity += quantity
            portfolio.save()

            Transaction.objects.create(user=request.user, stock=stock, quantity=quantity, transaction_price=price)
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'error': '잔액 부족'})
    
    elif action == 'sell':
        portfolio = get_object_or_404(Portfolio, user=request.user, stock=stock)
        if portfolio.quantity >= quantity:
            portfolio.quantity -= quantity
            portfolio.save()

            account.balance += price * quantity
            account.save()

            Transaction.objects.create(user=request.user, stock=stock, quantity=-quantity, transaction_price=price)
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'error': '보유 주식 부족'})

    return JsonResponse({'success': False, 'error': '잘못된 요청'})

@require_GET
@login_required
def get_account_info(request, stock_id):
    stock = get_object_or_404(Stock, id=stock_id)
    account, _ = Account.objects.get_or_create(user=request.user)
    portfolio, _ = Portfolio.objects.get_or_create(user=request.user, stock=stock)
    
    return JsonResponse({
        'balance': account.balance,
        'quantity': portfolio.quantity
    })

def TotalBalance(user):
    account, _ = Account.objects.get_or_create(user=user)
    portfolios = Portfolio.objects.filter(user=user)
    stock_balance = sum([p.stock.price * p.quantity for p in portfolios])
    total_balance = account.balance + stock_balance
    return round(total_balance, 2)

@login_required
def ranking_view(request):
    users = User.objects.all()
    ranking = []

    for user in users:
        account, _ = Account.objects.get_or_create(user=user)
        portfolios = Portfolio.objects.filter(user=user)
        stock_value = sum([p.stock.price * p.quantity for p in portfolios])
        total_balance = round(account.balance + stock_value, 2)

        ranking.append({
            'user': user,
            'balance': round(account.balance, 2),
            'stock_value': round(stock_value, 2),
            'total_balance': total_balance,
        })

    ranking.sort(key=lambda x: x['total_balance'], reverse=True)

    return render(request, 'simulator/ranking.html', {'ranking': ranking})





