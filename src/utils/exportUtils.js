export const exportCsv = (rows, filename = 'export.csv') => {
  if (!rows.length) return;

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
  if (!rows.length) return;

  const { jsPDF } = window.jspdf || {};

  if (!jsPDF) {
    console.warn('jsPDF is not available.');
    return;
  }

  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(title, 14, 18);

  const headers = Object.keys(rows[0]);
  const tableRows = rows.map((row) => headers.map((header) => String(row[header] ?? '')));

  doc.autoTable({
    head: [headers],
    body: tableRows,
    startY: 28,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [79, 70, 229] },
    alternateRowStyles: { fillColor: [245, 247, 255] },
  });

  doc.save(filename);
};
