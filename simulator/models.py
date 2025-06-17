# simulator/models.py

from django.db import models
from django.contrib.auth.models import User

class Account(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    balance = models.FloatField(default=100000)  # 기본 잔고는 10만 원

    def __str__(self):
        return f'{self.user.username} 님의 잔고: {self.balance}₩'

# 주식 종목
class Stock(models.Model):
    name = models.CharField(max_length=100)
    price = models.FloatField()

    def __str__(self):
        return f'{self.name} ({self.price}₩)'

# 사용자 정보(주식보유)
class Portfolio(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=0)

    def __str__(self):
        return f'{self.user.username}: {self.stock.name} x {self.quantity}'

# 거래 내역
class Transaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE)
    quantity = models.IntegerField()  # +면 매수, -면 매도
    transaction_price = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        action = "매수" if self.quantity > 0 else "매도"
        return f'{self.user.username} {action} {abs(self.quantity)}주 {self.stock.name} @{self.transaction_price}₩'

class StockHistory(models.Model):
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE)
    price = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.stock.name} 기록: {self.price}₩ ({self.timestamp})'

