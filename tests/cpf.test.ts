
import { describe, it, expect } from 'vitest';
import { validateCPF } from '../src/services/cpf';

describe('validateCPF', () => {
  it('valid cpf', () => expect(validateCPF('11144477735')).toBe(true));
  it('invalid cpf', () => expect(validateCPF('12345678900')).toBe(false));
});
