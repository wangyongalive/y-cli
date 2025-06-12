import fs from 'fs-extra'
import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import logSymbols from './logSymbols.js';
import shell from "shelljs"

/**
 * CommonJS 和 ESM 模块互操作说明
 * 
 * 1. 为什么可以使用 import 导入 CommonJS 模块（如 shelljs）：
 *    - package.json 中设置了 "type": "module"，启用了 ESM 支持
 *    - Node.js 会自动处理 CommonJS 到 ESM 的转换
 *    - 将 module.exports 转换为默认导出
 *    - 将 exports 的属性转换为具名导出
 * 
 * 2. 不同的导入方式：
 *    // ESM 方式
 *    import shell from 'shelljs'         // 直接导入
 *    import * as shell from 'shelljs'    // 命名空间导入
 *    import { exec } from 'shelljs'      // 解构导入
 *    
 *    // CommonJS 方式
 *    const shell = require('shelljs')    // require 导入
 * 
 * 3. 注意事项：
 *    - 在 ESM 中导入本地文件必须包含扩展名（.js）
 *    - Node.js v12.20.0+ 支持这种互操作性
 *    - 某些包可能需要特殊的导入方式
 * 
 * 4. 最佳实践：
 *    - 在项目中使用一致的导入方式
 *    - 明确指定项目类型（type: "module" 或 "commonjs"）
 *    - 注意包的兼容性和版本要求
 *    - 如果遇到兼容性问题，可以尝试不同的导入方式
 * 
 * 5. 常见问题和解决方案：
 *    a) 导入 JSON 文件：
 *       // 方法1：使用 assert
 *       import data from './data.json' assert { type: 'json' }
 *       
 *       // 方法2：使用 fs
 *       const data = JSON.parse(await fs.readFile('./data.json'))
 * 
 *    b) 动态导入：
 *       // 使用 import() 函数
 *       const module = await import('some-module')
 * 
 *    c) __dirname 在 ESM 中不可用的解决方案：
 *       import { fileURLToPath } from 'url'
 *       import { dirname } from 'path'
 *       const __filename = fileURLToPath(import.meta.url)
 *       const __dirname = dirname(__filename)
 * 
 * 6. package.json 配置示例：
 *    {
 *      "type": "module",        // 启用 ESM
 *      "exports": {             // 定义不同环境的入口点
 *        "import": "./esm/index.js",    // ESM 导入时使用
 *        "require": "./cjs/index.js"    // CommonJS 导入时使用
 *      }
 *    }
 * 
 * 7. 调试技巧：
 *    - 使用 node --trace-warnings 查看详细的警告信息
 *    - 检查包的 package.json 中的 "type" 和 "exports" 字段
 *    - 注意 Node.js 版本对 ESM 特性的支持情况
 */

/**
 * 获取应用的真实工作目录
 * 使用 fs.realpathSync 而不是直接使用 process.cwd() 的原因：
 * 1. 解决符号链接：将逻辑路径转换为物理路径
 * 2. 确保路径一致性：处理 . 和 .. 等相对路径
 * 3. 性能优化：只需要解析一次真实路径
 */
const appDirectory = fs.realpathSync(process.cwd())

/**
 * 解析相对路径为绝对路径
 * @param {string} relativePath - 相对路径
 * @returns {string} 基于应用真实工作目录的绝对路径
 */
export const resolveApp = relativePath => path.resolve(appDirectory, relativePath)

/**
 * 检测终端是否支持 Unicode
 * @returns {boolean} 是否支持 Unicode
 */
export function isUnicodeSupported() {
    const { env } = process;
    const { TERM, TERM_PROGRAM } = env;

    // 对于非 Windows 平台，只要不是 Linux 控制台就支持
    if (process.platform !== 'win32') {
        return TERM !== 'linux'; // Linux console (kernel)
    }

    // Windows 平台下检查各种终端类型
    return Boolean(env.WT_SESSION) // Windows Terminal
        || Boolean(env.TERMINUS_SUBLIME) // Terminus (<0.2.27)
        || env.ConEmuTask === '{cmd::Cmder}' // ConEmu and cmder
        || TERM_PROGRAM === 'Terminus-Sublime'
        || TERM_PROGRAM === 'vscode'
        || TERM === 'xterm-256color'
        || TERM === 'alacritty'
        || TERM === 'rxvt-unicode'
        || TERM === 'rxvt-unicode-256color'
        || env.TERMINAL_EMULATOR === 'JetBrains-JediTerm';
}

/**
 * 删除指定目录
 * @param {string} dir - 要删除的目录路径
 * @returns {Promise<void>}
 */
