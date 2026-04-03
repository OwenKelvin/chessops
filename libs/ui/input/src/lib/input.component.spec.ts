import { describe, it, expect } from 'vitest';
import { inputVariants } from './input.variants';

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
