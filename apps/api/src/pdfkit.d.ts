/**
 * Déclaration de type pour le module pdfkit (génération PDF).
 */
declare module 'pdfkit' {
  interface PDFDocumentOptions {
    size?: string | number[];
    margin?: number;
  }
  class PDFDocument extends NodeJS.ReadableStream {
    constructor(options?: PDFDocumentOptions);
    page: { width: number; height: number };
    x: number;
    y: number;
    rect(x: number, y: number, w: number, h: number): this;
    fill(color?: string): this;
    fillColor(color: string): this;
    strokeColor(color: string): this;
    lineWidth(w: number): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    stroke(): this;
    fontSize(size: number): this;
    font(name: string): this;
    text(text: string, x?: number, y?: number, options?: { width?: number; align?: string }): this;
    moveDown(n?: number): this;
    end(): void;
    on(event: 'data', cb: (chunk: Buffer) => void): this;
    on(event: 'end', cb: () => void): this;
    on(event: 'error', cb: (err: Error) => void): this;
  }
  export = PDFDocument;
}
