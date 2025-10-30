import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scatter, ScatterChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, ZAxis } from "recharts";
import { TrendingUp } from "lucide-react";

interface Quarto {
  id: string;
  codigoQuarto: string;
  dataRegistro: Date | string;
  taxaPrecisao?: string | null;
  revisor?: string | null;
}

interface GraficoPrecisaoProps {
  quartos: Quarto[];
  onQuartoClick?: (quartoId: string) => void;
}

// Paleta de cores para revisores (mesma do EstatisticaRevisor)
const coresRevisores = [
  "#9333ea", // purple-600
  "#2563eb", // blue-600
  "#16a34a", // green-600
  "#ea580c", // orange-600
  "#db2777", // pink-600
  "#4f46e5", // indigo-600
  "#0d9488", // teal-600
  "#dc2626", // red-600
];

export function GraficoPrecisao({ quartos, onQuartoClick }: GraficoPrecisaoProps) {
  // Filtrar apenas quartos com taxa de precisão e dataRegistro válida
  const quartosComPrecisao = quartos.filter(q => 
    q.taxaPrecisao !== null && 
    q.taxaPrecisao !== undefined &&
    q.taxaPrecisao !== '' &&
    q.dataRegistro !== null && 
    q.dataRegistro !== undefined &&
    q.revisor !== null &&
    q.revisor !== undefined
  );

  if (quartosComPrecisao.length === 0) {
    return null;
  }

  // Criar mapeamento de revisor → índice de cor
  const revisoresUnicos = Array.from(new Set(quartosComPrecisao.map(q => q.revisor!)));
  const revisorParaCor = revisoresUnicos.reduce((acc, revisor, index) => {
    acc[revisor] = coresRevisores[index % coresRevisores.length];
    return acc;
  }, {} as Record<string, string>);

  // Preparar dados do gráfico
  const dadosPrecisao = quartosComPrecisao
    .sort((a, b) => {
      const dateA = typeof a.dataRegistro === 'string' ? new Date(a.dataRegistro) : a.dataRegistro;
      const dateB = typeof b.dataRegistro === 'string' ? new Date(b.dataRegistro) : b.dataRegistro;
      return dateA.getTime() - dateB.getTime();
    })
    .map((q, index) => {
      const date = typeof q.dataRegistro === 'string' ? new Date(q.dataRegistro) : q.dataRegistro;
      const precisaoNum = typeof q.taxaPrecisao === 'string' ? parseFloat(q.taxaPrecisao) : q.taxaPrecisao;
      return {
        x: index, // índice sequencial para eixo X
        y: precisaoNum,
        data: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        dataCompleta: date.toLocaleDateString('pt-BR'),
        codigo: q.codigoQuarto,
        revisor: q.revisor || 'N/A',
        cor: revisorParaCor[q.revisor!],
        quartoId: q.id,
      };
    });

  // Calcular média de precisão
  const mediaPrecisao = dadosPrecisao.reduce((acc, d) => acc + (d.y || 0), 0) / dadosPrecisao.length;

  const handleDotClick = (data: any) => {
    if (data && data.quartoId && onQuartoClick) {
      onQuartoClick(data.quartoId);
    }
  };

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
              Taxa de precisão dos quartos ao longo do tempo (clique para ver detalhes)
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
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              type="number"
              dataKey="x"
              name="Sequência"
              tick={false}
              label={{ value: 'Tempo →', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              type="number"
              dataKey="y"
              name="Precisão"
              domain={[0, 100]}
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              label={{ value: '% Precisão', angle: -90, position: 'insideLeft' }}
            />
            <ZAxis range={[100, 100]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Data
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {data.dataCompleta}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Quarto
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {data.codigo}
                          </span>
                        </div>
                        <div className="flex flex-col col-span-2">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Revisor
                          </span>
                          <span className="font-bold" style={{ color: data.cor }}>
                            {data.revisor}
                          </span>
                        </div>
                        <div className="flex flex-col col-span-2">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Precisão
                          </span>
                          <span className="font-bold text-purple-600 text-lg">
                            {data.y.toFixed(1)}%
                          </span>
                        </div>
                        <div className="col-span-2 text-xs text-muted-foreground text-center pt-2 border-t">
                          Clique para ver comparação
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter 
              data={dadosPrecisao} 
              fill="#8884d8"
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill={payload.cor}
                    stroke="#fff"
                    strokeWidth={2}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleDotClick(payload)}
                    className="hover:r-8 transition-all"
                  />
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

