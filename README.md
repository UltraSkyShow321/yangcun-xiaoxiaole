# 羊村消消乐

喜羊羊与灰太狼主题的消消乐游戏(原创同人)。角色形象、音乐音效全部原创绘制/合成,不涉及官方素材版权。

## 游戏内容

- **8 种消除棋子**:喜羊羊、美羊羊、懒羊羊、沸羊羊、暖羊羊、蕉太狼、小灰灰、慢羊羊(贴合原动画特征的白羊毛 Q 版形象)
- **特殊棋子**:4 连 → 平底锅(清整行/列);5 连 → 青草蛋糕(清全场同色);L/T 形 → 羊角爆竹(3×3 爆炸);特殊+特殊组合大招
- **30 个关卡**:6 个章节(青青草原 → 狼堡之巅),每 5 关一个灰太狼 Boss 关,蜿蜒小路选关地图
- **三种关卡目标**:分数关、收集关(灰太狼/蛋糕掉落收集)、果冻关、双目标关(分数+收集)
- **障碍**:冰层、锁链、藤蔓、果冻
- **6 种道具** + 铃铛货币 + 羊村商店
- **无尽模式**(60 步冲高分)+ **每日挑战**(按日期固定种子的全新棋盘,本地纪录)
- **原创 8-bit 音乐**:主菜单/普通关/Boss 关/胜利 4 首多声部旋律 + 全套音效(Web Audio 合成,无外部文件)
- **新手引导**:第 1 关交换引导箭头;收集关/果冻关/特殊棋子的机制首见引导
- **奖励时间**:通关后剩余步数转化为特殊棋子自动连爆刷分
- **失败续命**:花 30 铃铛 +5 步继续;连续失败 3 次村长送加步器
- **剧情对话**:章节开场、Boss 战、大结局("我还会回来的!")
- **PWA**:支持离线游玩与"添加到主屏幕"
- **存档**:localStorage + 导出/导入 JSON

## 多平台

| 平台 | 产物 | 说明 |
|---|---|---|
| 网页端 | 本项目 | 双击 index.html 或静态服务器;支持 PWA 安装到桌面 |
| Windows | `release/羊村消消乐-1.0.0-portable.exe` | 便携版,双击即玩 |
| Android | `release/羊村消消乐-1.0.0-release.apk` | 正式签名版,直接安装 |
| iOS/iPadOS | GitHub Actions 构建 | 推送到 GitHub 后 Actions 自动产出未签名 ipa(安装需自签/开发者账号) |
| macOS | GitHub Actions 构建 | Actions 自动产出未签名 app zip(本地可直接运行) |
| 鸿蒙 NEXT | `harmonyos/` 壳工程 | DevEco Studio 打开构建(签名需华为开发者账号),见 `harmonyos/README.md` |

## 目录结构

```
├── index.html          游戏入口(双击即可游玩)
├── preview.html        素材预览页
├── manifest.webmanifest / sw.js / icon-*.png   PWA
├── css/ js/            游戏代码(零构建依赖)
├── test/               测试(引擎压力/智能机器人/真实页面完整测试)
├── electron/           Electron 桌面壳
├── android/            Capacitor Android 工程(含签名配置)
├── ios/                Capacitor iOS 工程
├── harmonyos/          鸿蒙 NEXT ArkTS 壳工程
├── .github/workflows/  GitHub Actions 多平台自动构建
└── release/            打包产物(exe/apk)
```

## 本地运行

```bash
node server.js          # 浏览器打开 http://localhost:8600
# 或直接双击 index.html
```

## 测试

```bash
node test/engine.test.js          # 引擎压力测试(30关随机/智能对局)
node test/smart-bot.test.js       # 智能机器人逐关通关率
# 浏览器打开 http://localhost:8600/?selftest=1
#   → 真实游戏页面上的完整自测:棋盘一致性/交换动画时序/渲染冒烟/页面错误捕获
```

## 打包

```bash
# Windows exe(国内网络需先设置镜像,见下)
npx electron-builder --win portable
# Android release apk(已配置签名,密钥见 android/app/release.keystore)
mkdir -p www && cp -r index.html css js sw.js manifest.webmanifest icon-*.png www/
npx cap sync android && cd android && ./gradlew assembleRelease
# iOS(需 macOS + Xcode)
npx cap sync ios && cd ios/App && pod install && xcodebuild ...
```

国内网络镜像:
```bash
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
export ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
npm_config_sharp_binary_host="https://npmmirror.com/mirrors/sharp-libvips" npm install
```

## 已知事项

- exe 打包依赖 winCodeSign 工具;本机已通过 `tools/7za-wrapper.c`(自动追加 `-snl-` 参数)解决其 7z 符号链接解压问题,`node_modules` 重装后需重新编译安装该包装器。
- iOS/鸿蒙安装包签名需要对应开发者账号(Apple / 华为 AGC),这是平台方要求。
- Android 签名密钥为开发用密钥,正式发布建议更换。

## 存档

进度、星级、铃铛、道具、每日纪录、设置保存在 localStorage(键 `yxxl_save_v1`)。设置页支持导出/导入/重置。
