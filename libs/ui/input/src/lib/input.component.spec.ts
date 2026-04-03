import { describe, it, expect } from 'vitest';
import { FormControl } from '@angular/forms/signals';
import { inputVariants } from './input.variants';
import { InputComponent } from './input.component';

describe('Input variants', () => {
  it('should generate default variant', () => {
    const result = inputVariants({ variant: 'default', size: 'md' });
    expect(result).toContain('border-border');
    expect(result).toContain('bg-surface');
  });

  it('should generate error variant', () => {
    const result = inputVariants({ variant: 'error', size: 'md' });
    expect(result).toContain('border-error');
    expect(result).toContain('focus-visible:ring-error');
  });

  it('should generate sm size', () => {
    const result = inputVariants({ variant: 'default', size: 'sm' });
    expect(result).toContain('h-8');
    expect(result).toContain('px-2.5');
    expect(result).toContain('text-sm');
  });

  it('should generate lg size', () => {
    const result = inputVariants({ variant: 'default', size: 'lg' });
    expect(result).toContain('h-12');
    expect(result).toContain('px-4');
    expect(result).toContain('text-lg');
  });
});

describe('InputComponent', () => {
  it('should create', () => {
    const component = new InputComponent();
    component.formControl = new FormControl('');
    expect(component).toBeTruthy();
  });

  it('should have default type', () => {
    const component = new InputComponent();
    component.formControl = new FormControl('');
    expect(component.type).toBe('text');
  });

  it('should have default size', () => {
    const component = new InputComponent();
    component.formControl = new FormControl('');
    expect(component.size).toBe('md');
  });

  it('should generate input class with default variant', () => {
    const component = new InputComponent();
    component.formControl = new FormControl('');
    expect(component.inputClass).toContain('border-border');
    expect(component.inputClass).toContain('bg-surface');
  });

  it('should generate input class with error variant', () => {
    const component = new InputComponent();
    component.formControl = new FormControl('');
    component.error = 'Invalid input';
    expect(component.inputClass).toContain('border-error');
    expect(component.inputClass).toContain('focus-visible:ring-error');
  });

  it('should update form control on input', () => {
    const component = new InputComponent();
    const control = new FormControl('');
    component.formControl = control;

    const event = {
      target: { value: 'test value' } as HTMLInputElement
    } as unknown as Event;

    component.onInput(event);
    expect(control()).toBe('test value');
  });

  it('should mark control as touched on blur', () => {
    const component = new InputComponent();
    const control = new FormControl('');
    component.formControl = control;

    expect(control.touched).toBe(false);
    component.onBlur();
    expect(control.touched).toBe(true);
  });
});
