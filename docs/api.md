# API 接口文档

本文档对应当前项目 `app/api` 路由实现。

- Base URL: `/api`
- 鉴权方式: 登录后由服务端写入 `HttpOnly` Cookie（`admin_session`，值为 `HS256` 签名的 JWT，需配置 `AUTH_JWT_SECRET`）
- 权限规则:
  - 读操作（GET）默认开放
  - 写操作（POST/PUT/DELETE）中，`posts/photos` 需要管理员权限（`isAdmin=true`）

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

- **Success (200)**:

```json
{
  "data": [
    {
      "id": 1,
      "title": "标题",
      "type": "",
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
  "type": "",
  "isHidden": false,
  "isPinned": false,
  "coverUrl": "",
  "excerpt": ""
}
```

说明:

- `content` 传 Markdown，服务端会转换并存为 HTML。
- `coverUrl` / `excerpt` 不传时服务端会自动推导。
- `multipart/form-data` 时可上传 `file`（Markdown 文件），常用于拖拽上传。

- **Body(FormData)**:
  - `file`: Markdown 文件（可选，推荐拖拽上传）
  - `content`: Markdown 文本（可选）
  - `title`: 标题（可选；若上传文件且不传，自动用首行 H1 或文件名）
  - `type`: 类型（可选）
  - `isHidden`: `true|false`（可选）
  - `isPinned`: `true|false`（可选）
  - `coverUrl`: 封面地址（可选）
  - `excerpt`: 摘要（可选）

- **拖拽上传示例（FormData）**:

```bash
curl -X POST "http://localhost:3000/api/posts" \
  -b "admin_session=YOUR_JWT" \
  -F "file=@./demo.md" \
  -F "isHidden=false" \
  -F "type="
```

- **Success (201)**:

```json
{
  "data": {
    "id": 1,
    "title": "标题",
    "type": "",
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
    "type": "",
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
  "type": "tech",
  "isHidden": true,
  "isPinned": false,
  "coverUrl": "https://example.com/new-cover.jpg",
  "excerpt": "新摘要"
}
```

说明:

- 更新 `content` 时会同步更新 `content`(HTML) 与 `markdownContent`。
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
