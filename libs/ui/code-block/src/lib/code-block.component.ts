import { Component, Input, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { twMerge } from 'tailwind-merge';

export type CodeLanguage = 'typescript' | 'javascript' | 'bash' | 'json' | 'plaintext' | 'python';

@Component({
  selector: 'chessops-code-block',
  standalone: true,
  template: `
    <div class="code-block" [class]="containerClass">
      <div class="code-header">
        <span class="language-label">{{ language }}</span>
        <button type="button" class="copy-button" (click)="copyToClipboard()" [disabled]="copied">
          {{ copied ? 'Copied!' : 'Copy' }}
        </button>
      </div>
      <pre><code #codeBlock [class]="'language-' + language">{{ code }}</code></pre>
    </div>
  `,
  styles: `
    .code-block {
      position: relative;
      border-radius: 0.75rem;
      overflow: hidden;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.875rem;
      line-height: 1.6;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      backdrop-filter: blur(12px);
    }

    .code-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 1rem;
      background: var(--color-surface-elevated);
      border-bottom: 1px solid var(--color-border);
    }

    .language-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-muted-foreground);
    }

    .copy-button {
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      border-radius: 0.25rem;
      border: 1px solid var(--color-border);
      background: transparent;
      color: var(--color-foreground);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .copy-button:hover {
      background: var(--color-ghost-hover);
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    .copy-button:disabled {
      opacity: 0.7;
      cursor: default;
    }

    pre {
      margin: 0;
      padding: 1rem;
      overflow-x: auto;
    }

    code {
      font-family: inherit;
    }

    /* Remove hardcoded dark mode; tokens now handle both themes */
  `,
})
export class CodeBlockComponent implements AfterViewInit {
  @Input() code = '';
  @Input() language: CodeLanguage = 'plaintext';
  @Input() darkMode = false;

  @ViewChild('codeBlock') codeBlock!: ElementRef<HTMLElement>;

  copied = false;

  get containerClass(): string {
    return twMerge('code-block', this.darkMode ? 'dark' : '');
  }

  constructor() {}

  ngAfterViewInit(): void {
    this.highlightCode();
  }

  private highlightCode(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hljs = (window as any).hljs;
    if (hljs && this.codeBlock) {
      hljs.highlightElement(this.codeBlock.nativeElement);
    }
  }

  async copyToClipboard(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code);
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = this.code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    }
  }
}
