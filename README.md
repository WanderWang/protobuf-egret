# egret protobuf

## 特性

* 支持微信小游戏


## 如何安装

```
npm install protobuf@6.8.4 -g
npm install @egret/protobuf -g
```

## 如何使用

```
# 假设用户有个名为 egret-project 的白鹭项目
cd egret-project
# 将代码和项目结构拷贝至白鹭项目中
pb-egret add
# 将 protofile 文件放在 egret-project/protobuf/protofile 文件夹中
pb-egret generate
# 文件将会生成到 protobuf/bundles 文件夹中

```

## 如何运行 Demo

下载源代码，使用 ```egret run egret-project ```即可直接运行 demo 项目

## 注意事项

* [重要] 由于微信小游戏的限制，只支持生成 JavaScript 代码，不支持加载 ```protobuf.load('file.proto')```这种机制


## 路线图

* 集成 egret 构建管线




