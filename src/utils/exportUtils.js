export const exportCsv = (rows, filename = 'export.csv') => {
  if (!rows || !rows.length) {
    const emptyFile = [];
    const blob = new Blob([emptyFile], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  const headers = Object.keys(rows[0]);
  const csvRows = [headers.join(',')];

  rows.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header] ?? '';
      const sanitized = String(value).replace(/"/g, '""');
      return `"${sanitized}"`;
    });

    csvRows.push(values.join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportPdf = (rows, filename = 'export.pdf', title = 'School Summary') => {
  if (!rows || !rows.length) return;

  const { jsPDF } = window.jspdf || {};

  if (!jsPDF) {
    console.warn('jsPDF is not available.');
    return;
  }

  const doc = new jsPDF();
  doc.setFillColor(79, 70, 229);
  doc.setTextColor(255, 255, 255);
  doc.rect(0, 0, 220, 18, 'F');
  doc.setFontSize(16);
  doc.text(title, 14, 12);

  const headers = Object.keys(rows[0]);
  const tableRows = rows.map((row) => headers.map((header) => String(row[header] ?? '')));

  doc.setTextColor(15, 23, 42);
  doc.autoTable({
    head: [headers],
    body: tableRows,
    startY: 26,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 255] },
    margin: { left: 12, right: 12 },
  });

  doc.save(filename);
};
