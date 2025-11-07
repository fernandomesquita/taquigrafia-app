# ⚠️ ERROS CRÍTICOS - CONSULTAR DIARIAMENTE

## 🚨 ERRO #1: CONFUSÃO ENTRE BANCOS DE DESENVOLVIMENTO E PRODUÇÃO

### ❌ NUNCA FAÇA ISSO:
- **NUNCA** execute queries SQL no banco de desenvolvimento (TiDB sandbox) achando que está alterando produção
- **NUNCA** use `webdev_execute_sql` para operações em produção - esta ferramenta opera apenas no banco de desenvolvimento
- **NUNCA** confie em dados do banco de desenvolvimento para tomar decisões sobre produção

### ✅ SEMPRE FAÇA ISSO:

#### Para consultar/alterar o banco de PRODUÇÃO:
1. Use as credenciais corretas do Railway que estão nos segredos do Manus:
   - **`database_url`** (minúsculas!) - mysql://root:***@turntable.proxy.rlwy.net:51205/railway
   - **`mysql_public_url`** (minúsculas!) - mysql://root:***@turntable.proxy.rlwy.net:51205/railway
   - ⚠️ **NÃO USE** `DATABASE_URL` (maiúsculas) - essa é do TiDB (desenvolvimento)!
   
2. Crie scripts Node.js standalone (`.mjs`) que:
   ```javascript
   import mysql from 'mysql2/promise';
   // ATENÇÃO: usar variáveis em MINÚSCULAS!
   const DATABASE_URL = process.env.database_url || process.env.mysql_public_url;
   ```

3. **SEMPRE valide** que está no banco correto:
   ```javascript
   // Verificar se tem mais de 50 quartos (produção)
   const [count] = await connection.execute("SELECT COUNT(*) as total FROM quartos");
   if (count[0].total < 50) {
     console.error('❌ BANCO ERRADO!');
     process.exit(1);
   }
   ```

3. Execute o script com:
   ```bash
   cd /home/ubuntu/taquigrafia-app && node seu-script.mjs
   ```

#### Para consultar/alterar o banco de DESENVOLVIMENTO:
- Use `webdev_execute_sql` apenas para testes locais
- Lembre-se: dados aqui NÃO afetam produção

### 📋 CHECKLIST ANTES DE EXECUTAR QUALQUER QUERY:

- [ ] Confirmei qual banco estou usando? (dev ou prod)
- [ ] Estou usando as credenciais corretas?
- [ ] Li este documento de erros críticos?
- [ ] Tenho certeza que a query não vai corromper dados?

### 🔍 COMO IDENTIFICAR QUAL BANCO ESTÁ SENDO USADO:

**Banco de Desenvolvimento (TiDB Sandbox):**
- Usado por: `webdev_execute_sql`
- Variável: Configurada automaticamente pelo Manus
- Dados: Apenas para testes locais

**Banco de Produção (Railway MySQL):**
- Usado por: Scripts Node.js com `process.env.MYSQL_PUBLIC_URL`
- Variável: `MYSQL_PUBLIC_URL` ou `DATABASE_URL` dos segredos do Manus
- Dados: **DADOS REAIS DO USUÁRIO** - cuidado máximo!

---

## 🚨 ERRO #2: MODIFICAR dataRegistro DURANTE REORDENAÇÃO

### ❌ NUNCA FAÇA ISSO:
- **NUNCA** altere o campo `dataRegistro` ao reordenar quartos
- **NUNCA** use timestamps para ordenação manual

### ✅ SEMPRE FAÇA ISSO:
- Use o campo `ordem` para ordenação manual
- Mantenha `dataRegistro` intocado (registro histórico)
- Ordenação: PRIMARY por `ordem`, SECONDARY por `dataRegistro`

---

## 🚨 ERRO #3: TIMEZONE ISSUES

### ❌ NUNCA FAÇA ISSO:
- **NUNCA** converta datas usando `new Date()` no backend para comparações
- **NUNCA** confie em timezone do servidor

### ✅ SEMPRE FAÇA ISSO:
- Use datas diretas do banco de dados
- Deixe o MySQL fazer comparações de data
- Use `YYYY-MM-DD HH:mm:ss` para strings de data

---

## 📝 HISTÓRICO DE ERROS COMETIDOS:

### 2025-11-07 01:47 - Confusão entre bancos dev/prod (RESOLVIDO)
**Erro:** Usei `DATABASE_URL` (maiúsculas) que aponta para TiDB (dev) ao invés de `database_url` (minúsculas) que aponta para Railway (prod).
**Sintomas:** 
- Banco retornava apenas 5 quartos (dev) ao invés de 87 (prod)
- Quartos 79877-13 e 79877-14 não eram encontrados
- Connection string mostrava `tidbcloud.com` ao invés de `rlwy.net`
**Solução:** Usar `process.env.database_url` ou `process.env.mysql_public_url` (minúsculas)
**Lição:** 
1. Sempre validar número de quartos antes de executar queries
2. Verificar se connection string contém "railway" ou "rlwy"
3. Variáveis de ambiente são case-sensitive!

### 2025-11-06 (versões 1.4.4-1.5.0) - Corrupção de dataRegistro
**Erro:** Usei timestamps para reordenação, modificando `dataRegistro` original.
**Resultado:** Quartos aparecendo em datas erradas, dados históricos corrompidos.
**Lição:** Nunca modificar campos de registro histórico. Usar campo `ordem` dedicado.

---

## 🔄 ATUALIZAÇÃO DESTE DOCUMENTO

Este documento deve ser atualizado sempre que:
1. Um novo erro crítico for identificado
2. Uma solução melhor for encontrada
3. Um padrão problemático for detectado

**Última atualização:** 2025-11-07 01:47
**Versão:** 1.1.0

