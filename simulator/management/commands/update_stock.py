from django.core.management.base import BaseCommand
from simulator.models import Stock
import random

class Command(BaseCommand):
    help = '주식 가격을 랜덤으로 갱신 (더 현실적인 변동)'

    def handle(self, *args, **kwargs):
        for stock in Stock.objects.all():
            volatility = random.uniform(5, 30)  # 매번 변하는 변동성
            change = random.uniform(-volatility, volatility) / 100  # 변동폭을 %로 바꿈
            stock.price *= (1 + change)
            stock.price = round(stock.price, 2)

            if stock.price < 1:
                stock.price = 1

            stock.save()
            self.stdout.write(f"{stock.name}: {stock.price:.2f}원")

        self.stdout.write(self.style.SUCCESS('주식 가격 갱신 완료!'))
