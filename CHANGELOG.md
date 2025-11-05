# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.4.1] - 2025-11-05

### Corrigido
- **Bug de Componentes Desaparecendo**: Componentes "Estatística por Revisor" e "Evolução da Precisão" agora permanecem visíveis quando o filtro "Global" é selecionado e não há dados de precisão
- **Mensagem Informativa**: Substituído `return null` por renderização completa do card com mensagem "Nenhum quarto revisado com taxa de precisão registrada"
- **Usabilidade**: Seletor de período (Mês Atual/Global) permanece sempre acessível, mesmo quando não há dados

## [1.4.0] - 2025-11-05

### Adicionado
- **Reordenação de Quartos**: Botões de seta (↑↓) para reordenar quartos dentro do mesmo dia
- **Campo `ordem`**: Adicionado campo `ordem` na tabela de quartos para controlar a sequência de exibição
- **Filtros de Período**: Seletores de mês/ano no painel "Registros do Mês"
- **Filtros nas Estatísticas**: Opção de filtrar por mês específico ou global nas estatísticas por revisor e gráfico de precisão
- **Botão Dispensar**: Botão para dispensar o alerta de fim de mês (backup/relatório) com persistência via localStorage
- **Estatísticas Expandidas**: Box de estatísticas compiladas agora mostra:
  - Precisão média do mês atual
  - Precisão média global (todos os tempos)
  - Total de quartos registrados (histórico completo)
- **Lista de Revisores Persistente**: Revisores de meses anteriores agora aparecem na lista de seleção

### Corrigido
- **Bug de Reordenação**: Quartos agora trocam de posição corretamente ao clicar nas setas
- **Bug de Data do Backup**: Data do último backup agora atualiza corretamente usando useState + useEffect
- **Ordenação de Quartos**: Quartos são ordenados por `ordem` ao serem agrupados por data no frontend

### Modificado
- **Lógica de Reordenação**: Simplificada para trocar ordens entre quartos adjacentes
- **Criação de Quartos**: Novos quartos recebem valor de ordem sequencial automaticamente
- **Query de Quartos**: Ordenação por `dataRegistro DESC, ordem ASC` para manter consistência

## [1.3.0] - 2025-11-04

### Adicionado
- **Melhorias de Layout**: 
  - Fundo azul claro (bg-blue-50/50) no box "Registrar Quartos"
  - Card de estatísticas compiladas ao lado do contador de dias restantes
  - Grid reorganizado em 4 colunas para melhor aproveitamento do espaço horizontal

## [1.2.0] - 2025-11-03

### Adicionado
- **Tabela de Quartos no PDF**: Detalhamento completo de todos os quartos do mês com colunas:
  - Data/Hora
  - Número do Quarto
  - Anotações
  - Revisado (Sim/Não)
  - Precisão (%)
  - Revisor
- **Estatísticas de Precisão no PDF**: 
  - Precisão média do mês atual
  - Precisão média global (todos os meses)
- **Biblioteca jspdf-autotable**: Instalada para formatação profissional de tabelas no PDF

### Modificado
- **Endpoint de Exportação PDF**: Atualizado para buscar todos os quartos do mês e calcular estatísticas globais

## [1.1.0] - 2025-11-02

### Adicionado
- Sistema de registro de quartos de taquigrafia
- Dashboard com estatísticas e gráficos
- Exportação de relatórios em PDF
- Sistema de backup de dados
- Autenticação via Manus OAuth
- Banco de dados MySQL/TiDB com Drizzle ORM

### Funcionalidades Principais
- Registro diário de quartos com data/hora automática
- Acompanhamento de metas mensais e diárias
- Marcação de quartos como revisados
- Upload e gerenciamento de arquivos por quarto
- Comparação de documentos com análise de precisão
- Gráficos de evolução de produção e precisão
- Estatísticas por revisor
- Distribuição por nível de dificuldade

---

## Tipos de Mudanças
- **Adicionado**: para novas funcionalidades
- **Modificado**: para mudanças em funcionalidades existentes
- **Descontinuado**: para funcionalidades que serão removidas
- **Removido**: para funcionalidades removidas
- **Corrigido**: para correção de bugs
- **Segurança**: para vulnerabilidades corrigidas