export async function removeDir(dir) {
    // 创建加载动画
    const spinner = ora({
        text: `正在删除文件夹${chalk.cyan(dir)}`,
        color: 'yellow'
    }).start()

    try {
        // 使用 resolveApp 确保使用真实路径
        await fs.remove(resolveApp(dir))
        spinner.succeed(chalk.greenBright(`删除文件夹${chalk.cyan(dir)}成功`))
    } catch (err) {
        spinner.fail(chalk.redBright(`删除文件夹${chalk.cyan(dir)}失败`))
        console.log(err)
        return
    }
}

/**
 * 修改项目的 package.json 文件
 * @param {string} name - 项目名称
 * @param {Object} info - 要更新的信息对象
 * @param {string} [info.name] - 包名，可选，为空时使用项目名
 * @param {string} [info.keywords] - 关键字，可选，以逗号分隔的字符串，会被转换为数组
 * @param {string} [info.*] - 其他任意 package.json 中的字段
 * @example
 * // 基本使用
 * await changePackageJson('my-project', {
 *   name: 'custom-name',
 *   keywords: 'node,cli,tool',
 *   description: 'My awesome project'
 * });
 * 
 * // 生成的 package.json 将会是：
 * // {
 * //   "name": "custom-name",
 * //   "keywords": ["node", "cli", "tool"],
 * //   "description": "My awesome project"
 * // }
 */
export async function changePackageJson(name, info) {
    try {
        // 读取现有的 package.json 文件
        // 使用 resolveApp 确保路径正确（处理符号链接等情况）
        const pkg = await fs.readJson(resolveApp(`${name}/package.json`))
        
        // 遍历需要更新的字段
        Object.keys(info).forEach(item => {
            if (item === 'name') {
                // 特殊处理包名：
                // - 如果提供了有效的名称（非空），使用提供的名称
                // - 否则使用项目文件夹名称作为包名
                pkg[item] = info[item] && info[item].trim() ? info[item].trim() : name
            } else if (item === 'keywords') {
                // 特殊处理关键字：
                // - 输入格式：以逗号分隔的字符串 "keyword1,keyword2,keyword3"
                // - 输出格式：字符串数组 ["keyword1", "keyword2", "keyword3"]
                pkg[item] = info[item].split(',')
            } else if (info[item] && info[item].trim()) {
                // 处理其他字段：
                // - 只更新有值的字段（避免写入空值或纯空格）
                // - 保持原有格式
                pkg[item] = info[item]
            }
        })

        // 写入更新后的 package.json 文件
        // spaces: 2 参数用于控制 JSON 文件的格式化：
        // 1. 使用2个空格进行缩进，而不是使用制表符或无缩进
        // 2. 生成的文件更易读，例如：
        // {
        //   "name": "project",
        //   "version": "1.0.0"
        // }
        // 3. 这是 JavaScript/Node.js 社区的常用规范
        // 4. 便于版本控制和手动编辑
        await fs.writeJson(resolveApp(`${name}/package.json`), pkg, { spaces: 2 })
    } catch (err) {
        // 错误处理：
        // - 输出错误提示
        // - 建议用户手动修改
        console.log(logSymbols.error, chalk.red('对不起，修改自定义package.json失败，请手动修改。'))
        console.log(err)
    }
}

/**
 * 在指定目录下安装 npm 依赖
 * @param {string} dir - 项目目录
 * @description
 * 执行 npm install 安装项目依赖：
 * 1. 切换到项目目录
 * 2. 安装所有依赖（包括 dependencies 和 devDependencies）
 * 3. 使用 --force 参数强制重新安装，解决可能的依赖冲突
 * 
 * npm install 常用参数说明：
 * 1. 依赖类型相关：
 *    - npm install package          # 安装但不记录到 package.json
 *    - npm install package --save   # 或 -S, 安装并记录到 dependencies（生产依赖）
 *    - npm install package --save-dev # 或 -D, 安装并记录到 devDependencies（开发依赖）
 * 
 * 2. 版本控制：
 *    - npm install package@1.0.0   # 安装特定版本
 *    - npm install package@latest  # 安装最新版本
 *    - npm install package@next    # 安装预发布版本
 * 
 * 3. 安装选项：
 *    - npm install --force        # 强制重新安装
 *    - npm install --no-save     # 安装但不修改 package.json
 *    - npm install --production  # 只安装 dependencies，不安装 devDependencies
 * 
 * 4. 其他常用选项：
 *    - npm install --global      # 或 -g, 全局安装
 *    - npm install --quiet       # 或 -q, 安静模式，减少输出信息
 *    - npm install --verbose     # 输出详细安装信息
 * 
 * 常见使用场景示例：
 * 1. 开发环境：
 *    npm install react --save          # 安装生产依赖
 *    npm install typescript --save-dev  # 安装开发依赖
 * 
 * 2. 特定版本需求：
 *    npm install react@16.8.0          # 安装特定版本
 *    npm install react@^16.8.0         # 安装 16.8.x 的最新版本
 *    npm install react@~16.8.0         # 安装 16.8.0 的补丁版本
 * 
 * 3. 问题排查和解决：
 *    npm install --force               # 依赖冲突时强制重新安装
 *    npm install --verbose             # 安装出错时查看详细日志
 *    npm install --production          # 部署时只安装生产依赖
 * 
 * 4. 批量安装：
 *    npm install react react-dom       # 一次安装多个包
 *    npm install                       # 安装 package.json 中所有依赖
 */
