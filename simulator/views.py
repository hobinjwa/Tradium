from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET, require_POST
from .models import Stock, Portfolio, Account,Transaction,StockHistory
from django.contrib.auth.models import User
from .forms import SignUpForm
from django.shortcuts import redirect


def stock_list(request):
    stocks = Stock.objects.all()
    return render(request, 'simulator/stock_list.html', {'stocks': stocks})

def stock_main(request, stock_id):
    stock = get_object_or_404(Stock, id=stock_id)
    account, _= Account.objects.get_or_create(user=request.user)
    portfolio, _ = Portfolio.objects.get_or_create(user=request.user, stock=stock)
    return render(request, 'simulator/stock_main.html', {'stock': stock , 'balance': account.balance, 'quantity': portfolio.quantity})


@login_required
def portfolio_view(request):
    user = request.user
    portfolios = Portfolio.objects.filter(user=user)
    return render(request, 'simulator/portfolio.html', {'portfolios': portfolios})

@login_required
def main(request):
    stocks = Stock.objects.all()
    account,created = Account.objects.get_or_create(user=request.user)
    return render(request, 'simulator/main.html', {
        'stocks': stocks,
        'balance': account.balance,
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
        total_balance = TotalBalance(user)
        ranking.append({'username': user.username, 'total_balance': total_balance})

    # 자산 내림차순 정렬
    ranking.sort(key=lambda x: x['total_balance'], reverse=True)

    return render(request, 'simulator/ranking.html', {'ranking': ranking})



def signup(request):
    if request.method == "POST":
        form = SignUpForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('Tradium:login')  # 가입 후 로그인 페이지로 이동
    else:
        form = SignUpForm()
    return render(request, 'simulator/signup.html', {'form': form})
