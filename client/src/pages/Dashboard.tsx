import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { BarChart3, CalendarIcon, Download, Eye, LogOut, Plus, Trash2, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AjustarMeta } from "@/components/AjustarMeta";
import { EditarQuarto } from "@/components/EditarQuarto";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const utils = trpc.useUtils();

  // Queries
  const { data: quartos = [], isLoading: loadingQuartos } = trpc.quartos.listByMonth.useQuery(
    { year: selectedYear, month: selectedMonth },
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
    onSuccess: () => {
      utils.quartos.listByMonth.invalidate();
      toast.success("Quarto excluído com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao excluir quarto: ${error.message}`);
    },
  });

  const updateRevisado = trpc.quartos.updateRevisado.useMutation({
    onSuccess: () => {
      utils.quartos.listByMonth.invalidate();
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
  const { totalQuartos, totalMinutos, metaMensal, saldo, diasUteis, diasUteisRestantes, mediaNecessaria, quartosAgrupados, trabalhoHoje, dadosGrafico } = useMemo(() => {
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

    // Agrupar quartos por data
    const agrupados = quartos.reduce((acc, quarto) => {
      const data = new Date(quarto.dataRegistro).toLocaleDateString("pt-BR");
      if (!acc[data]) {
        acc[data] = [];
      }
      acc[data].push(quarto);
      return acc;
    }, {} as Record<string, typeof quartos>);

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
    };
  }, [quartos, metas, selectedMonth, selectedYear]);

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
            <Button onClick={() => (window.location.href = getLoginUrl())} className="w-full">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {APP_LOGO && <img src={APP_LOGO} alt="Logo" className="h-8" />}
            <h1 className="text-2xl font-bold text-gray-900">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name || user?.email}</span>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Botões de Ação */}
        <div className="mb-6 flex gap-4 flex-wrap">
          <Button onClick={() => setLocation("/consolidado")}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Visão Consolidada (12 meses)
          </Button>
          <Button variant="outline" onClick={() => setLocation("/relatorio")}>
            <Eye className="h-4 w-4 mr-2" />
            Visualizar Relatório do Mês
          </Button>
          <Button
            variant="outline"
            onClick={() => exportarPDF.mutate({ year: selectedYear, month: selectedMonth })}
            disabled={exportarPDF.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            {exportarPDF.isPending ? "Gerando PDF..." : "Exportar PDF do Mês"}
          </Button>
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
              <div>
                <AjustarMeta
                  dataInicial={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trabalho de Hoje */}
        {trabalhoHoje.isDiaUtil && (
          <Card className="mb-6 border-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Trabalho de Hoje
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário de Registro */}
          <Card>
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

          {/* Lista de Registros */}
          <Card>
            <CardHeader>
              <CardTitle>Registros do Mês</CardTitle>
              <CardDescription>
                {quartos.length} {quartos.length === 1 ? "registro" : "registros"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingQuartos ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : quartos.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum registro neste mês
                </p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {Object.entries(quartosAgrupados).map(([data, quartosData]) => (
                    <div key={data} className="border-l-4 border-blue-500 pl-4">
                      <p className="font-bold text-lg text-gray-800 mb-3 border-b pb-2">{data}</p>
                      {quartosData.map((quarto) => (
                        <div
                          key={quarto.id}
                          className="bg-gray-50 rounded-lg p-3 mb-2 flex items-start justify-between"
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
                                {quarto.observacao}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 flex-wrap">
                              <p className="text-xs text-muted-foreground">
                                {new Date(quarto.dataRegistro).toLocaleTimeString("pt-BR")}
                              </p>
                              <label className="flex items-center gap-1 text-xs cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={quarto.revisado}
                                  onChange={(e) => updateRevisado.mutate({ id: quarto.id, revisado: e.target.checked })}
                                  className="cursor-pointer"
                                />
                                <span className={quarto.revisado ? "text-green-600 font-medium" : "text-muted-foreground"}>
                                  REVISADO
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
        </div>
      </main>
    </div>
  );
}

