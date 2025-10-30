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

