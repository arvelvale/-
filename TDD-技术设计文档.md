# 印记 - 技术设计文档 (TDD)

## 1. 技术架构概览

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        前端层 (Frontend)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web App    │  │   iOS App    │  │ Android App  │      │
│  │   (React)    │  │  (React N.)  │  │  (React N.)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTPS/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                      API网关层 (Gateway)                      │
│                    Nginx + FastAPI Gateway                   │
│              (认证/限流/路由/负载均衡)                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      业务逻辑层 (Backend)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              FastAPI 微服务集群                        │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │  │
│  │  │ 日记服务 │ │ AI服务  │ │ 用户服务 │ │ 分析服务 │   │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      AI编排层 (LangGraph)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Agent A: 时间线管家 (Timeline Manager)              │  │
│  │  Agent B: 萨提亚分析师 (Satir Therapist)             │  │
│  │  Agent C: 社交主编 (Social Content Creator)          │  │
│  │  Agent D: 知识图谱构建器 (Graph Builder)             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      数据存储层 (Storage)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  MySQL   │ │  Milvus  │ │  Neo4j   │ │  Redis   │      │
│  │(结构化)  │ │(向量库)  │ │(图数据库)│ │(缓存)    │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      基础设施层 (Infrastructure)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  Docker  │ │    K8s   │ │   OSS    │ │  监控    │      │
│  │(容器化)  │ │(编排)    │ │(对象存储)│ │(Prometheus)│    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈选型

| 层级 | 技术选型 | 理由 |
|------|---------|------|
| **前端** | React + Tailwind CSS | 生态丰富，快速开发UI |
| **移动端** | React Native | 跨平台，代码复用率高 |
| **后端框架** | FastAPI (Python) | 原生异步，支持流式输出 |
| **AI编排** | LangGraph | 有状态Agent，完美匹配需求 |
| **LLM** | OpenAI GPT-4 / Claude | 心理分析需要强推理能力 |
| **向量数据库** | Milvus | 多租户隔离，混合检索 |
| **图数据库** | Neo4j | GraphRAG标准，关系查询强大 |
| **关系数据库** | MySQL 8.0 | 成熟稳定，事务支持 |
| **缓存** | Redis | 高性能，支持多种数据结构 |
| **消息队列** | RabbitMQ | 异步任务处理 |
| **容器化** | Docker + K8s | 微服务部署，弹性伸缩 |
| **对象存储** | 阿里云OSS / AWS S3 | 图片/视频存储 |

---

## 2. 数据库设计

### 2.1 MySQL 关系数据库

#### 2.1.1 用户表 (users)
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    is_premium BOOLEAN DEFAULT FALSE,
    premium_expires_at TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 2.1.2 用户画像表 (user_profiles)
