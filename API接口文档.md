# 印记 - API接口文档

## 1. 接口规范

### 1.1 基础信息

```
生产环境: https://api.yinji.app/v1
开发环境: http://localhost:8000/v1
协议: HTTPS
编码: UTF-8
```

### 1.2 命名规范

- **URL路径**: 小驼峰命名（camelCase）
- **请求参数**: 小驼峰命名（camelCase）
- **响应字段**: 小驼峰命名（camelCase）

### 1.3 认证方式

```http
Authorization: Bearer <JWT_TOKEN>
```

### 1.4 统一响应格式

#### 成功响应
```json
{
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "data": {
    // 业务数据
  },
  "timestamp": "2026-02-05T15:30:00Z"
}
```

#### 错误响应
```json
{
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "success": false,
  "error": {
    "code": "INVALID_PARAMS",
    "message": "参数验证失败",
    "details": {
      "field": "email",
      "reason": "邮箱格式不正确"
    }
  },
  "timestamp": "2026-02-05T15:30:00Z"
}
```

### 1.5 错误码定义

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| SUCCESS | 200 | 成功 |
| CREATED | 201 | 创建成功 |
| INVALID_PARAMS | 400 | 参数错误 |
| UNAUTHORIZED | 401 | 未授权 |
| FORBIDDEN | 403 | 无权限 |
| NOT_FOUND | 404 | 资源不存在 |
| RATE_LIMIT_EXCEEDED | 429 | 请求过于频繁 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |
| LLM_TIMEOUT | 503 | AI服务超时 |

### 1.6 限流策略

| 用户类型 | 限流规则 | 响应头 |
|---------|---------|--------|
| 免费用户 | 100 req/min | X-RateLimit-Limit: 100 |
| 高级用户 | 1000 req/min | X-RateLimit-Remaining: 95 |
| | | X-RateLimit-Reset: 1675612800 |

---

## 2. 认证模块 (/auth)

### 2.1 用户注册

```http
POST /v1/auth/register
Content-Type: application/json
```

**请求参数**
```json
{
  "username": "zhangsan",
  "email": "zhangsan@example.com",
  "password": "SecurePass123!",
  "inviteCode": "ABC123"  // 可选
}
```

**响应示例**
```json
{
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "data": {
    "userId": 123,
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2026-02-12T15:30:00Z"
  },
  "timestamp": "2026-02-05T15:30:00Z"
}
```

### 2.2 用户登录

```http
POST /v1/auth/login
Content-Type: application/json
```

**请求参数**
```json
{
  "email": "zhangsan@example.com",
  "password": "SecurePass123!"
}
```

**响应示例**
```json
{
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "data": {
    "userId": 123,
    "username": "zhangsan",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2026-02-12T15:30:00Z"
  },
  "timestamp": "2026-02-05T15:30:00Z"
}
```

### 2.3 发送邮箱验证码

```http
POST /v1/auth/send-code
Content-Type: application/json
```

**请求参数**
```json
{
  "email": "user@example.com"
}
```

**响应示例**
```json
{
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "data": {
    "message": "验证码已发送"
  },
  "timestamp": "2026-02-24T16:00:00Z"
}
```

**说明**
- 验证码为6位数字，有效期5分钟
- 同一邮箱60秒内只能发送一次（前端控制倒计时）
- 开发环境未配置QQ邮箱时，验证码会打印到后端日志

### 2.4 邮箱验证码登录/注册

```http
POST /v1/auth/email-login
Content-Type: application/json
```

