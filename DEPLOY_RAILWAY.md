# Deploy no Railway - Sistema de Taquigrafia

## Variáveis de Ambiente Necessárias

Ao fazer deploy no Railway, você precisará configurar as seguintes variáveis de ambiente:

### 1. DATABASE_URL
O Railway criará automaticamente um banco MySQL e fornecerá esta variável.

### 2. Variáveis do Manus OAuth
Estas já estão configuradas no sistema atual:
- `MANUS_OAUTH_CLIENT_ID`
- `MANUS_OAUTH_CLIENT_SECRET`
- `OAUTH_SERVER_URL`

### 3. SESSION_SECRET
Uma string aleatória para segurança das sessões.

### 4. NODE_ENV
Definir como `production`

## Passos para Deploy

1. Acesse: https://railway.app
2. Faça login com GitHub
3. Clique em "New Project"
4. Selecione "Deploy from GitHub repo"
5. Escolha: `fernandomesquita/taquigrafia-app`
6. Adicione serviço MySQL
7. Configure variáveis de ambiente
8. Deploy automático!

