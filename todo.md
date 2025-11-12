# TODO - Sistema de Taquigrafia

## Novas Funcionalidades Solicitadas

- [x] Implementar botão "Desfazer" ao apagar um quarto (toast com ação de desfazer)
- [x] Marcar automaticamente quarto como REVISADO ao adicionar texto comparado
- [x] Criar lembrete no último dia do mês para exportar backup e relatório
- [x] Copiar dificuldade atual do quarto para janela de edição ao abrir
- [ ] Adicionar suporte para arquivos PDF na comparação de textos
- [x] Implementar sistema de status (Pendente/Concluído) com indicação visual
- [x] Adicionar campo "Revisor" ao marcar quarto como Revisado
- [x] Criar estatística de % de precisão por revisor com visualização gráfica

## Funcionalidades Implementadas Recentemente

- [x] Corrigir título da aba do navegador
- [x] Adicionar dados de comparação ao backup
- [x] Melhorar formatação do PDF de comparação
- [x] Adicionar data atual no topo
- [x] Implementar sistema de abas Dashboard/Backup
- [x] Criar página de Backup separada com indicadores visuais
- [x] Reorganizar Dashboard removendo elementos duplicados
- [x] Aplicar LayoutComAbas em todas as páginas


## Bugs para Corrigir

- [x] Nome do revisor não está aparecendo no card do quarto após ser marcado como revisado
- [ ] Estatísticas de revisor não estão sendo exibidas no dashboard - deve mostrar taxa média de precisão agrupada por revisor para identificar quais são mais rigorosos/justos



## Melhorias de Interface Solicitadas

- [x] Cores diferentes para cada revisor nas estatísticas (ao invés de todos roxos)
- [x] Alinhar painel de Quartos Revisados com o painel de Estatística de Revisores
- [x] Implementar autocomplete de nomes de revisores com dropdown de sugestões baseado em nomes já utilizados



## Ajustes de Layout e Footer

- [x] Adicionar footer com "Desenvolvido por Fernando Mesquita" e informações de versionamento
- [x] Esticar verticalmente o painel de "Registros do Mês" para alinhar com os cards da direita



## Bug Crítico

- [x] ReferenceError: revisoresUnicos is not defined - erro ao tentar adicionar revisor



## Ajuste de Altura da Lista

- [x] Alongar verticalmente a exibição dos quartos realizados para preencher todo o espaço do card até o final do box



## Melhorias da Home Page

- [x] Adicionar "Desenvolvido por Fernando Mesquita" no footer da home page
- [x] Adicionar informação sobre comparação automática de documentos abaixo do botão "Começar Agora"



## Novo Gráfico de Precisão

- [x] Criar gráfico de curvas elegante mostrando evolução do percentual de precisão dos quartos ao longo do tempo
- [x] Posicionar abaixo do gráfico de produção diária x metas



## Bugs do Gráfico de Precisão

- [x] Datas aparecem como "Invalid Date" no eixo X e no tooltip
- [x] Média geral aparece como "NaN%"
- [x] Tooltip não mostra o nome do revisor
- [x] Código do quarto não aparece corretamente no tooltip



## Bug Crítico - Gráfico de Precisão

- [x] TypeError: Cannot read properties of undefined (reading 'getTime') - erro ao carregar gráfico quando dataHora é undefined



## Bug - Gráfico de Precisão Não Aparece

- [x] Gráfico de precisão não está sendo exibido no dashboard após correção de validação - corrigido para usar dataRegistro ao invés de dataHora



## Melhorias do Gráfico de Precisão

- [x] Cores das bolinhas do gráfico devem corresponder às cores dos revisores na tabela de estatísticas
- [x] Ao clicar na bolinha do gráfico, abrir modal de comparação de documentos do quarto correspondente



## Melhoria do PDF Exportado

- [x] Adicionar tabela de quartos no PDF com colunas: Data, Número do Quarto, Anotações, Revisado (Sim/Não), Precisão %, Revisor
- [x] Adicionar estatísticas de precisão média do mês ao final do PDF
- [x] Adicionar estatística de precisão média global (todos os meses) ao final do PDF



## Melhorias de Layout do Dashboard

- [x] Adicionar fundo azul bem claro no box "Registrar Quartos"
- [x] Criar box de estatísticas compiladas ao lado do box "Faltam X DIAS" contendo:
  - Quartos registrados / Quartos restantes
  - Taxa média de precisão



## Novas Melhorias Solicitadas

- [x] Adicionar seletor de mês/ano no painel "Registros do Mês"
- [x] Adicionar filtro de período (mês específico ou global) nas estatísticas por revisor
- [x] Adicionar filtro de período (mês específico ou global) no gráfico de evolução da precisão
- [x] Corrigir bug: data do último backup não está atualizando corretamente
- [x] Adicionar botão "Dispensar" no alerta de fim de mês para backup/relatório
- [x] Expandir box de estatísticas compiladas para mostrar:
  - Precisão média do mês atual
  - Precisão média global (todos os meses)
  - Total de quartos registrados (todos os tempos)



## Reordenação de Quartos e Lista de Revisores

- [x] Adicionar campo `ordem` na tabela de quartos (schema)
- [x] Implementar setas (↑↓) para reordenar quartos dentro de um mesmo dia
- [x] Criar endpoint tRPC para atualizar ordem dos quartos
- [x] Corrigir lista de revisores para incluir revisores de meses anteriores (buscar todos os revisores únicos do usuário)



