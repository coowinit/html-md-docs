# HTML MD Docs

一个使用 **HTML + Markdown + CSS + 原生 JavaScript** 构建的轻量响应式文档站模板。

项目采用电脑端三栏文档布局：左侧一级/二级目录，中间 Markdown 正文，右侧自动快速导航；手机端则把左侧目录改为侧滑 Drawer，并提供独立的快速导航面板。

## 核心维护方式

日常使用只需要记住两件事：

1. **修改正文**：编辑 `docs/xxx.md`。
2. **新增、删除、排序、改名或调整分类**：编辑 `index.html` 中的 `window.DOCS_NAV` 数组。

原则上无需修改 `css/style.css` 与 `js/app.js`。

## 目录结构

```text
html-md-docs/
├── index.html
├── README.md
├── .nojekyll
├── css/
│   └── style.css
├── js/
│   ├── marked.umd.js
│   └── app.js
├── docs/
│   ├── 001.md
│   ├── 002.md
│   ├── 003.md
│   └── ...
└── images/
    └── logo.svg
```

## 导航索引

一级目录和二级目录统一维护在 `index.html`：

```javascript
window.DOCS_NAV = [
  {
    title: "入门指南",
    children: [
      { title: "简介", page: "001" },
      { title: "快速开始", page: "002" },
      { title: "更新日志", page: "003" }
    ]
  }
];
```

规则非常简单：

```text
page: "003"
↓
docs/003.md
```

一级目录只负责分类；二级目录才对应 Markdown 文档。

## 新增一篇文档

### 第一步：新增 Markdown

例如创建：

```text
docs/015.md
```

### 第二步：更新 index.html

在对应一级目录的 `children` 中加入：

```javascript
{ title: "常见问题", page: "015" }
```

完成后不需要修改 `app.js`。

## 页面核心技术

- CSS Grid：电脑端三栏布局
- `position: sticky`：左侧目录与右侧快速导航
- Accordion：一级目录展开/折叠
- Off-canvas Drawer：手机端侧滑菜单
- Marked：Markdown 转 HTML
- IntersectionObserver：右侧 ScrollSpy 当前章节高亮
- History API：切换文档时更新 `?page=xxx`
- 原生 CSS Media Query：响应式布局

## Markdown 排版

正文 Typography 参考 `html-md-blog` 的紧凑阅读风格，包含：

- H1 ~ H6
- 段落与链接
- 有序/无序列表
- Task List
- Blockquote
- 行内代码与代码块
- 表格横向滚动
- 图片、视频、iframe
- details / summary

## Marked

项目把 Marked 放在本地：

```html
<script src="js/marked.umd.js"></script>
<script src="js/app.js"></script>
```

当前压缩包内置的是 **Marked 4.0.19 UMD**。如果你已经在其他项目中保存了更新版本的 `marked.umd.js`，可以直接覆盖该文件；本项目只使用基础的 `marked.parse()` / `marked.setOptions()` 接口。

## 本地预览说明

因为 Markdown 正文通过浏览器 `fetch()` 读取，直接双击 `index.html` 使用 `file://` 打开时，Chrome 等浏览器通常会限制本地 Markdown 请求。

推荐三种方式：

1. GitHub Pages 在线预览；
2. VS Code Live Server；
3. 在项目目录运行简单 HTTP 服务：

```bash
python -m http.server 8000
```

然后访问：

```text
http://localhost:8000/
```

## 适用场景

- 软件使用说明
- 产品帮助中心
- 技术知识库
- GitHub 项目扩展文档
- WordPress / WooCommerce 开发笔记
- 安装部署教程
- 公司内部操作指南
- 更新日志

## 设计原则

这个项目刻意保持简单：

- 不使用 npm
- 不使用构建流程
- 不使用数据库
- 不使用额外 JSON 索引
- 不使用 UI 框架
- 不把正文写进 JavaScript

最终目标是让 HTML、CSS、JS 在模板稳定后基本冻结，长期只维护 `index.html` 与 `docs/*.md`。
