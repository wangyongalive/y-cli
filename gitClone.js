import chalk from "chalk";
import download from "download-git-repo";
import ora from "ora";

export default function clone(remote, name, options = false) {
  // console.log('正在拉取项目......')
  const spinner = ora("正在拉取项目......").start();

  return new Promise((resolve, reject) => {
    download(remote, name, options, (err) => {
      if (err) {
        // console.error(err)
        spinner.fail(chalk.red(err));
        reject(err);
        return;
      }
      // console.log('拉取成功!')
      spinner.succeed(chalk.green("拉取成功"));
      resolve();
    });
  });
}