## Bug: Reordenação de Quartos Não Funciona Visualmente

- [x] Investigar por que os quartos não mudam de posição após clicar nas setas
- [x] Corrigir lógica de reordenação no backend (simplificada para trocar ordens)
- [x] Garantir que quartos novos recebam valor inicial de ordem
- [x] Testar reordenação funcionando corretamente



## Filtros de Status e Melhorias Visuais

- [x] Adicionar filtros de status na lista de quartos (Todos, Pendentes, Não Revisados, Revisados)
- [x] Adicionar nome do mês atual em BOLD abaixo do contador de dias no card "Faltam X DIAS"



## Bug: Reordenação Limitada ao Dia Atual

- [x] Investigar por que a reordenação só funciona para quartos do dia atual
- [x] Corrigir lógica para permitir reordenação de quartos de qualquer dia do mês (já estava funcionando)
- [ ] Testar reordenação em diferentes dias



## Bug: Filtro Global nas Estatísticas por Revisor

- [x] Investigar por que o filtro "Global" não mostra dados de todos os meses
- [x] Corrigir lógica para buscar todos os quartos quando "Global" estiver selecionado (EstatisticaRevisor e GraficoPrecisao)
- [x] Testar filtro Global funcionando corretamente (implementação verificada no código)



## Bug: Boxes Desaparecem ao Clicar em Global

- [x] Investigar por que os boxes de estatística por revisor e evolução da precisão desaparecem ao clicar em "Global"
- [x] Corrigir lógica de renderização condicional dos componentes
- [x] Testar filtro Global funcionando sem desaparecer boxes

## Configuração do Banco de Dados

- [ ] Verificar se o ambiente de desenvolvimento está usando o banco correto
- [ ] Atualizar DATABASE_URL se necessário para usar o banco de produção




## Bug: Mensagem Incorreta ao Selecionar Global

- [x] Investigar por que aparece "Nenhum quarto revisado com taxa de precisão registrada" quando existem 52 quartos no mês 10/2025
- [x] Verificar se a filtragem está correta ao usar filtro Global
- [x] Corrigir lógica de filtragem se necessário - BUG: todosQuartos.data deveria ser apenas todosQuartos




## Bug: Erro ao Reordenar Quartos Recém-Adicionados

- [x] Investigar por que aparece "Erro ao reordenar: Quarto não encontrado" ao tentar reorganizar quartos recém-adicionados
- [x] Verificar se o problema está na busca do quarto no banco de dados
- [x] Corrigir lógica de reordenação para funcionar com quartos novos - CAUSA: Problema de timezone entre frontend e backend




## Bug: Quartos Criados de Forma Intercalada

- [x] Investigar por que quartos estão sendo criados de forma intercalada, ignorando ordem cronológica
- [x] Verificar como o campo `ordem` é atribuído quando novos quartos são criados
- [x] Mudar para ordenação puramente cronológica por dataRegistro (eliminar dependência de ordem)
- [x] Atualizar função de reordenação para modificar dataRegistro ao invés de ordem




## URGENTE: Reverter Mudanças Problemáticas de Ordenação

- [x] Reverter função de reordenação para NÃO alterar dataRegistro
- [x] Usar campo `ordem` para reordenação manual mantendo datas originais
- [x] Criar endpoint temporário fixDataRegistro para correções manuais
- [x] Corrigir quarto 79877-14 para dia 07/11/2025 (banco de produção Railway)
- [x] Corrigir quarto 79877-13 para dia 06/11/2025 (banco de produção Railway)
- [x] Criar documento ERROS_CRITICOS.md com checklist diário
- [x] Implementar drag and drop para reordenação de quartos (biblioteca @dnd-kit)
- [x] Garantir que setas up/down funcionem corretamente (mantidos como fallback)
- [x] Testar que data/hora original nunca é alterada (campo ordem usado para reordenação)




## Bug: Drag-and-drop com Ordem Aleatória

- [x] Investigar lógica de handleDragEnd no Dashboard.tsx (problema: múltiplas chamadas sequenciais)
- [x] Corrigir atribuição de ordem para respeitar posição exata do drop (implementado reordenarBatch)
- [x] Criar endpoint batch para atualizar todas as ordens de uma vez
- [x] Usar arrayMove para calcular nova ordem completa
- [ ] Testar reordenação em diferentes cenários no ambiente de produção





## Feature: Editar Data e Hora do Quarto

- [x] Adicionar campos de data e hora no modal de edição (input datetime-local)
- [x] Atualizar endpoint update para aceitar dataRegistro (ISO string)
- [x] Validar formato de data/hora no frontend (required)
- [ ] Testar edição de data/hora em ambiente de produção




## Feature: Dropdown Automático de Revisores

- [x] Modificar checkbox REVISADO para abrir dropdown ao marcar (já existia)
- [x] Implementar lista de revisores em ordem alfabética (já ordenado com .sort())
- [x] Permitir adicionar novo revisor digitando (com feedback visual)
- [x] Mostrar TODOS os revisores quando campo vazio (ao clicar no input)
- [x] Filtrar revisores quando usuário digita
- [x] Indicador visual quando novo revisor será adicionado




## Bug Crítico: Página Inicial com Erro 404

- [x] Investigar causa do erro 404 (botão "Fazer Login" redireciona para /login que não existe)
- [x] Corrigir redirecionamentos no Home.tsx para usar OAuth direto
- [ ] Fazer commit e push das correções
- [ ] Deploy no Railway para aplicar correções