**请求参数**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "username": "我的昵称"  // 可选，注册时使用，默认为邮箱前缀
}
```

**响应示例**
```json
{
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "data": {
    "userId": 123,
    "username": "我的昵称",
    "email": "user@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2026-03-03T16:00:00Z"
  },
  "timestamp": "2026-02-24T16:00:00Z"
}
```

**说明**
- 验证码正确 → 自动完成登录（已有账号）或注册（首次）
- 注册时自动生成随机密码（用户无需记忆，后续可通过验证码登录）
- 用户名重复时自动添加数字后缀

### 2.5 刷新Token

```http
POST /v1/auth/refresh
Content-Type: application/json
```

**请求参数**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**响应示例**
```json
{
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2026-02-12T15:30:00Z"
  },
  "timestamp": "2026-02-05T15:30:00Z"
}
```

---

## 3. 用户模块 (/users)

### 3.1 获取用户画像

```http
GET /v1/users/{userId}/profile
Authorization: Bearer <token>
```

**响应示例**
```json
{
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "data": {
    "userId": 123,
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "profile": {
      "identityTag": "职场精英",
      "currentState": "压力大",
      "personalityType": "INTJ",
      "socialStyle": "职场干货风",
      "catchphrases": ["复盘一下", "干就完了", "持续精进"]
    },
    "isPremium": false,
    "premiumExpiresAt": null,
    "createdAt": "2026-01-01T00:00:00Z"
  },
  "timestamp": "2026-02-05T15:30:00Z"
}
```

### 3.2 更新用户画像

```http
PUT /v1/users/{userId}/profile
Authorization: Bearer <token>
Content-Type: application/json
```

**请求参数**
```json
{
  "identityTag": "职场精英",
  "currentState": "压力大",
  "personalityType": "INTJ",
  "socialStyle": "职场干货风",
  "catchphrases": ["复盘一下", "干就完了", "持续精进"]
}
```

**响应示例**
```json
{
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "data": {
    "message": "用户画像更新成功"
  },
  "timestamp": "2026-02-05T15:30:00Z"
}
```

---

## 4. 日记模块 (/diaries)

### 4.1 创建日记

```http
POST /v1/diaries
Authorization: Bearer <token>
Content-Type: application/json
```

**请求参数**
```json
{
  "title": "今天的反思",
  "content": "今天又被老板批评了，感觉很委屈...",
  "diaryDate": "2026-02-05",
  "emotionTags": ["委屈", "焦虑"],
  "importanceScore": 7,
  "images": ["https://oss.yinji.app/images/123.jpg"]
}
```

**响应示例**
```json
{
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "data": {
    "diaryId": 456,
    "createdAt": "2026-02-05T15:30:00Z",
    "message": "日记创建成功"
  },
  "timestamp": "2026-02-05T15:30:00Z"
}
```

### 4.2 获取日记列表

```http
GET /v1/diaries?page=1&pageSize=20&startDate=2026-01-01&endDate=2026-02-05
Authorization: Bearer <token>
```

**查询参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| pageSize | int | 否 | 每页数量，默认20 |
| startDate | date | 否 | 开始日期 |
| endDate | date | 否 | 结束日期 |
| emotionTag | string | 否 | 情绪标签筛选 |

**响应示例**
```json
{
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "data": {
    "total": 45,
    "page": 1,
    "pageSize": 20,
    "diaries": [
      {
        "diaryId": 456,
        "title": "今天的反思",
        "contentPreview": "今天又被老板批评了...",
        "diaryDate": "2026-02-05",
        "emotionTags": ["委屈", "焦虑"],
        "importanceScore": 7,
        "isAnalyzed": true,
        "createdAt": "2026-02-05T15:30:00Z"
      }
    ]
  },
  "timestamp": "2026-02-05T15:30:00Z"
}
```

### 4.3 获取日记详情

```http
GET /v1/diaries/{diaryId}
Authorization: Bearer <token>
```

**响应示例**
```json
{
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "data": {
    "diaryId": 456,
    "title": "今天的反思",
    "content": "今天又被老板批评了，感觉很委屈...",
    "contentHtml": "<p>今天又被老板批评了，感觉很委屈...</p>",
    "diaryDate": "2026-02-05",
    "emotionTags": ["委屈", "焦虑"],
    "importanceScore": 7,
    "wordCount": 150,
    "images": ["https://oss.yinji.app/images/123.jpg"],
    "isAnalyzed": true,
    "createdAt": "2026-02-05T15:30:00Z",
    "updatedAt": "2026-02-05T15:30:00Z"
  },
  "timestamp": "2026-02-05T15:30:00Z"
}
```

### 4.4 更新日记

```http
PUT /v1/diaries/{diaryId}
Authorization: Bearer <token>
Content-Type: application/json
```

**请求参数**
```json
{
  "title": "今天的反思（修改版）",
  "content": "今天又被老板批评了...",
  "emotionTags": ["委屈", "焦虑", "成长"],
  "importanceScore": 8
}
```

### 4.5 删除日记

```http
DELETE /v1/diaries/{diaryId}
Authorization: Bearer <token>
```

---

## 5. AI分析模块 (/ai)

### 5.1 触发AI分析（异步）

```http
POST /v1/ai/analyze
Authorization: Bearer <token>
Content-Type: application/json
```

**请求参数**
```json
{
  "diaryId": 456,
  "analysisType": "satir"  // satir | emotion | summary
}
```

**响应示例**
```json
{
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "data": {
    "taskId": "task_789",
    "status": "processing",
    "estimatedTime": 3
  },
  "timestamp": "2026-02-05T15:30:00Z"
}
```

### 5.2 查询分析结果

```http
GET /v1/ai/analyze/{taskId}
Authorization: Bearer <token>
```

**响应示例（处理中）**
```json
{
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "data": {
    "taskId": "task_789",
    "status": "processing",
    "progress": 60
  },
  "timestamp": "2026-02-05T15:30:02Z"
}
```

**响应示例（已完成）**
```json
{
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "data": {
    "taskId": "task_789",
    "status": "completed",
    "result": {
      "behaviorLayer": {
        "event": "被老板批评",
        "copingStyle": "讨好"
      },
      "emotionLayer": {
        "surface": "愤怒",
        "underlying": "恐惧、委屈"
      },
      "cognitiveLayer": {
        "thinking": "我必须让所有人满意"
      },
      "beliefLayer": {
        "belief": "成就感来自外部认可"
      },
      "coreSelfLayer": {
        "desire": "被接纳、被认可",
        "lifeEnergy": "渴望证明自己的价值"
      },
      "therapeuticResponse": "我看到了你的委屈和恐惧。被批评确实让人难受，但这不代表你不够好..."
    }
  },
  "timestamp": "2026-02-05T15:30:05Z"
}
```

### 5.3 获取历史分析记录

```http
GET /v1/ai/analyses?diaryId=456
Authorization: Bearer <token>
```

**响应示例**
```json
{
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "data": {
    "analyses": [
      {
        "analysisId": 789,
        "diaryId": 456,
        "analysisType": "satir",
        "createdAt": "2026-02-05T15:30:05Z"
      }
    ]
  },
  "timestamp": "2026-02-05T15:30:00Z"
}
```

---

## 6. 社交文案模块 (/social)

### 6.1 生成朋友圈文案

```http
POST /v1/social/generate
Authorization: Bearer <token>
Content-Type: application/json
```

**请求参数**
```json
{
  "diaryId": 456,
  "style": "职场干货风"  // 可选，默认使用用户画像
}
```

**响应示例**
```json
{
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "data": {
    "postId": 789,
    "versions": [
      {
        "version": "A",
        "content": "今日复盘：被批评不可怕，可怕的是不成长。",
        "style": "简洁版"
      },
      {
        "version": "B",
        "content": "有时候，委屈是成长的代价。感谢每一次被质疑的机会，让我看清自己的不足。",
        "style": "情感版"
      },
      {
        "version": "C",
        "content": "老板又发威了，但我依然坚强💪 干就完了！",
        "style": "幽默版"
      }
    ]
  },
  "timestamp": "2026-02-05T15:30:00Z"
}
```

### 6.2 记录用户修改（风格学习）

```http
POST /v1/social/{postId}/feedback
Authorization: Bearer <token>
Content-Type: application/json
```

**请求参数**
```json
{
  "selectedVersion": "A",
  "finalContent": "今日复盘：被批评是成长的机会，持续精进！",
  "modifications": [
    {"from": "不可怕", "to": "是成长的机会"},
    {"from": "不成长", "to": "持续精进"}
  ]
}
```

**响应示例**
```json
{
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "data": {
    "message": "反馈已记录，风格学习中"
  },
  "timestamp": "2026-02-05T15:30:00Z"
}
```

---

## 7. 数据洞察模块 (/insights)

### 7.1 获取情绪趋势

```http
GET /v1/insights/emotionTrend?days=30
Authorization: Bearer <token>
```

**查询参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| days | int | 否 | 天数，默认30 |

**响应示例**
```json
{
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "data": {
    "period": "2026-01-06 ~ 2026-02-05",
    "data": [
      {"date": "2026-01-06", "emotion": "开心", "score": 8},
      {"date": "2026-01-07", "emotion": "焦虑", "score": 6}
    ],
    "averageScore": 6.5,
    "dominantEmotion": "焦虑"
  },
  "timestamp": "2026-02-05T15:30:00Z"
}
```

### 7.2 获取时间轴

```http
GET /v1/insights/timeline?startDate=2026-01-01&endDate=2026-02-05
Authorization: Bearer <token>
```

**响应示例**
```json
{
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "data": {
    "events": [
      {
        "eventId": 123,
        "eventDate": "2026-02-05",
        "eventSummary": "被老板批评",
        "emotionTag": "焦虑",
        "importanceScore": 8,
        "eventType": "work"
      }
    ]
  },
  "timestamp": "2026-02-05T15:30:00Z"
}
```

### 7.3 获取压力源分析

```http
GET /v1/insights/stressSources
Authorization: Bearer <token>
```

**响应示例**
```json
{
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "data": {
    "topSources": [
      {"entity": "老板", "type": "Person", "stressCount": 12},
      {"entity": "项目延期", "type": "Event", "stressCount": 8},
      {"entity": "公司", "type": "Location", "stressCount": 6}
    ]
  },
  "timestamp": "2026-02-05T15:30:00Z"
}
```

### 7.4 生成周总结

```http
POST /v1/insights/weeklySummary
Authorization: Bearer <token>
Content-Type: application/json
```

**请求参数**
```json
{
  "weekStart": "2026-01-27"
}
```

**响应示例**
```json
{
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "data": {
    "weekStart": "2026-01-27",
    "weekEnd": "2026-02-02",
    "summary": {
      "emotionTrend": "本周情绪波动较大...",
      "keyEvents": ["项目上线", "团队冲突"],
      "growthSuggestions": ["建议加强情绪管理", "多与团队沟通"]
    }
  },
  "timestamp": "2026-02-05T15:30:00Z"
}
```

### 7.5 生成月度报告（PDF）

```http
POST /v1/insights/monthlyReport
Authorization: Bearer <token>
Content-Type: application/json
```

**请求参数**
```json
{
  "year": 2026,
  "month": 1
}
```

**响应示例**
```json
{
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "data": {
    "reportUrl": "https://oss.yinji.app/reports/user_123_2026_01.pdf",
    "expiresAt": "2026-02-12T00:00:00Z"
  },
  "timestamp": "2026-02-05T15:30:00Z"
}
```

---

## 8. WebSocket 实时接口

### 8.1 连接地址

```
wss://api.yinji.app/v1/ws/analyze
```

### 8.2 连接示例

```javascript
const ws = new WebSocket('wss://api.yinji.app/v1/ws/analyze');

