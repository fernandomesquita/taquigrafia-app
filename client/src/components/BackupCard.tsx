import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, AlertCircle, CheckCircle2, Info, FileDown, Database } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export function BackupCard() {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportInstructions, setShowExportInstructions] = useState(false);
  const [importMode, setImportMode] = useState<"replace" | "merge">("merge");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backupPreview, setBackupPreview] = useState<any>(null);

  const utils = trpc.useUtils();

  const { data: backupData, refetch: refetchBackup } = trpc.backup.exportarCompleto.useQuery(undefined, {
    enabled: false,
  });

  const importBackup = trpc.backup.importarCompleto.useMutation({
    onSuccess: (result) => {
      toast.success(`Backup importado! ${result.imported.quartos} quartos, ${result.imported.metas} metas.`);
      if (result.skipped.quartos > 0) {
        toast.info(`${result.skipped.quartos} quartos já existentes foram ignorados.`);
      }
      utils.quartos.listByMonth.invalidate();
      utils.metas.listByMonth.invalidate();
      setShowImportDialog(false);
      setSelectedFile(null);
      setBackupPreview(null);
    },
    onError: (error) => {
      toast.error(`Erro ao importar backup: ${error.message}`);
    },
  });

  // Verificar último backup no localStorage
  const lastBackupDate = localStorage.getItem("lastBackupDate");
  const daysSinceBackup = lastBackupDate
    ? Math.floor((Date.now() - new Date(lastBackupDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const handleExportBackup = async () => {
    setShowExportInstructions(true);
    const result = await refetchBackup();
    
    if (result.data) {
      // Salvar data do último backup
      localStorage.setItem("lastBackupDate", new Date().toISOString());
      
      // Baixar JSON
      const json = JSON.stringify(result.data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const date = new Date().toISOString().split("T")[0];
      link.download = `backup-taquigrafia-${date}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success("Backup exportado com sucesso!");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      
      // Validar estrutura básica
      if (!backup.version || !backup.data) {
        throw new Error("Formato de backup inválido");
      }

      setBackupPreview(backup);
    } catch (error: any) {
      toast.error(`Erro ao ler arquivo: ${error.message}`);
      setSelectedFile(null);
    }
  };

  const handleImport = () => {
    if (!backupPreview) return;

    importBackup.mutate({
      backup: backupPreview,
      mode: importMode,
    });
  };

  const getBackupStatusColor = () => {
    if (!daysSinceBackup) return "text-red-600";
    if (daysSinceBackup <= 7) return "text-green-600";
    if (daysSinceBackup <= 14) return "text-yellow-600";
    return "text-red-600";
  };

  const getBackupStatusText = () => {
    if (!daysSinceBackup) return "Nenhum backup realizado";
    if (daysSinceBackup === 0) return "Backup realizado hoje";
    if (daysSinceBackup === 1) return "Backup realizado ontem";
    return `Último backup há ${daysSinceBackup} dias`;
  };

  const shouldShowReminder = !daysSinceBackup || daysSinceBackup >= 7;

  return (
    <>
      <Card className="col-span-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Backup e Segurança
              </CardTitle>
              <CardDescription>
                Proteja seus dados com backups regulares
              </CardDescription>
            </div>
            <div className={`text-sm font-medium ${getBackupStatusColor()}`}>
              {getBackupStatusText()}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {shouldShowReminder && (
            <Alert variant={daysSinceBackup && daysSinceBackup >= 14 ? "destructive" : "default"}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Lembrete de Backup</AlertTitle>
              <AlertDescription>
                {!daysSinceBackup
                  ? "Você ainda não fez nenhum backup. Faça seu primeiro backup agora para proteger seus dados!"
                  : `Faz ${daysSinceBackup} dias desde o último backup. Recomendamos fazer backup semanalmente.`}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <FileDown className="h-4 w-4" />
                Exportar Backup
              </h4>
              <p className="text-sm text-muted-foreground">
                Baixe um arquivo JSON com todos os seus dados para backup e recuperação.
              </p>
              <Button onClick={handleExportBackup} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Baixar Backup Completo
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Importar Backup
              </h4>
              <p className="text-sm text-muted-foreground">
                Restaure seus dados a partir de um arquivo de backup anterior.
              </p>
              <Button
                onClick={() => setShowImportDialog(true)}
                variant="outline"
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Restaurar Backup
              </Button>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Boas Práticas de Backup</AlertTitle>
            <AlertDescription className="space-y-1">
              <p>✅ Faça backup semanalmente</p>
              <p>✅ Guarde o arquivo em local seguro (Google Drive, email, pendrive)</p>
              <p>✅ Mantenha múltiplas cópias em locais diferentes</p>
              <p>✅ Teste a recuperação periodicamente</p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Dialog de Instruções de Exportação */}
      <Dialog open={showExportInstructions} onOpenChange={setShowExportInstructions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Backup Exportado com Sucesso!
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-4">
              <p>O arquivo de backup foi baixado. Agora siga estas instruções:</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-bold">1.</span>
                  <span>Localize o arquivo <code className="bg-muted px-1 rounded">backup-taquigrafia-*.json</code> na pasta de Downloads</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold">2.</span>
                  <span>Guarde o arquivo em um local seguro:</span>
                </div>
                <ul className="ml-6 space-y-1 text-muted-foreground">
                  <li>• Envie para seu email</li>
                  <li>• Salve no Google Drive</li>
                  <li>• Copie para um pendrive</li>
                  <li>• Mantenha em múltiplos locais</li>
                </ul>
                <div className="flex items-start gap-2">
                  <span className="font-bold">3.</span>
                  <span className="font-semibold text-destructive">IMPORTANTE: Este arquivo contém TODOS os seus dados e é essencial para recuperação!</span>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Configure um lembrete no seu calendário para fazer backup semanalmente (ex: todo domingo às 20h).
                </AlertDescription>
              </Alert>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowExportInstructions(false)}>
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Importação */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar Backup</DialogTitle>
            <DialogDescription>
              Restaure seus dados a partir de um arquivo de backup
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="backup-file">Selecione o arquivo de backup (JSON)</Label>
              <Input
                id="backup-file"
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="mt-2"
              />
            </div>

            {backupPreview && (
              <>
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Arquivo Válido</AlertTitle>
                  <AlertDescription>
                    <div className="space-y-1 mt-2">
                      <p><strong>Data do backup:</strong> {new Date(backupPreview.backup_date).toLocaleString('pt-BR')}</p>
                      <p><strong>Usuário:</strong> {backupPreview.user.name}</p>
                      <p><strong>Total de quartos:</strong> {backupPreview.stats.total_quartos}</p>
                      <p><strong>Quartos revisados:</strong> {backupPreview.stats.total_revisados}</p>
                      <p><strong>Metas configuradas:</strong> {backupPreview.stats.total_metas}</p>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Modo de Importação</Label>
                  <RadioGroup value={importMode} onValueChange={(value: any) => setImportMode(value)}>
                    <div className="flex items-start space-x-2 rounded-md border p-4">
                      <RadioGroupItem value="merge" id="merge" />
                      <div className="flex-1">
                        <Label htmlFor="merge" className="font-medium cursor-pointer">
                          Mesclar (Recomendado)
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Adiciona apenas dados novos, mantém dados existentes. Quartos duplicados serão ignorados.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2 rounded-md border p-4 border-destructive">
                      <RadioGroupItem value="replace" id="replace" />
                      <div className="flex-1">
                        <Label htmlFor="replace" className="font-medium cursor-pointer text-destructive">
                          Substituir Tudo (Cuidado!)
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Remove TODOS os dados atuais e substitui pelos dados do backup. Use apenas se tiver certeza!
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {importMode === "replace" && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Atenção!</AlertTitle>
                    <AlertDescription>
                      Modo "Substituir Tudo" irá APAGAR todos os seus dados atuais. Esta ação não pode ser desfeita!
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImportDialog(false);
                setSelectedFile(null);
                setBackupPreview(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={!backupPreview || importBackup.isPending}
            >
              {importBackup.isPending ? "Importando..." : "Importar Backup"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
