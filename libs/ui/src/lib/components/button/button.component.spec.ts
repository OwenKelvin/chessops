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
  });
});
