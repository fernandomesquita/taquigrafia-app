import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface EditarQuartoProps {
  quarto: {
    id: string;
    codigoQuarto: string;
    observacao?: string | null;
    dificuldade: "NA" | "Facil" | "Medio" | "Dificil";
  };
}

export function EditarQuarto({ quarto }: EditarQuartoProps) {
  const [open, setOpen] = useState(false);
  const [codigo, setCodigo] = useState(quarto.codigoQuarto);
  const [observacao, setObservacao] = useState(quarto.observacao || "");
  const [dificuldade, setDificuldade] = useState(quarto.dificuldade);

  const utils = trpc.useUtils();
  const updateQuarto = trpc.quartos.update.useMutation({
    onSuccess: () => {
      utils.quartos.listByMonth.invalidate();
      toast.success("Quarto atualizado com sucesso!");
      setOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuarto.mutate({
      id: quarto.id,
      codigoQuarto: codigo,
      observacao: observacao || undefined,
      dificuldade,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Quarto</DialogTitle>
          <DialogDescription>
            Faça alterações no registro do quarto
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="codigo">Código do Quarto</Label>
            <Input
              id="codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ex: 79777-8"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Formato: SESSÃO-QUARTO
            </p>
          </div>
          <div>
            <Label htmlFor="observacao">Observação</Label>
            <Textarea
              id="observacao"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="dificuldade">Dificuldade</Label>
            <select
              id="dificuldade"
              value={dificuldade}
              onChange={(e) => setDificuldade(e.target.value as any)}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="NA">NA</option>
              <option value="Facil">Fácil</option>
              <option value="Medio">Médio</option>
              <option value="Dificil">Difícil</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateQuarto.isPending}>
              {updateQuarto.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

