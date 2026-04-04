import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeBlockComponent } from '@chessops/ui/code-block';
import {
  apiDocumentation,
  type SectionDoc,
  type RouteDoc,
} from './api-docs.data';

@Component({
  selector: 'chessops-api-docs',
  standalone: true,
  imports: [CommonModule, CodeBlockComponent],
  template: `
    <div class="flex min-h-screen bg-background text-foreground">

      <!-- Left Sidebar -->
      <aside class="sticky top-0 w-70 h-screen overflow-y-auto bg-surface border-r border-border px-4 py-6">
        <nav>
          <h2 class="text-xl font-semibold mb-6 text-primary">API Reference</h2>

          @for (section of sections; track section.id) {
            <div class="mb-4">
              <h3
                class="text-xs font-semibold uppercase tracking-wide text-muted cursor-pointer flex justify-between items-center py-2"
                (click)="toggleSection(section.id)"
              >
                {{ section.title }}
                <span
                  class="text-[0.625rem] transition-transform duration-200"
                  [class.rotate-180]="expandedSections.has(section.id)"
                >▼</span>
              </h3>

              @if (expandedSections.has(section.id)) {
                <ul class="list-none p-0 mt-2 ml-3 space-y-1">
                  @for (route of section.routes; track route.id) {
                    <li>
                      <a
                        [href]="'#' + route.id"
                        [class]="'flex items-center gap-2 no-underline text-[0.8125rem] px-2 py-1 rounded transition-all duration-150 ' +
                      (activeRoute === route.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-surface-elevated hover:text-foreground')"
                        (click)="setActiveRoute(route.id)"
                      >
                      <span
                        [class]="getMethodBadgeClass(route.method) + ' text-[0.625rem] font-bold px-1.5 py-0.5 rounded uppercase min-w-10 text-center'">
                          {{ route.method }}
                        </span>
                        <span class="font-mono text-xs">{{ route.path }}</span>
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
      <main class="flex-1 overflow-x-hidden">
        <div class="max-w-4xl mx-auto px-12 py-8">
          <h1 class="text-4xl font-bold mb-2">ChessOps API Documentation</h1>
          <p class="text-muted-foreground mb-8">Complete API reference for the ChessOps identity and authentication
            module.</p>

          @for (section of sections; track section.id) {
            <section [id]="section.id" class="mb-12">
              <h2 class="text-2xl font-semibold border-b-2 border-border pb-2 mb-6">{{ section.title }}</h2>

              @for (route of section.routes; track route.id) {
                <div [id]="route.id" class="mb-10 pb-8 border-b border-border">

                  <!-- Route Header -->
                  <div class="flex items-center gap-4 mb-3">
                    <span
                      [class]="getMethodBadgeClass(route.method) + ' text-[0.625rem] font-bold px-1.5 py-0.5 rounded uppercase min-w-10 text-center'">
                      {{ route.method }}
                    </span>
                    <code class="font-mono text-base text-accent">{{ route.path }}</code>
                  </div>

                  <p class="mb-4">{{ route.description }}</p>

                  <!-- Auth Badge -->
                  <div
                    [class]="getAuthBadgeClass(route.auth) + ' inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs mb-6'">
                    <span class="text-sm">🔐</span>
                    <span>Auth: {{ route.auth }}</span>
                  </div>

                  <!-- Request Body -->
                  @if (route.requestBody && route.requestBody.length > 0) {
                    <div class="my-6">
                      <h3 class="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Request Body</h3>
                      <table class="w-full border-collapse text-sm">
                        <thead>
                        <tr>
                          <th class="text-left px-3 py-2 bg-surface-elevated border border-border font-semibold">Field
                          </th>
                          <th class="text-left px-3 py-2 bg-surface-elevated border border-border font-semibold">Type
                          </th>
                          <th class="text-left px-3 py-2 bg-surface-elevated border border-border font-semibold">
                            Required
                          </th>
                          <th class="text-left px-3 py-2 bg-surface-elevated border border-border font-semibold">
                            Description
                          </th>
                        </tr>
                        </thead>
                        <tbody>
                          @for (field of route.requestBody; track field.name) {
                            <tr>
                              <td class="px-3 py-2 border border-border"><code
                                class="font-mono text-[0.8125rem] text-accent">{{ field.name }}</code></td>
                              <td class="px-3 py-2 border border-border"><code
                                class="font-mono text-[0.8125rem] text-accent">{{ field.type }}</code></td>
                              <td class="px-3 py-2 border border-border">
                                @if (field.required) {
                                  <span
                                    class="inline-block px-2 py-0.5 bg-error-light text-error rounded text-[0.6875rem] font-semibold">Required</span>
                                } @else {
                                  <span
                                    class="inline-block px-2 py-0.5 bg-muted text-muted-foreground rounded text-[0.6875rem]">Optional</span>
                                }
                              </td>
                              <td class="px-3 py-2 border border-border">{{ field.description }}</td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  }

                  <!-- Path Parameters -->
                  @if (route.pathParams && route.pathParams.length > 0) {
                    <div class="my-6">
                      <h3 class="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Path Parameters</h3>
                      <table class="w-full border-collapse text-sm">
                        <thead>
                        <tr>
                          <th class="text-left px-3 py-2 bg-surface-elevated border border-border font-semibold">
                            Parameter
                          </th>
                          <th class="text-left px-3 py-2 bg-surface-elevated border border-border font-semibold">Type
                          </th>
                          <th class="text-left px-3 py-2 bg-surface-elevated border border-border font-semibold">
                            Description
                          </th>
                        </tr>
                        </thead>
                        <tbody>
                          @for (param of route.pathParams; track param.name) {
                            <tr>
                              <td class="px-3 py-2 border border-border"><code
                                class="font-mono text-[0.8125rem] text-accent">{{ param.name }}</code></td>
                              <td class="px-3 py-2 border border-border"><code
                                class="font-mono text-[0.8125rem] text-accent">{{ param.type }}</code></td>
                              <td class="px-3 py-2 border border-border">{{ param.description }}</td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  }

                  <!-- Responses -->
                  <div class="my-6">
                    <h3 class="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Responses</h3>
                    @for (status of responseStatuses; track status) {
                      @if (route.responses[status]) {
                        <div class="mb-4">
                          <div class="flex items-center gap-3 mb-2">
                            <span
                              [class]="getStatusBadgeClass(status) + ' font-mono text-xs font-bold px-2 py-0.5 rounded'">
                              {{ status }}
                            </span>
                            <span class="text-sm">{{ route.responses[status].description }}</span>
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
                  <div class="mt-6">
                    <h3 class="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Examples</h3>
                    <div class="flex gap-1 mb-0">
                      <button
                        type="button"
                        [class]="'px-3 py-1.5 text-xs border border-b-0 rounded-t transition-all duration-150 cursor-pointer ' +
                          (activeTabs[route.id] === 'curl' || !activeTabs[route.id]
                            ? 'bg-surface-elevated text-foreground border-accent'
                            : 'bg-surface text-muted-foreground border-border hover:bg-surface-elevated')"
                        (click)="activeTabs[route.id] = 'curl'"
                      >cURL
                      </button>

                      @if (route.examples.js) {
                        <button
                          type="button"
                          [class]="'px-3 py-1.5 text-xs border border-b-0 rounded-t transition-all duration-150 cursor-pointer ' +
                            (activeTabs[route.id] === 'js'
                              ? 'bg-surface-elevated text-foreground border-accent'
                              : 'bg-surface text-muted-foreground border-border hover:bg-surface-elevated')"
                          (click)="activeTabs[route.id] = 'js'"
                        >JavaScript
                        </button>
                      }

                      @if (route.examples.python) {
                        <button
                          type="button"
                          [class]="'px-3 py-1.5 text-xs border border-b-0 rounded-t transition-all duration-150 cursor-pointer ' +
                            (activeTabs[route.id] === 'python'
                              ? 'bg-surface-elevated text-foreground border-accent'
                              : 'bg-surface text-muted-foreground border-border hover:bg-surface-elevated')"
                          (click)="activeTabs[route.id] = 'python'"
                        >Python
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
})
export class ApiDocsComponent implements AfterViewInit, OnDestroy {
  sections = apiDocumentation;
  expandedSections = new Set<string>([
    'registration',
    'session',
    'oauth',
    'password',
    'mfa',
    'profile',
    'admin',
  ]);
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
    const labels: Record<string, string> = {
      curl: 'cURL',
      js: 'JavaScript',
      python: 'Python',
    };
    return labels[tab] || tab;
  }

  getStatusCodeClass(status: string): string {
    return status;
  }

  getMethodBadgeClass(method: string): string {
    const map: Record<string, string> = {
      GET: 'bg-info text-white',
      POST: 'bg-success text-white',
      PUT: 'bg-warning text-foreground',
      PATCH: 'bg-warning text-foreground',
      DELETE: 'bg-error text-white',
    };
    return map[method.toUpperCase()] ?? 'bg-muted text-white';
  }

  getAuthBadgeClass(auth: string): string {
    const map: Record<string, string> = {
      public: 'bg-info-light text-info',
      jwt: 'bg-warning-light text-warning',
      admin: 'bg-error-light text-error',
    };
    return map[auth.toLowerCase()] ?? 'bg-muted text-muted-foreground';
  }

  getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      '200': 'bg-success text-white',
      '400': 'bg-warning text-foreground',
      '401': 'bg-error text-white',
      '403': 'bg-error text-white',
      '404': 'bg-muted text-foreground',
      '409': 'bg-info text-white',
      '422': 'bg-warning text-foreground',
    };
    return map[status] ?? 'bg-muted text-white';
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
