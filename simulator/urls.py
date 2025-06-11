from django.urls import path
from . import views

urlpatterns = [
    path('stocks/', views.stock_list, name='stock_list'),
    path('stocks/<int:stock_id>/', views.stock_main, name='stock_main'),
    path('portfolio/', views.portfolio_view, name='portfolio'),
    path('', views.main, name='main'),
]