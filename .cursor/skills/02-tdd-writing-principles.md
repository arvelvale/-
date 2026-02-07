# TDD（技术设计文档）编写规则

## 核心原则
**契约优先** - 定义"契约 (Contract)"，而非"实现 (Implementation)"  
**架构蓝图** - 描述系统如何协作，而非如何编码  
**灵魂与约束** - 文档应充满设计思想，而非零散代码片段

---

## 1. TDD的定位

### ✅ TDD应该是什么
- **架构蓝图**：展示系统各组件如何协作
- **契约定义**：明确输入、输出、职责边界
- **技术决策**：解释为什么选择这个技术栈
- **数据流向**：描述数据如何在系统中流转

### ❌ TDD不应该是什么
- **代码手册**：不是教开发者怎么写代码
- **实现细节**：不是具体的函数实现
- **API文档**：不是接口调用示例集合

---

## 2. 核心编写原则

### 原则1: 定义"契约"而非"实现"

每个组件/节点的描述应包含：

#### 📥 输入契约 (Input Schema)
- 接收什么数据？
- 数据格式是什么？
- 必填/可选字段？

#### 🎯 核心逻辑 (Core Logic)
- 这个组件的职责是什么？
- 它要解决什么问题？
- 关键的业务规则是什么？

#### 📤 输出契约 (Output Schema)
- 必须返回什么？
- 输出格式规范？
- 成功/失败的判定标准？

#### ⚠️ 约束与边界 (Constraints)
- 性能要求（如：响应时间 < 3秒）
- 并发限制
- 错误处理策略

---

## 3. 代码使用规范

### ✅ 允许的代码形式

#### 1. 数据结构定义
```python
# ✅ 好：定义契约
class AnalysisState(TypedDict):
    user_id: int
    diary_content: str
    emotion_layer: Dict  # 必须包含 surface 和 underlying
```

#### 2. 伪代码/逻辑流程
```
# ✅ 好：描述逻辑
IF 用户情绪为"愤怒"
  THEN 深挖潜在情绪（恐惧/委屈）
  AND 分析触发事件
ELSE 
  提取表层情绪
```

#### 3. 配置示例
```yaml
# ✅ 好：展示配置结构
cache_strategy:
  user_profile:
    ttl: 3600
    key_pattern: "profile:{user_id}"
```

### ❌ 禁止的代码形式

#### 1. 完整函数实现
```python
# ❌ 坏：具体实现代码
def cognitive_agent_node(state: AnalysisState) -> AnalysisState:
    prompt = f"""你是一位认知心理学专家..."""
    response = llm.invoke(prompt)
    result = json.loads(response.content)
    state["cognitive_layer"] = result["thinking"]
    return state
```

**替换为**：
```
Node: 信念挖掘机 (Cognitive Agent)

输入契约:
  - diary_content: str (必填)
  - emotion_layer: Dict (必填，包含 surface/underlying)

核心逻辑:
  1. 基于情绪分析，推理非理性信念
  2. 识别未被满足的期待
  3. 提取核心价值观

输出契约:
  - cognitive_layer: Dict
    - thinking: str (非理性信念描述)
  - belief_layer: Dict
    - belief: str (核心价值观)

性能约束:
  - 处理时间 < 2秒
  - LLM Token消耗 < 1000
```

---

## 4. 文档结构规范

### 推荐的章节结构

```
1. 技术架构概览
   - 系统分层图（可视化）
   - 技术栈选型（带理由）

2. 数据模型设计
   - 数据库Schema（表结构）
   - 数据流向图

3. 核心组件契约
   - 每个Agent/Service的契约定义
   - 组件间协作流程

4. API契约规范
   - 接口定义（输入/输出）
   - 认证/限流策略

5. 部署架构
   - 容器化配置（结构，非完整代码）
   - 扩展策略

6. 性能与安全
   - 性能指标要求
   - 安全策略（加密/权限）

7. 监控与运维
   - 监控指标定义
   - 告警规则
```

---

## 5. 检查清单

在完成TDD文档后，自查：

- [ ] 每个核心组件都有清晰的契约定义？
- [ ] 输入/输出Schema是否完整？
- [ ] 是否避免了大量具体代码实现？
- [ ] 架构图是否清晰展示了组件协作？
- [ ] 技术选型是否有充分理由？
- [ ] 性能/安全约束是否明确？
- [ ] 开发者能否基于此文档理解系统设计？

---

**记住**: TDD是"蓝图"，不是"施工手册"！
