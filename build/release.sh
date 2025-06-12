#! /usr/bin/env sh

# 设置错误时立即退出脚本
# -e: 如果任何命令返回非零值（失败），立即退出脚本
set -e

# 提示用户输入新的版本号
echo "请出入新发布的版本号"

# 读取用户输入的版本号并存储在 VERSION 变量中
read VERSION

# 显示确认提示，要求用户确认版本号是否正确
# -p: 显示提示信息
# -n1: 只读取一个字符作为输入
read -p "版本号：$VERSION ? (y/n)" -n1

# echo "\r\n-----$VERSION---$REPLY\r\n"

echo

if [[ $REPLY =~ ^[Yy]$ ]];
then
  echo "开始发布"
  if [[ `git status --porcelain` ]]; 
  then
    echo "有未提交的文件"
    git add .
    git commit -m "[commit]: $VERSION"
  else
    echo "没有未提交的文件"
    exit 1
  fi
  npm version $VERSION --message "[release]: $VERSION"
  git push origin main
  git push origin refs/tags/$VERSION
  npm publish
else
  echo "取消发布"
  exit 1
fi





 
