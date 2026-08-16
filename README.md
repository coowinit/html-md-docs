# PHP Development Lab 文档预览页

这是 `php-development-lab` 的 **20 章 Markdown 在线阅读页面**。

页面沿用轻量的 **HTML + Markdown** 架构：`index.html` 维护目录索引，`docs/*.md` 保存章节正文，CSS 和 JavaScript 负责阅读体验。无需 npm、构建工具、数据库或额外 JSON 索引。

## 文档结构

20 章内容被划分为 5 个部分，每部分 4 章：

1. **PHP 基础**：01–04
2. **函数、模块与请求**：05–08
3. **验证、存储与状态**：09–12
4. **浏览器状态与数据库**：13–16
5. **安全查询、API 与综合项目**：17–20

## 目录结构

```text
.
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   └── marked.umd.js
├── images/
│   └── logo.svg
└── docs/
    ├── 001.md
    ├── 002.md
    ├── ...
    └── 020.md
```

## 日常维护

### 修改章节正文

直接修改对应的 Markdown 文件：

```text
docs/001.md
docs/002.md
...
docs/020.md
```

### 修改目录名称、顺序或分组

只需编辑 `index.html` 中的：

```js
window.DOCS_NAV = [...]
```

`page: "001"` 对应：

```text
docs/001.md
```

通常不需要修改 `js/app.js`、`js/marked.umd.js` 或 `css/style.css`。

## 本地预览

由于页面通过 `fetch()` 读取 Markdown，建议通过本地 HTTP 服务预览，而不是直接双击 `index.html`。

如果本机安装了 PHP，可以在当前目录运行：

```bash
php -S localhost:8000
```

然后访问：

```text
http://localhost:8000/
```

## GitHub Pages

本页面本身是纯静态 HTML/CSS/JavaScript，可以直接部署到 GitHub Pages。

需要注意：页面展示的是 PHP 学习文档，**GitHub Pages 不会执行章节实验中的 PHP 源码**。真正运行 PHP 实验仍需使用支持 PHP 的本地或服务器环境。

## 设计原则

- 文档内容与页面程序分离
- Markdown 文件使用固定编号命名
- 目录结构直接维护在 `index.html`
- 不引入 npm 和构建流程
- CSS / JS 在内容稳定后尽量冻结
- 优先保证长期维护简单、容易理解和容易迁移
