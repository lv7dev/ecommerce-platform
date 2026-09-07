import { validate } from 'class-validator';
import { LoginDto } from '../dto/login.dto';
import { PasswordPolicy } from './password-policy.validator';

class PasswordPolicyTestDto {
  @PasswordPolicy()
  password: string;

  constructor(password: string) {
    this.password = password;
  }
}

describe('PasswordPolicy', () => {
  it('rejects passwords shorter than 12 characters', async () => {
    const errors = await validate(new PasswordPolicyTestDto('short123'));

    expect(errors[0].constraints?.passwordPolicy).toBe(
      'Password must be at least 12 characters.',
    );
  });

  it('rejects common passwords even when they meet the minimum length', async () => {
    const errors = await validate(new PasswordPolicyTestDto('Password-1234'));

    expect(errors[0].constraints?.passwordPolicy).toBe(
      'Password is too common. Please choose a more unique password.',
    );
  });

  it('allows long non-common passwords', async () => {
    const errors = await validate(
      new PasswordPolicyTestDto('correct horse battery staple'),
    );

    expect(errors).toHaveLength(0);
  });

  it('applies the policy to login passwords', async () => {
    const dto = new LoginDto();
    dto.email = 'customer@example.com';
    dto.password = 'short123';

    const errors = await validate(dto);

    expect(
      errors.find((error) => error.property === 'password')?.constraints,
    ).toMatchObject({
      passwordPolicy: 'Password must be at least 12 characters.',
    });
  });
});