```sql
CREATE TABLE user_profiles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    identity_tag VARCHAR(50),  -- 创业者/职场精英/文艺青年等
    current_state VARCHAR(50),  -- 迷茫/压力大/记录美好等
    personality_type VARCHAR(20),  -- MBTI类型
    social_style VARCHAR(50),  -- 朋友圈风格
    catchphrases JSON,  -- 口头禅列表
    preferences JSON,  -- 偏好数据
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 2.1.3 日记表 (diaries)
```sql
CREATE TABLE diaries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(200),
    content TEXT NOT NULL,
    content_html TEXT,  -- 富文本HTML
    diary_date DATE NOT NULL,
    emotion_tags JSON,  -- 情绪标签数组
    importance_score TINYINT DEFAULT 5,  -- 1-10
    word_count INT DEFAULT 0,
    images JSON,  -- 图片URL数组
    is_analyzed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, diary_date),
    INDEX idx_user_created (user_id, created_at),
    FULLTEXT INDEX ft_content (content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 2.1.4 时间轴表 (timeline_events)
```sql
CREATE TABLE timeline_events (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    diary_id BIGINT,
    event_date DATE NOT NULL,
    event_summary VARCHAR(500) NOT NULL,
    emotion_tag VARCHAR(50),
    importance_score TINYINT DEFAULT 5,
    event_type VARCHAR(50),  -- work/relationship/health/achievement等
    related_entities JSON,  -- 相关实体（人物/地点）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (diary_id) REFERENCES diaries(id) ON DELETE SET NULL,
    INDEX idx_user_date (user_id, event_date),
    INDEX idx_emotion (user_id, emotion_tag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 2.1.5 AI分析记录表 (ai_analyses)
```sql
CREATE TABLE ai_analyses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    diary_id BIGINT NOT NULL,
    analysis_type VARCHAR(50),  -- satir/emotion/summary等
    behavior_layer JSON,  -- 行为层分析
    emotion_layer JSON,  -- 情绪层分析
    cognitive_layer JSON,  -- 思维层分析
    belief_layer JSON,  -- 信念层分析
    core_self_layer JSON,  -- 存在层分析
    response_text TEXT,  -- AI回复文本
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (diary_id) REFERENCES diaries(id) ON DELETE CASCADE,
    INDEX idx_user_diary (user_id, diary_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 2.1.6 朋友圈文案表 (social_posts)
```sql
CREATE TABLE social_posts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    diary_id BIGINT,
    generated_content TEXT NOT NULL,
    final_content TEXT,  -- 用户修改后的内容
    style_tag VARCHAR(50),  -- 风格标签
    is_used BOOLEAN DEFAULT FALSE,
    user_modifications JSON,  -- 用户修改记录（用于学习）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (diary_id) REFERENCES diaries(id) ON DELETE SET NULL,
    INDEX idx_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 2.2 Milvus 向量数据库

#### 2.2.1 Collection设计

```python
# 日记向量Collection
diary_collection_schema = {
    "collection_name": "diary_embeddings",
    "fields": [
        {"name": "id", "type": "INT64", "is_primary": True, "auto_id": True},
        {"name": "user_id", "type": "INT64"},  # Partition Key
        {"name": "diary_id", "type": "INT64"},
        {"name": "diary_date", "type": "VARCHAR", "max_length": 20},
        {"name": "embedding", "type": "FLOAT_VECTOR", "dim": 1536},  # OpenAI ada-002
        {"name": "content_snippet", "type": "VARCHAR", "max_length": 500},
        {"name": "emotion_tags", "type": "VARCHAR", "max_length": 200},
        {"name": "importance_score", "type": "INT8"},
    ],
    "partition_key_field": "user_id",  # 多租户隔离
}

# 索引配置
index_params = {
    "metric_type": "COSINE",  # 余弦相似度
    "index_type": "HNSW",  # 高性能近似搜索
    "params": {"M": 16, "efConstruction": 200}
}
```

#### 2.2.2 检索策略

```python
# 混合检索示例
search_params = {
    "metric_type": "COSINE",
    "params": {"ef": 100},
    "filter": f"user_id == {user_id} and diary_date >= '2026-01-01' and importance_score >= 7"
}
```

### 2.3 Neo4j 图数据库

#### 2.3.1 节点类型 (Node Labels)

```cypher
// 用户节点
CREATE (u:User {
    user_id: 123,
    username: "张三",
    created_at: datetime()
})

// 人物节点
CREATE (p:Person {
    name: "老王",
    first_mentioned: date(),
    mention_count: 15
})

// 事件节点
CREATE (e:Event {
    event_id: 456,
    summary: "项目上线",
    date: date(),
    emotion: "兴奋"
})

// 情绪节点
CREATE (em:Emotion {
    type: "焦虑",
    intensity: 8
})

// 地点节点
CREATE (l:Location {
    name: "公司",
    type: "workplace"
})
```

#### 2.3.2 关系类型 (Relationships)

```cypher
// 人际关系
(User)-[:KNOWS]->(Person)
(Person)-[:IS_BOSS_OF]->(User)
(Person)-[:COLLEAGUE_OF]->(Person)

// 事件关系
(User)-[:EXPERIENCED]->(Event)
(Event)-[:CAUSED_BY]->(Person)
(Event)-[:HAPPENED_AT]->(Location)
(Event)-[:TRIGGERED]->(Emotion)

// 因果关系
(Event)-[:LEADS_TO]->(Event)
(Emotion)-[:CAUSED_BY]->(Event)

// 时间关系
(Event)-[:BEFORE]->(Event)
(Event)-[:AFTER]->(Event)
```

#### 2.3.3 查询示例

```cypher
// 查询压力源分析
MATCH (u:User {user_id: 123})-[:EXPERIENCED]->(e:Event)-[:TRIGGERED]->(em:Emotion {type: "压力"})
MATCH (e)-[:CAUSED_BY]->(p:Person)
RETURN p.name, COUNT(e) as stress_count
ORDER BY stress_count DESC
LIMIT 5

// 查询事件链
MATCH path = (e1:Event)-[:LEADS_TO*1..3]->(e2:Event)
WHERE e1.date >= date('2026-01-01')
RETURN path
```

---

## 3. AI Agent 设计（LangGraph）

### 3.1 整体状态机设计

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Dict

# 定义全局状态
class AnalysisState(TypedDict):
    user_id: int
    diary_id: int
    diary_content: str
    user_profile: Dict
    timeline_context: List[Dict]
    
    # 萨提亚冰山五层
    behavior_layer: Dict
    emotion_layer: Dict
    cognitive_layer: Dict
    belief_layer: Dict
    core_self_layer: Dict
    
    # 输出
    therapeutic_response: str
    social_post: str
    
    # 元数据
    processing_time: float
    error: str
```

### 3.2 Agent A: 时间线管家 (Timeline Manager)

#### 职责
- 提取日记中的关键事件
- 更新结构化时间轴
- 检测连续事件模式

#### 实现
```python
def timeline_manager_node(state: AnalysisState) -> AnalysisState:
    """
    提取关键事件并更新时间轴
    """
    diary_content = state["diary_content"]
    user_id = state["user_id"]
    
    # Prompt设计
    prompt = f"""
    你是一个专业的事件提取专家。请从以下日记中提取关键事件：
    
    日记内容：
    {diary_content}
    
    请提取：
    1. 事件摘要（一句话）
    2. 情绪标签（如：焦虑、开心、愤怒）
    3. 重要性评分（1-10）
    4. 事件类型（work/relationship/health/achievement）
    5. 相关实体（人物、地点）
    
    以JSON格式返回。
    """
    
    # 调用LLM
    response = llm.invoke(prompt)
    event_data = json.loads(response.content)
    
    # 存入MySQL时间轴表
    save_timeline_event(user_id, event_data)
    
    # 检测连续模式（如：连续3天失眠）
    pattern = detect_continuous_pattern(user_id)
    
    # 更新状态
    state["timeline_context"] = get_recent_timeline(user_id, days=7)
    
    return state
```

### 3.3 Agent B: 萨提亚分析师 (Satir Therapist)

#### 职责
- 基于萨提亚冰山模型进行五层分析
- 生成温暖的疗愈回复

#### 实现（分5个子节点）

##### Node B1: 情绪侦探 (Emotion Agent)
```python
def emotion_agent_node(state: AnalysisState) -> AnalysisState:
    """
    分析行为层和情绪层
    """
    prompt = f"""
    你是一位专业的情绪分析师。
    
    日记内容：{state["diary_content"]}
    
    请分析：
    1. 显性事件（Who/What/Where/When）
    2. 用户的应对姿态（指责/讨好/超理智/打岔）
    3. 表层情绪（如：愤怒）
    4. 潜在情绪（如：恐惧、委屈）
    
    以JSON格式返回：
    {{
        "behavior": {{"event": "...", "coping_style": "..."}},
        "emotion": {{"surface": "...", "underlying": "..."}}
    }}
    """
    
    response = llm.invoke(prompt)
    result = json.loads(response.content)
    
    state["behavior_layer"] = result["behavior"]
    state["emotion_layer"] = result["emotion"]
    
    return state
```

##### Node B2: 信念挖掘机 (Cognitive Agent)
```python
def cognitive_agent_node(state: AnalysisState) -> AnalysisState:
    """
    分析思维层和信念层
    """
    prompt = f"""
    你是一位认知心理学专家。
    
    日记内容：{state["diary_content"]}
    情绪分析：{state["emotion_layer"]}
    
    请分析：
    1. 非理性信念（如："我必须完美"）
    2. 未被满足的期待（如："希望被认可"）
    3. 核心价值观（如："成就感很重要"）
    
    以JSON格式返回。
    """
    
    response = llm.invoke(prompt)
    result = json.loads(response.content)
    
    state["cognitive_layer"] = result["thinking"]
    state["belief_layer"] = result["belief"]
    
    return state
```

##### Node B3: 灵魂摆渡人 (Existence Agent)
```python
def existence_agent_node(state: AnalysisState) -> AnalysisState:
    """
    分析存在层（冰山最底层）
    """
    prompt = f"""
    你是一位资深的萨提亚流派咨询师。
    
    用户行为：{state["behavior_layer"]}
    情绪：{state["emotion_layer"]}
    思维：{state["cognitive_layer"]}
    信念：{state["belief_layer"]}
    历史背景：{state["timeline_context"]}
    
    请洞察他内心深层的**渴望**：
    - 被爱（Love）
    - 被接纳（Acceptance）
    - 自由（Freedom）
    - 意义（Meaning）
    
    不要评判，要看见他的生命力。
    请生成一段直击灵魂的分析（100-200字）。
    """
    
    response = llm.invoke(prompt)
    
    state["core_self_layer"] = {
        "desire": response.content,
        "life_energy": "..."
    }
    
    return state
```

##### Node B4: 疗愈回信生成器 (Therapeutic Responder)
```python
def therapeutic_responder_node(state: AnalysisState) -> AnalysisState:
    """
    生成温暖的疗愈回复
    """
    user_profile = state["user_profile"]
    personality = user_profile.get("personality_type", "INFP")
    
    # 根据人格类型调整语气
    tone_map = {
        "INFP": "温柔共情，诗意表达",
        "INTJ": "理性分析，提供框架",
        "ESFP": "积极鼓励，活泼轻松"
    }
    tone = tone_map.get(personality[:4], "温和倾听")
    
    prompt = f"""
    你是一位温暖的心理陪伴者。
    
    用户的深层分析：{state["core_self_layer"]}
    用户性格：{personality}
    回复语气：{tone}
    
    请生成一段温暖、像人一样的回复（200-300字），包含：
    1. 看见他的感受
    2. 连接到他的渴望
    3. 给予具体的成长建议
    
    不要说教，要陪伴。
    """
    
    response = llm.invoke(prompt)
    state["therapeutic_response"] = response.content
    
    return state
```

### 3.4 Agent C: 社交主编 (Social Content Creator)

#### 职责
- 生成个性化朋友圈文案
- 学习用户修改记录

#### 实现
```python
def social_content_creator_node(state: AnalysisState) -> AnalysisState:
    """
    生成朋友圈文案
    """
    user_profile = state["user_profile"]
    social_style = user_profile.get("social_style", "文艺极简风")
    catchphrases = user_profile.get("catchphrases", [])
    
    # 获取历史修改记录（用于风格学习）
    past_modifications = get_user_style_modifications(state["user_id"])
    
    prompt = f"""
    你是一位社交媒体文案专家。
    
    日记内容：{state["diary_content"]}
    用户风格：{social_style}
    口头禅：{catchphrases}
    历史修改偏好：{past_modifications}
    
    请生成3个版本的朋友圈文案（每个50-100字）：
    1. 版本A：简洁版
    2. 版本B：情感版
    3. 版本C：幽默版
    
    要求：
    - 自然融入用户的口头禅
    - 符合用户的社交人设
    - 不要过度煽情
    
    以JSON数组返回。
    """
    
    response = llm.invoke(prompt)
    posts = json.loads(response.content)
    
    state["social_post"] = posts
    
    return state
```

### 3.5 Agent D: 知识图谱构建器 (Graph Builder)

#### 职责
- 提取实体和关系
- 更新Neo4j知识图谱

#### 实现
```python
def graph_builder_node(state: AnalysisState) -> AnalysisState:
    """
    构建知识图谱
    """
    diary_content = state["diary_content"]
    
    prompt = f"""
    你是一个知识图谱构建专家。
    
    日记内容：{diary_content}
    
    请提取：
    1. 实体（Entity）：
       - 人物（Person）：姓名、关系
       - 地点（Location）：名称、类型
       - 事件（Event）：摘要、日期
       - 情绪（Emotion）：类型、强度
    
    2. 关系（Relation）：
       - 人际关系：老王 IS_BOSS_OF 我
       - 因果关系：项目延期 CAUSED 焦虑
       - 时间关系：事件A BEFORE 事件B
    
    以JSON格式返回：
    {{
        "entities": [...],
        "relations": [...]
    }}
    """
    
    response = llm.invoke(prompt)
    graph_data = json.loads(response.content)
    
    # 写入Neo4j
    update_knowledge_graph(state["user_id"], graph_data)
    
    return state
```

### 3.6 LangGraph 编排

```python
# 构建状态图
workflow = StateGraph(AnalysisState)

# 添加节点
workflow.add_node("timeline_manager", timeline_manager_node)
workflow.add_node("emotion_agent", emotion_agent_node)
workflow.add_node("cognitive_agent", cognitive_agent_node)
workflow.add_node("existence_agent", existence_agent_node)
workflow.add_node("therapeutic_responder", therapeutic_responder_node)
workflow.add_node("social_creator", social_content_creator_node)
workflow.add_node("graph_builder", graph_builder_node)

# 定义流程
workflow.set_entry_point("timeline_manager")
workflow.add_edge("timeline_manager", "emotion_agent")
workflow.add_edge("emotion_agent", "cognitive_agent")
workflow.add_edge("cognitive_agent", "existence_agent")
workflow.add_edge("existence_agent", "therapeutic_responder")
workflow.add_edge("therapeutic_responder", "social_creator")
workflow.add_edge("social_creator", "graph_builder")
workflow.add_edge("graph_builder", END)

# 编译
app = workflow.compile()

# 执行
result = app.invoke({
    "user_id": 123,
    "diary_id": 456,
    "diary_content": "今天又被老板批评了...",
    "user_profile": {...}
})
```

---

## 4. API 设计

### 4.1 RESTful API 规范

#### 基础URL
```
生产环境: https://api.yinji.app/v1
开发环境: http://localhost:8000/v1
```

#### 认证方式
```
Authorization: Bearer <JWT_TOKEN>
```

### 4.2 核心接口

#### 4.2.1 用户相关

```http
# 用户注册
POST /auth/register
Content-Type: application/json

{
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "password": "SecurePass123!"
}

Response 201:
{
    "user_id": 123,
    "username": "zhangsan",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

# 用户登录
POST /auth/login
Content-Type: application/json

{
    "email": "zhangsan@example.com",
    "password": "SecurePass123!"
}

# 更新用户画像
PUT /users/{user_id}/profile
Content-Type: application/json

{
    "identity_tag": "职场精英",
    "current_state": "压力大",
    "personality_type": "INTJ",
    "social_style": "职场干货风",
    "catchphrases": ["复盘一下", "干就完了", "持续精进"]
}
```

#### 4.2.2 日记相关

```http
# 创建日记
POST /diaries
Content-Type: application/json

{
    "title": "今天的反思",
    "content": "今天又被老板批评了，感觉很委屈...",
    "diary_date": "2026-02-05",
    "emotion_tags": ["委屈", "焦虑"],
    "importance_score": 7,
    "images": ["https://oss.yinji.app/images/123.jpg"]
}

Response 201:
{
    "diary_id": 456,
    "created_at": "2026-02-05T15:30:00Z",
    "message": "日记创建成功"
}

# 获取日记列表
GET /diaries?page=1&page_size=20&start_date=2026-01-01&end_date=2026-02-05

Response 200:
{
    "total": 45,
    "page": 1,
    "page_size": 20,
    "diaries": [
        {
            "diary_id": 456,
            "title": "今天的反思",
            "content_preview": "今天又被老板批评了...",
            "diary_date": "2026-02-05",
            "emotion_tags": ["委屈", "焦虑"],
            "is_analyzed": true
        }
    ]
}

# 获取单篇日记详情
GET /diaries/{diary_id}

# 更新日记
PUT /diaries/{diary_id}

# 删除日记
DELETE /diaries/{diary_id}
```

#### 4.2.3 AI分析相关

```http
# 触发AI分析（异步）
POST /ai/analyze
Content-Type: application/json

{
    "diary_id": 456,
    "analysis_type": "satir"  // satir/emotion/summary
}

Response 202:
{
    "task_id": "task_789",
    "status": "processing",
    "estimated_time": 3
}

# 查询分析结果
GET /ai/analyze/{task_id}

Response 200:
{
    "task_id": "task_789",
    "status": "completed",
    "result": {
        "behavior_layer": {...},
        "emotion_layer": {...},
        "cognitive_layer": {...},
        "belief_layer": {...},
        "core_self_layer": {...},
        "therapeutic_response": "我看到了你的委屈..."
    }
}

# 获取历史分析记录
GET /ai/analyses?diary_id=456
```

#### 4.2.4 朋友圈文案相关

```http
# 生成朋友圈文案
POST /social/generate
Content-Type: application/json

{
    "diary_id": 456,
    "style": "职场干货风"  // 可选，默认使用用户画像
}

Response 200:
{
    "post_id": 789,
    "versions": [
        {
            "version": "A",
            "content": "今日复盘：被批评不可怕，可怕的是不成长。",
            "style": "简洁版"
        },
        {
            "version": "B",
            "content": "有时候，委屈是成长的代价...",
            "style": "情感版"
        },
        {
            "version": "C",
            "content": "老板又发威了，但我依然坚强💪",
            "style": "幽默版"
        }
    ]
}

# 记录用户修改（用于风格学习）
POST /social/{post_id}/feedback
Content-Type: application/json

{
    "selected_version": "A",
    "final_content": "今日复盘：被批评是成长的机会，持续精进！",
    "modifications": [
        {"from": "不可怕", "to": "是成长的机会"},
        {"from": "不成长", "to": "持续精进"}
    ]
}
```

#### 4.2.5 数据洞察相关

```http
# 获取情绪趋势
GET /insights/emotion-trend?days=30

Response 200:
{
    "period": "2026-01-06 ~ 2026-02-05",
    "data": [
        {"date": "2026-01-06", "emotion": "开心", "score": 8},
        {"date": "2026-01-07", "emotion": "焦虑", "score": 6},
        ...
    ],
    "average_score": 6.5,
    "dominant_emotion": "焦虑"
}

# 获取时间轴
GET /insights/timeline?start_date=2026-01-01&end_date=2026-02-05

# 获取知识图谱（压力源分析）
GET /insights/stress-sources

Response 200:
{
    "top_sources": [
        {"entity": "老板", "type": "Person", "stress_count": 12},
        {"entity": "项目延期", "type": "Event", "stress_count": 8}
    ]
}

# 生成周总结
POST /insights/weekly-summary
Content-Type: application/json

{
    "week_start": "2026-01-27"
}

# 生成月度报告（PDF）
POST /insights/monthly-report
Content-Type: application/json

{
    "year": 2026,
    "month": 1
}

Response 200:
{
    "report_url": "https://oss.yinji.app/reports/user_123_2026_01.pdf",
    "expires_at": "2026-02-12T00:00:00Z"
}
```

### 4.3 WebSocket API（实时流式输出）

```javascript
// 连接WebSocket
const ws = new WebSocket('wss://api.yinji.app/v1/ws/analyze');

// 发送分析请求
ws.send(JSON.stringify({
    action: 'analyze',
    diary_id: 456
}));

// 接收流式输出
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'progress') {
        console.log(`进度: ${data.step}`);
    } else if (data.type === 'chunk') {
        // 流式输出文本
        appendText(data.content);
    } else if (data.type === 'complete') {
        console.log('分析完成');
    }
};
```

---

## 5. 前端技术方案

### 5.1 技术栈

```json
{
    "framework": "React 18",
    "state_management": "Zustand",
    "routing": "React Router v6",
    "ui_library": "shadcn/ui + Tailwind CSS",
    "charts": "Recharts",
    "editor": "Lexical (Meta开源富文本编辑器)",
    "icons": "Lucide React",
    "http_client": "Axios",
    "websocket": "Socket.IO Client",
    "build_tool": "Vite"
}
```

### 5.2 核心页面结构

```
src/
├── pages/
│   ├── Home.tsx                 # 首页（日记列表）
│   ├── DiaryEditor.tsx          # 日记编辑器
│   ├── AIAnalysis.tsx           # AI分析页面
│   ├── SocialPost.tsx           # 朋友圈文案生成
│   ├── Insights/
│   │   ├── Dashboard.tsx        # 数据看板
│   │   ├── Timeline.tsx         # 时间轴
│   │   ├── EmotionTrend.tsx     # 情绪趋势
│   │   └── KnowledgeGraph.tsx   # 知识图谱可视化
│   ├── Profile.tsx              # 用户画像设置
│   └── Onboarding.tsx           # 首次使用引导
├── components/
│   ├── IcebergChart.tsx         # 萨提亚冰山图
│   ├── EmotionCalendar.tsx      # 心情日历
│   ├── StyleSelector.tsx        # 风格选择器
│   └── ...
├── hooks/
│   ├── useAIAnalysis.ts         # AI分析Hook
│   ├── useDiary.ts              # 日记CRUD Hook
│   └── useWebSocket.ts          # WebSocket Hook
├── store/
│   ├── userStore.ts             # 用户状态
│   ├── diaryStore.ts            # 日记状态
│   └── analysisStore.ts         # 分析状态
└── utils/
    ├── api.ts                   # API封装
    └── constants.ts             # 常量定义
```

### 5.3 关键组件示例

#### 5.3.1 萨提亚冰山图组件

```tsx
import React from 'react';
import { motion } from 'framer-motion';

interface IcebergChartProps {
    analysis: {
        behavior_layer: any;
        emotion_layer: any;
        cognitive_layer: any;
        belief_layer: any;
        core_self_layer: any;
    };
}

export const IcebergChart: React.FC<IcebergChartProps> = ({ analysis }) => {
    const layers = [
        { name: '行为', data: analysis.behavior_layer, color: '#E3F2FD' },
        { name: '情绪', data: analysis.emotion_layer, color: '#BBDEFB' },
        { name: '思维', data: analysis.cognitive_layer, color: '#90CAF9' },
        { name: '信念', data: analysis.belief_layer, color: '#64B5F6' },
        { name: '存在', data: analysis.core_self_layer, color: '#42A5F5' },
    ];

    return (
        <div className="relative w-full h-[600px]">
            {/* 水面线 */}
            <div className="absolute w-full h-[2px] bg-blue-400 top-[100px] z-10">
                <span className="absolute right-4 -top-6 text-sm text-blue-600">
                    水面（意识层）
                </span>
            </div>

            {/* 冰山层级 */}
            {layers.map((layer, index) => (
                <motion.div
                    key={layer.name}
                    className="relative mx-auto rounded-lg p-6 mb-4"
                    style={{
                        backgroundColor: layer.color,
                        width: `${100 - index * 10}%`,
                        marginTop: index === 0 ? '0' : '8px'
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                >
                    <h3 className="font-bold text-lg mb-2">{layer.name}层</h3>
                    <p className="text-sm">{JSON.stringify(layer.data)}</p>
                </motion.div>
            ))}
        </div>
    );
};
```

---

## 6. 部署架构

### 6.1 容器化部署

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Nginx网关
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api-gateway

  # FastAPI网关
  api-gateway:
    build: ./gateway
    ports:
      - "8000:8000"
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  # 日记服务
  diary-service:
    build: ./services/diary
    environment:
      - MYSQL_URL=mysql://user:pass@mysql:3306/yinji
      - MILVUS_URL=http://milvus:19530
    depends_on:
      - mysql
      - milvus

  # AI服务
  ai-service:
    build: ./services/ai
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - REDIS_URL=redis://redis:6379
    deploy:
      replicas: 3  # 多实例

  # MySQL
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: yinji
    volumes:
      - mysql-data:/var/lib/mysql

  # Milvus
  milvus:
    image: milvusdb/milvus:latest
    ports:
      - "19530:19530"
    volumes:
      - milvus-data:/var/lib/milvus

  # Neo4j
  neo4j:
    image: neo4j:5.15
    ports:
      - "7474:7474"
      - "7687:7687"
    environment:
      NEO4J_AUTH: neo4j/${NEO4J_PASSWORD}
    volumes:
      - neo4j-data:/data

  # Redis
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

  # RabbitMQ
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"

volumes:
  mysql-data:
  milvus-data:
  neo4j-data:
```

### 6.2 Kubernetes部署（生产环境）

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-service
spec:
  replicas: 5
  selector:
    matchLabels:
      app: ai-service
  template:
    metadata:
      labels:
        app: ai-service
    spec:
      containers:
      - name: ai-service
        image: yinji/ai-service:latest
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-secrets
              key: openai-api-key
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## 7. 性能优化策略

### 7.1 缓存策略

```python
# Redis缓存层级
CACHE_STRATEGY = {
    # L1: 用户画像（1小时）
    "user_profile": {"ttl": 3600, "key": "profile:{user_id}"},
    
    # L2: 日记向量（永久，仅删除时清除）
    "diary_embedding": {"ttl": -1, "key": "embed:{diary_id}"},
    
    # L3: AI分析结果（7天）
    "ai_analysis": {"ttl": 604800, "key": "analysis:{diary_id}"},
    
    # L4: 朋友圈文案（24小时）
    "social_post": {"ttl": 86400, "key": "post:{diary_id}"},
    
    # L5: 数据洞察（1小时）
    "insights": {"ttl": 3600, "key": "insights:{user_id}:{type}"}
}
```

### 7.2 数据库优化

```sql
-- MySQL索引优化
CREATE INDEX idx_user_date_emotion ON diaries(user_id, diary_date, emotion_tags(50));
CREATE INDEX idx_timeline_user_date ON timeline_events(user_id, event_date DESC);

-- 分区表（按月分区）
ALTER TABLE diaries PARTITION BY RANGE (YEAR(diary_date) * 100 + MONTH(diary_date)) (
    PARTITION p202601 VALUES LESS THAN (202602),
    PARTITION p202602 VALUES LESS THAN (202603),
    ...
);
```

### 7.3 LLM成本优化

```python
# 混合模型策略
MODEL_ROUTING = {
    "simple_tasks": {
        "model": "gpt-3.5-turbo",  # 便宜
        "tasks": ["事件提取", "情绪识别"]
    },
    "complex_tasks": {
        "model": "gpt-4",  # 贵但准确
        "tasks": ["萨提亚分析", "深度洞察"]
    }
}

# Prompt缓存
# 对于相同的System Prompt，使用缓存减少Token消耗
```

---

## 8. 安全设计

### 8.1 数据加密

```python
# 传输层加密
- HTTPS/TLS 1.3
- WebSocket Secure (WSS)

# 存储层加密
from cryptography.fernet import Fernet

class DiaryEncryption:
    def __init__(self, user_key: str):
        self.cipher = Fernet(user_key)
    
    def encrypt_content(self, content: str) -> bytes:
        return self.cipher.encrypt(content.encode())
    
    def decrypt_content(self, encrypted: bytes) -> str:
        return self.cipher.decrypt(encrypted).decode()
```

### 8.2 权限控制

```python
# RBAC权限模型
ROLES = {
    "free_user": {
        "ai_analysis_daily_limit": 3,
        "social_post_daily_limit": 1,
        "data_retention_days": 365
    },
    "premium_user": {
        "ai_analysis_daily_limit": -1,  # 无限
        "social_post_daily_limit": -1,
        "data_retention_days": -1,
        "export_enabled": True
    }
}
```

### 8.3 隐私保护

```python
# 向量数据库多租户隔离
milvus_collection.create_partition(partition_name=f"user_{user_id}")

# 数据脱敏
def anonymize_for_training(diary_content: str) -> str:
    """
    如果用户同意数据用于模型训练，需要脱敏
    """
    # 替换人名、地名、公司名等
    return anonymized_content
```

---

## 9. 监控与运维

### 9.1 监控指标

```yaml
# Prometheus监控
metrics:
  - name: api_request_duration_seconds
    type: histogram
    labels: [method, endpoint, status]
  
  - name: llm_token_usage_total
    type: counter
    labels: [model, user_id]
  
  - name: ai_analysis_queue_length
    type: gauge
  
  - name: database_connection_pool_size
    type: gauge
    labels: [database_type]
```

### 9.2 日志系统

```python
# 结构化日志
import structlog

logger = structlog.get_logger()

logger.info(
    "ai_analysis_completed",
    user_id=123,
    diary_id=456,
    processing_time=2.5,
    model="gpt-4",
    token_usage=1500
)
```

### 9.3 告警规则

```yaml
# AlertManager规则
groups:
  - name: yinji_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(api_errors_total[5m]) > 0.05
        for: 5m
        annotations:
          summary: "API错误率过高"
      
      - alert: LLMCostSpike
        expr: increase(llm_cost_usd[1h]) > 100
        annotations:
          summary: "LLM成本异常增长"
```

---

## 10. 开发规范

### 10.1 代码规范

```python
# Python代码规范（PEP 8 + Black）
# pyproject.toml
[tool.black]
line-length = 100
target-version = ['py311']

[tool.isort]
profile = "black"

[tool.mypy]
python_version = "3.11"
strict = true
```

### 10.2 Git工作流

```
main (生产环境)
  ↑
develop (开发环境)
  ↑
feature/xxx (功能分支)
```

### 10.3 测试策略

```python
# 测试覆盖率要求
- 单元测试覆盖率 > 80%
- 集成测试覆盖核心流程
- E2E测试覆盖关键用户路径

# pytest示例
def test_satir_analysis():
    state = {
        "diary_content": "今天被老板批评了...",
        "user_profile": {...}
    }
    result = emotion_agent_node(state)
    assert "emotion_layer" in result
    assert result["emotion_layer"]["surface"] == "愤怒"
```

---

## 11. 技术债务与未来优化

### 11.1 已知技术债务

| 问题 | 影响 | 优先级 | 计划 |
|------|------|--------|------|
| LLM成本过高 | 运营成本 | P0 | 引入开源模型（Llama 3） |
| 向量检索慢 | 用户体验 | P1 | 优化索引，增加缓存 |
| 图数据库查询复杂 | 开发效率 | P2 | 封装常用查询模板 |

### 11.2 未来技术演进

```
Phase 1 (当前): OpenAI API + Milvus + Neo4j
    ↓
Phase 2 (6个月): 混合模型（GPT-4 + 本地小模型）
    ↓
Phase 3 (12个月): 完全自主部署（Llama 3 + 自训练模型）
```

---

**文档版本**：v1.0  
**创建日期**：2026-02-05  
**技术负责人**：研发团队  
**审核状态**：待审核
