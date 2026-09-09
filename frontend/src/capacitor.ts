/** Native boundaries for the production Android build.
 *  The browser preview uses safe fallbacks; Android can replace these with
 *  Capacitor SQLite and a tested ESC/POS printer plugin/native bridge.
 */
export type Receipt = { cafeName:string; invoice:string; items:{name:string;qty:number;price:number}[]; total:number };

export interface LocalStore {
  saveOrder(order: unknown): Promise<void>;
  getPendingOrders(): Promise<unknown[]>;
}

export class BrowserPreviewStore implements LocalStore {
  async saveOrder(order: unknown) {
    const current = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
    current.push(order);
    localStorage.setItem('pendingOrders', JSON.stringify(current));
  }
  async getPendingOrders() {
    return JSON.parse(localStorage.getItem('pendingOrders') || '[]');
  }
}

export interface PrinterService {
  testPrint(): Promise<void>;
  print(receipt: Receipt): Promise<void>;
}

export class PreviewPrinter implements PrinterService {
  async testPrint(){ console.info('[printer] test print'); }
  async print(receipt: Receipt){ console.info('[printer] receipt', receipt); }
}
