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
  data: string; // YYYY-MM-DD
  metaAtual?: string;
  motivoAtual?: string;
}

export function AjustarMeta({ data, metaAtual, motivoAtual }: AjustarMetaProps) {
  const [open, setOpen] = useState(false);
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
    if (!metaQuartos || parseFloat(metaQuartos) < 0) {
      toast.error("Informe uma meta válida");
      return;
    }
    upsertMeta.mutate({ data, metaQuartos, motivo });
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

