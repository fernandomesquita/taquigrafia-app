# 🚀 Deploy no Railway - Sistema de Taquigrafia

## Pré-requisitos

- Conta no Railway (https://railway.app)
- Repositório no GitHub
- Git configurado

---

## 📋 Passo a Passo

### 1. Commit e Push das Mudanças

```bash
cd /home/ubuntu/taquigrafia-app

# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "feat: adicionar autenticação própria com JWT e comparação de documentos"

# Fazer push
git push origin main
```

### 2. Configurar no Railway

1. Acesse https://railway.app
2. Faça login com GitHub
3. Clique em "New Project"
4. Selecione "Deploy from GitHub repo"
5. Escolha o repositório `taquigrafia-app`

### 3. Adicionar Variáveis de Ambiente

No painel do Railway, vá em **Variables** e adicione:

```
DATABASE_URL=<sua_url_do_mysql>
JWT_SECRET=<chave_secreta_aleatoria>
NODE_ENV=production
```

#### Como gerar JWT_SECRET:

```bash
openssl rand -base64 32
```

Ou use um gerador online: https://generate-secret.vercel.app/32

### 4. Aguardar Deploy

- Railway detecta automaticamente o projeto Node.js
- Instala dependências com `pnpm install`
- Executa `pnpm build` (se existir)
- Inicia com `pnpm start`
- Deploy leva 2-5 minutos

### 5. Configurar Domínio (Opcional)

1. No Railway, vá em **Settings**
2. Clique em **Generate Domain**
3. Seu app estará em: `taquigrafia-app.up.railway.app`

---

## 🔧 Configuração do Banco de Dados

### Opção 1: MySQL no Railway

1. No projeto, clique em **New**
2. Selecione **Database** → **MySQL**
3. Railway cria automaticamente
4. Copie a `DATABASE_URL` das variáveis
5. Cole na variável do seu app

### Opção 2: MySQL Externo

Use qualquer provedor:
- PlanetScale (gratuito)
- AWS RDS
- DigitalOcean
- Seu próprio servidor

Formato da URL:
```
mysql://usuario:senha@host:porta/database
```

---

## ✅ Verificar Deploy

1. Acesse a URL do Railway
2. Você verá a tela de login
3. Crie uma conta ou faça login
4. Sistema funcionando!

---

## 🐛 Troubleshooting

### Erro: "Database not available"
- Verifique se `DATABASE_URL` está configurado
- Teste conexão com o banco

### Erro: "Token inválido"
- Verifique se `JWT_SECRET` está configurado
- Limpe localStorage e faça login novamente

### Erro: Build falhou
- Verifique logs no Railway
- Certifique-se que todas as dependências estão no `package.json`

---

## 📊 Monitoramento

No Railway você pode:
- Ver logs em tempo real
- Monitorar uso de recursos
- Configurar alertas
- Ver métricas de performance

---

## 💰 Custos

**Railway:**
- $5 de crédito grátis por mês
- Uso estimado: $3-5/mês
- Primeiro mês: GRÁTIS

**MySQL:**
- Railway: ~$5/mês
- PlanetScale: Gratuito (até 5GB)

---

## 🔒 Segurança

Após deploy:

1. ✅ Troque `JWT_SECRET` para valor aleatório
2. ✅ Use HTTPS (Railway fornece automaticamente)
3. ✅ Não compartilhe variáveis de ambiente
4. ✅ Faça backup regular do banco

---

## 📞 Suporte

Se tiver problemas:
1. Verifique logs no Railway
2. Teste localmente primeiro
3. Verifique variáveis de ambiente

---

**Boa sorte com o deploy!** 🚀

