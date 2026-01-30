
import { Lead, LeadStatus } from '../types';

/**
 * Gwapashop Data Portability Engine
 * Handles high-fidelity CSV serialization and parsing.
 */
export const csvService = {
  /**
   * Universal JSON to CSV Exporter
   */
  exportToCSV(data: any[], filename: string) {
    if (!data || !data.length) {
      alert("No data available for export.");
      return;
    }

    // Extract headers from the first object
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(fieldName => {
          const value = row[fieldName] ?? '';
          // Escape quotes and handle strings with commas
          const stringValue = String(value).replace(/"/g, '""');
          return `"${stringValue}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Specialized Lead Importer
   */
  async importLeadsFromCSV(file: File): Promise<Partial<Lead>[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          if (lines.length < 2) return resolve([]);

          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          // Fix: Explicitly type the results array to Lead[] to ensure correct type inference for literal union types
          const results: Lead[] = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const obj: any = {};
            headers.forEach((header, i) => {
              obj[header] = values[i];
            });

            // Map imported data to Lead structure
            return {
              id: 'lead_' + Math.random().toString(36).substr(2, 9),
              id_num: '#' + (Math.floor(Math.random() * 9000) + 1000),
              name: obj.name || `${obj.firstName || ''} ${obj.lastName || ''}`.trim(),
              firstName: obj.firstName || obj.name?.split(' ')[0] || '',
              lastName: obj.lastName || obj.name?.split(' ').slice(1).join(' ') || '',
              email: obj.email || '',
              phone: obj.phone || '',
              preferredContact: (obj.preferredContact as any) || 'both',
              company: obj.company || '',
              country: obj.country || '',
              region: obj.region || '',
              city: obj.city || '',
              product_id: obj.product_id || '',
              status: (obj.status as LeadStatus) || LeadStatus.NEW,
              // Fix: Explicitly cast 'Manual' to the union type to avoid 'string' type mismatch
              source: 'Manual' as 'Manual' | 'Storefront',
              createdAt: obj.createdAt || new Date().toLocaleString(),
              updatedAt: new Date().toLocaleString()
            };
          });
          resolve(results);
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsText(file);
    });
  }
};
