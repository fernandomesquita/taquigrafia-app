import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarRange } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AjustarMetaLoteProps {
  mesAtual: number;
  anoAtual: number;
}

export function AjustarMetaLote({ mesAtual, anoAtual }: AjustarMetaLoteProps) {
  const [open, setOpen] = useState(false);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [metaQuartos, setMetaQuartos] = useState("0");

  const utils = trpc.useUtils();

  const ajustarMetaLote = trpc.metas.ajustarLote.useMutation({
    onSuccess: (result) => {
      toast.success(`Meta ajustada para ${result.count} dias!`);
      utils.metas.listByMonth.invalidate();
      setOpen(false);
      setDataInicio("");
      setDataFim("");
      setMetaQuartos("0");
    },
    onError: (error) => {
      toast.error(`Erro ao ajustar metas: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!dataInicio || !dataFim) {
      toast.error("Selecione as datas de início e fim");
      return;
    }

    const inicio = new Date(dataInicio + "T00:00:00");
    const fim = new Date(dataFim + "T00:00:00");

    if (inicio > fim) {
      toast.error("Data de início deve ser anterior à data de fim");
      return;
    }

    ajustarMetaLote.mutate({
      dataInicio,
      dataFim,
      metaQuartos,
    });
  };

  // Calcular primeiro e último dia do mês
  const primeiroDia = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-01`;
  const ultimoDia = new Date(anoAtual, mesAtual, 0).getDate();
  const ultimoDiaStr = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarRange className="h-4 w-4 mr-2" />
          Ajustar Meta em Lote
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustar Meta para Período</DialogTitle>
          <DialogDescription>
            Defina a meta de quartos para um intervalo de datas. Útil para licenças, férias ou períodos especiais.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data de Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                min={primeiroDia}
                max={ultimoDiaStr}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data de Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                min={dataInicio || primeiroDia}
                max={ultimoDiaStr}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaQuartos">Meta de Quartos por Dia</Label>
              <Input
                id="metaQuartos"
                type="number"
                step="0.5"
                min="0"
                value={metaQuartos}
                onChange={(e) => setMetaQuartos(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Meta padrão: 5 quartos/dia. Use 0 para licenças/férias.
              </p>
            </div>
            {dataInicio && dataFim && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-900">
                  Resumo do Ajuste
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  De {new Date(dataInicio + "T00:00:00").toLocaleDateString("pt-BR")} até{" "}
                  {new Date(dataFim + "T00:00:00").toLocaleDateString("pt-BR")}
                </p>
                <p className="text-sm text-blue-700">
                  Meta: <strong>{metaQuartos} quartos/dia</strong>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={ajustarMetaLote.isPending}>
              {ajustarMetaLote.isPending ? "Ajustando..." : "Confirmar Ajuste"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

