# API 接口文档

本文档对应当前项目 `app/api` 路由实现。

- Base URL: `/api`
- 鉴权方式: 登录后由服务端写入 `HttpOnly` Cookie（`admin_session`，值为 `HS256` 签名的 JWT，需配置 `AUTH_JWT_SECRET`）
- 权限规则:
  - 读操作（GET）默认开放
  - 写操作（POST/PUT/DELETE）中，`posts/photos` 需要管理员权限（`isAdmin=true`）

---

## 0. 公开搜索

### 0.1 搜索文章（全文检索，zhparser）

- **Method**: `GET`
- **Path**: `/api/search`
- **Query**:
  - `q`（必填）：搜索关键词，最长 100 字符
  - `limit`（可选）：返回条数，默认 20，最大 50
  - `offset`（可选）：偏移，默认 0

- **Success (200)**:

```json
{
  "data": [
    {
      "id": 1,
      "title": "文章标题",
      "isPinned": false,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "snippet": "…<mark>关键词</mark>…",
      "rank": 0.12
    }
  ]
}
```

- **Errors**:
  - `400`: `{ "error": "缺少参数 q" }` / `{ "error": "搜索关键词过长" }` / zhparser 未启用时的提示

- **说明**: 仅返回 `isHidden=false` 的公开文章；数据库需安装 zhparser 并执行迁移 `0005_post_search_zhparser`。前台站点通过顶部放大镜或 **⌘K / Ctrl+K** 打开的搜索弹层请求此接口（不再提供独立 `/search` 页面）。

---

## 1. 认证接口

### 1.1 登录

- **Method**: `POST`
- **Path**: `/api/login`
- **Body**:

```json
{
  "username": "admin",
  "password": "your_password"
}
```

- **Success (200)**:

```json
{
  "success": true
}
```

- **Errors**:
  - `400`: `{ "error": "请填写用户名和密码" }`
  - `401`: `{ "error": "用户名或密码错误" }`
  - `500`: `{ "error": "登录失败" }`

### 1.2 登出

- **Method**: `POST`
- **Path**: `/api/logout`

- **Success (200)**:

```json
{
  "success": true
}
```

- **Errors**:
  - `500`: `{ "error": "登出失败" }`

### 1.3 获取当前登录用户

- **Method**: `GET`
- **Path**: `/api/auth/me`

- **Success (200)**:

```json
{
  "username": "admin",
  "isAdmin": true,
  "isVip": false
}
```

- **Errors**:
  - `401`: `{ "error": "未登录" }`
  - `500`: `{ "error": "获取当前用户失败" }`

---

## 2. Posts（CRUD）

### 2.1 获取文章列表

- **Method**: `GET`
- **Path**: `/api/posts`
- **Query**:
  - `includeHidden=true|false`（默认 `false`；默认仅返回 `isHidden=false`）
  - `type`：按类型 **`post_types.code`** 过滤（仅返回关联了该类型的文章）。兼容旧参数名 `typeSlug`（语义相同）。未匹配到类型时返回空数组 `[]`。

前台博文列表页使用 **`/blog?type=<code>`**；「未分类」桶为 **`/blog?uncategorized=1`**。英文站为 **`/en/blog?...`**。旧路径 **`/topic/...`** 由中间件 **308** 重定向到上述 query 形式。

- **Success (200)**:

```json
{
  "data": [
    {
      "id": 1,
      "title": "标题",
      "types": [{ "id": 2, "code": "tech", "nameZh": "技术", "nameEn": "Tech" }],
      "isHidden": false,
      "isPinned": false,
      "excerpt": "摘要",
      "coverUrl": "https://example.com/cover.jpg",
      "createdAt": "2026-05-05T10:00:00.000Z",
      "updatedAt": "2026-05-05T10:00:00.000Z"
    }
  ]
}
```

- **Errors**:
  - `500`: `{ "error": "获取文章列表失败" }`

### 2.2 创建文章（管理员）

- **Method**: `POST`
- **Path**: `/api/posts`
- **Content-Type**:
  - `application/json`（原有方式）
  - `multipart/form-data`（支持拖拽上传）
- **Body(JSON)**:

```json
{
  "title": "标题",
  "content": "# markdown 内容",
  "typeIds": [1, 2],
  "isHidden": false,
  "isPinned": false,
  "coverUrl": "",
  "excerpt": ""
}
```

说明:

- `content` 传 Markdown，服务端会转换并存为 HTML。
- `typeIds`：关联的 `post_types.id` 数组，可省略或 `[]` 表示未分类。
- `coverUrl` / `excerpt` 不传时服务端会自动推导。
- `multipart/form-data` 时可上传 `file`（Markdown 文件），常用于拖拽上传。

- **Body(FormData)**:
  - `file`: Markdown 文件（可选，推荐拖拽上传）
  - `content`: Markdown 文本（可选）
  - `title`: 标题（可选；若上传文件且不传，自动用首行 H1 或文件名）
  - `isHidden`: `true|false`（可选）
  - `isPinned`: `true|false`（可选）
  - `coverUrl`: 封面地址（可选）
  - `excerpt`: 摘要（可选）

