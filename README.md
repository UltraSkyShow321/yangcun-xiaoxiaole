# 羊村消消乐

喜羊羊与灰太狼主题的消消乐游戏(原创同人)。角色形象、音乐音效全部原创绘制/合成,不涉及官方素材版权。

## 游戏内容

- **8 种消除棋子**:喜羊羊、美羊羊、懒羊羊、沸羊羊、暖羊羊、蕉太狼、小灰灰、慢羊羊(贴合原动画特征的白羊毛 Q 版形象)
- **特殊棋子**:4 连 → 平底锅(清整行/列);5 连 → 青草蛋糕(清全场同色);L/T 形 → 羊角爆竹(3×3 爆炸);特殊+特殊组合大招
- **30 个关卡**:6 个章节(青青草原 → 羊村大门 → 狼堡外围 → 狼堡内部 → 森林深处 → 狼堡之巅),每 5 关一个灰太狼 Boss 关
- **三种关卡目标**:分数关、收集关(灰太狼/青草蛋糕掉落到棋盘底部)、果冻关
- **障碍**:冰层、锁链、果冻
- **6 种道具**:慢羊羊小锤、洗牌、加步器、平底锅、青草蛋糕、羊角爆竹;铃铛货币 + 羊村商店
- **无尽模式**:60 步冲高分
- **剧情对话**:章节开场、Boss 战、大结局("我还会回来的!")
- **原创 8-bit 音乐音效**:主菜单/普通关/Boss 关/胜利 4 首旋律 + 全套音效(Web Audio 合成,无外部音频文件)

## 目录结构

```
├── index.html        游戏入口(双击即可用浏览器打开游玩)
├── preview.html      素材预览页(查看全部角色/特殊棋子/障碍美术)
├── css/              样式
├── js/               游戏代码
│   ├── assets.js     全部 SVG 素材
│   ├── audio.js      Web Audio 音乐音效合成
│   ├── board.js      棋盘核心逻辑
│   ├── game.js       游戏会话(渲染/动画/输入)
│   ├── levels.js     30 关配置 + 剧情台词
│   ├── store.js      存档与经济
│   └── ui.js         界面与流程
├── test/             测试
│   ├── auto.html     浏览器端到端自测(18 项)
│   ├── engine.test.js    引擎压力测试(node)
│   └── smart-bot.test.js 智能机器人通关率测试(node)
├── electron/         Electron 桌面壳
├── android/          Capacitor Android 工程
└── release/          打包产物(exe)
```

## 本地运行(网页版)

方式一:直接双击 `index.html`(零依赖,支持 file:// 协议)。
方式二:起一个静态服务器:

```bash
node server.js        # 然后浏览器打开 http://localhost:8600
```

## 自动化测试

```bash
# 1. 引擎压力测试(全部 30 关随机/智能对局,验证无死循环、收集/果冻可完成)
node test/engine.test.js
# 2. 智能机器人通关率测试(每关 15 局,评估难度是否合理)
node test/smart-bot.test.js
# 3. 浏览器端到端自测(剧情/对局/结算/道具/商店/无尽/存档 18 项)
#    浏览器打开 http://localhost:8600/test/auto.html 等待出结果
```

## 打包 Windows exe

```bash
npm install                       # 依赖(建议设置 npm 镜像)
npm run dist:win                  # 输出 release/羊村消消乐-1.0.0-portable.exe
```

注:国内网络建议设置镜像:
```bash
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
export ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
```

## 打包 Android apk

```bash
mkdir -p www && cp -r index.html css js www/    # 更新 web 目录
npx cap sync android
cd android && ./gradlew assembleDebug           # 输出 app/build/outputs/apk/debug/app-debug.apk
```

需要 JDK 17+ 与 Android SDK(本机已配置 JDK 21 + SDK 36)。正式发布请使用 `assembleRelease` 并配置签名。

## 其他平台

- **iOS / iPadOS / macOS**:同一套 Capacitor 工程,在 macOS 上执行 `npx cap add ios` 后用 Xcode 打包。
- **纯血鸿蒙(HarmonyOS NEXT 6.0+)**:游戏为纯 Web 应用,可直接用 WebView 壳工程加载 `www/` 目录;或将网页版部署为在线页面后用鸿蒙浏览器打开。

## 存档

进度、星级、铃铛、道具库存、无尽最高分、设置保存在浏览器 localStorage(键 `yxxl_save_v1`)。设置页可一键重置。
