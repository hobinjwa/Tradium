from django.shortcuts import render
from .models import Stock

def stock_list(request):
    stocks = Stock.objects.all()
    return render(request, 'simulator/stock_list.html', {'stocks': stocks})
