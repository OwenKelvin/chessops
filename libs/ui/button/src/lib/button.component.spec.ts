import { describe, it, expect } from 'vitest';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  it('should create', () => {
    const component = new ButtonComponent();
    expect(component).toBeTruthy();
  });

  it('should have default variant', () => {
    const component = new ButtonComponent();
    expect(component.variant).toBe('primary');
  });

  it('should have default size', () => {
    const component = new ButtonComponent();
    expect(component.size).toBe('md');
  });

  it('should generate button class', () => {
    const component = new ButtonComponent();
    expect(component.buttonClass).toContain('inline-flex');
    expect(component.buttonClass).toContain('bg-primary');
    expect(component.buttonClass).toContain('text-primary-foreground');
  });

  it('should generate accent button class', () => {
    const component = new ButtonComponent();
    component.variant = 'accent';
    expect(component.buttonClass).toContain('bg-accent');
    expect(component.buttonClass).toContain('text-accent-foreground');
  });

  it('should generate ghost button class', () => {
    const component = new ButtonComponent();
    component.variant = 'ghost';
    expect(component.buttonClass).toContain('bg-ghost');
    expect(component.buttonClass).toContain('text-ghost-foreground');
  });
});
