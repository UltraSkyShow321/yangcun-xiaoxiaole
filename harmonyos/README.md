# 鸿蒙 NEXT(HarmonyOS 6.0+)壳工程说明

本目录是《羊村消消乐》的纯血鸿蒙壳工程(ArkTS + ArkWeb),游戏本体通过 WebView 加载 `entry/src/main/resources/rawfile/` 下的网页资源运行。

## 构建步骤(需要华为开发者账号)

1. 安装 **DevEco Studio**(5.0 及以上,支持 HarmonyOS NEXT)
2. 用 DevEco Studio 打开本 `harmonyos/` 目录
3. 首次打开会提示**工程结构升级/迁移**,点同意(自动完成,不会丢代码)
4. `File → Project Structure → Signing Configs` 登录华为账号(AGC),勾选自动签名
5. 菜单 `Build → Build Hap(s)/App(s)` 生成 HAP
6. 用 DevEco 的 Device Manager 连接真机(或模拟器)安装运行

## 更新游戏资源

游戏代码在项目根目录 `www/`。改完游戏后同步到壳工程:

```bash
rm -rf harmonyos/entry/src/main/resources/rawfile/*
cp -r www/* harmonyos/entry/src/main/resources/rawfile/
```

然后重新 Build 即可(无需改任何 ArkTS 代码)。

## 关键文件

| 文件 | 说明 |
|---|---|
| `entry/src/main/ets/pages/Index.ets` | WebView 页面,加载 rawfile 里的 index.html |
| `entry/src/main/ets/entryability/EntryAbility.ets` | 应用入口 |
| `entry/src/main/module.json5` | 模块配置(包名 com.yangcun.xiaoxiaole) |
| `entry/src/main/resources/rawfile/` | 游戏网页资源(由 www/ 同步) |
| `AppScope/app.json5` | 应用级配置(名称/图标/版本) |

## 注意

- 本机(Windows + DevEco Studio 6.x, SDK HarmonyOS 6.1.1 API 24)尝试命令行 hvigor 构建时,因手写工程结构与 5.x/6.x 工具链的版本匹配问题未能通过命令行构建;用 **DevEco Studio 图形界面打开会自动迁移并正常构建**。
- 安装到真机必须签名:签名需要华为开发者账号(AGC),这是华为侧要求,无法绕过。
- 无账号时的替代方案:鸿蒙手机浏览器打开网页版(支持 PWA 添加到桌面),功能与原生一致。
