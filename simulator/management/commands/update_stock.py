from django.core.management.base import BaseCommand
from simulator.models import Stock
import random

class Command(BaseCommand):
    help = '주식 가격을 랜덤으로 갱신'
    def handle(self,*args, **kwargs):
        for stock in Stock.objects.all():
            change = random.uniform(-0.05, 0.05)  # -5% ~ +5%
            stock.price *= (1 + change)
            stock.price = round(stock.price, 2)
            stock.save()
        self.stdout.write(self.style.SUCCESS('주식 가격 갱신 완료!'))
