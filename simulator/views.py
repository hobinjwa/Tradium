from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import Stock, Portfolio, Account

def stock_list(request):
    stocks = Stock.objects.all()
    return render(request, 'simulator/stock_list.html', {'stocks': stocks})

def stock_main(request, stock_id):
    stock = get_object_or_404(Stock, id=stock_id)
    return render(request, 'simulator/stock_main.html', {'stock': stock})


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

