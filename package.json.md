# package.json 配置说明

## 基本属性

### name

- 包的名称
- 必须是小写字母
- 可以包含连字符和下划线
- 在 npm 仓库中必须是唯一的

### version

- 包的版本号
- 遵循语义化版本规范 (major.minor.patch)
- major: 重大更新，可能包含破坏性变更
- minor: 新功能，向后兼容
- patch: 错误修复

### description

- 包的描述信息
- 会显示在 npm 搜索结果中
- 帮助用户理解包的用途

### type

- 项目的模块类型
- "module": 使用 ES 模块 (import/export)
- "commonjs": 使用 CommonJS (require/exports)
- 影响 .js 文件的解析方式

### main

- 包的入口文件
- 当其他项目引入该包时，实际引入的文件
- 通常是编译/打包后的文件

### bin

- 可执行文件配置
- 定义命令行工具的命令名和对应的执行文件
- npm install -g 时会创建对应的命令
- 执行文件需要有正确的 shebang (#! /usr/bin/env node)

### repository

- 代码仓库信息
- type: 版本控制类型（git, svn 等）
- url: 仓库地址
- 帮助用户找到源代码
- 显示在 npm 页面上

### dependencies

- 生产环境依赖
- 项目运行必需的包
- 版本号前缀：
  - ^ : 允许更新次版本和修订版本 (^1.2.3 允许 1.x.x)
  - ~ : 只允许更新修订版本 (~1.2.3 允许 1.2.x)
  - 空 : 锁定具体版本

当前项目使用的依赖说明：

- chalk: 终端文字颜色
- commander: 命令行工具框架
- download-git-repo: Git 仓库下载
- figlet: ASCII 艺术字生成
- fs-extra: 文件系统操作扩展
- inquirer: 交互式命令行
- log-symbols: 日志符号
- ora: 终端加载动画
- shelljs: Shell 命令执行
- table: 表格输出格式化

## 其他常用字段

### scripts

```json
"scripts": {
  "start": "node index.js",
  "test": "jest",
  "build": "webpack"
}
```

- 定义项目的脚本命令
- 可以通过 npm run <命令名> 执行

### devDependencies

```json
"devDependencies": {
  "jest": "^27.0.0",
  "eslint": "^8.0.0"
}
```

- 开发环境依赖
- 只在开发时需要，不会包含在生产环境

### engines

```json
"engines": {
  "node": ">=14.0.0"
}
```

- 指定 Node.js 版本要求
- 可以限制项目在特定版本范围运行

### private

```json
"private": true
```

- 防止意外发布到 npm 仓库
- 私有项目建议设置为 true

### author

```json
"author": {
  "name": "作者名",
  "email": "邮箱",
  "url": "网站"
}
```

- 作者信息
- 可以是字符串或对象格式

### license

```json
"license": "MIT"
```

- 开源许可证类型
- 指定代码的使用条款

### keywords

```json
"keywords": ["cli", "generator", "template"]
```

- 关键字数组
- 用于 npm 搜索
- 帮助其他开发者找到你的包

### files

```json
"files": ["dist", "lib"]
```

- 指定 npm 包包含的文件和目录
- 可以减小包的大小
- 不指定则默认包含所有文件

### browserslist

```json
"browserslist": [">0.2%", "not dead"]
```

- 浏览器兼容性配置
- 被许多工具使用（如 Babel, Autoprefixer）
- 指定支持的浏览器范围

## 版本号规范

### 语义化版本

- major.minor.patch
- 例如：1.2.3

### 版本范围

- ^1.2.3: 允许 1.x.x
- ~1.2.3: 允许 1.2.x
- > =1.2.3: 大于等于 1.2.3
- 1.2.3: 精确版本
- \*: 任意版本

## 最佳实践

1. 版本控制

   - 使用语义化版本
   - 谨慎使用 ^ 和 ~
   - 关键依赖考虑锁定版本

2. 依赖管理

   - 区分 dependencies 和 devDependencies
   - 定期更新依赖版本
   - 使用 package-lock.json 锁定依赖树

3. 脚本命令

   - 提供常用的 npm scripts
   - 文档化复杂的脚本命令
   - 考虑使用 pre/post 钩子

4. 安全性
   - 使用 private 防止意外发布
   - 及时更新有安全漏洞的依赖
   - 使用 .npmignore 排除敏感文件
