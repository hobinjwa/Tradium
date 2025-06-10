# simulator/models.py

from django.db import models
from django.contrib.auth.models import User

# 주식 종목
class Stock(models.Model):
    name = models.CharField(max_length=100)
    current_price = models.FloatField()

    def __str__(self):
        return f'{self.name} ({self.current_price}₩)'

# 사용자 정보(주식보유)
class Portfolio(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=0)

    def __str__(self):
        return f'{self.user.username} 님이 {self.stock.name}'

# 거래 내역
class Transaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE)
    quantity = models.IntegerField()  # +면 매수, -면 매도
    price_at_transaction = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        action = "매수" if self.quantity > 0 else "매도"
        return f'{self.user.username} 님이 {abs(self.quantity)}주 {self.stock.name}을 {self.price_at_transaction}₩에 {action}했습니다.'
