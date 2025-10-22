import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft } from "lucide-react";
import { LayoutComAbas } from "@/components/LayoutComAbas";
import { useMemo } from "react";
import { useLocation } from "wouter";

export default function Consolidado() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  // Gerar lista dos últimos 12 meses
  const meses = useMemo(() => {
    const hoje = new Date();
    const resultado = [];
    for (let i = 0; i < 12; i++) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      resultado.push({
        year: data.getFullYear(),
        month: data.getMonth() + 1,
        label: data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
      });
    }
    return resultado;
  }, []);

  // Buscar dados de todos os meses
  const queries = meses.map((mes) => ({
    quartos: trpc.quartos.listByMonth.useQuery(
      { year: mes.year, month: mes.month },
      { enabled: isAuthenticated }
    ),
    metas: trpc.metas.listByMonth.useQuery(
      { year: mes.year, month: mes.month },
      { enabled: isAuthenticated }
    ),
  }));

  // Calcular estatísticas de cada mês
  const estatisticas = useMemo(() => {
    return meses.map((mes, index) => {
      const quartos = queries[index].quartos.data || [];
      const metas = queries[index].metas.data || [];

      const totalQuartos = quartos.length; // cada registro = 1 quarto
      const totalMinutos = totalQuartos * 4;

      // Calcular dias úteis do mês
      const diasNoMes = new Date(mes.year, mes.month, 0).getDate();
      let diasUteis = 0;
      for (let dia = 1; dia <= diasNoMes; dia++) {
        const data = new Date(mes.year, mes.month - 1, dia);
        const diaSemana = data.getDay();
        if (diaSemana >= 1 && diaSemana <= 5) {
          diasUteis++;
        }
      }

      // Calcular meta mensal
      let metaMensal = diasUteis * 5;
      metas.forEach((meta) => {
        const metaPadrao = 5;
        const metaAjustada = parseFloat(meta.metaQuartos);
        metaMensal = metaMensal - metaPadrao + metaAjustada;
      });

      const saldo = totalQuartos - metaMensal;
      const percentual = metaMensal > 0 ? (totalQuartos / metaMensal) * 100 : 0;

      return {
        mes: mes.label,
        totalQuartos,
        totalMinutos,
        metaMensal,
        saldo,
        percentual,
      };
    });
  }, [meses, queries]);

  const isLoading = queries.some((q) => q.quartos.isLoading || q.metas.isLoading);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Autenticação Necessária</CardTitle>
            <CardDescription>Faça login para acessar o sistema</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <LayoutComAbas>
        <div className="mb-6">
          <Button variant="outline" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Visão Consolidada - Últimos 12 Meses</CardTitle>
            <CardDescription>
              Acompanhe seu desempenho ao longo do último ano
            </CardDescription>
          </CardHeader>
        </Card>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {estatisticas.map((stat, index) => (
              <Card
                key={index}
                className={`${
                  stat.saldo >= 0
                    ? "border-l-4 border-l-green-500"
                    : "border-l-4 border-l-red-500"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg capitalize">{stat.mes}</CardTitle>
                    <div
                      className={`text-2xl font-bold ${
                        stat.saldo >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {stat.saldo >= 0 ? "+" : ""}
                      {stat.saldo.toFixed(1)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Quartos Realizados</p>
                      <p className="text-lg font-semibold">{stat.totalQuartos.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Minutos</p>
                      <p className="text-lg font-semibold">{stat.totalMinutos.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Meta</p>
                      <p className="text-lg font-semibold">{stat.metaMensal.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Percentual</p>
                      <p
                        className={`text-lg font-semibold ${
                          stat.percentual >= 100 ? "text-green-600" : "text-orange-600"
                        }`}
                      >
                        {stat.percentual.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  {/* Barra de progresso */}
                  <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${
                        stat.percentual >= 100 ? "bg-green-500" : "bg-orange-500"
                      }`}
                      style={{ width: `${Math.min(stat.percentual, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </LayoutComAbas>
  );
}

