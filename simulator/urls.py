from django.urls import path
from . import views

urlpatterns = [
    path('stocks/', views.stock_list, name='stock_list'),
    path('stocks/<int:stock_id>/', views.stock_main, name='stock_main'),
    path('portfolio/', views.portfolio_view, name='portfolio'),
    path('', views.main, name='main'),
    path('api/stock/<int:stock_id>/price/', views.get_stock_price, name='get_stock_price'),
    path('api/stock/<int:stock_id>/trade/', views.trade_stock, name='trade_stock'),
    path('api/stock/<int:stock_id>/account/', views.get_account_info, name='get_account_info'),
    path('api/stock/<int:stock_id>/history/', views.get_stock_history, name='get_stock_history'),
    path('ranking/', views.ranking_view, name='ranking'),
]