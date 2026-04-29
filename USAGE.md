# CodeBuddy2API 部署说明

本项目将 CodeBuddy 官方接口反向代理为 OpenAI 兼容接口，推荐通过 Docker Compose 部署。

## 1. 获取代码

```bash
git clone https://github.com/sliverkiss/codebuddy2api.git
cd codebuddy2api
```

## 2. 准备环境变量

```bash
cp .env.example .env
```

编辑 `.env`，至少填写以下内容：

```dotenv
# 访问本代理服务的鉴权密码（给客户端使用）
CODEBUDDY_PASSWORD=your_proxy_password

# 推荐 API Key 模式
CODEBUDDY_AUTH_MODE=api_key
CODEBUDDY_API_KEY=your_codebuddy_api_key
CODEBUDDY_INTERNET_ENVIRONMENT=internal

# Docker 建议
CODEBUDDY_HOST=0.0.0.0
CODEBUDDY_PORT=8001
```

说明：
- `internal` 适用于中国版网络环境（会自动走 `https://copilot.tencent.com`）。
- `CODEBUDDY_API_ENDPOINT` 留空即可自动选择官方端点。

## 3. 启动服务

```bash
docker compose up -d --build
```

查看运行状态：

```bash
docker compose ps
docker compose logs -f codebuddy2api
```

## 4. 健康检查与接口测试

健康检查：

```bash
curl http://127.0.0.1:8001/health
```

获取模型：

```bash
curl -H "Authorization: Bearer your_proxy_password" \
  http://127.0.0.1:8001/v1/models
```

对话测试：

```bash
curl -X POST "http://127.0.0.1:8001/v1/chat/completions" \
  -H "Authorization: Bearer your_proxy_password" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "glm-5.1",
    "messages": [{"role": "user", "content": "你是什么模型"}],
    "stream": false
  }'
```

## 5. 客户端接入（OpenAI SDK）

```python
from openai import OpenAI

client = OpenAI(
    api_key="your_proxy_password",
    base_url="http://127.0.0.1:8001/v1"
)

resp = client.chat.completions.create(
    model="glm-5.1",
    messages=[{"role": "user", "content": "你是什么模型"}]
)
print(resp.choices[0].message.content)
```

## 6. 升级

```bash
git pull
docker compose up -d --build
```

## 7. 安全建议

- 不要把 `.env` 提交到 Git。
- 如果怀疑密钥泄露，请立即更换 `CODEBUDDY_API_KEY` 和 `CODEBUDDY_PASSWORD`。
- 对公网暴露时，建议在反向代理层增加 HTTPS 与 IP 白名单。
