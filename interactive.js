import inquirer from "inquirer";

/**
 * 创建确认提示
 * @param {string} message - 要显示的提示信息
 * @returns {Promise<Object>} - 返回包含用户选择的对象 { confirm: boolean }
 * @example
 * const answer = await inquirerConfirm("是否继续？");
 * if (answer.confirm) {
 *   // 用户选择了是
 * }
 */
export const inquirerConfirm = async (message) => {
  const answer = await inquirer.prompt({
    type: "confirm",    // 提示类型：确认（是/否）
    name: "confirm",    // 答案的属性名
    message,           // 提示信息
  });
  return answer;
};

/**
 * 创建选择提示
 * @param {string} message - 要显示的提示信息
 * @param {Array} choices - 可选项数组
 * @param {string} type - 选择类型，默认为 "list"（列表选择）
 * @returns {Promise<Object>} - 返回包含用户选择的对象 { choose: string }
 * @example
 * const choices = ["选项1", "选项2", "选项3"];
 * const answer = await inquirerChoose("请选择一个选项：", choices);
 */
export const inquirerChoose = async (message, choices, type = "list") => {
  const answer = await inquirer.prompt({
    type,              // 提示类型：列表选择
    name: "choose",    // 答案的属性名
    message,           // 提示信息
    choices,           // 可选项数组
  });
  return answer;
};

/**
 * 创建单行输入提示
 * @param {string} message - 要显示的提示信息
 * @returns {Promise<Object>} - 返回包含用户输入的对象 { input: string }
 * @example
 * const answer = await inquirerInput("请输入您的名字：");
 * console.log(answer.input);
 */
export const inquirerInput = async (message) => {
  const answer = await inquirer.prompt({
    type: "input",     // 提示类型：文本输入
    name: "input",     // 答案的属性名
    message,           // 提示信息
  });
  return answer;
};

/**
 * 创建多个输入提示
 * @param {Array<Object>} messages - 提示信息数组，每个对象包含 name 和 message 属性
 * @returns {Promise<Object>} - 返回包含所有用户输入的对象，key 为每个提示的 name
 * @example
 * const messages = [
 *   { name: "username", message: "请输入用户名：" },
 *   { name: "email", message: "请输入邮箱：" }
 * ];
 * const answers = await inquirerInputs(messages);
 * console.log(answers.username, answers.email);
 */
export const inquirerInputs = async (messages) => {
  const answers = await inquirer.prompt(
    messages.map((msg) => ({
      name: msg.name,      // 答案的属性名
      type: "input",       // 提示类型：文本输入
      message: msg.message, // 提示信息
    }))
  );
  return answers;
};