- **拖拽上传示例（FormData）**:

```bash
curl -X POST "http://localhost:3000/api/posts" \
  -b "admin_session=YOUR_JWT" \
  -F "file=@./demo.md" \
  -F "isHidden=false"
```

- **Success (201)**:

```json
{
  "data": {
    "id": 1,
    "title": "标题",
    "isHidden": false,
    "content": "<p>...</p>",
    "markdownContent": "# markdown 内容",
    "coverUrl": "https://example.com/cover.jpg",
    "excerpt": "摘要",
    "isPinned": false,
    "createdAt": "2026-05-05T10:00:00.000Z",
    "updatedAt": "2026-05-05T10:00:00.000Z",
    "types": [{ "id": 1, "code": "tech", "nameZh": "技术", "nameEn": "Tech" }]
  }
}
```

- **Errors**:
  - `400`: `title` 或 `content` 为空
  - `401`: 未登录
  - `403`: 无权限
  - `500`: `{ "error": "创建文章失败" }`

### 2.3 获取文章详情

- **Method**: `GET`
- **Path**: `/api/posts/:id`

- **Success (200)**:

```json
{
  "data": {
    "id": 1,
    "title": "标题",
    "isHidden": false,
    "content": "<p>...</p>",
    "markdownContent": "# markdown 内容",
    "coverUrl": "https://example.com/cover.jpg",
    "excerpt": "摘要",
    "isPinned": false,
    "createdAt": "2026-05-05T10:00:00.000Z",
    "updatedAt": "2026-05-05T10:00:00.000Z"
  }
}
```

说明：`GET` 详情仍为数据库行结构；类型关联请使用管理端 `GET /api/admin/posts/:id`（响应含 `types` 数组）。

- **Errors**:
  - `400`: `{ "error": "无效的文章 ID" }`
  - `404`: `{ "error": "文章不存在" }`
  - `500`: `{ "error": "获取文章详情失败" }`

### 2.4 更新文章（管理员）

- **Method**: `PUT`
- **Path**: `/api/posts/:id`
- **Body（至少传一个字段）**:

```json
{
  "title": "新标题",
  "content": "# 新 markdown",
  "typeIds": [1],
  "isHidden": true,
  "isPinned": false,
  "coverUrl": "https://example.com/new-cover.jpg",
  "excerpt": "新摘要"
}
```

说明:

- 更新 `content` 时会同步更新 `content`(HTML) 与 `markdownContent`。
- `typeIds`：传数组则**整表替换**该文的类型关联；不传该字段则不修改关联。
- 未传 `coverUrl` / `excerpt` 时，会根据新内容自动推导更新。

- **Success (200)**:

```json
{
  "data": {
    "id": 1,
    "title": "新标题"
  }
}
```

- **Errors**:
  - `400`: ID 无效 / 字段非法 / 未提供可更新字段
  - `401`: 未登录
  - `403`: 无权限
  - `404`: 文章不存在
  - `500`: `{ "error": "更新文章失败" }`

### 2.5 删除文章（管理员）

- **Method**: `DELETE`
- **Path**: `/api/posts/:id`

- **Success (200)**:

```json
{
  "success": true
}
```

- **Errors**:
  - `400`: `{ "error": "无效的文章 ID" }`
  - `401`: 未登录
  - `403`: 无权限
  - `404`: `{ "error": "文章不存在" }`
  - `500`: `{ "error": "删除文章失败" }`

### 2.6 管理端：获取 / 更新单篇博文（HTML Zen 编辑）

- **Method**: `GET` / `PUT`
- **Path**: `/api/admin/posts/:id`
- **权限**: 管理员（`isAdmin=true`）

**GET** 返回数据库整行（含 `content`、`contentEn`、`titleEn`、`excerptEn`、`markdownContent` 等大字段），并在文章对象上附带 `types: [{ id, code, nameZh, nameEn }]`（多对多关联）。

**PUT** Body 为部分字段更新，常用字段与公开 `PUT /api/posts/:id` 类似，并额外支持英文 HTML：

- `typeIds`（`number[]`）：传则**整表替换**该文的类型关联；不传或省略字段则不修改关联。
- `contentEn`（`string`）：英文正文 HTML。传空字符串或仅空白时，服务端将 `contentEn` / `titleEn` / `excerptEn` 置为 `null`（清空英文）。非空时若未显式传 `titleEn` / `excerptEn`，服务端会从英文正文首段 H1 与内容推导标题与摘要。
- `titleEn`、`excerptEn`（`string`）：可选手动覆盖；与 `contentEn` 的自动推导逻辑见服务端实现。

管理端全屏 Zen 编辑器在「编辑」模式下通过「中文正文 / English」Tab 分别维护 `content` 与 `contentEn`，保存时一并提交 `typeIds`。

### 2.7 管理端：博文列表与分类内排序

- **Method**: `GET`
- **Path**: `/api/admin/posts`
- **说明**: 列表项含 `types` 数组（轻量），正文仍须 `GET /api/admin/posts/:id` 按需加载。

- **Method**: `PUT`
- **Path**: `/api/admin/posts/reorder`
- **Body**:

