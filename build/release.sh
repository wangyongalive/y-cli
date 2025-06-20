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
    # 修改退出状态为0，因为没有未提交文件不是错误状态
    exit 0
  fi

  # 更新版本号并创建tag
  # --allow-same-version 允许更新到相同版本号
  # --git-tag-version 创建git tag
  npm version $VERSION --allow-same-version --git-tag-version=false

  # 手动创建tag
  git tag -a "v$VERSION" -m "[release]: $VERSION"
  
  # 推送代码和tag
  git push origin main
  git push origin "v$VERSION"
  
  # 发布到npm
  npm publish

  echo "发布完成"
else
  echo "取消发布"
  exit 1
fi





 
