import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface EstatisticaRevisorProps {
  quartos: any[];
}

export function EstatisticaRevisor({ quartos }: EstatisticaRevisorProps) {
  // Filtrar apenas quartos revisados com revisor e taxa de precisão
  const quartosRevisados = quartos.filter(
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
        <CardTitle className="flex items-center gap-2">
          📊 Estatística por Revisor
        </CardTitle>
        <CardDescription>
          Média de precisão por revisor
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Tabela de Revisores */}
        <div className="mb-6 space-y-3">
          {dadosRevisores.map((item: any, index) => (
            <div
              key={item.revisor}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
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
                <p className="text-2xl font-bold text-purple-600">
                  {item.mediaPrecisao}%
                </p>
                <p className="text-xs text-muted-foreground">Precisão média</p>
              </div>
            </div>
          ))}
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

