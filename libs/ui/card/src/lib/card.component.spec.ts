import { describe, it, expect } from 'vitest';
import { CardComponent } from './card.component';

describe('CardComponent', () => {
  it('should create', () => {
    const component = new CardComponent();
    expect(component).toBeTruthy();
  });

  it('should have default variant', () => {
    const component = new CardComponent();
    expect(component.variant).toBe('default');
  });

  it('should have padding by default', () => {
    const component = new CardComponent();
    expect(component.padding).toBe(true);
  });

  it('should generate card class with default variant', () => {
    const component = new CardComponent();
    expect(component.cardClass).toContain('bg-surface');
    expect(component.cardClass).toContain('shadow-sm');
  });

  it('should generate card class with elevated variant', () => {
    const component = new CardComponent();
    component.variant = 'elevated';
    expect(component.cardClass).toContain('shadow-md');
    expect(component.cardClass).toContain('bg-surface-elevated');
  });

  it('should generate card class without padding', () => {
    const component = new CardComponent();
    component.padding = false;
    expect(component.cardClass).not.toContain('p-4');
  });
});
