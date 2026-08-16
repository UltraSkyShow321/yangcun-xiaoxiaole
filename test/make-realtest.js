/* 从 index.html 生成 test/realtest.html:真实页面结构 + 自动对局驱动 */
const fs = require('fs');
const path = require('path');

let html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const driver = fs.readFileSync(path.join(__dirname, 'realtest-driver.js'), 'utf8');

/* 修正相对路径(index.html 位于根目录,realtest.html 位于 test/) */
html = html.replace(/src="js\//g, 'src="../js/').replace(/href="css\//g, 'href="../css/');

/* 注入日志浮层与驱动脚本(游戏脚本沿用 index.html 原有的引入) */
html = html.replace('</body>',
  '<div id="realtest-log" style="display:none;position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:99999;background:rgba(20,26,36,0.96);color:#d8e0ea;padding:14px;overflow:auto;font-size:13px;line-height:1.75;white-space:pre-wrap;font-family:Consolas,monospace;"></div>\n' +
  '<script>\n' + driver + '\n</script>\n</body>');

fs.writeFileSync(path.join(__dirname, 'realtest.html'), html);
console.log('test/realtest.html 已生成');
