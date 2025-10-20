import { jsPDF } from "jspdf";
import type { Quarto } from "../drizzle/schema";

interface PDFData {
  userName: string;
  mes: string;
  ano: number;
  quartos: Quarto[];
  totalQuartos: number;
  totalMinutos: number;
  metaMensal: number;
  saldo: number;
}

export function generatePDF(data: PDFData): Buffer {
  const doc = new jsPDF();
  
  // Configurações
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Título
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Taquigrafia", pageWidth / 2, yPos, { align: "center" });
  yPos += 15;

  // Informações do usuário e período
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Taquígrafo: ${data.userName}`, margin, yPos);
  yPos += 7;
  doc.text(`Período: ${data.mes}/${data.ano}`, margin, yPos);
  yPos += 7;
  doc.text(`Data de emissão: ${new Date().toLocaleDateString("pt-BR")}`, margin, yPos);
  yPos += 15;

  // Resumo
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo do Mês", margin, yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Total de Quartos: ${data.totalQuartos.toFixed(1)}`, margin, yPos);
  yPos += 7;
  doc.text(`Total de Minutos: ${data.totalMinutos.toFixed(0)}`, margin, yPos);
  yPos += 7;
  doc.text(`Meta do Mês: ${data.metaMensal.toFixed(1)} quartos`, margin, yPos);
  yPos += 7;
  
  // Saldo com cor
  const saldoText = `Saldo: ${data.saldo >= 0 ? "+" : ""}${data.saldo.toFixed(1)} quartos`;
  if (data.saldo >= 0) {
    doc.setTextColor(0, 128, 0); // Verde
  } else {
    doc.setTextColor(255, 0, 0); // Vermelho
  }
  doc.text(saldoText, margin, yPos);
  doc.setTextColor(0, 0, 0); // Voltar para preto
  yPos += 15;

  // Detalhamento por data
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Detalhamento dos Registros", margin, yPos);
  yPos += 10;

  // Agrupar quartos por data
  const quartosPorData: Record<string, typeof data.quartos> = {};
  data.quartos.forEach((quarto) => {
    const data = new Date(quarto.dataRegistro).toLocaleDateString("pt-BR");
    if (!quartosPorData[data]) {
      quartosPorData[data] = [];
    }
    quartosPorData[data].push(quarto);
  });

  // Ordenar datas
  const datasOrdenadas = Object.keys(quartosPorData).sort((a, b) => {
    const [diaA, mesA, anoA] = a.split("/").map(Number);
    const [diaB, mesB, anoB] = b.split("/").map(Number);
    return new Date(anoA, mesA - 1, diaA).getTime() - new Date(anoB, mesB - 1, diaB).getTime();
  });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  datasOrdenadas.forEach((data) => {
    const quartosData = quartosPorData[data];
    const totalDia = quartosData.length; // cada registro = 1 quarto

    // Verificar se precisa de nova página
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    // Data
    doc.setFont("helvetica", "bold");
    doc.text(`${data} - ${totalDia.toFixed(1)} quartos (${(totalDia * 4).toFixed(0)} min)`, margin, yPos);
    yPos += 6;

    // Registros do dia
    doc.setFont("helvetica", "normal");
    quartosData.forEach((quarto) => {
      const hora = new Date(quarto.dataRegistro).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      
      let texto = `  • ${hora} - ${quarto.codigoQuarto}`;
      if (quarto.revisado) {
        texto += " [REVISADO]";
        if (quarto.observacoesRevisao) {
          texto += ` (${quarto.observacoesRevisao})`;
        }
      }
      if (quarto.dificuldade && quarto.dificuldade !== "NA") {
        const dificuldadeLabel = quarto.dificuldade === "Facil" ? "Fácil" : 
                                  quarto.dificuldade === "Medio" ? "Médio" : 
                                  quarto.dificuldade === "Dificil" ? "Difícil" : quarto.dificuldade;
        texto += ` [${dificuldadeLabel}]`;
      }
      if (quarto.observacao) {
        texto += ` - ${quarto.observacao}`;
      }

      // Verificar se o texto cabe na linha
      const textoWidth = doc.getTextWidth(texto);
      if (textoWidth > pageWidth - 2 * margin) {
        // Quebrar texto em múltiplas linhas
        const linhas = doc.splitTextToSize(texto, pageWidth - 2 * margin);
        linhas.forEach((linha: string) => {
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(linha, margin, yPos);
          yPos += 5;
        });
      } else {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(texto, margin, yPos);
        yPos += 5;
      }
    });

    yPos += 3;
  });

  // Rodapé
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Retornar como Buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
}

