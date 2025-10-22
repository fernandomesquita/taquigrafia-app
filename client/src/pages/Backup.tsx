import { Button } from "@/components/ui/button";
import { LayoutComAbas } from "@/components/LayoutComAbas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, AlertCircle, CheckCircle2, Info, FileDown, Database, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
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

export default function Backup() {
  
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportInstructions, setShowExportInstructions] = useState(false);
  const [importMode, setImportMode] = useState<"replace" | "merge">("merge");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backupPreview, setBackupPreview] = useState<any>(null);
  
  // Histórico de backups do localStorage
  const [lastDownloadDate, setLastDownloadDate] = useState<string | null>(
    localStorage.getItem("lastBackupDownload")
  );
  const [lastRestoreDate, setLastRestoreDate] = useState<string | null>(
    localStorage.getItem("lastBackupRestore")
  );

  const utils = trpc.useUtils();

  const { data: backupData, refetch: refetchBackup } = trpc.backup.exportarCompleto.useQuery(undefined, {
    enabled: false,
  });

  const importBackup = trpc.backup.importarCompleto.useMutation({
    onSuccess: (result) => {
      toast.success(`Backup restaurado! ${result.imported.quartos} quartos, ${result.imported.metas} metas.`);
      if (result.skipped.quartos > 0) {
        toast.info(`${result.skipped.quartos} quartos já existentes foram ignorados.`);
      }
      
      // Salvar data da restauração
      const now = new Date().toISOString();
      localStorage.setItem("lastBackupRestore", now);
      setLastRestoreDate(now);
      
      utils.quartos.listByMonth.invalidate();
      utils.metas.listByMonth.invalidate();
      setShowImportDialog(false);
      setSelectedFile(null);
      setBackupPreview(null);
    },
    onError: (error) => {
      toast.error(`Erro ao restaurar backup: ${error.message}`);
    },
  });

  // Calcular dias desde último download
  const daysSinceDownload = lastDownloadDate
    ? Math.floor((Date.now() - new Date(lastDownloadDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  // Calcular dias desde última restauração
  const daysSinceRestore = lastRestoreDate
    ? Math.floor((Date.now() - new Date(lastRestoreDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Determinar cor do alerta baseado nos dias
  const getAlertColor = (days: number | null) => {
    if (days === null) return "gray";
    if (days <= 7) return "green";
    if (days <= 14) return "yellow";
    if (days <= 30) return "orange";
    return "red";
  };

  const alertColor = getAlertColor(daysSinceDownload);

  const handleExportBackup = async () => {
    setShowExportInstructions(true);
    const result = await refetchBackup();
    
    if (result.data) {
      // Salvar data do último download
      const now = new Date().toISOString();
      localStorage.setItem("lastBackupDownload", now);
      setLastDownloadDate(now);
      
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
      
      toast.success("Backup baixado com sucesso!");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      setBackupPreview(backup);
    } catch (error) {
      toast.error("Arquivo inválido. Selecione um backup válido.");
      setSelectedFile(null);
    }
  };

  const handleImport = async () => {
    if (!backupPreview) return;

    await importBackup.mutateAsync({
      backup: backupPreview,
      mode: importMode,
    });
  };

  return (
    <LayoutComAbas>
      <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Backup e Segurança</h1>
        <p className="text-muted-foreground">
          Gerencie backups dos seus dados de taquigrafia
        </p>
      </div>

      {/* Alerta de status do backup */}
      <Alert 
        className={`mb-6 ${
          alertColor === "green" ? "border-green-500 bg-green-50" :
          alertColor === "yellow" ? "border-yellow-500 bg-yellow-50" :
          alertColor === "orange" ? "border-orange-500 bg-orange-50" :
          alertColor === "red" ? "border-red-500 bg-red-50" :
          "border-gray-300 bg-gray-50"
        }`}
      >
        <Clock className="h-4 w-4" />
        <AlertTitle>Status do Backup</AlertTitle>
        <AlertDescription>
          {daysSinceDownload === null ? (
            "Nenhum backup foi baixado ainda. Recomendamos fazer backups regulares."
          ) : daysSinceDownload === 0 ? (
            "✅ Backup baixado hoje! Seus dados estão seguros."
          ) : daysSinceDownload <= 7 ? (
            `✅ Último backup há ${daysSinceDownload} ${daysSinceDownload === 1 ? "dia" : "dias"}. Tudo certo!`
          ) : daysSinceDownload <= 14 ? (
            `⚠️ Último backup há ${daysSinceDownload} dias. Considere fazer um novo backup em breve.`
          ) : daysSinceDownload <= 30 ? (
            `⚠️ Último backup há ${daysSinceDownload} dias. Recomendamos fazer um backup novo.`
          ) : (
            `🚨 Último backup há ${daysSinceDownload} dias! Faça um backup urgentemente para proteger seus dados.`
          )}
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Card de Download */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-600" />
              <CardTitle>Baixar Backup</CardTitle>
            </div>
            <CardDescription>
              Exporte todos os seus dados em formato JSON
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                O backup inclui:
              </p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Todos os quartos registrados</li>
                <li>• Metas diárias personalizadas</li>
                <li>• Dados de comparação e precisão</li>
                <li>• Observações e anotações</li>
              </ul>
            </div>
            
            {lastDownloadDate && (
              <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                <p className="font-medium">Último download:</p>
                <p>{new Date(lastDownloadDate).toLocaleString("pt-BR")}</p>
                <p className="text-xs mt-1">
                  ({daysSinceDownload === 0 ? "hoje" : `há ${daysSinceDownload} ${daysSinceDownload === 1 ? "dia" : "dias"}`})
                </p>
              </div>
            )}
            
            <Button onClick={handleExportBackup} className="w-full gap-2">
              <FileDown className="h-4 w-4" />
              Baixar Backup Agora
            </Button>
          </CardContent>
        </Card>

        {/* Card de Restauração */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-green-600" />
              <CardTitle>Restaurar Backup</CardTitle>
            </div>
            <CardDescription>
              Importe dados de um backup anterior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Você pode escolher entre substituir todos os dados ou mesclar com os dados existentes.
              </AlertDescription>
            </Alert>
            
            {lastRestoreDate && (
              <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                <p className="font-medium">Última restauração:</p>
                <p>{new Date(lastRestoreDate).toLocaleString("pt-BR")}</p>
                <p className="text-xs mt-1">
                  ({daysSinceRestore === 0 ? "hoje" : `há ${daysSinceRestore} ${daysSinceRestore === 1 ? "dia" : "dias"}`})
                </p>
              </div>
            )}
            
            <Button 
              onClick={() => setShowImportDialog(true)} 
              variant="outline" 
              className="w-full gap-2"
            >
              <Database className="h-4 w-4" />
              Restaurar de Arquivo
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Informações adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Recomendações de Segurança</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <p>Faça backups semanalmente para garantir a segurança dos seus dados</p>
            </div>
            <div className="flex gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <p>Armazene os arquivos de backup em local seguro (nuvem, HD externo, etc)</p>
            </div>
            <div className="flex gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <p>Mantenha múltiplas cópias de backup em locais diferentes</p>
            </div>
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
              <p>Teste periodicamente a restauração de backups para garantir que funcionam</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Importação */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Restaurar Backup</DialogTitle>
            <DialogDescription>
              Selecione um arquivo de backup e escolha o modo de importação
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="backup-file">Arquivo de Backup</Label>
              <input
                id="backup-file"
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="mt-2 w-full text-sm"
              />
            </div>

            {backupPreview && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="font-medium">Informações do Backup:</p>
                <div className="text-sm space-y-1">
                  <p>📅 Data: {new Date(backupPreview.backup_date).toLocaleString("pt-BR")}</p>
                  <p>👤 Usuário: {backupPreview.user.name}</p>
                  <p>📊 Quartos: {backupPreview.stats.total_quartos}</p>
                  <p>🎯 Metas: {backupPreview.stats.total_metas}</p>
                </div>
              </div>
            )}

            <div>
              <Label>Modo de Importação</Label>
              <RadioGroup value={importMode} onValueChange={(v: any) => setImportMode(v)} className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="merge" id="merge" />
                  <Label htmlFor="merge" className="font-normal cursor-pointer">
                    Mesclar - Adicionar aos dados existentes (recomendado)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="replace" id="replace" />
                  <Label htmlFor="replace" className="font-normal cursor-pointer">
                    Substituir - Apagar todos os dados atuais
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {importMode === "replace" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Atenção!</AlertTitle>
                <AlertDescription>
                  Todos os seus dados atuais serão permanentemente apagados e substituídos pelo backup.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!backupPreview || importBackup.isPending}
            >
              {importBackup.isPending ? "Restaurando..." : "Restaurar Backup"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Instruções de Export */}
      <Dialog open={showExportInstructions} onOpenChange={setShowExportInstructions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Backup Baixado com Sucesso!</DialogTitle>
            <DialogDescription>
              Seu backup foi salvo. Siga estas recomendações:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm">Guarde o arquivo em local seguro (Google Drive, Dropbox, etc)</p>
            </div>
            <div className="flex gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm">Mantenha múltiplas cópias em diferentes locais</p>
            </div>
            <div className="flex gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm">Faça backups regulares (recomendamos semanalmente)</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowExportInstructions(false)}>
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </LayoutComAbas>
  );
}

