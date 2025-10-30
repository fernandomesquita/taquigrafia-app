import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";

interface Quarto {
  id: string;
  codigo: string;
  dataHora: Date | string;
  taxaPrecisao?: number | null;
  revisor?: string | null;
}

interface GraficoPrecisaoProps {
  quartos: Quarto[];
}

export function GraficoPrecisao({ quartos }: GraficoPrecisaoProps) {
  // Filtrar apenas quartos com taxa de precisão e dataHora válida
  const dadosPrecisao = quartos
    .filter(q => 
      q.taxaPrecisao !== null && 
      q.taxaPrecisao !== undefined && 
      q.dataHora !== null && 
      q.dataHora !== undefined
    )
    .sort((a, b) => {
      const dateA = typeof a.dataHora === 'string' ? new Date(a.dataHora) : a.dataHora;
      const dateB = typeof b.dataHora === 'string' ? new Date(b.dataHora) : b.dataHora;
      return dateA.getTime() - dateB.getTime();
    })
    .map(q => {
      const date = typeof q.dataHora === 'string' ? new Date(q.dataHora) : q.dataHora;
      return {
        data: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        dataCompleta: date.toLocaleDateString('pt-BR'),
        precisao: q.taxaPrecisao,
        codigo: q.codigo,
        revisor: q.revisor || 'N/A'
      };
    });

  if (dadosPrecisao.length === 0) {
    return null;
  }

  // Calcular média de precisão
  const mediaPrecisao = dadosPrecisao.reduce((acc, d) => acc + (d.precisao || 0), 0) / dadosPrecisao.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Evolução da Precisão
            </CardTitle>
            <CardDescription>
              Taxa de precisão dos quartos ao longo do tempo
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-purple-600">{mediaPrecisao.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">Média geral</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dadosPrecisao}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="data" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              domain={[0, 100]}
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              label={{ value: '% Precisão', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Data
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {payload[0].payload.dataCompleta}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Quarto
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {payload[0].payload.codigo}
                          </span>
                        </div>
                        <div className="flex flex-col col-span-2">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Revisor
                          </span>
                          <span className="font-bold text-blue-600">
                            {payload[0].payload.revisor}
                          </span>
                        </div>
                        <div className="flex flex-col col-span-2">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Precisão
                          </span>
                          <span className="font-bold text-purple-600 text-lg">
                            {payload[0].value}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line 
              type="monotone" 
              dataKey="precisao" 
              stroke="hsl(var(--chart-5))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--chart-5))', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

