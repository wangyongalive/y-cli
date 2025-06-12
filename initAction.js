// ===== 导入必要的依赖包 =====
import shell from 'shelljs'         // 用于执行shell命令
import chalk from 'chalk'           // 用于控制台彩色输出
import clone from "./gitClone.js"   // 自定义的git克隆功能
import logSymbols from './logSymbols.js'  // 日志符号
import { changePackageJson, npmInstall, removeDir } from "./utils.js"  // 工具函数
import fs from 'fs-extra'           // 文件系统操作
import { inquirerChoose, inquirerConfirm, inquirerInputs } from './interactive.js'  // 交互式命令行
import { templates, messages } from './constants.js'  // 模板配置和消息
import { resolveApp } from './utils.js'

/**
 * 项目初始化函数 - 处理项目创建的主要逻辑
 * @param {string} name - 项目名称
 * @param {Object} option - 命令行选项
 * @param {string} [option.template] - 指定的模板名称
 * @param {boolean} [option.force] - 是否强制覆盖已存在的项目
 * @param {boolean} [option.ignore] - 是否忽略项目配置步骤
 */
export default async function (name, option) {
    // 1. 环境检查：确保已安装git
    if (!shell.which('git')) {
        console.log(logSymbols.error, chalk.redBright('对不起，要先安装git'))
        shell.exit(1)
    }

    // 2. 验证项目名称：不允许包含中文和特殊字符
    if (name.match(/[\u4E00-\u9FFF`~!@#$%&^*()\[\]\\;:\.<>?]/g)) {
        console.log(logSymbols.error, chalk.redBright('对不起，项目名称存在非法字符'))
        return
    }

    let repository = ""

    // 3. 模板选择逻辑
    if (option.template) {
        // 3.1 使用命令行指定的模板
        const template = templates.find(template => template.name === option.template)
        if (!template) {
            console.log(logSymbols.error, `不存在模板${chalk.yellowBright(option.template)}`)
            console.log(`\r\n 运行${logSymbols.arrow} ${chalk.cyanBright("duyi-cli list")} 查看所有可用模板\r\n `)
            return
        }
        repository = template.value
    } else {
        // 3.2 通过交互式命令行选择模板
        const answer = await inquirerChoose("请选择一个项目模板", templates)
        repository = answer.choose
    }

    // 4. 处理目标目录冲突
    if (fs.existsSync(resolveApp(name)) && !option.force) {
        // 4.1 目录存在且未使用强制选项时，询问是否删除
        console.log(logSymbols.warning, `已经存在项目文件夹${chalk.yellowBright(name)}`)
        const answer = await inquirerConfirm(`是否删除文件夹${chalk.yellowBright(name)}`)

        if (answer.confirm) {
            await removeDir(name)
        } else {
            console.log(logSymbols.error, chalk.redBright(`对不起，创建文件夹失败，存在同名文件夹，${chalk.cyan(name)}`))
            return;
        }
    } else if (fs.existsSync(name) && option.force) {
        // 4.2 使用强制选项时直接删除已存在目录
        console.log(logSymbols.warning, `已经存在项目文件夹${chalk.yellowBright(name)}`)
        await removeDir(name)
    }

    // 5. 克隆项目模板
    try {
        await clone(repository, name)
    } catch (err) {
        console.log(logSymbols.error, chalk.redBright("对不起，项目创建失败"))
        console.log(err)
        shell.exit(1)
    }

    // 6. 项目初始化配置
    if (!option.ignore) {
        // 6.1 收集项目配置信息
        const answers = await inquirerInputs(messages)
        // 6.2 更新 package.json
        await changePackageJson(name, answers)
    }

    // 7. 安装项目依赖
    npmInstall(name)
}