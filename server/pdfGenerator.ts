import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
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
  precisaoMediaGlobal: number;
  totalQuartosGlobal: number;
  quartosComPrecisaoGlobal: number;
}

export function generatePDF(data: PDFData): Buffer {
  const doc = new jsPDF() as any;
  
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
  doc.text(`Total de Quartos: ${data.totalQuartos}`, margin, yPos);
  yPos += 7;
  doc.text(`Total de Minutos: ${data.totalMinutos}`, margin, yPos);
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

  // Tabela de Quartos
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Detalhamento dos Quartos", margin, yPos);
  yPos += 10;

  // Preparar dados da tabela
  const tableData = data.quartos
    .sort((a, b) => new Date(a.dataRegistro).getTime() - new Date(b.dataRegistro).getTime())
    .map((quarto) => {
      const data = new Date(quarto.dataRegistro).toLocaleDateString("pt-BR");
      const hora = new Date(quarto.dataRegistro).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const revisado = quarto.revisado ? "Sim" : "Não";
      const precisao = quarto.taxaPrecisao ? `${parseFloat(quarto.taxaPrecisao).toFixed(1)}%` : "-";
      const revisor = quarto.revisor || "-";
      const anotacoes = quarto.observacao || "-";

      return [
        `${data}\n${hora}`,
        quarto.codigoQuarto,
        anotacoes,
        revisado,
        precisao,
        revisor,
      ];
    });

  // Criar tabela
  autoTable(doc, {
    startY: yPos,
    head: [["Data/Hora", "Quarto", "Anotações", "Revisado", "Precisão", "Revisor"]],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 25 }, // Data/Hora
      1: { cellWidth: 25 }, // Quarto
      2: { cellWidth: 45 }, // Anotações
      3: { cellWidth: 20 }, // Revisado
      4: { cellWidth: 20 }, // Precisão
      5: { cellWidth: 30 }, // Revisor
    },
    margin: { left: margin, right: margin },
  });

  // Calcular estatísticas de precisão
  const quartosComPrecisao = data.quartos.filter(q => q.taxaPrecisao && q.taxaPrecisao.trim() !== "");
  const precisaoMedia = quartosComPrecisao.length > 0
    ? quartosComPrecisao.reduce((acc, q) => acc + parseFloat(q.taxaPrecisao!), 0) / quartosComPrecisao.length
    : 0;

  // Posição após a tabela
  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Verificar se precisa de nova página
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  // Estatísticas de Precisão
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Estatísticas de Precisão", margin, yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  
  if (quartosComPrecisao.length > 0) {
    doc.text(`Precisão Média do Mês: ${precisaoMedia.toFixed(1)}%`, margin, yPos);
    yPos += 7;
    doc.text(`Quartos com Comparação: ${quartosComPrecisao.length} de ${data.totalQuartos}`, margin, yPos);
    yPos += 10;
  } else {
    doc.text("Nenhum quarto com comparação de documentos realizada neste mês.", margin, yPos);
    yPos += 10;
  }

  // Precisão Média Global
  doc.setFont("helvetica", "bold");
  doc.text("Precisão Média Global (Todos os Meses):", margin, yPos);
  yPos += 7;
  
  doc.setFont("helvetica", "normal");
  if (data.quartosComPrecisaoGlobal > 0) {
    doc.text(`${data.precisaoMediaGlobal.toFixed(1)}% (baseado em ${data.quartosComPrecisaoGlobal} de ${data.totalQuartosGlobal} quartos)`, margin, yPos);
  } else {
    doc.text("Nenhuma comparação de documentos realizada ainda.", margin, yPos);
  }

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

