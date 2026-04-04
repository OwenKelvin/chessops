import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeBlockComponent } from '@chessops/ui/code-block';
import { apiDocumentation, type SectionDoc, type RouteDoc } from './api-docs.data';

@Component({
  selector: 'chessops-api-docs',
  standalone: true,
  imports: [CommonModule, CodeBlockComponent],
  template: `
    <div class="api-docs-container">
      <!-- Left Sidebar -->
      <aside class="sidebar">
        <nav class="sidebar-nav">
          <h2 class="nav-title">API Reference</h2>
          @for (section of sections; track section.id) {
            <div class="nav-section">
              <h3 class="nav-section-title" (click)="toggleSection(section.id)">
                {{ section.title }}
                <span class="chevron" [class.expanded]="expandedSections.has(section.id)">▼</span>
              </h3>
              @if (expandedSections.has(section.id)) {
                <ul class="nav-routes">
                  @for (route of section.routes; track route.id) {
                    <li>
                      <a
                        [href]="'#' + route.id"
                        [class.active]="activeRoute === route.id"
                        (click)="setActiveRoute(route.id)"
                      >
                        <span class="method-badge" [class]="'method-' + route.method.toLowerCase()">
                          {{ route.method }}
                        </span>
                        <span class="route-path">{{ route.path }}</span>
                      </a>
                    </li>
                  }
                </ul>
              }
            </div>
          }
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <div class="content-wrapper">
          <h1 class="page-title">ChessOps API Documentation</h1>
          <p class="page-intro">Complete API reference for the ChessOps identity and authentication module.</p>

          @for (section of sections; track section.id) {
            <section [id]="section.id" class="doc-section">
              <h2 class="section-title">{{ section.title }}</h2>

              @for (route of section.routes; track route.id) {
                <div [id]="route.id" class="route-doc">
                  <div class="route-header">
                    <span class="method-badge" [class]="'method-' + route.method.toLowerCase()">
                      {{ route.method }}
                    </span>
                    <code class="route-path-large">{{ route.path }}</code>
                  </div>

                  <p class="route-description">{{ route.description }}</p>

                  <div class="auth-badge" [class]="'auth-' + route.auth.toLowerCase()">
                    <span class="auth-icon">🔐</span>
                    <span class="auth-label">Auth: {{ route.auth }}</span>
                  </div>

                  <!-- Request Body -->
                  @if (route.requestBody && route.requestBody.length > 0) {
                    <div class="schema-section">
                      <h3 class="schema-title">Request Body</h3>
                      <table class="schema-table">
                        <thead>
                          <tr>
                            <th>Field</th>
                            <th>Type</th>
                            <th>Required</th>
                            <th>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (field of route.requestBody; track field.name) {
                            <tr>
                              <td><code>{{ field.name }}</code></td>
                              <td><code>{{ field.type }}</code></td>
                              <td>
                                @if (field.required) {
                                  <span class="required-badge">Required</span>
                                } @else {
                                  <span class="optional-badge">Optional</span>
                                }
                              </td>
                              <td>{{ field.description }}</td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  }

                  <!-- Path Parameters -->
                  @if (route.pathParams && route.pathParams.length > 0) {
                    <div class="schema-section">
                      <h3 class="schema-title">Path Parameters</h3>
                      <table class="schema-table">
                        <thead>
                          <tr>
                            <th>Parameter</th>
                            <th>Type</th>
                            <th>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (param of route.pathParams; track param.name) {
                            <tr>
                              <td><code>{{ param.name }}</code></td>
                              <td><code>{{ param.type }}</code></td>
                              <td>{{ param.description }}</td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  }

                  <!-- Responses -->
                  <div class="schema-section">
                    <h3 class="schema-title">Responses</h3>
                    @for (status of responseStatuses; track status) {
                      @if (route.responses[status]) {
                        <div class="response-block">
                          <div class="response-header">
                            <span class="status-code" [class]="'status-' + getStatusCodeClass(status)">
                              {{ status }}
                            </span>
                            <span class="response-description">{{ route.responses[status].description }}</span>
                          </div>
                          @if (route.responses[status].example) {
                            <chessops-code-block
                              [code]="toJson(route.responses[status].example)"
                              language="json"
                            />
                          }
                        </div>
                      }
                    }
                  </div>

                  <!-- Code Examples -->
                  <div class="examples-section">
                    <h3 class="schema-title">Examples</h3>
                    <div class="tabs">
                      <button
                        type="button"
                        class="tab-button"
                        [class.active]="activeTabs[route.id] === 'curl'"
                        (click)="activeTabs[route.id] = 'curl'"
                      >
                        cURL
                      </button>
                      @if (route.examples.js) {
                        <button
                          type="button"
                          class="tab-button"
                          [class.active]="activeTabs[route.id] === 'js'"
                          (click)="activeTabs[route.id] = 'js'"
                        >
                          JavaScript
                        </button>
                      }
                      @if (route.examples.python) {
                        <button
                          type="button"
                          class="tab-button"
                          [class.active]="activeTabs[route.id] === 'python'"
                          (click)="activeTabs[route.id] = 'python'"
                        >
                          Python
                        </button>
                      }
                    </div>
                    @if (activeTabs[route.id] === 'curl' || !activeTabs[route.id]) {
                      <chessops-code-block [code]="route.examples.curl" language="bash" />
                    }
                    @if (route.examples.js && activeTabs[route.id] === 'js') {
                      <chessops-code-block [code]="route.examples.js" language="typescript" />
                    }
                    @if (route.examples.python && activeTabs[route.id] === 'python') {
                      <chessops-code-block [code]="route.examples.python" language="python" />
                    }
                  </div>
                </div>
              }
            </section>
          }
        </div>
      </main>
    </div>
  `,
  styles: `
    .api-docs-container {
      display: flex;
      min-height: 100vh;
      background: var(--color-background);
      color: var(--color-foreground);
    }

    /* Sidebar */
    .sidebar {
      position: sticky;
      top: 0;
      width: 280px;
      height: 100vh;
      overflow-y: auto;
      background: var(--color-surface);
      border-right: 1px solid var(--color-border);
      padding: 1.5rem 1rem;
    }

    .nav-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      color: var(--color-primary);
    }

    .nav-section {
      margin-bottom: 1rem;
    }

    .nav-section-title {
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-muted);
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
    }

    .chevron {
      font-size: 0.625rem;
      transition: transform 0.2s;
    }

    .chevron.expanded {
      transform: rotate(180deg);
    }

    .nav-routes {
      list-style: none;
      padding: 0;
      margin: 0.5rem 0 0 0.75rem;
    }

    .nav-routes li {
      margin: 0.25rem 0;
    }

    .nav-routes a {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      color: var(--color-muted-foreground);
      font-size: 0.8125rem;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      transition: all 0.15s;
    }

    .nav-routes a:hover {
      background: var(--color-surface-elevated);
      color: var(--color-foreground);
    }

    .nav-routes a.active {
      background: var(--color-primary);
      color: var(--color-primary-foreground);
    }

    .method-badge {
      font-size: 0.625rem;
      font-weight: 700;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      text-transform: uppercase;
      min-width: 2.5rem;
      text-align: center;
    }

    .method-get { background: var(--color-info); color: white; }
    .method-post { background: var(--color-success); color: white; }
    .method-put { background: var(--color-warning); color: var(--color-foreground); }
    .method-patch { background: var(--color-warning); color: var(--color-foreground); }
    .method-delete { background: var(--color-error); color: white; }

    .route-path {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
    }

    /* Main Content */
    .main-content {
      flex: 1;
      overflow-x: hidden;
    }

    .content-wrapper {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem 3rem;
    }

    .page-title {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .page-intro {
      color: var(--color-muted-foreground);
      margin-bottom: 2rem;
    }

    .doc-section {
      margin-bottom: 3rem;
    }

    .section-title {
      font-size: 1.5rem;
      border-bottom: 2px solid var(--color-border);
      padding-bottom: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .route-doc {
      margin-bottom: 2.5rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid var(--color-border);
    }

    .route-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }

    .route-path-large {
      font-family: 'JetBrains Mono', monospace;
      font-size: 1rem;
      color: var(--color-accent);
    }

    .route-description {
      color: var(--color-foreground);
      margin-bottom: 1rem;
    }

    .auth-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .auth-public { background: var(--color-info-light); color: var(--color-info); }
    .auth-jwt { background: var(--color-warning-light); color: var(--color-warning); }
    .auth-admin { background: var(--color-error-light); color: var(--color-error); }

    .auth-icon { font-size: 0.875rem; }

    /* Schema Tables */
    .schema-section {
      margin: 1.5rem 0;
    }

    .schema-title {
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-muted);
      margin-bottom: 0.75rem;
    }

    .schema-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .schema-table th {
      text-align: left;
      padding: 0.5rem 0.75rem;
      background: var(--color-surface-elevated);
      border: 1px solid var(--color-border);
      font-weight: 600;
    }

    .schema-table td {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--color-border);
    }

    .schema-table code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8125rem;
      color: var(--color-accent);
    }

    .required-badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      background: var(--color-error-light);
      color: var(--color-error);
      border-radius: 0.25rem;
      font-size: 0.6875rem;
      font-weight: 600;
    }

    .optional-badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      background: var(--color-muted);
      color: var(--color-muted-foreground);
      border-radius: 0.25rem;
      font-size: 0.6875rem;
    }

    /* Responses */
    .response-block {
      margin-bottom: 1rem;
    }

    .response-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .status-code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.125rem 0.5rem;
      border-radius: 0.25rem;
    }

    .status-200 { background: var(--color-success); color: white; }
    .status-400, .status-422 { background: var(--color-warning); color: var(--color-foreground); }
    .status-401, .status-403 { background: var(--color-error); color: white; }
    .status-404 { background: var(--color-muted); color: var(--color-foreground); }
    .status-409 { background: var(--color-info); color: white; }

    .response-description {
      font-size: 0.875rem;
      color: var(--color-foreground);
    }

    /* Examples */
    .examples-section {
      margin-top: 1.5rem;
    }

    .tabs {
      display: flex;
      gap: 0.25rem;
      margin-bottom: 0.75rem;
    }

    .tab-button {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
      border: 1px solid var(--color-border);
      border-bottom: none;
      background: var(--color-surface);
      color: var(--color-muted-foreground);
      border-radius: 0.375rem 0.375rem 0 0;
      cursor: pointer;
      transition: all 0.15s;
    }

    .tab-button:hover {
      background: var(--color-surface-elevated);
    }

    .tab-button.active {
      background: var(--color-surface-elevated);
      color: var(--color-foreground);
      border-color: var(--color-accent);
    }

    /* Dark mode adjustments */
    @media (prefers-color-scheme: dark) {
      .sidebar {
        background: #1a1a1a;
      }
    }
  `,
})
export class ApiDocsComponent implements AfterViewInit, OnDestroy {
  sections = apiDocumentation;
  expandedSections = new Set<string>(['registration', 'session', 'oauth', 'password', 'mfa', 'profile', 'admin']);
  activeRoute = '';
  activeTabs: Record<string, string> = {};
  responseStatuses = ['200', '400', '401', '403', '404', '409', '422'] as const;

  ngAfterViewInit(): void {
    this.setupScrollSpy();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.handleScroll);
  }

  toggleSection(sectionId: string): void {
    if (this.expandedSections.has(sectionId)) {
      this.expandedSections.delete(sectionId);
    } else {
      this.expandedSections.add(sectionId);
    }
  }

  setActiveRoute(routeId: string): void {
    this.activeRoute = routeId;
  }

  toJson(obj: object): string {
    return JSON.stringify(obj, null, 2);
  }

  getTabLabel(tab: string): string {
    const labels: Record<string, string> = { curl: 'cURL', js: 'JavaScript', python: 'Python' };
    return labels[tab] || tab;
  }


  getStatusCodeClass(status: string): string {
    return status;
  }

  private setupScrollSpy(): void {
    window.addEventListener('scroll', this.handleScroll);
    this.handleScroll();
  }

  private handleScroll = (): void => {
    const sections = document.querySelectorAll<HTMLElement>('.route-doc');
    const scrollPosition = window.scrollY + 100;

    sections.forEach((section) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPosition >= top && scrollPosition < top + height && id) {
        this.activeRoute = id;
      }
    });
  };
}
