import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical } from "lucide-react";
import { ComparacaoDocumentos } from "@/components/ComparacaoDocumentos";
import { EditarQuarto } from "@/components/EditarQuarto";

interface SortableQuartoItemProps {
  quarto: any;
  onDelete: () => void;
  onUpdateStatus: () => void;
  onUpdateRevisado: (checked: boolean) => void;
  onUpdateDificuldade: (dificuldade: string) => void;
  onSetQuartoRevisando: () => void;
  updateStatusPending: boolean;
  deleteQuartoPending: boolean;
}

export function SortableQuartoItem({
  quarto,
  onDelete,
  onUpdateStatus,
  onUpdateRevisado,
  onUpdateDificuldade,
  onSetQuartoRevisando,
  updateStatusPending,
  deleteQuartoPending,
}: SortableQuartoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: quarto.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg p-3 mb-2 flex items-start justify-between transition-colors ${
        quarto.status === "pendente"
          ? "bg-yellow-50 border-2 border-yellow-300"
          : quarto.revisado 
            ? "bg-green-50 border-2 border-green-200" 
            : "bg-gray-50"
      }`}
    >
      <div className="flex items-start gap-2 flex-1">
        {/* Handle para arrastar */}
        <button
          className="cursor-grab active:cursor-grabbing mt-1 text-gray-400 hover:text-gray-600"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">
              {quarto.codigoQuarto}
              <span className="text-muted-foreground text-sm ml-2">
                (4 min)
              </span>
            </p>
          </div>
          {quarto.observacao && (
            <p className="text-sm text-muted-foreground mt-1">
              <strong>Obs:</strong> {quarto.observacao}
            </p>
          )}
          {quarto.revisado && quarto.observacoesRevisao && (
            <p className="text-sm text-green-700 mt-1 bg-green-100 px-2 py-1 rounded">
              <strong>✓ Revisão:</strong> {quarto.observacoesRevisao}
            </p>
          )}
          {/* Sinalizadores de Arquivos */}
          {(quarto.arquivoTaquigrafia || quarto.arquivoRedacaoFinal) && (
            <div className="flex items-center gap-2 mt-2">
              {quarto.arquivoTaquigrafia && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1">
                  📝 Taquigrafia
                </span>
              )}
              {quarto.arquivoRedacaoFinal && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                  ✅ Redação Final
                </span>
              )}
            </div>
          )}
          {/* Taxa de Precisão */}
          {quarto.comparacaoRealizada && quarto.taxaPrecisao && (
            <div className="mt-2 bg-purple-50 border border-purple-200 rounded px-3 py-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Taxa de Precisão</p>
                  <p className="text-xl font-bold text-purple-600">
                    {quarto.taxaPrecisao}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {quarto.totalAlteracoes} alterações
                  </p>
                </div>
                <ComparacaoDocumentos quarto={quarto} mostrarApenasResultado />
              </div>
            </div>
          )}
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <p className="text-xs text-muted-foreground">
              {new Date(quarto.dataRegistro).toLocaleTimeString("pt-BR")}
            </p>
            <label className="flex items-center gap-1 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={quarto.revisado}
                onChange={(e) => {
                  if (e.target.checked) {
                    onSetQuartoRevisando();
                  } else {
                    onUpdateRevisado(false);
                  }
                }}
                className="cursor-pointer"
              />
              <span className={quarto.revisado ? "text-green-600 font-medium" : "text-muted-foreground"}>
                REVISADO
                {quarto.revisado && quarto.revisor && (
                  <span className="ml-1 text-xs font-normal">por {quarto.revisor}</span>
                )}
              </span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Dificuldade:</span>
              <select
                value={quarto.dificuldade}
                onChange={(e) => onUpdateDificuldade(e.target.value)}
                className="text-xs border rounded px-2 py-1 cursor-pointer"
              >
                <option value="NA">🔘 NA</option>
                <option value="Facil">🟢 Fácil</option>
                <option value="Medio">🟡 Médio</option>
                <option value="Dificil">🔴 Difícil</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onUpdateStatus}
          disabled={updateStatusPending}
          title={quarto.status === "pendente" ? "Marcar como concluído" : "Marcar como pendente"}
        >
          {quarto.status === "pendente" ? (
            <span className="text-yellow-600">⏳</span>
          ) : (
            <span className="text-green-600">✅</span>
          )}
        </Button>
        <ComparacaoDocumentos quarto={quarto} />
        <EditarQuarto quarto={quarto} />
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={deleteQuartoPending}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}

