from django.shortcuts import render
from .forms import SignUpForm
from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required

def signup(request):
    if request.method == "POST":
        form = SignUpForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('users:login')  # 가입 후 로그인 페이지로 이동
    else:
        form = SignUpForm()
    return render(request, 'users/signup.html', {'form': form})
from django.contrib.auth import logout
from django.shortcuts import redirect

def logout_view(request):
    logout(request)
    return redirect('users:login')  # 또는 '/' 등 원하는 위치