```json
{
  "orderedIds": [3, 1, 2],
  "typeId": 4
}
```

- `typeId`：当前筛选类型的数据库 id；`-1` 表示「未分类」（无任何 `post_type_assignments` 关联）的文章在同一桶内重排。

管理端博文列表筛选与前台一致，使用查询串：`/admin/posts?type=<code>`、`/admin/posts?uncategorized=1`；`/admin/posts` 表示全部。

### 2.8 管理端：文章类型 CRUD 与排序

- **GET** `/api/admin/post-types`：全部类型，`sortOrder` 升序。
- **POST** `/api/admin/post-types`：`{ code, nameZh, nameEn, suppressLinkedPostsGlobally? }`。
- **GET** `/api/admin/post-types/:id`
- **PUT** `/api/admin/post-types/:id`：部分更新 `code` / `nameZh` / `nameEn` / `suppressLinkedPostsGlobally`。
- **DELETE** `/api/admin/post-types/:id`：仍有文章关联时返回 `400`。
- **PUT** `/api/admin/post-types/reorder`：`{ orderedIds: number[] }`（有序 id 列表，下标即新 `sortOrder`）。

---

## 3. Photos（CRUD）

### 3.1 获取 photos 列表

- **Method**: `GET`
- **Path**: `/api/photos`
- **Query**:
  - `includeHidden=true|false`（默认 `false`；默认仅返回 `isHidden=false`）

- **Success (200)**:

```json
{
  "data": [
    {
      "id": 1,
      "title": "标题",
      "type": "",
      "isHidden": false,
      "description": "描述",
      "coverUrl": "https://example.com/photo-cover.jpg",
      "createdAt": "2026-05-05T10:00:00.000Z",
      "updatedAt": "2026-05-05T10:00:00.000Z"
    }
  ]
}
```

- **Errors**:
  - `500`: `{ "error": "获取 photos 列表失败" }`

### 3.2 创建 photo（管理员）

- **Method**: `POST`
- **Path**: `/api/photos`
- **Content-Type**:
  - `application/json`（原有方式）
  - `multipart/form-data`（支持拖拽图片上传）
- **Body(JSON)**:

```json
{
  "title": "标题",
  "description": "描述",
  "coverUrl": "https://example.com/photo-cover.jpg",
  "type": "",
  "isHidden": false
}
```

- **Success (201)**:

```json
{
  "data": {
    "id": 1,
    "title": "标题"
  }
}
```

- **Errors**:
  - `400`: `{ "error": "title 不能为空" }`
  - `401`: 未登录
  - `403`: 无权限
  - `500`: `{ "error": "创建 photo 失败" }`

- **Body(FormData)**:
  - `file`: 图片文件（可选；传入后会保存到 `public/uploads/photos`）
  - `title`: 标题（可选；不传时会使用文件名）
  - `description`: 描述（可选）
  - `type`: 类型（可选）
  - `isHidden`: `true|false`（可选）
  - `coverUrl`: 封面 URL（可选；若未传且上传了文件，会自动使用本地保存后的 URL）

- **拖拽上传示例（FormData）**:

```bash
curl -X POST "http://localhost:3000/api/photos" \
  -b "admin_session=YOUR_JWT" \
  -F "file=@./demo.png" \
  -F "isHidden=false" \
  -F "type="
```

### 3.3 获取 photo 详情

- **Method**: `GET`
- **Path**: `/api/photos/:id`

- **Success (200)**:

```json
{
  "data": {
    "id": 1,
    "title": "标题",
    "type": "",
    "isHidden": false,
    "description": "描述",
    "coverUrl": "https://example.com/photo-cover.jpg",
    "createdAt": "2026-05-05T10:00:00.000Z",
    "updatedAt": "2026-05-05T10:00:00.000Z"
  }
}
```

- **Errors**:
  - `400`: `{ "error": "无效 photo ID" }`
  - `404`: `{ "error": "photo 不存在" }`
  - `500`: `{ "error": "获取 photo 详情失败" }`

### 3.4 更新 photo（管理员）

- **Method**: `PUT`
- **Path**: `/api/photos/:id`
- **Body（至少传一个字段）**:

```json
{
  "title": "新标题",
  "description": "新描述",
  "coverUrl": "https://example.com/new-photo-cover.jpg",
  "type": "gallery",
  "isHidden": true
}
```

- **Success (200)**:

```json
{
  "data": {
    "id": 1,
    "title": "新标题"
  }
}
```

- **Errors**:
  - `400`: ID 无效 / title 为空 / 未提供可更新字段
  - `401`: 未登录
  - `403`: 无权限
  - `404`: photo 不存在
  - `500`: `{ "error": "更新 photo 失败" }`

### 3.5 删除 photo（管理员）

- **Method**: `DELETE`
- **Path**: `/api/photos/:id`

- **Success (200)**:

```json
{
  "success": true
}
```

- **Errors**:
  - `400`: `{ "error": "无效 photo ID" }`
  - `401`: 未登录
  - `403`: 无权限
  - `404`: `{ "error": "photo 不存在" }`
  - `500`: `{ "error": "删除 photo 失败" }`
