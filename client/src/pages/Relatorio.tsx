import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Download } from "lucide-react";
import { LayoutComAbas } from "@/components/LayoutComAbas";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Relatorio() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: quartos = [], isLoading: loadingQuartos } = trpc.quartos.listByMonth.useQuery({
    year: selectedYear,
    month: selectedMonth,
  });

  const { data: metas = [] } = trpc.metas.listByMonth.useQuery({
    year: selectedYear,
    month: selectedMonth,
  });

  const exportarPDF = trpc.relatorios.exportarPDF.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([Uint8Array.from(atob(data.pdf), c => c.charCodeAt(0))], {
        type: "application/pdf",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("PDF exportado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao exportar PDF: ${error.message}`);
    },
  });

  const { totalQuartos, totalMinutos, metaMensal, saldo, diasUteis, quartosAgrupados, estatisticasDificuldade } = useMemo(() => {
    const total = quartos.length;
    const minutos = total * 4;

    const diasNoMes = new Date(selectedYear, selectedMonth, 0).getDate();
    let diasUteis = 0;
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const data = new Date(selectedYear, selectedMonth - 1, dia);
      const diaSemana = data.getDay();
      if (diaSemana >= 1 && diaSemana <= 5) {
        diasUteis++;
      }
    }

    let metaMensal = diasUteis * 5;
    metas.forEach((meta) => {
      const metaPadrao = 5;
      const metaAjustada = parseFloat(meta.metaQuartos);
      metaMensal = metaMensal - metaPadrao + metaAjustada;
    });

    const saldo = total - metaMensal;

    const agrupados = quartos.reduce((acc, quarto) => {
      const data = new Date(quarto.dataRegistro).toLocaleDateString("pt-BR");
      if (!acc[data]) {
        acc[data] = [];
      }
      acc[data].push(quarto);
      return acc;
    }, {} as Record<string, typeof quartos>);

    // Estatísticas de dificuldade
    const dificuldades = {
      NA: 0,
      Facil: 0,
      Medio: 0,
      Dificil: 0,
    };
    quartos.forEach((quarto) => {
      dificuldades[quarto.dificuldade]++;
    });

    return {
      totalQuartos: total,
      totalMinutos: minutos,
      metaMensal,
      saldo,
      diasUteis,
      quartosAgrupados: agrupados,
      estatisticasDificuldade: dificuldades,
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
            <CardDescription>Você precisa estar autenticado para acessar esta página.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <LayoutComAbas>
        <div className="mb-6 flex gap-4 items-center">
          <Button variant="outline" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button
            onClick={() => exportarPDF.mutate({ year: selectedYear, month: selectedMonth })}
            disabled={exportarPDF.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            {exportarPDF.isPending ? "Gerando PDF..." : "Exportar PDF"}
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Relatório Mensal</CardTitle>
            <CardDescription>Visualize o trabalho realizado no mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end mb-6">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Estatísticas de Dificuldade</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>🔘 NA</CardDescription>
                    <CardTitle className="text-2xl">{estatisticasDificuldade.NA}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>🟢 Fácil</CardDescription>
                    <CardTitle className="text-2xl text-green-600">{estatisticasDificuldade.Facil}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>🟡 Médio</CardDescription>
                    <CardTitle className="text-2xl text-yellow-600">{estatisticasDificuldade.Medio}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>🔴 Difícil</CardDescription>
                    <CardTitle className="text-2xl text-red-600">{estatisticasDificuldade.Dificil}</CardTitle>
                  </CardHeader>
                </Card>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Registros Detalhados</h3>
              {loadingQuartos ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : quartos.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum registro neste mês
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(quartosAgrupados).map(([data, quartosData]) => (
                    <div key={data} className="border-l-4 border-blue-500 pl-4">
                      <p className="font-semibold text-sm text-gray-700 mb-2">{data}</p>
                      {quartosData.map((quarto) => (
                        <div
                          key={quarto.id}
                          className="bg-gray-50 rounded-lg p-3 mb-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">
                                {quarto.codigoQuarto}
                                <span className="text-muted-foreground text-sm ml-2">(4 min)</span>
                                {quarto.revisado && (
                                  <span className="text-green-600 text-xs ml-2 font-semibold">✓ REVISADO</span>
                                )}
                              </p>
                              {quarto.observacao && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {quarto.observacao}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-1">
                                <p className="text-xs text-muted-foreground">
                                  {new Date(quarto.dataRegistro).toLocaleTimeString("pt-BR")}
                                </p>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  quarto.dificuldade === "NA" ? "bg-gray-200" :
                                  quarto.dificuldade === "Facil" ? "bg-green-200 text-green-800" :
                                  quarto.dificuldade === "Medio" ? "bg-yellow-200 text-yellow-800" :
                                  "bg-red-200 text-red-800"
                                }`}>
                                  {quarto.dificuldade === "Facil" ? "🟢 Fácil" : 
                                   quarto.dificuldade === "Medio" ? "🟡 Médio" :
                                   quarto.dificuldade === "Dificil" ? "🔴 Difícil" : "🔘 NA"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
    </LayoutComAbas>
  );
}

