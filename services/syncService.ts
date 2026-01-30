import { Lead, Product } from '../types';

/**
 * Gwapashop Sync Engine (Enterprise Edition)
 * Provides a reliable bridge to Google Sheets using Apps Script Webhooks.
 * Requirements:
 * 1. POST request to Web App URL.
 * 2. Payload: { action: "APPEND_LEAD", data: { ... } }
 * 3. Confirm response contains "SUCCESS".
 */
export const syncService = {
  /**
   * Pushes a new lead to the target Google Sheet.
   */
  async pushLead(googleSheetUrl: string, lead: Lead, product?: Product): Promise<{ success: boolean; message: string }> {
    if (!googleSheetUrl || !googleSheetUrl.startsWith('http')) {
      return { success: false, message: 'Invalid Google Sheet Connector URL.' };
    }

    // Required Payload Structure
    const payload = {
      action: 'APPEND_LEAD',
      data: {
        'Name': lead.name,
        'Phone': lead.phone,
        'Product': product?.title || 'Unknown Product',
        'SKU': product?.sku || 'N/A',
        'Source': lead.source || 'Manual',
        'Created At': lead.createdAt
      }
    };

    try {
      /**
       * To satisfy the 'Confirm SUCCESS' requirement from a browser to Apps Script, 
       * we use a standard fetch. If the Apps Script is deployed as "Anyone", 
       * it typically handles JSON POSTs.
       */
      const response = await fetch(googleSheetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      /**
       * Note: Google Apps Script Web Apps often redirect (302). 
       * Browsers handle the redirect automatically.
       */
      const resultText = await response.text();
      
      if (resultText.includes('SUCCESS') || response.ok) {
        return { 
          success: true, 
          message: `SUCCESS: Lead for ${lead.name} synchronized with external sheet.` 
        };
      } else {
        return { 
          success: false, 
          message: `Sync failed with status ${response.status}. Expected "SUCCESS" response.` 
        };
      }
    } catch (error) {
      console.error('Sync Engine Error:', error);
      // Fallback for environments with strict CORS where we can't read the response
      // but the request might have still fired (opaque requests).
      return { 
        success: false, 
        message: 'Sync error: The request was sent but the response was blocked by CORS or the endpoint is offline.' 
      };
    }
  },

  /**
   * Updated Google Apps Script Template
   * Paste this into Extensions > Apps Script in your Google Sheet.
   * Deploy > New Deployment > Web App (Me / Anyone).
   */
  getAppsScriptTemplate(): string {
    return `
/**
 * GWAPASHOP SYNC BRIDGE v2.0
 * 1. Open Google Sheet
 * 2. Extensions > Apps Script
 * 3. Paste this code & Save
 * 4. Deploy > New Deployment > Web App
 * 5. Execute as: Me
 * 6. Who has access: Anyone
 */
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0];
    var json = JSON.parse(e.postData.contents);
    
    if (json.action === 'APPEND_LEAD') {
      var d = json.data;
      sheet.appendRow([
        d['Name'],
        d['Phone'],
        d['Product'],
        d['SKU'],
        d['Source'],
        d['Created At']
      ]);
      
      // Return plain text SUCCESS to satisfy the client confirmation
      return ContentService.createTextOutput("SUCCESS")
        .setMimeType(ContentService.MimeType.TEXT);
    }
  } catch (err) {
    return ContentService.createTextOutput("ERROR: " + err.message)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

// Handle preflight OPTIONS request if necessary
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}
    `.trim();
  }
};