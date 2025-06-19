# simulator/management/commands/update_stock.py

from django.core.management.base import BaseCommand
from simulator.models import Stock, StockHistory
import random

class Command(BaseCommand):
    help = '주식 가격을 갱신'

    def handle(self, *args, **kwargs):
        for stock in Stock.objects.all():
            volatility = random.uniform(0.1, 0.6)
            change = random.uniform(-volatility, volatility) / 100
            stock.price *= (1 + change)
            stock.price = round(stock.price, 2)
            if stock.price < 1:
                stock.price = 1

            stock.save()

            # 히스토리 저장
            StockHistory.objects.create(stock=stock, price=stock.price)

            self.stdout.write(f"{stock.name}: {stock.price:.2f}원")

            # 히스토리 60개 유지 
            histories = StockHistory.objects.filter(stock=stock).order_by('-timestamp')
            if histories.count() > 60:
                for h in histories[60:]:
                    h.delete()

        self.stdout.write(self.style.SUCCESS('주식 가격 갱신,저장 완료'))