export function npmInstall(dir) {
    const spinner = ora("正在安装......")
    // 执行安装命令：
    // 1. cd ${shell.pwd()}/${dir}: 切换到项目目录
    // 2. npm install: 安装所有依赖
    // 3. --force: 强制重新安装，忽略缓存
    if (shell.exec(`cd ${shell.pwd()}/${dir} && npm install --force`).code !== 0) {
        console.log(logSymbols.error, chalk.redBright("对不起，依赖安装失败，请手动安装"))
        shell.exit(1)
    }
    spinner.succeed(chalk.greenBright("~~~依赖安装成功~~~"))
    spinner.succeed(chalk.greenBright("~~~项目创建完成~~~"))

    shell.exit(1)
}

/**
 * NPM 包管理命令说明
 * 
 * 1. 卸载命令对比：
 *    a) npm uninstall <package>
 *       - 完整的卸载命令
 *       - 从 node_modules 删除包
 *       - 从 package.json 中删除依赖
 *       - 从 package-lock.json 中删除相关信息
 *       示例：npm uninstall lodash
 * 
 *    b) npm rm <package>
 *       - uninstall 的简写别名
 *       - 功能完全相同
 *       - 更简短的命令形式
 *       示例：npm rm lodash
 * 
 *    c) npm unlink <package>
 *       - 用于断开全局包的符号链接
 *       - 主要用于开发时的包调试
 *       - 不会删除包，只解除链接
 *       示例：npm unlink my-cli
 * 
 * 2. 常用参数：
 *    --save 或 -S：从 dependencies 中删除
 *    --save-dev 或 -D：从 devDependencies 中删除
 *    --global 或 -g：从全局删除
 * 
 * 3. 使用场景：
 *    a) 普通包卸载：
 *       npm uninstall lodash --save
 *       npm rm lodash --save        // 同上，更简短
 * 
 *    b) 开发依赖卸载：
 *       npm uninstall jest --save-dev
 *       npm rm jest -D             // 同上，更简短
 * 
 *    c) 全局包卸载：
 *       npm uninstall -g create-react-app
 *       npm rm -g create-react-app  // 同上，更简短
 * 
 *    d) 开发调试：
 *       npm link                    // 在包目录中创建全局链接
 *       npm unlink                  // 解除当前包的全局链接
 *       npm unlink package-name     // 解除特定包的链接
 * 
 * 4. 最佳实践：
 *    - 使用 npm rm 作为日常卸载命令（更简短）
 *    - 确保使用正确的作用域（-g, -D, -S）
 *    - 卸载后检查 package.json 确认更新
 *    - 考虑使用 npm prune 清理未使用的包
 * 
 * 5. 注意事项：
 *    - unlink 不等于卸载，只是断开链接
 *    - 全局卸载需要合适的权限
 *    - 某些包可能需要手动清理配置文件
 *    - 建议卸载后运行 npm install 确保依赖树正确
 * 
 * 6. 高级用法：
 *    a) 批量卸载：
 *       npm rm package1 package2 package3
 * 
 *    b) 使用通配符：
 *       npm rm @types/* // 卸载所有 @types 作用域的包
 * 
 *    c) 清理未使用的包：
 *       npm prune      // 删除 node_modules 中未在 package.json 中列出的包
 *       npm prune --production  // 删除所有 devDependencies
 * 
 *    d) 完全清理：
 *       rm -rf node_modules
 *       rm package-lock.json
 *       npm install
 * 
 * 7. 常见问题解决：
 *    a) 权限问题：
 *       sudo npm rm -g package  // Linux/Mac 下使用 sudo
 *       // Windows 下使用管理员权限运行命令行
 * 
 *    b) 包依赖关系问题：
 *       npm rm package --force  // 强制删除
 * 
 *    c) 卸载后仍存在：
 *       - 检查是否有多个版本
 *       - 检查全局安装路径
 *       - 清理 npm 缓存：npm cache clean --force
 * 
 *    d) link/unlink 相关：
 *       - 检查全局链接：npm ls -g --link
 *       - 手动删除链接：rm -rf /usr/local/lib/node_modules/package
 * 
 * 8. 开发工具集成：
 *    VS Code 终端命令：
 *    - 右键 package.json 中的依赖
 *    - 选择 "Uninstall Package" 
 *    - 自动执行 npm uninstall 命令
 */