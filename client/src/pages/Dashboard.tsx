import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { APP_LOGO, APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { BarChart3, CalendarIcon, Download, Eye, LogOut, Plus, Trash2, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { PieChart, Pie, Cell } from "recharts";
import { AjustarMeta } from "@/components/AjustarMeta";
import { EstatisticaRevisor } from "@/components/EstatisticaRevisor";
import { LembreteFimMes } from "@/components/LembreteFimMes";
import { AjustarMetaLote } from "@/components/AjustarMetaLote";
import { EditarQuarto } from "@/components/EditarQuarto";
import { LayoutComAbas } from "@/components/LayoutComAbas";
import { ComparacaoDocumentos } from "@/components/ComparacaoDocumentos";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { GraficoPrecisao } from "@/components/GraficoPrecisao";

export default function Dashboard() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendentes' | 'nao-revisados' | 'revisados'>('todos');
  const [quartoRevisandoId, setQuartoRevisandoId] = useState<string | null>(null);
  const [quartoComparacaoId, setQuartoComparacaoId] = useState<string | null>(null);
  const [observacoesRevisao, setObservacoesRevisao] = useState("");
  const [revisor, setRevisor] = useState("");
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  const utils = trpc.useUtils();

  // Queries
  const { data: quartos = [], isLoading: loadingQuartos } = trpc.quartos.listByMonth.useQuery(
    { year: selectedYear, month: selectedMonth },
    { enabled: isAuthenticated }
  );

  // Buscar TODOS os quartos para estatísticas globais
  const { data: todosQuartos = [] } = trpc.quartos.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: metas = [], isLoading: loadingMetas } = trpc.metas.listByMonth.useQuery(
    { year: selectedYear, month: selectedMonth },
    { enabled: isAuthenticated }
  );

  // Mutations
  const createQuarto = trpc.quartos.create.useMutation({
    onSuccess: () => {
      utils.quartos.listByMonth.invalidate();
      setQuantidade("");
      setObservacao("");
      toast.success("Quarto registrado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao registrar quarto: ${error.message}`);
    },
  });

  const deleteQuarto = trpc.quartos.delete.useMutation({
    onSuccess: (_, variables) => {
      utils.quartos.listByMonth.invalidate();
      
      // Toast com botão de desfazer
      toast.success("Quarto excluído", {
        description: "Você pode desfazer esta ação",
        action: {
          label: "Desfazer",
          onClick: () => {
            // Encontrar o quarto deletado no cache antes da invalidation
            const quartosDeletado = quartos.find(q => q.id === variables.id);
            if (quartosDeletado) {
              // Recriar o quarto
              createQuarto.mutate({
                codigos: quartosDeletado.codigoQuarto,
                observacao: quartosDeletado.observacao || undefined,
              });
              toast.info("Exclusão desfeita!");
            }
          },
        },
      });
    },
    onError: (error) => {
      toast.error(`Erro ao excluir quarto: ${error.message}`);
    },
  });

  const updateRevisado = trpc.quartos.updateRevisado.useMutation({
    onSuccess: () => {
      utils.quartos.listByMonth.invalidate();
      setQuartoRevisandoId(null);
      setObservacoesRevisao("");
      toast.success("Status de revisão atualizado!");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });

  const updateDificuldade = trpc.quartos.updateDificuldade.useMutation({
    onSuccess: () => {
      utils.quartos.listByMonth.invalidate();
    },
  });

  const updateStatus = trpc.quartos.updateStatus.useMutation({
    onSuccess: () => {
      utils.quartos.listByMonth.invalidate();
      toast.success("Status atualizado!");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });

  const reordenarQuartos = trpc.quartos.reordenar.useMutation({
    onSuccess: () => {
      utils.quartos.listByMonth.invalidate();
      toast.success("Ordem atualizada!");
    },
    onError: (error) => {
      toast.error(`Erro ao reordenar: ${error.message}`);
    },
  });

  const exportarPDF = trpc.relatorios.exportarPDF.useMutation({
    onSuccess: (data) => {
      // Converter base64 para blob e fazer download
      const byteCharacters = atob(data.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = data.filename;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("PDF exportado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao exportar PDF: ${error.message}`);
    },
  });

  // Cálculos
  const { totalQuartos, totalMinutos, metaMensal, saldo, diasUteis, diasUteisRestantes, mediaNecessaria, quartosAgrupados, trabalhoHoje, dadosGrafico, dadosDificuldade, percentualRevisados, revisoresUnicos, quartosComPrecisao } = useMemo(() => {
    const total = quartos.length; // cada registro = 1 quarto
    const minutos = total * 4;

    // Calcular dias úteis do mês (segunda a sexta)
    const diasNoMes = new Date(selectedYear, selectedMonth, 0).getDate();
    let diasUteis = 0;
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const data = new Date(selectedYear, selectedMonth - 1, dia);
      const diaSemana = data.getDay();
      if (diaSemana >= 1 && diaSemana <= 5) {
        diasUteis++;
      }
    }

    // Calcular meta mensal considerando ajustes
    let metaMensal = diasUteis * 5; // 5 quartos por dia útil por padrão
    metas.forEach((meta) => {
      const metaPadrao = 5;
      const metaAjustada = parseFloat(meta.metaQuartos);
      metaMensal = metaMensal - metaPadrao + metaAjustada;
    });

    const saldo = total - metaMensal;

    // Calcular dias úteis restantes no mês
    const hojeData = new Date();
    const mesAtualCalc = hojeData.getMonth() + 1;
    const anoAtualCalc = hojeData.getFullYear();
    let diasUteisRestantes = 0;
    
    if (selectedMonth === mesAtualCalc && selectedYear === anoAtualCalc) {
      const diaHoje = hojeData.getDate();
      for (let dia = diaHoje; dia <= diasNoMes; dia++) {
        const data = new Date(selectedYear, selectedMonth - 1, dia);
        const diaSemana = data.getDay();
        if (diaSemana >= 1 && diaSemana <= 5) {
          diasUteisRestantes++;
        }
      }
    } else {
      // Se for mês futuro, todos os dias úteis estão disponíveis
      // Se for mês passado, não há dias restantes
      const dataComparacao = new Date(selectedYear, selectedMonth - 1, 1);
      const dataAtual = new Date(anoAtualCalc, mesAtualCalc - 1, 1);
      if (dataComparacao > dataAtual) {
        diasUteisRestantes = diasUteis;
      }
    }

    // Calcular média necessária por dia
    const quartosRestantes = metaMensal - total;
    const mediaNecessaria = diasUteisRestantes > 0 ? quartosRestantes / diasUteisRestantes : 0;

    // Filtrar quartos por status
    let quartosFiltrados = quartos;
    if (filtroStatus === 'pendentes') {
      quartosFiltrados = quartos.filter(q => q.status === 'pendente');
    } else if (filtroStatus === 'nao-revisados') {
      quartosFiltrados = quartos.filter(q => !q.revisado);
    } else if (filtroStatus === 'revisados') {
      quartosFiltrados = quartos.filter(q => q.revisado);
    }

    // Agrupar quartos por data e ordenar por ordem
    const agrupados = quartosFiltrados.reduce((acc, quarto) => {
      const data = new Date(quarto.dataRegistro).toLocaleDateString("pt-BR");
      if (!acc[data]) {
        acc[data] = [];
      }
      acc[data].push(quarto);
      return acc;
    }, {} as Record<string, typeof quartos>);
    
    // Ordenar quartos dentro de cada data por dataRegistro (ordem cronológica)
    Object.keys(agrupados).forEach(data => {
      agrupados[data].sort((a, b) => {
        return new Date(a.dataRegistro).getTime() - new Date(b.dataRegistro).getTime();
      });
    });

    // Calcular trabalho de hoje
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();
    const diaHoje = hoje.getDate();
    const diaSemanaHoje = hoje.getDay();
    
    let trabalhoHoje = {
      metaDia: 0,
      realizados: 0,
      faltam: 0,
      isDiaUtil: false
    };
    
    if (selectedMonth === mesAtual && selectedYear === anoAtual) {
      // Verificar se hoje é dia útil (seg-sex)
      trabalhoHoje.isDiaUtil = diaSemanaHoje >= 1 && diaSemanaHoje <= 5;
      
      if (trabalhoHoje.isDiaUtil) {
        // Meta padrão é 5, mas pode ter ajuste
        trabalhoHoje.metaDia = 5;
        const dataHoje = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-${String(diaHoje).padStart(2, '0')}`;
        const metaAjustada = metas.find(m => m.data === dataHoje);
        if (metaAjustada) {
          trabalhoHoje.metaDia = parseFloat(metaAjustada.metaQuartos);
        }
        
        // Contar quartos realizados hoje
        const dataHojeStr = hoje.toLocaleDateString("pt-BR");
        trabalhoHoje.realizados = agrupados[dataHojeStr]?.length || 0;
        trabalhoHoje.faltam = Math.max(0, trabalhoHoje.metaDia - trabalhoHoje.realizados);
      }
    }

    // Preparar dados para o gráfico de produção diária
    const dadosGrafico = [];
    
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const data = new Date(selectedYear, selectedMonth - 1, dia);
      const diaSemana = data.getDay();
      const isDiaUtil = diaSemana >= 1 && diaSemana <= 5;
      
      // Formatar data para buscar no agrupamento
      const dataStr = data.toLocaleDateString("pt-BR");
      const quartosNoDia = agrupados[dataStr]?.length || 0;
      
      // Meta do dia (5 para dias úteis, 0 para finais de semana)
      let metaDia = isDiaUtil ? 5 : 0;
      
      // Verificar se há ajuste de meta para este dia
      const dataISO = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      const metaAjustada = metas.find(m => m.data === dataISO);
      if (metaAjustada) {
        metaDia = parseFloat(metaAjustada.metaQuartos);
      }
      
      dadosGrafico.push({
        dia: dia,
        diaNome: `${dia}/${selectedMonth}`,
        realizados: quartosNoDia,
        meta: metaDia,
        isDiaUtil
      });
    }

    // Calcular dados de dificuldade
    const contagemDificuldade = quartos.reduce((acc, q) => {
      acc[q.dificuldade] = (acc[q.dificuldade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Ignorar N/A no gráfico de dificuldade
    const dadosDificuldade = [
      { name: 'Fácil', value: contagemDificuldade['Facil'] || 0, color: '#10b981' },
      { name: 'Médio', value: contagemDificuldade['Medio'] || 0, color: '#f59e0b' },
      { name: 'Difícil', value: contagemDificuldade['Dificil'] || 0, color: '#ef4444' },
    ].filter(d => d.value > 0);

    // Calcular percentual de revisados
    const totalRevisados = quartos.filter(q => q.revisado).length;
    const percentualRevisados = total > 0 ? (totalRevisados / total) * 100 : 0;

    // Obter lista de revisores únicos (de TODOS os quartos, não apenas do mês atual)
    const revisoresUnicos = Array.from(
      new Set(todosQuartos.filter(q => q.revisor).map(q => q.revisor))
    ).sort();

    // Filtrar quartos com taxa de precisão
    const quartosComPrecisao = quartos.filter(q => q.taxaPrecisao && q.taxaPrecisao !== '');

    return {
      totalQuartos: total,
      totalMinutos: minutos,
      metaMensal,
      saldo,
      diasUteis,
      diasUteisRestantes,
      mediaNecessaria,
      quartosAgrupados: agrupados,
      trabalhoHoje,
      dadosGrafico,
      dadosDificuldade,
      percentualRevisados,
      revisoresUnicos,
      quartosComPrecisao,
    };
  }, [quartos, metas, selectedMonth, selectedYear, filtroStatus]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Autenticação Necessária</CardTitle>
            <CardDescription>Faça login para acessar o sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => (window.location.href = "/login")} className="w-full">
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantidade || quantidade.trim() === "") {
      toast.error("Informe os códigos dos quartos");
      return;
    }
    createQuarto.mutate({ codigos: quantidade, observacao });
  };

  return (
    <LayoutComAbas>
      {/* Lembrete de Fim de Mês */}
      <LembreteFimMes />
      
      {/* Botões de Ação */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <Button
          variant="outline"
          onClick={() => exportarPDF.mutate({ year: selectedYear, month: selectedMonth })}
          disabled={exportarPDF.isPending}
        >
          <Download className="h-4 w-4 mr-2" />
          {exportarPDF.isPending ? "Gerando PDF..." : "Exportar PDF do Mês"}
        </Button>
      </div>

        {/* Formulário de Registro + Dias Restantes + Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {/* Formulário de Registro */}
          <Card className="md:col-span-2 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Registrar Quartos
              </CardTitle>
              <CardDescription>Adicione os quartos realizados hoje</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="quantidade">Códigos dos Quartos</Label>
                  <Input
                    id="quantidade"
                    type="text"
                    placeholder="Ex: 79777-8, 79777-9, 79778-1"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Formato: SESSÃO-QUARTO. Separe múltiplos códigos por vírgula. Cada quarto = 4 minutos
                  </p>
                </div>
                <div>
                  <Label htmlFor="observacao">Observação (opcional)</Label>
                  <Textarea
                    id="observacao"
                    placeholder="Adicione observações sobre este registro"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createQuarto.isPending}>
                  {createQuarto.isPending ? "Registrando..." : "Registrar"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Card de Dias Restantes */}
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
            <CardContent className="flex flex-col items-center justify-center h-full py-8">
              <p className="text-lg text-muted-foreground mb-2">Faltam</p>
              <p className="text-6xl font-bold text-orange-600">
                {(() => {
                  const hoje = new Date();
                  const ultimoDia = new Date(selectedYear, selectedMonth, 0);
                  const diasRestantes = Math.max(0, ultimoDia.getDate() - hoje.getDate());
                  return diasRestantes;
                })()}
              </p>
              <p className="text-lg text-muted-foreground mt-2">DIAS</p>
              <p className="text-sm text-muted-foreground mt-1">para acabar o mês</p>
              <p className="text-base font-bold text-orange-700 mt-2">
                {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase()}
              </p>
            </CardContent>
          </Card>

          {/* Card de Estatísticas Compiladas */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="flex flex-col justify-center h-full py-6 space-y-3">
              {/* Progresso do Mês */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Progresso do Mês</p>
                <p className="text-xl font-bold text-blue-600">
                  {totalQuartos} / {metaMensal}
                </p>
                <p className="text-xs text-muted-foreground">quartos</p>
              </div>
              
              <div className="border-t border-blue-200" />
              
              {/* Precisão Média do Mês */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Precisão Mês</p>
                <p className="text-xl font-bold text-indigo-600">
                  {quartosComPrecisao.length > 0
                    ? `${(quartosComPrecisao.reduce((sum, q) => sum + parseFloat(q.taxaPrecisao || '0'), 0) / quartosComPrecisao.length).toFixed(1)}%`
                    : '-'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {quartosComPrecisao.length > 0 ? `${quartosComPrecisao.length} comparados` : 'sem dados'}
                </p>
              </div>
              
              <div className="border-t border-blue-200" />
              
              {/* Precisão Global */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Precisão Global</p>
                <p className="text-xl font-bold text-purple-600">
                  {(() => {
                    const todosComPrecisao = todosQuartos.filter(q => q.taxaPrecisao);
                    return todosComPrecisao.length > 0
                      ? `${(todosComPrecisao.reduce((sum, q) => sum + parseFloat(q.taxaPrecisao || '0'), 0) / todosComPrecisao.length).toFixed(1)}%`
                      : '-';
                  })()}
                </p>
                <p className="text-xs text-muted-foreground">todos os tempos</p>
              </div>
              
              <div className="border-t border-blue-200" />
              
              {/* Total Global de Quartos */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Registrado</p>
                <p className="text-xl font-bold text-green-600">
                  {todosQuartos.length}
                </p>
                <p className="text-xs text-muted-foreground">quartos (global)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seletor de Mês */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="month">Mês</Label>
                <Input
                  id="month"
                  type="number"
                  min="1"
                  max="12"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="year">Ano</Label>
                <Input
                  id="year"
                  type="number"
                  min="2020"
                  max="2100"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                />
              </div>
              <div className="flex gap-2">
                <AjustarMeta
                  dataInicial={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
                />
                <AjustarMetaLote
                  mesAtual={selectedMonth}
                  anoAtual={selectedYear}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trabalho do Dia */}
        {trabalhoHoje.isDiaUtil && (
          <Card className="mb-6 border-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Trabalho do Dia
              </CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Meta do Dia</p>
                  <p className="text-2xl font-bold">{trabalhoHoje.metaDia}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Realizados</p>
                  <p className="text-2xl font-bold text-blue-600">{trabalhoHoje.realizados}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Faltam</p>
                  <p className={`text-2xl font-bold ${
                    trabalhoHoje.faltam === 0 ? "text-green-600" : 
                    trabalhoHoje.faltam <= 2 ? "text-yellow-600" : 
                    "text-red-600"
                  }`}>
                    {trabalhoHoje.faltam}
                  </p>
                </div>
              </div>
              {/* Frase Motivacional */}
              <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-900 italic text-center">
                  {(() => {
                    const frases = [
                      "🚀 Bora lá! Cada quarto é um passo mais perto da meta!",
                      "☕ Café no copo, dedos no teclado, vamos nessa!",
                      "🎯 Foco, força e fé! A meta não vai se bater sozinha!",
                      "💪 Hoje é dia de fazer acontecer! Vamos com tudo!",
                      "✨ Cada palavra digitada é uma vitória. Siga firme!",
                      "🌟 Você é capaz! Mais um dia de excelência!",
                      "🎵 No ritmo da sessão, no compasso da precisão!",
                      "👊 Respira fundo e vai! Você já fez isso mil vezes!",
                      "🌈 Depois da tempestade vem o arco-íris... e a meta batida!",
                      "🤓 Modo taquigrafia ON! Nada nos para hoje!",
                      "💡 Lembre-se: você é bom nisso. Muito bom!",
                      "🎉 Mais um dia, mais uma oportunidade de arrasar!",
                      "⏰ O tempo passa, mas sua dedicação fica. Vamos!",
                      "🎓 Aprendizado diário: você está evoluindo sempre!",
                      "🎮 Game on! Cada quarto é um level up!",
                      "🌺 Florescendo na taquigrafia, um quarto de cada vez!",
                      "⚓ Firme e forte! A consistência leva à excelência!",
                      "🌞 Bom dia, campeão! Hoje vai ser produtivo!",
                      "🔥 Tá pegando fogo! Vamos manter esse ritmo!",
                      "🏆 Você não chegou até aqui pra desistir. Bora!"
                    ];
                    const indice = new Date().getDate() % frases.length;
                    return frases[indice];
                  })()}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumo do Mês */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total de Quartos</CardDescription>
              <CardTitle className="text-3xl">{totalQuartos.toFixed(1)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total de Minutos</CardDescription>
              <CardTitle className="text-3xl">{totalMinutos.toFixed(0)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Meta do Mês</CardDescription>
              <CardTitle className="text-3xl">{metaMensal.toFixed(1)}</CardTitle>
            </CardHeader>
          </Card>
          <Card className={saldo >= 0 ? "border-green-500" : "border-red-500"}>
            <CardHeader className="pb-3">
              <CardDescription>Saldo</CardDescription>
              <CardTitle className={`text-3xl ${saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
                {saldo >= 0 ? "+" : ""}
                {saldo.toFixed(1)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-blue-500">
            <CardHeader className="pb-3">
              <CardDescription>
                Média Necessária/Dia
                {diasUteisRestantes > 0 && (
                  <span className="text-xs block mt-1">({diasUteisRestantes} dias úteis restantes)</span>
                )}
              </CardDescription>
              <CardTitle className={`text-3xl ${
                mediaNecessaria <= 5 ? "text-green-600" : 
                mediaNecessaria <= 7 ? "text-yellow-600" : 
                "text-red-600"
              }`}>
                {diasUteisRestantes > 0 ? mediaNecessaria.toFixed(1) : "--"}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Gráfico de Produção Diária */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Produção Diária do Mês
            </CardTitle>
            <CardDescription>
              Acompanhe sua produção diária em comparação com a meta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="diaNome" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded shadow-lg">
                          <p className="font-semibold">{data.diaNome}</p>
                          <p className="text-sm text-blue-600">Realizados: {data.realizados}</p>
                          <p className="text-sm text-green-600">Meta: {data.meta}</p>
                          {!data.isDiaUtil && (
                            <p className="text-xs text-gray-500 mt-1">Final de semana</p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="realizados" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Realizados"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="meta" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Meta"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Precisão */}
        <GraficoPrecisao 
          quartos={quartos} 
          todosQuartos={todosQuartos}
          mesAtual={selectedMonth}
          anoAtual={selectedYear}
          onQuartoClick={(quartoId) => {
            const quarto = quartos.find(q => q.id === quartoId);
            if (quarto) {
              setQuartoComparacaoId(quartoId);
            }
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

          {/* Lista de Registros */}
          <Card className="flex flex-col h-full">
            <CardHeader>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Registros do Mês</CardTitle>
                    <CardDescription>
                      {quartos.length} {quartos.length === 1 ? "registro" : "registros"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div>
                      <Label className="text-xs">Mês</Label>
                      <Input
                        type="number"
                        min="1"
                        max="12"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="w-20"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Ano</Label>
                      <Input
                        type="number"
                        min="2020"
                        max="2030"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="w-24"
                      />
                    </div>
                  </div>
                </div>
                {/* Filtros de Status */}
                <div className="flex gap-2">
                  <Button
                    variant={filtroStatus === 'todos' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFiltroStatus('todos')}
                  >
                    Todos
                  </Button>
                  <Button
                    variant={filtroStatus === 'pendentes' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFiltroStatus('pendentes')}
                  >
                    Pendentes
                  </Button>
                  <Button
                    variant={filtroStatus === 'nao-revisados' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFiltroStatus('nao-revisados')}
                  >
                    Não Revisados
                  </Button>
                  <Button
                    variant={filtroStatus === 'revisados' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFiltroStatus('revisados')}
                  >
                    Revisados
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {loadingQuartos ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : quartos.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum registro neste mês
                </p>
              ) : (
                <div className="space-y-4 flex-1 overflow-y-auto">
                  {Object.entries(quartosAgrupados).map(([data, quartosData]) => (
                    <div key={data} className="border-l-4 border-blue-500 pl-4">
                      <p className="font-bold text-lg text-gray-800 mb-3 border-b pb-2">{data}</p>
                      {quartosData.map((quarto) => (
                        <div
                          key={quarto.id}
                          className={`rounded-lg p-3 mb-2 flex items-start justify-between transition-colors ${
                            quarto.status === "pendente"
                              ? "bg-yellow-50 border-2 border-yellow-300"
                              : quarto.revisado 
                                ? "bg-green-50 border-2 border-green-200" 
                                : "bg-gray-50"
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {quarto.codigoQuarto}
                                <span className="text-muted-foreground text-sm ml-2">
                                  (4 min)
                                </span>
                              </p>
                            </div>
                            {quarto.observacao && (
                              <p className="text-sm text-muted-foreground mt-1">
                                <strong>Obs:</strong> {quarto.observacao}
                              </p>
                            )}
                            {quarto.revisado && quarto.observacoesRevisao && (
                              <p className="text-sm text-green-700 mt-1 bg-green-100 px-2 py-1 rounded">
                                <strong>✓ Revisão:</strong> {quarto.observacoesRevisao}
                              </p>
                            )}
                            {/* Sinalizadores de Arquivos */}
                            {(quarto.arquivoTaquigrafia || quarto.arquivoRedacaoFinal) && (
                              <div className="flex items-center gap-2 mt-2">
                                {quarto.arquivoTaquigrafia && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1">
                                    📝 Taquigrafia
                                  </span>
                                )}
                                {quarto.arquivoRedacaoFinal && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                                    ✅ Redação Final
                                  </span>
                                )}
                              </div>
                            )}
                            {/* Taxa de Precisão */}
                            {quarto.comparacaoRealizada && quarto.taxaPrecisao && (
                              <div className="mt-2 bg-purple-50 border border-purple-200 rounded px-3 py-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Taxa de Precisão</p>
                                    <p className="text-xl font-bold text-purple-600">
                                      {quarto.taxaPrecisao}%
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {quarto.totalAlteracoes} alterações
                                    </p>
                                  </div>
                                  <ComparacaoDocumentos quarto={quarto} mostrarApenasResultado />
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-4 mt-2 flex-wrap">
                              <p className="text-xs text-muted-foreground">
                                {new Date(quarto.dataRegistro).toLocaleTimeString("pt-BR")}
                              </p>
                              <label className="flex items-center gap-1 text-xs cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={quarto.revisado}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setQuartoRevisandoId(quarto.id);
                                      setObservacoesRevisao(quarto.observacoesRevisao || "");
                                    } else {
                                      updateRevisado.mutate({ 
                                        id: quarto.id, 
                                        revisado: false,
                                        observacoesRevisao: undefined 
                                      });
                                    }
                                  }}
                                  className="cursor-pointer"
                                />
                                <span className={quarto.revisado ? "text-green-600 font-medium" : "text-muted-foreground"}>
                                  REVISADO
                                  {quarto.revisado && quarto.revisor && (
                                    <span className="ml-1 text-xs font-normal">por {quarto.revisor}</span>
                                  )}
                                </span>
                              </label>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Dificuldade:</span>
                                <select
                                  value={quarto.dificuldade}
                                  onChange={(e) => updateDificuldade.mutate({ id: quarto.id, dificuldade: e.target.value as any })}
                                  className="text-xs border rounded px-2 py-1 cursor-pointer"
                                >
                                  <option value="NA">🔘 NA</option>
                                  <option value="Facil">🟢 Fácil</option>
                                  <option value="Medio">🟡 Médio</option>
                                  <option value="Dificil">🔴 Difícil</option>
                                </select>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {/* Botões de Reordenação */}
                            <div className="flex flex-col gap-0 mr-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  reordenarQuartos.mutate({
                                    quartoId: quarto.id,
                                    direcao: 'up',
                                    data: data
                                  });
                                }}
                                disabled={reordenarQuartos.isPending || quartosData.findIndex(q => q.id === quarto.id) === 0}
                                title="Mover para cima"
                                className="h-5 px-1 py-0"
                              >
                                <span className="text-xs">↑</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  reordenarQuartos.mutate({
                                    quartoId: quarto.id,
                                    direcao: 'down',
                                    data: data
                                  });
                                }}
                                disabled={reordenarQuartos.isPending || quartosData.findIndex(q => q.id === quarto.id) === quartosData.length - 1}
                                title="Mover para baixo"
                                className="h-5 px-1 py-0"
                              >
                                <span className="text-xs">↓</span>
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateStatus.mutate({ 
                                id: quarto.id, 
                                status: quarto.status === "pendente" ? "concluido" : "pendente" 
                              })}
                              disabled={updateStatus.isPending}
                              title={quarto.status === "pendente" ? "Marcar como concluído" : "Marcar como pendente"}
                            >
                              {quarto.status === "pendente" ? (
                                <span className="text-yellow-600">⏳</span>
                              ) : (
                                <span className="text-green-600">✅</span>
                              )}
                            </Button>
                            <ComparacaoDocumentos quarto={quarto} />
                            <EditarQuarto quarto={quarto} />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteQuarto.mutate({ id: quarto.id })}
                              disabled={deleteQuarto.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coluna Esquerda: Quartos Revisados + Taxa Média + Dificuldade */}
            <div className="space-y-6">
              {/* Card de Percentual Revisado */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Quartos Revisados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-green-600">
                      {percentualRevisados.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {quartos.filter(q => q.revisado).length} de {quartos.length} quartos
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Card de Taxa Média */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Taxa Média Correção Taquigrafia - Redação Final</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const quartosComComparacao = quartos.filter(q => q.comparacaoRealizada && q.taxaPrecisao);
                    if (quartosComComparacao.length === 0) {
                      return (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Faça comparações para ver sua evolução
                        </p>
                      );
                    }

                    const mediaPrecisao = quartosComComparacao.reduce((acc, q) => 
                      acc + parseFloat(q.taxaPrecisao || "0"), 0
                    ) / quartosComComparacao.length;

                    const melhorPrecisao = Math.max(...quartosComComparacao.map(q => 
                      parseFloat(q.taxaPrecisao || "0")
                    ));

                    return (
                      <>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Média</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {mediaPrecisao.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Melhor</p>
                            <p className="text-2xl font-bold text-green-600">
                              {melhorPrecisao.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>✓ {quartosComComparacao.length} comparações realizadas</p>
                          {mediaPrecisao >= 90 && (
                            <p className="text-green-600 font-medium mt-2">
                              🎉 Excelente precisão!
                            </p>
                          )}
                          {mediaPrecisao < 80 && (
                            <p className="text-yellow-600 font-medium mt-2">
                              💪 Continue praticando!
                            </p>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Card de Dificuldade */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Distribuição por Dificuldade</CardTitle>
              </CardHeader>
              <CardContent>
                {dadosDificuldade.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={dadosDificuldade}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {dadosDificuldade.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-1">
                      {dadosDificuldade.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                            <span>{item.name}</span>
                          </div>
                          <span className="font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum dado de dificuldade
                  </p>
                )}
              </CardContent>
            </Card>
            </div>

            {/* Coluna Direita: Estatística por Revisor */}
            <div>
              <EstatisticaRevisor quartos={quartos} todosQuartos={todosQuartos} mesAtual={selectedMonth} anoAtual={selectedYear} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 py-6 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-muted-foreground">
                <p>© 2025 Sistema de Registro de Taquigrafia. Todos os direitos reservados.</p>
                <p className="mt-1">Desenvolvido por <span className="font-semibold text-foreground">Fernando Mesquita</span></p>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Versão 2.1.0</p>
                <p className="mt-1 text-xs">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>
        </footer>

        {/* Dialog de Observações de Revisão */}
        <Dialog open={quartoRevisandoId !== null} onOpenChange={(open) => !open && setQuartoRevisandoId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Marcar como Revisado</DialogTitle>
              <DialogDescription>
                Adicione observações sobre a revisão deste quarto (opcional)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="relative">
                <Label htmlFor="revisor">Revisor *</Label>
                <Input
                  id="revisor"
                  placeholder="Nome do revisor"
                  value={revisor}
                  onChange={(e) => {
                    setRevisor(e.target.value);
                    setMostrarSugestoes(true);
                  }}
                  onFocus={() => setMostrarSugestoes(true)}
                  onBlur={() => setTimeout(() => setMostrarSugestoes(false), 200)}
                  required
                />
                {mostrarSugestoes && revisor && revisoresUnicos.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {revisoresUnicos
                      .filter(r => r.toLowerCase().includes(revisor.toLowerCase()))
                      .map((r) => (
                        <button
                          key={r}
                          type="button"
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          onClick={() => {
                            setRevisor(r);
                            setMostrarSugestoes(false);
                          }}
                        >
                          {r}
                        </button>
                      ))
                    }
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="observacoesRevisao">Observações da Revisão</Label>
                <Textarea
                  id="observacoesRevisao"
                  placeholder="Ex: Corrigido erros de pontuação, ajustado formatação..."
                  value={observacoesRevisao}
                  onChange={(e) => setObservacoesRevisao(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setQuartoRevisandoId(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (quartoRevisandoId && revisor.trim()) {
                    updateRevisado.mutate({
                      id: quartoRevisandoId,
                      revisado: true,
                      observacoesRevisao: observacoesRevisao || undefined,
                      revisor: revisor.trim(),
                    });
                    setQuartoRevisandoId(null);
                    setRevisor("");
                    setObservacoesRevisao("");
                  } else if (!revisor.trim()) {
                    toast.error("Por favor, informe o nome do revisor");
                  }
                }}
                disabled={updateRevisado.isPending || !revisor.trim()}
              >
                {updateRevisado.isPending ? "Salvando..." : "Confirmar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Comparação de Documentos (aberto pelo gráfico) */}
        {quartoComparacaoId && (
          <Dialog open={quartoComparacaoId !== null} onOpenChange={(open) => !open && setQuartoComparacaoId(null)}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <ComparacaoDocumentos 
                quarto={quartos.find(q => q.id === quartoComparacaoId)!} 
                mostrarApenasResultado={false}
              />
            </DialogContent>
          </Dialog>
        )}
    </LayoutComAbas>
  );
}

