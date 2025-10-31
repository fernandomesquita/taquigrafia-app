import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface EstatisticaRevisorProps {
  quartos: any[];
  mesAtual: number;
  anoAtual: number;
}

export function EstatisticaRevisor({ quartos, mesAtual, anoAtual }: EstatisticaRevisorProps) {
  const [filtroMes, setFiltroMes] = useState<string>("mes-atual");
  // Paleta de cores para revisores
  const coresRevisores = [
    { bg: "bg-purple-100", text: "text-purple-700", badge: "text-purple-600" },
    { bg: "bg-blue-100", text: "text-blue-700", badge: "text-blue-600" },
    { bg: "bg-green-100", text: "text-green-700", badge: "text-green-600" },
    { bg: "bg-orange-100", text: "text-orange-700", badge: "text-orange-600" },
    { bg: "bg-pink-100", text: "text-pink-700", badge: "text-pink-600" },
    { bg: "bg-indigo-100", text: "text-indigo-700", badge: "text-indigo-600" },
    { bg: "bg-teal-100", text: "text-teal-700", badge: "text-teal-600" },
    { bg: "bg-red-100", text: "text-red-700", badge: "text-red-600" },
  ];

  // Filtrar quartos por período
  let quartosFiltrados = quartos;
  if (filtroMes === "mes-atual") {
    quartosFiltrados = quartos.filter((q) => {
      const dataQuarto = new Date(q.dataRegistro);
      return (
        dataQuarto.getMonth() + 1 === mesAtual &&
        dataQuarto.getFullYear() === anoAtual
      );
    });
  }
  // Se filtroMes === "global", usa todos os quartos

  // Filtrar apenas quartos revisados com revisor e taxa de precisão
  const quartosRevisados = quartosFiltrados.filter(
    (q) => q.revisado && q.revisor && q.taxaPrecisao
  );

  if (quartosRevisados.length === 0) {
    return null;
  }

  // Agrupar por revisor
  const estatisticasPorRevisor = quartosRevisados.reduce((acc, quarto) => {
    const revisor = quarto.revisor;
    if (!acc[revisor]) {
      acc[revisor] = {
        revisor,
        totalQuartos: 0,
        somaPrecisao: 0,
        mediaPrecisao: 0,
      };
    }
    
    acc[revisor].totalQuartos++;
    acc[revisor].somaPrecisao += parseFloat(quarto.taxaPrecisao);
    
    return acc;
  }, {} as Record<string, any>);

  // Calcular médias e ordenar
  const dadosRevisores = Object.values(estatisticasPorRevisor)
    .map((item: any) => ({
      ...item,
      mediaPrecisao: (item.somaPrecisao / item.totalQuartos).toFixed(1),
    }))
    .sort((a: any, b: any) => parseFloat(b.mediaPrecisao) - parseFloat(a.mediaPrecisao));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              📊 Estatística por Revisor
            </CardTitle>
            <CardDescription>
              Média de precisão por revisor
            </CardDescription>
          </div>
          <Select value={filtroMes} onValueChange={setFiltroMes}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes-atual">Mês Atual</SelectItem>
              <SelectItem value="global">Global</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Tabela de Revisores */}
        <div className="mb-6 space-y-3">
          {dadosRevisores.map((item: any, index) => {
            const cor = coresRevisores[index % coresRevisores.length];
            return (
              <div
                key={item.revisor}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${cor.bg} ${cor.text} font-bold text-sm`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{item.revisor}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.totalQuartos} quarto{item.totalQuartos > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${cor.badge}`}>
                    {item.mediaPrecisao}%
                  </p>
                  <p className="text-xs text-muted-foreground">Precisão média</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Gráfico de Barras */}
        {dadosRevisores.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Comparação Visual</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dadosRevisores}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="revisor" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  label={{ value: '% Precisão', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded shadow-lg">
                          <p className="font-semibold">{data.revisor}</p>
                          <p className="text-sm text-purple-600">
                            Precisão média: {data.mediaPrecisao}%
                          </p>
                          <p className="text-sm text-gray-600">
                            Quartos: {data.totalQuartos}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="mediaPrecisao" fill="#9333ea" name="Precisão Média (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

