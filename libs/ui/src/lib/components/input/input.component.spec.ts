import { describe, it, expect } from 'vitest';
import { inputVariants } from './input.variants';

describe('Input variants', () => {
  it('should generate default variant', () => {
    const result = inputVariants({ variant: 'default', size: 'md' });
    expect(result).toContain('border-gray-300');
  });

  it('should generate error variant', () => {
    const result = inputVariants({ variant: 'error', size: 'md' });
    expect(result).toContain('border-red-500');
  });

  it('should generate sm size', () => {
    const result = inputVariants({ variant: 'default', size: 'sm' });
    expect(result).toContain('h-8');
  });

  it('should generate lg size', () => {
    const result = inputVariants({ variant: 'default', size: 'lg' });
    expect(result).toContain('h-12');
  });
});
