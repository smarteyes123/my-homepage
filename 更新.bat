@echo off
REM 更新主页批处理脚本

REM 1. 提交到本地仓库
git add .
git commit -m "更新主页" 

REM 2. 推送到远程
git push origin main

REM 3. 如果有服务器SSH部署
REM    自动登录服务器并执行 git pull
REM    注意：需要提前设置好SSH免密登录
ssh your_user@your_server "cd /path/to/your/homepage && git pull && exit"

pause
