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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AjustarMetaProps {
  dataInicial?: string; // YYYY-MM-DD (opcional, se não fornecido usa data atual)
  metaAtual?: string;
  motivoAtual?: string;
}

export function AjustarMeta({ dataInicial, metaAtual, motivoAtual }: AjustarMetaProps) {
  const [open, setOpen] = useState(false);
  const hoje = new Date().toISOString().split('T')[0];
  const [data, setData] = useState(dataInicial || hoje);
  const [metaQuartos, setMetaQuartos] = useState(metaAtual || "5");
  const [motivo, setMotivo] = useState(motivoAtual || "");
  
  const utils = trpc.useUtils();

  const upsertMeta = trpc.metas.upsert.useMutation({
    onSuccess: () => {
      utils.metas.listByMonth.invalidate();
      utils.quartos.listByMonth.invalidate();
      setOpen(false);
      toast.success("Meta ajustada com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao ajustar meta: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) {
      toast.error("Informe uma data válida");
      return;
    }
    if (!metaQuartos || parseFloat(metaQuartos) < 0) {
      toast.error("Informe uma meta válida");
      return;
    }
    // Garantir formato YYYY-MM-DD
    let dataFormatada = data;
    // Se a data está no formato DD/MM/YYYY ou MM/DD/YYYY, converter
    if (data.includes('/')) {
      const partes = data.split('/');
      if (partes.length === 3) {
        // Assumir DD/MM/YYYY ou MM/DD/YYYY dependendo do locale
        const d = new Date(data);
        if (!isNaN(d.getTime())) {
          dataFormatada = d.toISOString().split('T')[0];
        }
      }
    }
    console.log('Enviando meta:', { data: dataFormatada, metaQuartos, motivo });
    upsertMeta.mutate({ data: dataFormatada, metaQuartos, motivo });
  };

  const dataFormatada = new Date(data + "T00:00:00").toLocaleDateString("pt-BR");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Ajustar Meta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustar Meta do Dia</DialogTitle>
          <DialogDescription>
            Ajuste a meta de quartos para {dataFormatada}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="metaQuartos">Meta de Quartos</Label>
              <Input
                id="metaQuartos"
                type="number"
                step="0.5"
                min="0"
                placeholder="Ex: 5"
                value={metaQuartos}
                onChange={(e) => setMetaQuartos(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Meta padrão: 5 quartos (20 minutos)
              </p>
            </div>
            <div>
              <Label htmlFor="motivo">Motivo do Ajuste</Label>
              <Textarea
                id="motivo"
                placeholder="Ex: Licença médica, feriado, falha de sistema..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={upsertMeta.isPending}>
              {upsertMeta.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

