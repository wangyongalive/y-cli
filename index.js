#! /usr/bin/env node

// 导入必要的依赖包
import figlet from "figlet"; // 用于生成 ASCII 艺术字
import chalk from "chalk"; // 用于在控制台输出彩色文字
import { program } from "commander"; // 用于构建命令行界面
import { templates } from "./constants.js";
import initAction from "./initAction.js";
import logSymbols from "./logSymbols.js";
import { table } from "table";
import fs from "fs-extra";

const pkg = fs.readJsonSync(new URL("./package.json", import.meta.url));

program.version(pkg.version, "-v --version", "display the version number");

program
  .name("duyi-cli")
  .description("一个简单的脚手架工具")
  .usage("<command> [options]")
  .on("--help", () => {
    console.log(
      "\r\n" +
        chalk.bgGreenBright.bold(
          figlet.textSync("duyi-cli!", {
            font: "Standard",
            horizontalLayout: "default",
            verticalLayout: "default",
            width: 80,
            whitespaceBreak: true,
          })
        )
    );

    console.log(
      `\r\n Run ${chalk.cyan(
        "duyi-cli <command> --help"
      )} for detailed usage of given command.`
    );
  });

// 定义 create 命令：用于创建新项目
program
  .command("create <app-name>") // <app-name> 是必填参数
  .description("创建一个新项目")
  .option("-t --template [template]", "输入模板名称创建项目") // 可选：指定模板 如果不写[template] 则返回布尔值
  .option("-f --force", "强制覆盖本地同名项目") // 可选：强制覆盖
  .option("-i --ignore", "忽略相关项目描述，快速创建项目") // 可选：快速创建
  .action(initAction);

// 定义 list 命令：用于显示所有可用的模板
program
  .command("list")
  .description("查看所有可用的模板")
  .action((name, option) => {
    // 处理模板数据并添加颜色样式
    const data = templates.map((item) => [
      chalk.greenBright(item.name),
      chalk.blueBright(item.value),
      chalk.blueBright(item.desc),
    ]);

    // 配置表格显示样式
    const config = {
      header: {
        alignment: "center",
        content: chalk.yellowBright(logSymbols.star, "所有可用的模板"),
      },
    };
    // 格式化输出模板信息
    console.log(table(data, config));
  });

// 组合格式化输出
// 1. 生成 ASCII 艺术字
// 2. 添加背景色
// 3. 添加粗体
// 4. 添加文本颜色
// 5. 添加文本宽度
// 6. 添加文本换行
// console.log('\r\n' + chalk.bgGreenBright.bold(figlet.textSync("duyi-cli!", {
//     font: "Standard",
//     horizontalLayout: 'default',
//     verticalLayout: 'default',
//     width: 80,
//     whitespaceBreak: true
// })))

program.parse(process.argv);