// 连接成功
ws.onopen = () => {
  console.log('WebSocket连接成功');
  
  // 发送分析请求
  ws.send(JSON.stringify({
    action: 'analyze',
    diaryId: 456,
    token: 'Bearer xxx'
  }));
};

// 接收消息
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'progress') {
    console.log(`进度: ${data.step}`);
  } else if (data.type === 'chunk') {
    // 流式输出文本
    appendText(data.content);
  } else if (data.type === 'complete') {
    console.log('分析完成');
  } else if (data.type === 'error') {
    console.error('分析失败:', data.error);
  }
};

// 连接关闭
ws.onclose = () => {
  console.log('WebSocket连接关闭');
};

// 连接错误
ws.onerror = (error) => {
  console.error('WebSocket错误:', error);
};
```

### 8.3 消息格式

#### 进度消息
```json
{
  "type": "progress",
  "step": "正在分析情绪层...",
  "progress": 40
}
```

#### 流式输出
```json
{
  "type": "chunk",
  "content": "我看到了你的委屈..."
}
```

#### 完成消息
```json
{
  "type": "complete",
  "result": {
    "behaviorLayer": {...},
    "emotionLayer": {...}
  }
}
```

#### 错误消息
```json
{
  "type": "error",
  "error": {
    "code": "LLM_TIMEOUT",
    "message": "AI服务超时"
  }
}
```

---

## 9. traceId 使用说明

### 9.1 客户端发送

**方式1: 请求头携带**
```http
GET /v1/diaries
Authorization: Bearer <token>
X-Trace-Id: 550e8400-e29b-41d4-a716-446655440000
```

**方式2: 由网关自动生成**
如果客户端未提供 `X-Trace-Id`，API网关会自动生成并返回

### 9.2 响应中返回

所有响应都会包含 `traceId` 字段：
```json
{
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "data": {...}
}
```

### 9.3 错误排查

当遇到问题时，提供 `traceId` 给技术支持，可以快速定位问题：

```
用户反馈: "AI分析失败"
提供 traceId: 550e8400-e29b-41d4-a716-446655440000

技术支持查询日志:
grep "550e8400" /var/log/yinji/*.log

快速定位到完整调用链路
```

---

**文档版本**: v1.0  
**创建日期**: 2026-02-05  
**维护团队**: 后端团队  
**更新记录**: 初始版本
