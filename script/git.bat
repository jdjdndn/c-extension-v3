@echo off
@title bat 交互执行git命令

cd D:\code\Chrome-Extension-V3
git add .
git commit -m %date:~0,4%年%date:~5,2%月%date:~8,2%日%TIME:~0,2%时%TIME:~3,2%分%TIME:~6,2%秒
git push