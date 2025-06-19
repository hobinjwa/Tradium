from django.contrib import admin
from .models import Stock, Transaction, Account, Portfolio, StockHistory

admin.site.register(Stock)
admin.site.register(Transaction)
admin.site.register(Portfolio)
admin.site.register(Account)
admin.site.register(StockHistory)